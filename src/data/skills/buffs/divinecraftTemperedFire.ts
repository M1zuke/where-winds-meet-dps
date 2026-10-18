import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { TEMPERED_FIRE_ALL_DAMAGE_BOOST } from "../../consumables/divinecraftRefinements"

export const divinecraftTemperedFire = defineBuff({
  id: BUFF.divinecraftTemperedFire,
  name: "Tempered Fire",
  requires: { param: PARAM.divinecraftTemperedFire },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+0.4% HP damage",
  effects: [stat("allDamageBoost", TEMPERED_FIRE_ALL_DAMAGE_BOOST)],
})
