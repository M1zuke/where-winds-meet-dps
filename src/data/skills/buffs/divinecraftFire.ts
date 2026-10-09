import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

export const divinecraftFire = defineBuff({
  id: BUFF.divinecraftFire,
  name: "Divinecraft: Fire",
  requires: { param: PARAM.divinecraftFire },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+1.5% HP damage",
  effects: [stat("allDamageBoost", 0.015)],
})
