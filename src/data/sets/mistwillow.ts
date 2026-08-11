import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The cross-stance mechanic lives in `buffEngine.ts` (`params.armorSet ===
// "mistwillow"`), not here.
export const mistwillow = defineSet({
  id: SET_ID.mistwillow,
  name: "Mistwillow",
  siteKey: "mistwillow",
})
