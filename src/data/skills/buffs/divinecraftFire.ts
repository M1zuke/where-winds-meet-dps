import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { FIRE_ENCHANT_SEC } from "../../consumables/fireOilMechanic"

export const divinecraftFire = defineBuff({
  id: BUFF.divinecraftFire,
  name: "Divinecraft: Fire",
  requires: { param: PARAM.divinecraftFire },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+1.5% HP damage while the enchant lasts",
  effects: (ctx) => (ctx.timeSec < FIRE_ENCHANT_SEC ? [stat("allDamageBoost", 0.015)] : []),
})
