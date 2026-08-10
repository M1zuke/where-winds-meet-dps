import { defineSet } from "./define"
import { SET_ID } from "./ids"

export const rainwhisper = defineSet({
  id: SET_ID.rainwhisper,
  name: "Rainwhisper",
  siteKey: "rainwhisper",
  formulaBonus: { critDamage: 0.25 },
  panelBonus: { stat: "precisionRate", value: 0.08 },
})
