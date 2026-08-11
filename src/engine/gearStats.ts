import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "./types"
import { isWeaponSlot } from "./types"
import { getWordSpecs } from "./itemRanking"
import { getAttunement } from "./attunements"
import { addStatDelta, resolveEnginePath } from "./statPaths"

export const RELAYED_FACTOR = 0.94

// Kept to the precision the UI shows — two decimals, which for a percent word
// means four on the stored fraction.
export function relayedCapValue(amount: number, unit: "raw" | "percent"): number {
  const raw = amount * RELAYED_FACTOR
  return unit === "percent" ? Math.round(raw * 10000) / 10000 : Math.round(raw * 100) / 100
}

export interface GearBaseStats {
  minPhys: number
  maxPhys: number
  hp: number
  physDef: number
}

// Source: in-game lvl-91 / lvl-96 gear.
const GEAR_BASE_STATS: Partial<
  Record<GearLevel, Record<GearSlot, Record<GearRarity, GearBaseStats>>>
> = {
  91: {
    leftWeapon: {
      epic: { minPhys: 48, maxPhys: 112, hp: 0, physDef: 0 },
      legendary: { minPhys: 53, maxPhys: 124, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 48, maxPhys: 112, hp: 0, physDef: 0 },
      legendary: { minPhys: 53, maxPhys: 124, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 64, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 71, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 96, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 106, hp: 0, physDef: 0 },
    },
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 18 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 8305, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 9227, physDef: 18 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 32 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 36 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 4153, physDef: 16 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 4614, physDef: 18 },
    },
  },
  96: {
    leftWeapon: {
      epic: { minPhys: 59, maxPhys: 136, hp: 0, physDef: 0 },
      legendary: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
    },
    rightWeapon: {
      epic: { minPhys: 59, maxPhys: 136, hp: 0, physDef: 0 },
      legendary: { minPhys: 65, maxPhys: 151, hp: 0, physDef: 0 },
    },
    disc: {
      epic: { minPhys: 78, maxPhys: 0, hp: 0, physDef: 0 },
      legendary: { minPhys: 86, maxPhys: 0, hp: 0, physDef: 0 },
    },
    pendant: {
      epic: { minPhys: 0, maxPhys: 116, hp: 0, physDef: 0 },
      legendary: { minPhys: 0, maxPhys: 129, hp: 0, physDef: 0 },
    },
    // lv96 armor, from a live lvl-96 build (2026-08-11): helm legendary 22/5774,
    // armor legendary 22/11547, greaves epic 39/5196, bracer epic 20/5196. Helm and
    // bracer share one row and armor is twice helm, which fixes the other three
    // cells; only greaves legendary defense is extrapolated (39 × the observed
    // 22/20 rarity step) and is the one number here still to be confirmed in game.
    helm: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
    },
    armor: {
      epic: { minPhys: 0, maxPhys: 0, hp: 10392, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 11547, physDef: 22 },
    },
    greaves: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 39 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 43 },
    },
    bracer: {
      epic: { minPhys: 0, maxPhys: 0, hp: 5196, physDef: 20 },
      legendary: { minPhys: 0, maxPhys: 0, hp: 5774, physDef: 22 },
    },
  },
}

const ZERO_BASE: GearBaseStats = { minPhys: 0, maxPhys: 0, hp: 0, physDef: 0 }

export function gearBaseStatsFor(
  piece: Pick<GearPiece, "slot" | "rarity" | "level">,
): GearBaseStats {
  const byLevel = GEAR_BASE_STATS[piece.level] ?? GEAR_BASE_STATS[91]!
  return byLevel[piece.slot]?.[piece.rarity] ?? ZERO_BASE
}

export interface GearIdentity {
  level: GearLevel
  rarity: GearRarity
}

export interface InferredGearIdentity {
  level: GearLevel | null
  rarity: GearRarity | null
  candidates: readonly GearIdentity[]
}

const TABLED_LEVELS: readonly GearLevel[] = [91, 96]
const RARITIES: readonly GearRarity[] = ["legendary", "epic"]

function comparedFields(slot: GearSlot): readonly (keyof GearBaseStats)[] {
  return isWeaponSlot(slot) ? ["minPhys", "maxPhys"] : ["hp", "physDef"]
}

/**
 * Recovers a piece's level and rarity from the base stats the game reports for
 * it. An axis that the observed stats cannot pin comes back null with every
 * candidate listed; lv86 has no table row and is never inferred.
 */
export function inferGearIdentity(
  slot: GearSlot,
  observed: Partial<GearBaseStats>,
): InferredGearIdentity {
  const fields = comparedFields(slot).filter((field) => typeof observed[field] === "number")
  if (!fields.length) return { level: null, rarity: null, candidates: [] }

  const candidates: GearIdentity[] = []
  for (const level of TABLED_LEVELS) {
    for (const rarity of RARITIES) {
      const tabled = gearBaseStatsFor({ slot, level, rarity })
      if (fields.every((field) => tabled[field] === observed[field])) {
        candidates.push({ level, rarity })
      }
    }
  }

  const levels = new Set(candidates.map((candidate) => candidate.level))
  const rarities = new Set(candidates.map((candidate) => candidate.rarity))
  return {
    level: levels.size === 1 ? [...levels][0]! : null,
    rarity: rarities.size === 1 ? [...rarities][0]! : null,
    candidates,
  }
}

