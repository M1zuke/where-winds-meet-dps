import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

export const windWall = defineBuff({
  id: BUFF.windWall,
  name: "Wind Wall",
  duration: 15,
  effects: [stat("allDamageBoost", 0.4)],
})
