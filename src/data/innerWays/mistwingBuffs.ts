import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// Tier 1 adds 3 Physical Penetration in the damage calculation, tier 4 raises
// it to 6 of every type, and tier 6 adds a further 6 of every type while
// Inebriate. Penetration is a character stat rather than a per-skill bonus, so
// every rung reaches every skill the class casts — hence affectsAll.
export const mistwingPhysicalPenetration = defineBuff({
  id: BUFF.mistwingPhysicalPenetration,
  name: "Mistwing T1 (Physical Penetration)",
  requires: { param: PARAM.mistwing, minTier: 1 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +3",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("phys.penetration", 0.03)] : []),
})

export const mistwingAllTypePenetration = defineBuff({
  id: BUFF.mistwingAllTypePenetration,
  name: "Mistwing T4 (All-Type Penetration)",
  requires: { param: PARAM.mistwing, minTier: 4 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +3, bamboocut.penetration +6",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [stat("phys.penetration", 0.03), stat("bamboocut.penetration", 0.06)]
      : [],
})

export const mistwingInebriatePenetration = defineBuff({
  id: BUFF.mistwingInebriatePenetration,
  name: "Mistwing T6 (Inebriate Penetration)",
  requires: { param: PARAM.mistwing, minTier: 6 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +6, bamboocut.penetration +6 while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("phys.penetration", 0.06), stat("bamboocut.penetration", 0.06)]
      : [],
})

// In-game values as of 2026-09-10.
const TARGET_HEALTH_PENETRATION_BANDS: readonly { above: number; step: number }[] = [
  { above: 0.9, step: 0 },
  { above: 0.8, step: 0.01 },
  { above: 0.7, step: 0.02 },
  { above: 0.6, step: 0.03 },
  { above: -Infinity, step: 0.04 },
]

function targetHealthPenetrationStep(remainingHealthFraction: number): number {
  const band = TARGET_HEALTH_PENETRATION_BANDS.find(
    (candidate) => remainingHealthFraction > candidate.above,
  )
  return band ? band.step : 0.04
}

export const mistwingTargetHealthPenetration = defineBuff({
  id: BUFF.mistwingTargetHealthPenetration,
  name: "Mistwing T6 (Target Health Penetration)",
  requires: { param: PARAM.mistwing, minTier: 6 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary:
    "phys.penetration and bamboocut.penetration step up as the target's health falls, doubled while Inebriate",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    const base = targetHealthPenetrationStep(ctx.target.remainingHealthFraction)
    const step = isInebriate(ctx) ? base * 2 : base
    return step > 0 ? [stat("phys.penetration", step), stat("bamboocut.penetration", step)] : []
  },
})

// Tiers 1-5 read a shallower band, replaced outright by tier 6's own bands
// above rather than adding to them. In-game values as of 2026-09-16.
const LOW_TIER_TARGET_HEALTH_PENETRATION_BANDS: readonly { above: number; step: number }[] = [
  { above: 0.8, step: 0 },
  { above: 0.6, step: 0.01 },
  { above: 0.4, step: 0.02 },
  { above: 0.2, step: 0.03 },
  { above: -Infinity, step: 0.04 },
]

function lowTierTargetHealthPenetrationStep(remainingHealthFraction: number): number {
  const band = LOW_TIER_TARGET_HEALTH_PENETRATION_BANDS.find(
    (candidate) => remainingHealthFraction > candidate.above,
  )
  return band ? band.step : 0.04
}

export const mistwingLowTierTargetHealthPenetration = defineBuff({
  id: BUFF.mistwingLowTierTargetHealthPenetration,
  name: "Mistwing T1 (Target Health Penetration)",
  requires: { param: PARAM.mistwing, minTier: 1 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary:
    "physical penetration steps up as the target's health falls, all types from tier 4, doubled while Inebriate from tier 3",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    const tier = ctx.build.paramTier(PARAM.mistwing)
    if (tier >= 6) return []
    const base = lowTierTargetHealthPenetrationStep(ctx.target.remainingHealthFraction)
    if (base <= 0) return []
    const step = tier >= 3 && isInebriate(ctx) ? base * 2 : base
    return tier >= 4
      ? [stat("phys.penetration", step), stat("bamboocut.penetration", step)]
      : [stat("phys.penetration", step)]
  },
})
