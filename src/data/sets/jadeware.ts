import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

export const jadeware = defineSet({
  id: SET_ID.jadeware,
  name: "Jadeware",
  siteKey: "jadeware",
  panelBonus: { stat: "maxPhys", value: 78 },
})
