// Sword Horizon's crosswind charge is per-detonation STATE, not a time-windowed
// buff — every Bleed Detonation advances a counter, and the fifth one converts
// to a guaranteed affinity hit and resets. That is why it belongs to the skill
// rather than to the buff engine (see src/data/skills/buffs/crosswindSpirit.ts,
// which is never seeded or activated).
import { DEFAULT_BEHAVIOR, registerSkillBehavior, type SkillBehavior } from "../../engine/behavior"
import { stat, forceOutcome, setStatus, type HitEffect } from "../../engine/effects/effect"
import { CrosswindTracker } from "../../engine/buffs/crosswind"
import { SKILL } from "../skills/bellstrike-umbra/ids"
import { CROSSWIND_SPIRIT_BONUS } from "../skills/buffs/crosswindSpirit"
// This module is the one the class barrel (`data/classes/index.ts`) actually
// imports, so it is also what transitively pulls `bellstrikeUmbraGates.ts`'s
// own registration side effect (`registerBuiltinBuffs`, `registerPoisonExtension`)
// into the app — importing the gate ids from `ids.ts` directly instead would
// silently drop that registration. Keep this import even though only the two
// named values are used.
import { ZENITH_BAR_BUFF_ID, ZENITH_DETONATION_BUFF_ID } from "./bellstrikeUmbraGates"

const SKILL_ID = SKILL.bleedDetonation
const INNER_WAY = "swordHorizon"
const RETAIN_TIER = 6

registerSkillBehavior(SKILL_ID, (build): SkillBehavior | null => {
  const tier = build.innerWayTier(INNER_WAY)
  if (tier === null) return null
  const tracker = new CrosswindTracker(tier >= RETAIN_TIER)

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
})
