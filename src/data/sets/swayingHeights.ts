import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

export const swayingHeights = defineSet({
  id: SET_ID.swayingHeights,
  name: "Swaying Heights",
  formulaBonus: { generalDamageBoost: 0.0375 },
})
