import { attunementsFor } from "../../../../engine/attunements"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { inferGearIdentity } from "../../../../engine/gearIdentity"
import { getWordSpecs } from "../../../../engine/itemRanking"
import { EMPTY_EQUIPPED, emptyGearWord } from "../../../../engine/types"
import type {
  EquippedSlots,
  GearLevel,
  GearPiece,
  GearRarity,
  GearSlot,
  GearWordEntry,
  Inputs,
} from "../../../../engine/types"
import { newGearPieceId } from "../../../../storage"
import { AFFIX_ID_TO_STAT_LINE } from "./affixStatLineTable"
import { targetKey } from "./dashboardGearPayload"
import { resolveInnerWays } from "./importedInnerWays"
import type {
  AffixTarget,
  GearImportResult,
  ImportedAffix,
  ImportedPiece,
} from "./dashboardGearPayload"

export const FALLBACK_LEVEL: GearLevel = 96
export const FALLBACK_RARITY: GearRarity = "legendary"

export type IdentityOverrides = Readonly<Record<string, { level?: GearLevel; rarity?: GearRarity }>>
/** Affix id → `targetKey`, mapped by the user in the dialog and remembered. */
export type AffixChoices = Readonly<Record<string, string>>

// The game reports attunement rolls in percent (10.7 for 10.7 %) and tunement
// rolls as fractions, without saying which — so a target whose ceiling matches
// the raw ceiling is used as-is, and one that matches it divided by 100 is scaled.
const VALUE_SCALES: readonly number[] = [1, 0.01]
const MAX_ROLL_TOLERANCE = 1e-3

// The payload carries float32 values, so a roll sitting exactly on its ceiling
// arrives a few billionths above or below it.
const CLAMP_TOLERANCE = 1e-6

function matchesMaxRoll(derivedMax: number, knownMax: number): boolean {
  return Math.abs(derivedMax - knownMax) <= Math.abs(knownMax) * MAX_ROLL_TOLERANCE
}

function ceilingOf(target: AffixTarget): number {
  return target.kind === "attunement" ? target.max : target.cap
}

/**
 * A tunement row can only become a word and an attunement row only an
 * attunement — `toGearPieces` reads the two from different places, so crossing
 * them would drop the line instead of importing it.
 */
function legalTargets(affix: ImportedAffix, slot: GearSlot | null, inputs: Inputs): AffixTarget[] {
  if (affix.isAttunementAffix) {
    if (!slot) return []
    return attunementsFor(slot, inputs.classId).map((option) => ({
      kind: "attunement",
      attunementId: option.id,
      label: option.label,
      min: option.min,
      max: option.max,
    }))
  }
  return getWordSpecs(inputs).map((spec) => ({
    kind: "word",
    word: spec.word,
    unit: spec.unit,
    cap: spec.amount,
  }))
}

/**
 * The ceiling the payload reports narrows the list a user has to choose from; it
 * is offered as a suggestion only, and never used to pick on its own.
 */
function suggestedTargets(affix: ImportedAffix, targets: readonly AffixTarget[]): AffixTarget[] {
  if (affix.derivedMax === null) return []
  for (const scale of VALUE_SCALES) {
    const scaledMax = affix.derivedMax * scale
    const matching = targets.filter((target) => matchesMaxRoll(scaledMax, ceilingOf(target)))
    if (matching.length) return matching
  }
  return []
}

/**
 * Raw words arrive in their own units. Everything else is a rate, which the payload
 * reports as a fraction for some affixes and as a percentage for others, so the
 * magnitude of the reported ceiling is what says which: no rate this app models
 * caps above 100 %, so a ceiling over 1 can only be a percentage.
 *
 * Deciding this by matching our own cap instead would break on any gear tier whose
 * ceiling differs from the one in our tables — a lower-tier disc capping physical
 * penetration at 9 % against our 11 % matched neither unit, fell back to fractions,
 * and imported 8.9 % as 890 % clamped down to the cap.
 */
function scaleFor(affix: ImportedAffix, target: AffixTarget): number {
  if (target.kind === "word" && target.unit === "raw") return 1
  const reported = affix.derivedMax ?? affix.rawValue
  return reported !== null && Math.abs(reported) > 1 ? 0.01 : 1
}

