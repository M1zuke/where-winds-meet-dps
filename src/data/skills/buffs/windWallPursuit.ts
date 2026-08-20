import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

export const windWallPursuit = defineBuff({
  id: BUFF.windWallPursuit,
  name: "Wind Wall (Pursuit)",
  duration: 15,
  effects: [stat("allDamageBoost", 0.1)],
})
