import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2-piece MAX_W_ATK, gear-level ladder (in-game, 2026-09-07).
export const jadeware = defineSet({
  id: SET_ID.jadeware,
  name: "Jadeware",
  siteKey: "jadeware",
  panelBonus: { stat: "maxPhys", value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 } },
})
