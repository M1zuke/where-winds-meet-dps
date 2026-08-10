// Data source: `src/data/skills/buffs/*.json` (hand-maintained).
import type { StatKey } from "../statRegistry"

export type BuffBonusType = "buffBonus" | "groupDamage" | "phyBoostMod" | "bossOnlyBuffBonus"

export interface BuffBonus {
  type: BuffBonusType
  value?: number
  valuePerStack?: number
  valueFromParam?: string
  minStacks?: number
  phaseBonus?: Record<string, number>
}

export type BuffStatMods = Partial<
  Record<
    | "crit"
    | "affinity"
    | "critDmg"
    | "affinityDmg"
    | "directCrit"
    | "directAffinity"
    | "physPen"
    | "bellstrikePen"
    | "stonesplitPen"
    | "dotDamage"
    | "enhancedDotDamage",
    number
  >
>

export interface PerCastConsumeSource {
  buffStack: string
  enabledParam?: string
  minTier?: number
}

export interface PerCastConsumeSpec {
  triggerSkillProperty: string
  consumesFromBuffStack: string
  bonus?: BuffBonus | null
  preferredSources?: PerCastConsumeSource[]
}

// `mistwillowCategory` depends on the timeline flattening a per-hit
// light/heavy mistwillow categorization into `opts` — not yet wired (see
// docs/CALCULATION.md); until then a def gated on it alone never consumes.
export interface ConsumeOnMatch {
  skillProperty?: string
  mistwillowCategory?: boolean
  excludeProperty?: string
}

export interface TierStackRestore {
  minTier: number
  restoreOn: ConsumeOnMatch
  requireBuffActive?: boolean
  phaseGate?: string | string[]
  icd?: number
  stacksPerTrigger?: number
}

export interface ConsumableStackPool {
  stackOn: { skillProperty: string; stacksPerTrigger?: number; icd?: number }
  stackCap: number
  stackLifetime: number
  consumeOn: ConsumeOnMatch
  bonus: BuffBonus
  tierStackRestore?: TierStackRestore
}

export interface BuffDef {
  id: string
  name?: string
  triggers?: string[]
  stackOnDamage?: boolean
  exactMatch?: boolean
  refreshOn?: { skillProperty?: string; onlyIfActive?: boolean }
  onApply?: string[]
  onApplyFn?: { __handler: string }
  alwaysActive?: boolean
  counterMechanic?: { refreshable?: boolean } | boolean
  requiresSet?: string
  spec?: string
  affects?: string[] | null
  affectsProperty?: string
  affectsWeaponTypes?: string[]
  excludes?: string[]
  overriddenBy?: string
  bonus?: BuffBonus | null
  statModifiers?: BuffStatMods
  bossStatModifiers?: BuffStatMods
  tier6StatModifiers?: BuffStatMods
  __statModByPrefix?: {
    prefixes: string[]
    match: BuffStatMods | null
    default: BuffStatMods | null
  }
  forceCrit?: boolean
  forceCritIfHighCrit?: boolean
  duration?: number
  maxStacks?: number
  stacksPerHit?: number | boolean
  stacksPerCast?: number
  tierConditionalStacks?: unknown
  triggerDurations?: Record<string, number>
  extendDurationToIfBuffActive?: {
    buffId: string
    enabledParam?: string
    minTier?: number
    targetDuration: number
  }
  cooldown?: number
  rateLimit?: { count: number; window: number }
  stackRateLimit?: { count: number; window: number }
  stackIcd?: number
  triggerPhaseGate?: string | string[]
  phaseGate?: string
  enabledParam?: string
  minTier?: number
  tier6?: unknown
  tier6Value?: number
  conditionalTrigger?: { refreshIfActive?: string; upgradeFromActive?: string }
  consumableStackPool?: ConsumableStackPool
  perCastConsume?: PerCastConsumeSpec
  triggerOnBuffEnd?: { sourceBuff: string; cancelledByReapply?: boolean }
  buffAppliesOnCastEnd?: boolean
  affectsParty?: boolean
  formbendBonus?: number
  formbendBonusTriggers?: string[]
}

export const BONUS_TYPE_TO_STATKEY: Record<BuffBonusType, StatKey> = {
  buffBonus: "allDamageBoost",
  groupDamage: "allDamageBoost",
  phyBoostMod: "physBoost",
  bossOnlyBuffBonus: "bossBoost",
}

// `scale` converts the site's unit to the app's: rates/dmg are already
// fractions (scale 1); the site's `physPen` is in 0-200 "points" while the
// app stores penetration as a fraction the panel multiplies by 100, so
// 1 site point = 0.01 app fraction.
export const STATMOD_TO_STATKEY: Record<keyof BuffStatMods, { key: StatKey; scale: number }> = {
  crit: { key: "critRate", scale: 1 },
  affinity: { key: "affinityRate", scale: 1 },
  critDmg: { key: "critDamageBoost", scale: 1 },
  affinityDmg: { key: "affinityDamageBoost", scale: 1 },
  directCrit: { key: "directCritRate", scale: 1 },
  directAffinity: { key: "directAffinityRate", scale: 1 },
  physPen: { key: "phys.penetration", scale: 0.01 },
  bellstrikePen: { key: "bellstrike.penetration", scale: 0.01 },
  stonesplitPen: { key: "stonesplit.penetration", scale: 0.01 },
  dotDamage: { key: "sustainDamageBoost", scale: 1 },
  enhancedDotDamage: { key: "sustainDamageBoost", scale: 1 },
}

export function statModsToEffects(
  mods: BuffStatMods | null | undefined,
): { statKey: StatKey; amount: number }[] {
  if (!mods) return []
  const out: { statKey: StatKey; amount: number }[] = []
  for (const k of Object.keys(mods) as (keyof BuffStatMods)[]) {
    const m = STATMOD_TO_STATKEY[k]
    const v = mods[k]
    if (m && typeof v === "number" && v !== 0) out.push({ statKey: m.key, amount: v * m.scale })
  }
  return out
}

export function isBuffDef(x: unknown): x is BuffDef {
  return !!x && typeof x === "object" && typeof (x as { id?: unknown }).id === "string"
}
