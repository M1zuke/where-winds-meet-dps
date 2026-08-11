import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece bonus is stochastic (site computes it live from distance) —
// contributes 0 here by design; see docs/CALCULATION.md § "Mechanic coverage".
export const starsAlign = defineSet({
  id: SET_ID.starsAlign,
  name: "Stars Align",
  siteKey: "starsAlign",
})
