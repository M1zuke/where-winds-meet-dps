import type { GearPiece, Inputs } from "./types"
import { isWeaponSlot } from "./types"
import { gearBaseStatsFor } from "../data/stats/gearBaseStats"
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

export interface GearContribEntry {
  path: string
  amount: number
}

export type GearContribution = GearContribEntry[]

const NUMERIC_PATHS = [
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
] as const

export type PanelStatPath =
  (typeof NUMERIC_PATHS)[number] | `primaryAttr.${"min" | "max" | "penetration"}`

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
