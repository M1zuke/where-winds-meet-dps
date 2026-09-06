import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2 pieces: Min Physical Attack +78 (in-game set tooltip, 2026-09-03).
export const tiltrim = defineSet({
  id: SET_ID.tiltrim,
  name: "Tiltrim",
  siteKey: "tiltrim",
  panelBonus: { stat: "minPhys", value: 78 },
})
