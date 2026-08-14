import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

export const mirageBonus = defineBuff({
  id: BUFF.mirageBonus,
  name: "Mirage Bonus",
  affectsAll: true,
  duration: 8,
  requiresBuffActive: BUFF.mirage,
  effects: [stat("allDamageBoost", 0.15)],
})
