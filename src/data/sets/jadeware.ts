import { defineSet } from "./define"
import { SET_ID } from "./ids"

export const jadeware = defineSet({
  id: SET_ID.jadeware,
  name: "Jadeware",
  siteKey: "jadeware",
  formulaBonus: { affinityDamage: 0, lowQiDirectAffinityRate: 0 },
  panelBonus: { stat: "maxPhys", value: 78 },
})
