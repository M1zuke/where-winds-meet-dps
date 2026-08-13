import type { GearBaseStats } from "../../../../data/stats/gearBaseStats"
import type { InferredGearIdentity } from "../../../../engine/gearIdentity"
import { GEAR_SLOTS, type GearSlot, type GearWordName } from "../../../../engine/types"
import { GAME_SLOT_TO_GEAR_SLOT } from "./dashboardGearMaps"

export const BOOKMARKLET_ENVELOPE_VERSION = 1
const ENVELOPE_SOURCE = "wwm-dashboard"

export class GearImportError extends Error {}

export type AffixTarget =
  | { kind: "word"; word: GearWordName; unit: "raw" | "percent"; cap: number }
  | { kind: "attunement"; attunementId: string; label: string; min: number; max: number }

export type AffixResolution =
  | {
      kind: "resolved"
      target: AffixTarget
      value: number
      clampedFrom: number | null
      /** Targets whose max roll matches this affix's ceiling — offered, not decisive. */
      suggestions: readonly AffixTarget[]
      choosableTargets: readonly AffixTarget[]
    }
  | {
      kind: "unmapped"
      /** Set when the id is mapped to a stat that is illegal for this build. */
      mappedTo: string | null
      suggestions: readonly AffixTarget[]
      choosableTargets: readonly AffixTarget[]
    }

export interface ImportedAffix {
  affixId: string
  rawValue: number | null
  /** `value / maxRoll`, as reported by the game. */
  rolledRatio: number | null
  /** `rawValue / rolledRatio` — the roll's ceiling, which is what identifies the stat. */
  derivedMax: number | null
  isAttunementAffix: boolean
  /** The payload entry verbatim, so diagnostics survive a shape change. */
  raw: unknown
  resolution: AffixResolution
}

export type InnerWayResolution =
  | { kind: "resolved"; innerWayId: string; name: string; tier: number; tierAssumed: boolean }
  | { kind: "notForThisClass"; innerWayId: string; name: string }
  /** In the game's passive catalog, with no `defineInnerWay` module behind it. */
  | { kind: "unsupported"; name: string }
  | { kind: "unmapped" }

export interface ImportedInnerWay {
  passiveId: string
  /** The tier the payload reports, before it is narrowed to a selectable one. */
  reportedTier: number | null
  raw: unknown
  resolution: InnerWayResolution
}

export type SlotResolution =
  { kind: "mapped"; slot: GearSlot } | { kind: "noAppEquivalent" } | { kind: "unknownSlotId" }

export interface ImportedPiece {
  gameSlotId: string
  itemId: number | null
  slot: SlotResolution
  observedBaseStats: Partial<GearBaseStats> | null
  identity: InferredGearIdentity | null
  affixes: ImportedAffix[]
  overflowAffixes: ImportedAffix[]
  attunement: ImportedAffix | null
}

export interface GearImportResult {
  roleName: string | null
  characterLevel: number | null
  pieces: ImportedPiece[]
  innerWays: ImportedInnerWay[]
  unrecognizedPayloadKeys: readonly string[]
}

const PASSIVE_SLOTS_KEY = "passiveSlots"

// Tunement and attunement ids overlap in max roll — physical penetration exists as
// both — so the id, not the ceiling, is what tells the two apart.
const LOWEST_TUNEMENT_AFFIX_ID = 1_000_000

const PASSIVE_ID_KEYS: readonly string[] = ["id", "passiveId", "no", "passiveNo"]
const PASSIVE_TIER_KEYS: readonly string[] = ["tier", "level", "lv", "grade", "stage"]
const EMPTY_PASSIVE_ID = "0"

const BASE_STAT_KEYS: Readonly<Record<keyof GearBaseStats, readonly string[]>> = {
  minPhys: ["MIN_W_ATK", "minPhys"],
  maxPhys: ["MAX_W_ATK", "maxPhys"],
  hp: ["HP_MAX", "hp"],
  physDef: ["W_DEF", "physDef"],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function firstNumber(source: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const found = asNumber(source[key])
    if (found !== null) return found
  }
  return null
}

function resolveSlot(gameSlotId: string): SlotResolution {
  if (!Object.prototype.hasOwnProperty.call(GAME_SLOT_TO_GEAR_SLOT, gameSlotId)) {
    return { kind: "unknownSlotId" }
  }
  const slot = GAME_SLOT_TO_GEAR_SLOT[gameSlotId]
  return slot ? { kind: "mapped", slot } : { kind: "noAppEquivalent" }
}

function unresolvedAffix(
  affixId: string,
  rawValue: number | null,
  rolledRatio: number | null,
  raw: unknown,
): ImportedAffix {
  const numericId = Number(affixId)
  return {
    affixId,
    rawValue,
    rolledRatio,
    derivedMax: rawValue !== null && rolledRatio ? rawValue / rolledRatio : null,
    isAttunementAffix: Number.isFinite(numericId) && numericId < LOWEST_TUNEMENT_AFFIX_ID,
    raw,
    resolution: { kind: "unmapped", mappedTo: null, suggestions: [], choosableTargets: [] },
  }
}

