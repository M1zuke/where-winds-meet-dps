// Sword Horizon's crosswind charge is per-detonation STATE, not a time-windowed
// buff — every Bleed Detonation advances a counter, and the fifth one converts
// to a guaranteed affinity hit and resets. That is why it belongs to the skill
// rather than to the buff engine (see src/data/skills/buffs/crosswindSpirit.json,
// whose generic `bonus`/`counterMechanic` fields are deliberately unused).
import {
  DEFAULT_BEHAVIOR,
  registerSkillBehavior,
  type HitOutcome,
  type StatusWrite,
  type SkillBehavior,
} from "../../engine/behavior"
import { CrosswindTracker } from "../../engine/buffs/crosswind"
import { ZENITH_BAR_BUFF_ID, ZENITH_DETONATION_BUFF_ID } from "./bellstrikeUmbraGates"

const SKILL_ID = "bellstrikeUmbra-bleed-detonation"
const INNER_WAY = "Sword Horizon"
const RETAIN_TIER = 6
const SPIRIT_BONUS = 0.15

registerSkillBehavior(SKILL_ID, (build): SkillBehavior | null => {
  const tier = build.innerWayTier(INNER_WAY)
  if (tier === null) return null
  const tracker = new CrosswindTracker(tier >= RETAIN_TIER)

  return {
    ...DEFAULT_BEHAVIOR,
    onHit(): HitOutcome {
      const outcome = tracker.onDetonation()
      const statuses: StatusWrite[] = [
        { id: ZENITH_BAR_BUFF_ID, stacks: tracker.charge, permanent: true },
      ]
      if (outcome.guaranteedAffinity) statuses.push({ id: ZENITH_DETONATION_BUFF_ID, stacks: 1 })
      return {
        statuses,
        statEffects: outcome.spiritBonusActive
          ? [{ statKey: "allDamageBoost", amount: SPIRIT_BONUS }]
          : [],
        forceGuaranteedAffinity: outcome.guaranteedAffinity,
      }
    },
  }
})
