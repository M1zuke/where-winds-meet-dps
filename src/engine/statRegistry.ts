// CAP CONVENTION (load-bearing — see CLAUDE.md white/yellow rules): additive
// deltas land on the RAW `Inputs` field, then `formula.ts` applies its caps
// downstream (crit MIN(…, 0.8), affinity MIN(…, 0.4)) — to grant cap-bypassing
// rate, author `directCritRate`/`directAffinityRate` instead. Penetration is
// stored as a fraction (0.292 == 29.2 %).
import type { Inputs } from "./types"
import type { TargetOverride } from "./panel"
import { getBreakthrough } from "../definitions/baseStats/breakthroughs"

export type StatScope = "player" | "target"
export type StatUnit = "fraction" | "flat"

export type StatKey =
  | "precision"
  | "critRate"
  | "affinityRate"
  | "directCritRate"
  | "directAffinityRate"
  | "physBoost"
  | "critDamageBoost"
  | "affinityDamageBoost"
  | "attributeDamageBoost"
  | "sustainDamageBoost"
  | "allDamageBoost"
  | "allMartialBoost"
  | "swordBoost"
  | "spearBoost"
  | "fanBoost"
  | "umbrellaBoost"
  | "modaoBoost"
  | "dualKnivesBoost"
  | "ropeDartBoost"
  | "hengDaoBoost"
  | "bossBoost"
  | "singleMysticBoost"
  | "areaMysticBoost"
  | "phys.min"
  | "phys.max"
  | "phys.penetration"
  | "bellstrike.min"
  | "bellstrike.max"
  | "bellstrike.penetration"
  | "stonesplit.min"
  | "stonesplit.max"
  | "stonesplit.penetration"
  | "silkbind.min"
  | "silkbind.max"
  | "silkbind.penetration"
  | "bamboocut.min"
  | "bamboocut.max"
  | "bamboocut.penetration"
  | "target.defense"
  | "target.defensePct"
  | "target.generalDamageTaken"
  | "target.fatigueDamageTaken"

export interface StatDef {
  key: StatKey
  label: string
  scope: StatScope
  unit: StatUnit
  category: string
}

export const STAT_DEFS: readonly StatDef[] = [
  {
    key: "precision",
    label: "Precision",
    scope: "player",
    unit: "fraction",
    category: "Three Rates",
  },
  {
    key: "critRate",
    label: "Crit Rate",
    scope: "player",
    unit: "fraction",
    category: "Three Rates",
  },
  {
    key: "affinityRate",
    label: "Affinity Rate",
    scope: "player",
    unit: "fraction",
    category: "Three Rates",
  },
  {
    key: "directCritRate",
    label: "Direct Crit",
    scope: "player",
    unit: "fraction",
    category: "Three Rates",
  },
  {
    key: "directAffinityRate",
    label: "Direct Affinity",
    scope: "player",
    unit: "fraction",
    category: "Three Rates",
  },
  {
    key: "physBoost",
    label: "Physical Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "critDamageBoost",
    label: "Crit Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "affinityDamageBoost",
    label: "Affinity Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "attributeDamageBoost",
    label: "Attribute Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "sustainDamageBoost",
    label: "Sustain Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "allDamageBoost",
    label: "General Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Damage Boosts",
  },
  {
    key: "allMartialBoost",
    label: "All Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "swordBoost",
    label: "Sword Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "spearBoost",
    label: "Spear Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "fanBoost",
    label: "Fan Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "umbrellaBoost",
    label: "Umbrella Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "modaoBoost",
    label: "Modao Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "dualKnivesBoost",
    label: "Twin Blades Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "ropeDartBoost",
    label: "Rope Dart Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "hengDaoBoost",
    label: "Hengdao Martial Boost",
    scope: "player",
    unit: "fraction",
    category: "Martial Boosts",
  },
  {
    key: "bossBoost",
    label: "Boss Damage Boost",
    scope: "player",
    unit: "fraction",
    category: "Target-Type Boosts",
  },
  {
    key: "singleMysticBoost",
    label: "Single-Target Mystic Skill DMG Boost",
    scope: "player",
    unit: "fraction",
    category: "Target-Type Boosts",
  },
  {
    key: "areaMysticBoost",
    label: "Area Mystic Skill DMG Boost",
    scope: "player",
    unit: "fraction",
    category: "Target-Type Boosts",
  },
  { key: "phys.min", label: "Min Phys", scope: "player", unit: "flat", category: "Phys" },
  { key: "phys.max", label: "Max Phys", scope: "player", unit: "flat", category: "Phys" },
  {
    key: "phys.penetration",
    label: "Physical Penetration",
    scope: "player",
    unit: "fraction",
    category: "Phys",
  },
  {
    key: "bellstrike.min",
    label: "Min Bellstrike",
    scope: "player",
    unit: "flat",
    category: "Bellstrike",
  },
  {
    key: "bellstrike.max",
    label: "Max Bellstrike",
    scope: "player",
    unit: "flat",
    category: "Bellstrike",
  },
  {
    key: "bellstrike.penetration",
    label: "Bellstrike Penetration",
    scope: "player",
    unit: "fraction",
    category: "Bellstrike",
  },
  {
    key: "stonesplit.min",
    label: "Min Stonesplit",
    scope: "player",
    unit: "flat",
    category: "Stonesplit",
  },
  {
    key: "stonesplit.max",
    label: "Max Stonesplit",
    scope: "player",
    unit: "flat",
    category: "Stonesplit",
  },
  {
    key: "stonesplit.penetration",
    label: "Stonesplit Penetration",
    scope: "player",
    unit: "fraction",
    category: "Stonesplit",
  },
  {
    key: "silkbind.min",
    label: "Min Silkbind",
    scope: "player",
    unit: "flat",
    category: "Silkbind",
  },
  {
    key: "silkbind.max",
    label: "Max Silkbind",
    scope: "player",
    unit: "flat",
    category: "Silkbind",
  },
  {
    key: "silkbind.penetration",
    label: "Silkbind Penetration",
    scope: "player",
    unit: "fraction",
    category: "Silkbind",
  },
  {
    key: "bamboocut.min",
    label: "Min Bamboocut",
    scope: "player",
    unit: "flat",
    category: "Bamboocut",
  },
  {
    key: "bamboocut.max",
    label: "Max Bamboocut",
    scope: "player",
    unit: "flat",
    category: "Bamboocut",
  },
  {
    key: "bamboocut.penetration",
    label: "Bamboocut Penetration",
    scope: "player",
    unit: "fraction",
    category: "Bamboocut",
  },
  {
    key: "target.defense",
    label: "Target Defense",
    scope: "target",
    unit: "flat",
    category: "Target",
  },
  {
    key: "target.defensePct",
    label: "Target Defense %",
    scope: "target",
    unit: "fraction",
    category: "Target",
  },
  {
    key: "target.generalDamageTaken",
    label: "Target Vulnerability",
    scope: "target",
    unit: "fraction",
    category: "Target",
  },
  {
    key: "target.fatigueDamageTaken",
    label: "Target Exhaustion Boost",
    scope: "target",
    unit: "fraction",
    category: "Target",
  },
]

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
