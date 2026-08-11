import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece bonus is stochastic (site computes it live from distance), so
// equipping the set enables the buff but contributes 0 here by design.
export const starsAlign = defineSet({
  id: SET_ID.starsAlign,
  name: "Stars Align",
  siteKey: "starsAlign",
})
