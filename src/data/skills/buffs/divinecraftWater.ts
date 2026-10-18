import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-10-18.
export const divinecraftWater = defineBuff({
  id: BUFF.divinecraftWater,
  name: "Divinecraft: Water",
  requires: { param: PARAM.divinecraftWater },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+1% HP damage",
  effects: [stat("allDamageBoost", 0.01)],
})
