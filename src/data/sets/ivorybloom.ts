import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

export const ivorybloom = defineSet({
  id: SET_ID.ivorybloom,
  name: "Ivorybloom",
  siteKey: "ivorybloom",
  formulaBonus: { critDamage: 0.15, directCrit: 0.05 },
  panelBonus: { stat: "critRate", value: 0.09 },
})
