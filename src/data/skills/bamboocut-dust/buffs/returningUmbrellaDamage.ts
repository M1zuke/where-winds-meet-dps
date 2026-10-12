import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { stat } from "../../../../engine/effects/effect"
import { steppedByMinPhysAttack } from "../../bamboocut-draught/buffs/minPhysScaling"
import { BUFF } from "../../buffs/ids"

const MAX_DAMAGE_BOOST = 0.12
const DAMAGE_BOOST_STEPS = 12

export function returningUmbrellaBoostAt(minPhysAttack: number): number {
  return steppedByMinPhysAttack(MAX_DAMAGE_BOOST, DAMAGE_BOOST_STEPS, minPhysAttack)
}

// Talent "Returning Umbrella DMG Up", top rank: +1% Physical and Bamboocut
// damage per full 62.5 Min Physical Attack, up to +12% at 750 (in-game values
// as of 2026-10-12), on the Martial Art Skill hits of the umbrella.
export const returningUmbrellaDamage = defineClassBuff({
  id: BUFF.returningUmbrellaDamage,
  name: "Returning Umbrella DMG Up",
  alwaysActive: true,
  duration: 9999,
  summary:
    "physBoost and attributeDamageBoost up to +12% on the umbrella's Martial Art Skill, full at 750 Min Phys",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    const boost = returningUmbrellaBoostAt(ctx.build.minPhysAttack)
    return [stat("physBoost", boost), stat("attributeDamageBoost", boost)]
  },
})