function readAffix(entry: unknown): ImportedAffix {
  if (typeof entry === "number") return unresolvedAffix(String(entry), null, null, entry)
  if (!isRecord(entry)) return unresolvedAffix("?", null, null, entry)

  const tuple = entry.equipmentDetails
  if (Array.isArray(tuple)) {
    const affixId = asNumber(tuple[0])
    return unresolvedAffix(
      affixId !== null ? String(affixId) : "?",
      asNumber(tuple[1]),
      asNumber(tuple[2]),
      entry,
    )
  }

  const affixId = firstNumber(entry, ["id", "affixId", "propertyId"])
  return unresolvedAffix(
    affixId !== null ? String(affixId) : "?",
    firstNumber(entry, ["value", "val", "amount"]),
    firstNumber(entry, ["ratio", "rolledRatio"]),
    entry,
  )
}

function unresolvedInnerWay(
  passiveId: string,
  reportedTier: number | null,
  raw: unknown,
): ImportedInnerWay {
  return { passiveId, reportedTier, raw, resolution: { kind: "unmapped" } }
}

// The passive-slot entry shape is not yet confirmed against a live account, so a
// bare id, an `[id, tier]` tuple and a record all read — and `raw` is what the
// diagnostics carry to pin it down.
function readInnerWay(entry: unknown): ImportedInnerWay {
  if (typeof entry === "number") return unresolvedInnerWay(String(entry), null, entry)
  if (Array.isArray(entry)) {
    const passiveId = asNumber(entry[0])
    return unresolvedInnerWay(
      passiveId !== null ? String(passiveId) : "?",
      asNumber(entry[1]),
      entry,
    )
  }
  if (!isRecord(entry)) return unresolvedInnerWay("?", null, entry)

  const passiveId = firstNumber(entry, PASSIVE_ID_KEYS)
  return unresolvedInnerWay(
    passiveId !== null ? String(passiveId) : "?",
    firstNumber(entry, PASSIVE_TIER_KEYS),
    entry,
  )
}

function readInnerWays(source: unknown): ImportedInnerWay[] {
  const entries = Array.isArray(source) ? source : isRecord(source) ? Object.values(source) : []
  return entries.map(readInnerWay).filter((innerWay) => innerWay.passiveId !== EMPTY_PASSIVE_ID)
}

function readObservedBaseStats(sources: readonly unknown[]): Partial<GearBaseStats> | null {
  const observed: Partial<GearBaseStats> = {}
  for (const source of sources) {
    if (!isRecord(source)) continue
    for (const field of Object.keys(BASE_STAT_KEYS) as (keyof GearBaseStats)[]) {
      if (observed[field] !== undefined) continue
      const found = firstNumber(source, BASE_STAT_KEYS[field])
      if (found !== null) observed[field] = found
    }
  }
  return Object.keys(observed).length ? observed : null
}

function unwrapEnvelope(parsed: unknown): Record<string, unknown> {
  if (!isRecord(parsed)) {
    throw new GearImportError(
      "That JSON is not an object. Run the bookmarklet and paste its output.",
    )
  }
  const source = parsed.source
  if (typeof source === "string" && source !== ENVELOPE_SOURCE) {
    throw new GearImportError(`That JSON came from "${source}", not the WWM dashboard bookmarklet.`)
  }
  const version = parsed.v
  if (typeof version === "number" && version > BOOKMARKLET_ENVELOPE_VERSION) {
    throw new GearImportError(
      `That JSON was made by a newer bookmarklet (v${version}). Re-drag the bookmarklet from this dialog.`,
    )
  }
  // The dashboard nests the same fields under `data`; accept a raw capture too.
  if (!parsed.wearEquipsDetailed && isRecord(parsed.data)) return parsed.data
  return parsed
}

export function parseDashboardGearPayload(text: string): GearImportResult {
  if (!text.trim()) throw new GearImportError("Paste the JSON the bookmarklet copied.")

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new GearImportError("That is not valid JSON. Copy the bookmarklet's output again.")
  }

  const envelope = unwrapEnvelope(parsed)
  const detailed = envelope.wearEquipsDetailed
  if (!isRecord(detailed)) {
    throw new GearImportError(
      "No gear data in that JSON — it has no wearEquipsDetailed. Make sure your character loaded on the dashboard before running the bookmarklet.",
    )
  }
  const wearEquips = isRecord(envelope.wearEquips) ? envelope.wearEquips : {}

  const pieces: ImportedPiece[] = Object.keys(detailed).map((gameSlotId) => {
    const detail = isRecord(detailed[gameSlotId])
      ? (detailed[gameSlotId] as Record<string, unknown>)
      : null
    const exVo = detail && isRecord(detail.exVo) ? detail.exVo : null
    const rawList = exVo && Array.isArray(exVo.baseAffixes) ? exVo.baseAffixes : []
    const all = rawList.map(readAffix)
    const tunements = all.filter((affix) => !affix.isAttunementAffix)

    return {
      gameSlotId,
      itemId: asNumber(wearEquips[gameSlotId]) ?? asNumber(detail?.no) ?? null,
      slot: resolveSlot(gameSlotId),
      observedBaseStats: readObservedBaseStats([exVo?.baseAttrs, detail, exVo]),
      identity: null,
      affixes: tunements.slice(0, 5),
      overflowAffixes: tunements.slice(5),
      attunement: all.find((affix) => affix.isAttunementAffix) ?? null,
    }
  })

  const declaredExtras = envelope.unrecognizedPayloadKeys
  return {
    roleName: typeof envelope.roleName === "string" ? envelope.roleName : null,
    characterLevel: asNumber(envelope.level),
    pieces,
    innerWays: readInnerWays(envelope[PASSIVE_SLOTS_KEY]),
    unrecognizedPayloadKeys: Array.isArray(declaredExtras)
      ? declaredExtras.filter((key): key is string => typeof key === "string")
      : [],
  }
}