function resolveAffix(
  affix: ImportedAffix,
  slot: GearSlot | null,
  inputs: Inputs,
  choices: AffixChoices,
): ImportedAffix {
  const targets = legalTargets(affix, slot, inputs)
  const suggestions = suggestedTargets(affix, targets)
  const mappedKey = AFFIX_ID_TO_STAT_LINE[affix.affixId] ?? choices[affix.affixId]
  const target = mappedKey
    ? targets.find((candidate) => targetKey(candidate) === mappedKey)
    : undefined

  if (!target || affix.rawValue === null) {
    return {
      ...affix,
      resolution: {
        kind: "unmapped",
        mappedTo: mappedKey ?? null,
        suggestions,
        choosableTargets: targets,
      },
    }
  }

  // Only the ceiling clamps. An attunement's `min` is the lowest roll at the top
  // breakthrough, so raising a lower-tier piece up to it would invent stats.
  const scaled = affix.rawValue * scaleFor(affix, target)
  const value = Math.min(Math.max(scaled, 0), ceilingOf(target))
  const shaved = Math.abs(scaled - value) > Math.abs(scaled) * CLAMP_TOLERANCE

  return {
    ...affix,
    resolution: {
      kind: "resolved",
      target,
      value,
      clampedFrom: shaved ? scaled : null,
      suggestions,
      choosableTargets: targets,
    },
  }
}

/** Fallback for a piece whose own base stats pin no level, e.g. one the payload reports none for. */
function levelAgreedByWeapons(pieces: readonly ImportedPiece[]): GearLevel | null {
  const levels = new Set<GearLevel>()
  for (const piece of pieces) {
    if (piece.identity?.level) levels.add(piece.identity.level)
  }
  return levels.size === 1 ? [...levels][0]! : null
}

export function resolveAgainstBuild(
  result: GearImportResult,
  inputs: Inputs,
  choices: AffixChoices = {},
): GearImportResult {
  const pieces = result.pieces.map((piece) => {
    const slot = piece.slot.kind === "mapped" ? piece.slot.slot : null
    return {
      ...piece,
      identity:
        slot && piece.observedBaseStats ? inferGearIdentity(slot, piece.observedBaseStats) : null,
      affixes: piece.affixes.map((affix) => resolveAffix(affix, slot, inputs, choices)),
      overflowAffixes: piece.overflowAffixes.map((affix) =>
        resolveAffix(affix, slot, inputs, choices),
      ),
      attunement: piece.attunement ? resolveAffix(piece.attunement, slot, inputs, choices) : null,
    }
  })
  return { ...result, pieces, innerWays: resolveInnerWays(result, inputs) }
}

export function effectiveIdentity(
  piece: ImportedPiece,
  pieces: readonly ImportedPiece[],
  overrides: IdentityOverrides,
): { level: GearLevel; rarity: GearRarity } {
  const override = overrides[piece.gameSlotId]
  return {
    level:
      override?.level ?? piece.identity?.level ?? levelAgreedByWeapons(pieces) ?? FALLBACK_LEVEL,
    rarity: override?.rarity ?? piece.identity?.rarity ?? FALLBACK_RARITY,
  }
}

export function importablePieces(result: GearImportResult): ImportedPiece[] {
  return result.pieces.filter((piece) => piece.slot.kind === "mapped")
}

export function equippedFromImported(pieces: readonly GearPiece[]): EquippedSlots {
  const equipped: EquippedSlots = { ...EMPTY_EQUIPPED }
  for (const piece of pieces) equipped[piece.slot] = piece.id
  return equipped
}

export function toGearPieces(result: GearImportResult, overrides: IdentityOverrides): GearPiece[] {
  return importablePieces(result).map((piece) => {
    const slot = (piece.slot as { kind: "mapped"; slot: GearSlot }).slot
    const { level, rarity } = effectiveIdentity(piece, result.pieces, overrides)
    const base = gearBaseStatsFor({ slot, level, rarity })

    const words = [0, 1, 2, 3, 4].map((index) => {
      const resolution = piece.affixes[index]?.resolution
      if (resolution?.kind !== "resolved" || resolution.target.kind !== "word") {
        return emptyGearWord()
      }
      return { word: resolution.target.word, value: resolution.value, retuned: false }
    }) as [GearWordEntry, GearWordEntry, GearWordEntry, GearWordEntry, GearWordEntry]

    const attunement = piece.attunement?.resolution
    const attuned =
      attunement?.kind === "resolved" && attunement.target.kind === "attunement"
        ? { id: attunement.target.attunementId, value: attunement.value }
        : null

    return {
      id: newGearPieceId(),
      slot,
      level,
      rarity,
      minPhys: base.minPhys,
      maxPhys: base.maxPhys,
      hp: base.hp,
      physDef: base.physDef,
      words,
      attunement: attuned?.id ?? "",
      attunementValue: attuned?.value ?? 0,
      relayed: false,
      isNew: true,
    }
  })
}
