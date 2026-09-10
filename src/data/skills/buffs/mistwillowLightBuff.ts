import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { mistwillow } from "../../sets/mistwillow"
import { MISTWILLOW_BONUS } from "./mistwillowBuff"

export const mistwillowLightBuff = defineBuff({
  id: BUFF.mistwillowLightBuff,
  name: "Mistwillow (Light)",
  requires: { set: mistwillow.siteKey },
  duration: 15,
  cooldown: 2,
  summary: "phys +10%, attribute damage +10%",
  effects: [stat("physBoost", MISTWILLOW_BONUS), stat("attributeDamageBoost", MISTWILLOW_BONUS)],
})
