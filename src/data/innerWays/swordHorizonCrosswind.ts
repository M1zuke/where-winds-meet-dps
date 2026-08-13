// Sword Horizon's crosswind charge is per-detonation STATE, not a time-windowed
// buff — every Bleed Detonation advances a counter, and the fifth one converts
// to a guaranteed affinity hit and resets. That is why it belongs to the skill
// rather than to the buff engine (see `swordHorizonZenith.ts`'s `zenithBar`,
// which is never seeded or activated).
import { DEFAULT_BEHAVIOR, type SkillBehavior, type BuildView } from "../../engine/behavior"
import { stat, forceOutcome, setStatus, type HitEffect } from "../../engine/effects/effect"
import { CrosswindTracker } from "../../engine/buffs/crosswind"
import {
  ZENITH_BAR_BUFF_ID,
  ZENITH_BAR_DAMAGE_BONUS,
  ZENITH_BAR_MAX_CHARGES,
  ZENITH_DETONATION_BUFF_ID,
} from "./swordHorizonZenith"
import { innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { swordHorizon } from "./swordHorizon"

// A hoisted function, not a `const`: `swordHorizon.ts` imports this module for
// its `skillBehaviors` entry, and this module imports `swordHorizon` back for
// its id/tier — a `const` here would leave whichever module loads second
// reading an uninitialized binding.
export function crosswindBehavior(build: BuildView): SkillBehavior | null {
  const tier = build.innerWayTier(swordHorizon.id)
  if (tier === null) return null
  const tracker = new CrosswindTracker({
    maxCharges: ZENITH_BAR_MAX_CHARGES,
    retainOnMax: innerWayHasNode(swordHorizon, tier, INNER_WAY_NODE.crosswindChargeRetention),
  })

  return {
    ...DEFAULT_BEHAVIOR,
    onHit(): HitEffect[] {
      const outcome = tracker.onDetonation()
      const effects: HitEffect[] = [
        setStatus(ZENITH_BAR_BUFF_ID, { stacks: tracker.charge, permanent: true }),
      ]
      if (outcome.guaranteedAffinity) {
        effects.push(setStatus(ZENITH_DETONATION_BUFF_ID, { stacks: 1 }))
        effects.push(forceOutcome("affinity"))
      }
      if (outcome.damageBonusActive) effects.push(stat("allDamageBoost", ZENITH_BAR_DAMAGE_BONUS))
      return effects
    },
  }
}
