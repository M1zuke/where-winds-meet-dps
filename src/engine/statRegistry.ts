// CAP CONVENTION (load-bearing — see CLAUDE.md white/yellow rules): additive
// deltas land on the RAW `Inputs` field, then `formula.ts` applies its caps
// downstream (crit MIN(…, 0.8), affinity MIN(…, 0.4)) — to grant cap-bypassing
// rate, author `directCritRate`/`directAffinityRate` instead. Penetration is
// stored as a fraction (0.292 == 29.2 %).
import type { Inputs } from "./types"
import type { TargetOverride } from "./panel"
import { getBreakthrough } from "../definitions/baseStats/breakthroughs"
import { STAT_PATH_LINES, type StatPathKey } from "../data/stats/statLines"

export type StatScope = "player" | "target"
export type StatUnit = "fraction" | "flat"

export type StatKey = StatPathKey

export interface StatDef {
  key: StatKey
  label: string
  scope: StatScope
  unit: StatUnit
  category: string
}

export const STAT_DEFS: readonly StatDef[] = STAT_PATH_LINES.map((line) => ({
  key: line.enginePath as StatKey,
  label: line.label,
  scope: line.scope,
  unit: line.unit === "raw" ? "flat" : "fraction",
  category: line.category,
}))
export const STAT_DEF_BY_KEY: Readonly<Record<string, StatDef>> = Object.fromEntries(
  STAT_DEFS.map((d) => [d.key, d]),
)

export const PLAYER_STAT_DEFS: readonly StatDef[] = STAT_DEFS.filter((d) => d.scope === "player")
export const TARGET_STAT_DEFS: readonly StatDef[] = STAT_DEFS.filter((d) => d.scope === "target")

export const WEAPON_BOOST_STAT_KEY: Readonly<Record<string, StatKey>> = {
  Sword: "swordBoost",
  Spear: "spearBoost",
  Fan: "fanBoost",
  Umbrella: "umbrellaBoost",
  Modao: "modaoBoost",
  "Twin Blades": "dualKnivesBoost",
  "Rope Dart": "ropeDartBoost",
  Hengdao: "hengDaoBoost",
}

export const MYSTIC_TYPE_BOOST_STAT_KEY: Readonly<Record<string, StatKey>> = {
  control: "singleMysticBoost",
  burst: "singleMysticBoost",
  area: "areaMysticBoost",
  "area-debuff": "areaMysticBoost",
  "area-damage": "areaMysticBoost",
}

const ATTACK_BLOCKS = new Set(["phys", "bellstrike", "stonesplit", "silkbind", "bamboocut"])

const TARGET_DELTA_FIELD: Record<string, keyof TargetOverride> = {
  "target.defense": "defenseDelta",
  "target.generalDamageTaken": "generalDamageTakenDelta",
  "target.fatigueDamageTaken": "fatigueDamageTakenDelta",
}

export interface AppliedBuffDeltas {
  inputs: Inputs
  targetOverride: TargetOverride
}

export function applyBuffEffects(
  inputs: Inputs,
  effects: readonly { statKey: string; amount: number }[],
): AppliedBuffDeltas {
  if (effects.length === 0) return { inputs, targetOverride: {} }

  let out: Inputs | null = null
  const clonedBlocks = new Set<string>()
  const targetOverride: TargetOverride = {}
  const cloneOut = (): Inputs => (out ??= { ...inputs })

  for (const { statKey, amount } of effects) {
    if (!amount || !STAT_DEF_BY_KEY[statKey]) continue

    if (statKey === "target.defensePct") {
      const baseDefense = getBreakthrough(inputs.breakthrough).defense
      targetOverride.defenseDelta = (targetOverride.defenseDelta ?? 0) + amount * baseDefense
      continue
    }

    const targetField = TARGET_DELTA_FIELD[statKey]
    if (targetField) {
      targetOverride[targetField] = (targetOverride[targetField] ?? 0) + amount
      continue
    }

    const dot = statKey.indexOf(".")
    if (dot > 0) {
      const block = statKey.slice(0, dot)
      const sub = statKey.slice(dot + 1)
      if (!ATTACK_BLOCKS.has(block)) continue
      const o = cloneOut()
      if (!clonedBlocks.has(block)) {
        ;(o as unknown as Record<string, Record<string, number>>)[block] = {
          ...(o as unknown as Record<string, Record<string, number>>)[block],
        }
        clonedBlocks.add(block)
      }
      const b = (o as unknown as Record<string, Record<string, number>>)[block]
      b[sub] = (b[sub] ?? 0) + amount
      continue
    }

    const o = cloneOut()
    const cur = (o as unknown as Record<string, unknown>)[statKey]
    if (typeof cur === "number") {
      ;(o as unknown as Record<string, number>)[statKey] = cur + amount
    }
  }

  return { inputs: out ?? inputs, targetOverride }
}
