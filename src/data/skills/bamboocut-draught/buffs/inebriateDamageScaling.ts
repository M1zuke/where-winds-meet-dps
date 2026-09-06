import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"

// Talent "Inebriate DMG Boost Enhancement": up to +9% Physical and Bamboocut
// damage at 750 Min Physical Attack while Inebriate, carried flat at the cap.
// "Damage dealt", not the class's own skills alone, hence affectsAll
// (in-game talent text, 2026-09-06).
export const inebriateDamageScaling = defineClassBuff({
  id: BUFF.inebriateDamageScaling,
  name: "Inebriate DMG Boost Enhancement",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "physBoost +9%, attributeDamageBoost +9% while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("physBoost", 0.09), stat("attributeDamageBoost", 0.09)]
      : [],
})
