import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"
import { scaledByMinPhysAttack } from "./minPhysScaling"

const MAX_CRIT_DAMAGE_BOOST = 0.3

export function inebriateCritDamageBoostAt(minPhysAttack: number): number {
  return scaledByMinPhysAttack(MAX_CRIT_DAMAGE_BOOST, minPhysAttack)
}

// Talent "Inebriate Critical Enhancement", rank 3 at art level 100: up to
// +30% critical damage at 750 Min Physical Attack on Inebriate-enhanced
// skills (client talent row 320203, 2026-09-04), scaling linearly with Min
// Physical Attack below that.
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
