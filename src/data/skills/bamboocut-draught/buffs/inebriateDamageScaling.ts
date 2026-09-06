import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"
import { scaledByMinPhysAttack } from "./minPhysScaling"

const MAX_DAMAGE_BOOST = 0.09

export function inebriateDamageBoostAt(minPhysAttack: number): number {
  return scaledByMinPhysAttack(MAX_DAMAGE_BOOST, minPhysAttack)
}

// Talent "Inebriate DMG Boost Enhancement": up to +9% Physical and Bamboocut
// damage at 750 Min Physical Attack while Inebriate, scaling linearly with Min
// Physical Attack below that. "Damage dealt", not the class's own skills
// alone, hence affectsAll (in-game talent text, 2026-09-06).
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
