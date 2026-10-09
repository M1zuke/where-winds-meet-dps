import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"
import { steppedByMinPhysAttack } from "./minPhysScaling"

const MAX_DAMAGE_BOOST = 0.09
const DAMAGE_BOOST_STEPS = 9

export function inebriateDamageBoostAt(minPhysAttack: number): number {
  return steppedByMinPhysAttack(MAX_DAMAGE_BOOST, DAMAGE_BOOST_STEPS, minPhysAttack)
}

// Talent "Inebriate DMG Boost Enhancement": +1% Physical and Bamboocut damage
// per full 83.33 Min Physical Attack while Inebriate, up to +9% at 750
// (in-game values as of 2026-09-16). "Damage dealt", not the class's own
// skills alone, hence affectsAll.
export const inebriateDamageScaling = defineClassBuff({
  id: BUFF.inebriateDamageScaling,
  name: "Inebriate DMG Boost Enhancement",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "physBoost and attributeDamageBoost up to +9% while Inebriate, full at 750 Min Phys",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx)) return []
    const boost = inebriateDamageBoostAt(ctx.build.minPhysAttack)
    return [stat("physBoost", boost), stat("attributeDamageBoost", boost)]
  },
})
