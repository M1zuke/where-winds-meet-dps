// Sword Horizon's crosswind charge is per-detonation STATE, not a time-windowed
// buff — every Bleed Detonation advances a counter, and the fifth one converts
// to a guaranteed affinity hit and resets. That is why it belongs to the skill
// rather than to the buff engine (see
// src/data/skills/bellstrike-umbra/buffs/crosswindSpirit.ts, which is never
// seeded or activated).
import {
  DEFAULT_BEHAVIOR,
  type SkillBehavior,
  type SkillBehaviorFactory,
} from "../../engine/behavior"
import { stat, forceOutcome, setStatus, type HitEffect } from "../../engine/effects/effect"
import { CrosswindTracker } from "../../engine/buffs/crosswind"
import { CROSSWIND_SPIRIT_BONUS } from "../skills/bellstrike-umbra/buffs/crosswindSpirit"
import { ZENITH_BAR_BUFF_ID, ZENITH_DETONATION_BUFF_ID } from "./bellstrikeUmbraGates"
import { innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "../innerWays/ids"
import { swordHorizon } from "../innerWays/swordHorizon"

export const crosswindBehavior: SkillBehaviorFactory = (build): SkillBehavior | null => {
  const tier = build.innerWayTier(swordHorizon.id)
  if (tier === null) return null
  const tracker = new CrosswindTracker(
    innerWayHasNode(swordHorizon, tier, INNER_WAY_NODE.crosswindChargeRetention),
  )

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
      if (outcome.spiritBonusActive) effects.push(stat("allDamageBoost", CROSSWIND_SPIRIT_BONUS))
      return effects
    },
  }
}
