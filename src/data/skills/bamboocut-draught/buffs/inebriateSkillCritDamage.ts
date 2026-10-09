import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"
import { steppedByMinPhysAttack } from "./minPhysScaling"

const MAX_CRIT_DAMAGE_BOOST = 0.3
const CRIT_DAMAGE_BOOST_STEPS = 15

export function inebriateCritDamageBoostAt(minPhysAttack: number): number {
  return steppedByMinPhysAttack(MAX_CRIT_DAMAGE_BOOST, CRIT_DAMAGE_BOOST_STEPS, minPhysAttack)
}

// Talent "Inebriate Critical Enhancement", rank 3 at art level 100: +2%
// critical damage per full 50 Min Physical Attack, up to +30% at 750 (in-game
// values as of 2026-09-16) on Inebriate-enhanced skills.
export const inebriateSkillCritDamage = defineClassBuff({
  id: BUFF.inebriateSkillCritDamage,
  name: "Inebriate Critical Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary:
    "critDamageBoost up to +30% on Inebriate-enhanced skills while Inebriate, full at 750 Min Phys",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("critDamageBoost", inebriateCritDamageBoostAt(ctx.build.minPhysAttack))]
      : [],
})