/**
 * Drops the slots the game has and this app deliberately does not model, and puts
 * the rest in `GEAR_SLOTS` order so the preview reads like the Equipped card
 * rather than like the payload's key order. Slots with no app equivalent sort last.
 */
export function previewablePieces(result: GearImportResult): ImportedPiece[] {
  const order = (piece: ImportedPiece): number =>
    piece.slot.kind === "mapped" ? GEAR_SLOTS.indexOf(piece.slot.slot) : GEAR_SLOTS.length
  return result.pieces
    .filter((piece) => piece.slot.kind !== "noAppEquivalent")
    .sort((left, right) => order(left) - order(right))
}

/** A capture that lists the key as an extra came from a bookmarklet too old to carry it. */
export function innerWaysAbsentFromCapture(result: GearImportResult): boolean {
  return result.unrecognizedPayloadKeys.includes(PASSIVE_SLOTS_KEY)
}

export function targetKey(target: AffixTarget): string {
  return target.kind === "word" ? `word:${target.word}` : `attunement:${target.attunementId}`
}

export function targetLabel(target: AffixTarget): string {
  return target.kind === "word" ? target.word : target.label
}

export interface GearImportSummary {
  pieceCount: number
  mappedPieceCount: number
  resolvedAffixCount: number
  unmappedAffixCount: number
  clampedCount: number
  overflowCount: number
  innerWayCount: number
  resolvedInnerWayCount: number
}

function affixRows(piece: ImportedPiece): ImportedAffix[] {
  return piece.attunement ? [...piece.affixes, piece.attunement] : piece.affixes
}

export function summarizeImport(result: GearImportResult): GearImportSummary {
  const summary: GearImportSummary = {
    pieceCount: 0,
    mappedPieceCount: 0,
    resolvedAffixCount: 0,
    unmappedAffixCount: 0,
    clampedCount: 0,
    overflowCount: 0,
    innerWayCount: result.innerWays.length,
    resolvedInnerWayCount: result.innerWays.filter(
      (innerWay) => innerWay.resolution.kind === "resolved",
    ).length,
  }
  for (const piece of previewablePieces(result)) {
    summary.pieceCount += 1
    if (piece.slot.kind === "mapped") summary.mappedPieceCount += 1
    summary.overflowCount += piece.overflowAffixes.length
    for (const affix of affixRows(piece)) {
      if (affix.resolution.kind !== "resolved") {
        summary.unmappedAffixCount += 1
        continue
      }
      summary.resolvedAffixCount += 1
      if (affix.resolution.clampedFrom !== null) summary.clampedCount += 1
    }
  }
  return summary
}

function resolvedInnerWayId(resolution: InnerWayResolution): string | null {
  return resolution.kind === "resolved" || resolution.kind === "notForThisClass"
    ? resolution.innerWayId
    : null
}

/** Ids and raw entries only — no role name, no role id. */
export function buildImportDiagnostics(result: GearImportResult): string {
  return JSON.stringify(
    {
      source: ENVELOPE_SOURCE,
      v: BOOKMARKLET_ENVELOPE_VERSION,
      unrecognizedPayloadKeys: result.unrecognizedPayloadKeys,
      pieces: result.pieces.map((piece) => ({
        gameSlotId: piece.gameSlotId,
        slot: piece.slot,
        observedBaseStats: piece.observedBaseStats,
        baseAffixes: [...piece.affixes, ...piece.overflowAffixes].map((affix) => ({
          affixId: affix.affixId,
          derivedMax: affix.derivedMax,
          resolved:
            affix.resolution.kind === "resolved" ? targetKey(affix.resolution.target) : null,
        })),
        attunement: piece.attunement
          ? { affixId: piece.attunement.affixId, derivedMax: piece.attunement.derivedMax }
          : null,
      })),
      passiveSlots: result.innerWays.map((innerWay) => ({
        passiveId: innerWay.passiveId,
        reportedTier: innerWay.reportedTier,
        resolved: resolvedInnerWayId(innerWay.resolution),
        raw: innerWay.raw,
      })),
    },
    null,
    2,
  )
}
