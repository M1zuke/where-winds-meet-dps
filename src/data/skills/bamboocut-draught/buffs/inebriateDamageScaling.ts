import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { isInebriate } from "./inebriate"

// Talent "Inebriate DMG Boost Enhancement", rank 3 at art level 100: up to
// +9% Physical and Bamboocut damage at 750 Min Physical Attack while
// Inebriate (client talent row 321203, 2026-09-04), carried flat at the cap.
export const inebriateDamageScaling = defineClassBuff({
  id: BUFF.inebriateDamageScaling,
  name: "Inebriate DMG Boost Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "physBoost +9%, attributeDamageBoost +9% while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("physBoost", 0.09), stat("attributeDamageBoost", 0.09)]
      : [],
})
