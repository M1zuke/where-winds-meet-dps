import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

export const cleftpeak = defineSet({
  id: SET_ID.cleftpeak,
  name: "Cleftpeak",
  siteKey: "cleftpeak",
  panelBonus: { stat: "minPhys", value: 78 },
  formulaBonus: { generalDamageBoost: 0.05 },
})
