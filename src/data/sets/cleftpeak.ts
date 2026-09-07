import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2-piece MIN_W_ATK, gear-level ladder (in-game, 2026-09-07).
export const cleftpeak = defineSet({
  id: SET_ID.cleftpeak,
  name: "Cleftpeak",
  siteKey: "cleftpeak",
  panelBonus: { stat: "minPhys", value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 } },
  formulaBonus: { generalDamageBoost: 0.05 },
})