export interface GearContribEntry {
  path: string
  amount: number
}

export type GearContribution = GearContribEntry[]

const NUMERIC_PATHS: readonly string[] = [
  "phys.min",
  "phys.max",
  "phys.penetration",
  "bellstrike.min",
  "bellstrike.max",
  "bellstrike.penetration",
  "stonesplit.min",
  "stonesplit.max",
  "stonesplit.penetration",
  "silkbind.min",
  "silkbind.max",
  "silkbind.penetration",
  "bamboocut.min",
  "bamboocut.max",
  "bamboocut.penetration",
  "precision",
  "critRate",
  "affinityRate",
  "directCritRate",
  "directAffinityRate",
  "physBoost",
  "critDamageBoost",
  "affinityDamageBoost",
  "attributeDamageBoost",
  "sustainDamageBoost",
  "allMartialBoost",
  "swordBoost",
  "spearBoost",
  "fanBoost",
  "umbrellaBoost",
  "modaoBoost",
  "dualKnivesBoost",
  "ropeDartBoost",
  "hengDaoBoost",
  "bossBoost",
  "singleMysticBoost",
  "areaMysticBoost",
]

function readPath(obj: unknown, path: string): number {
  const parts = path.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return 0
    }
  }
  return typeof cur === "number" ? cur : 0
}

function diffNumeric(before: Inputs, after: Inputs): GearContribution {
  const out: GearContribution = []
  for (const path of NUMERIC_PATHS) {
    const b = readPath(before, path)
    const a = readPath(after, path)
    if (a !== b) out.push({ path, amount: a - b })
  }
  return out
}

export function computeGearContribution(piece: GearPiece, ctx: Inputs): GearContribution {
  const out: GearContribution = []

  const base = gearBaseStatsFor(piece)
  if (isWeaponSlot(piece.slot)) {
    if (base.minPhys) out.push({ path: "phys.min", amount: base.minPhys })
    if (base.maxPhys) out.push({ path: "phys.max", amount: base.maxPhys })
  } else {
    if (base.hp) out.push({ path: "hp", amount: base.hp })
    if (base.physDef) out.push({ path: "physDef", amount: base.physDef })
  }

  const specs = getWordSpecs(ctx)
  for (const w of piece.words) {
    if (!w.word) continue
    const spec = specs.find((s) => s.word === w.word)
    if (!spec || !spec.amount) continue
    const scale = w.value / spec.amount
    if (!scale) continue
    const after = spec.apply(ctx)
    for (const d of diffNumeric(ctx, after)) {
      out.push({ path: d.path, amount: d.amount * scale })
    }
  }

  if (piece.attunement && piece.attunementValue) {
    const opt = getAttunement(piece.attunement)
    if (opt && opt.enginePath) {
      out.push({
        path: resolveEnginePath(opt.enginePath, ctx),
        amount: piece.attunementValue,
      })
    }
  }

  return out
}

export function sumContributions(pieces: GearPiece[], ctx: Inputs): GearContribution {
  const totals = new Map<string, number>()
  for (const p of pieces) {
    for (const e of computeGearContribution(p, ctx)) {
      totals.set(e.path, (totals.get(e.path) ?? 0) + e.amount)
    }
  }
  return [...totals.entries()].map(([path, amount]) => ({ path, amount }))
}

export function listKnownPaths(): readonly string[] {
  return NUMERIC_PATHS
}

export function gearAttributeTotals(pieces: readonly GearPiece[]): {
  power: number
  agility: number
  momentum: number
} {
  let power = 0
  let agility = 0
  let momentum = 0
  for (const p of pieces) {
    for (const w of p.words) {
      if (!w.word || !w.value) continue
      if (w.word === "Power") power += w.value
      else if (w.word === "Agility") agility += w.value
      else if (w.word === "Momentum") momentum += w.value
    }
  }
  return { power, agility, momentum }
}

function clonePieceShape(i: Inputs): Inputs {
  return {
    ...i,
    phys: { ...i.phys },
    bellstrike: { ...i.bellstrike },
    stonesplit: { ...i.stonesplit },
    silkbind: { ...i.silkbind },
    bamboocut: { ...i.bamboocut },
    mindMethods: i.mindMethods.map((m) => ({ ...m })) as Inputs["mindMethods"],
    dingYinByTag: { ...i.dingYinByTag },
  }
}

export function applyPieceContribution(inputs: Inputs, piece: GearPiece, sign: 1 | -1): Inputs {
  const next = clonePieceShape(inputs)
  const contribution = computeGearContribution(piece, inputs)
  for (const e of contribution) {
    if (e.path === "hp" || e.path === "physDef") continue
    addStatDelta(next, e.path, sign * e.amount)
  }
  return next
}

export function maxRelayedClone(piece: GearPiece, ctx: Inputs): GearPiece {
  const specs = getWordSpecs(ctx)
  const upgraded = piece.words.map((w) => {
    if (!w.word) return w
    const spec = specs.find((s) => s.word === w.word)
    if (!spec) return w
    return { ...w, value: relayedCapValue(spec.amount, spec.unit) }
  }) as GearPiece["words"]
  return { ...piece, words: upgraded, relayed: true }
}
