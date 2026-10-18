import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { HEART_POISON_QI_DAMAGE_BOOST } from "../../consumables/divinecraftRefinements"

export const divinecraftHeartPoison = defineBuff({
  id: BUFF.divinecraftHeartPoison,
  name: "Heart Poison",
  requires: { param: PARAM.divinecraftHeartPoison },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+4% Qi damage",
  effects: [stat("qiDamageBoost", HEART_POISON_QI_DAMAGE_BOOST)],
})
