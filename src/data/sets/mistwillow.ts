import { defineSet } from "./define"
import { SET_ID } from "./ids"

// The cross-stance mechanic lives in `buffEngine.ts` (`params.armorSet ===
// "mistwillow"`), not here — see docs/BUFFS.md on why set logic stays out of
// the set module.
export const mistwillow = defineSet({
  id: SET_ID.mistwillow,
  name: "Mistwillow",
  siteKey: "mistwillow",
})
