import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// `formula.ts`'s `attrBlock` reads `lowQiBambooDamage` twice — once generically
// (`setLowQiBonus`, applied to every attribute block) and once through a
// Swallowcall-specific `dmgBoost` addend. Both predate this module; preserved
// exactly rather than "deduplicated", since collapsing them would move the
// anchor DPS. Do not read this field from only one of the two sites.
export const swallowcall = defineSet({
  id: SET_ID.swallowcall,
  name: "Swallowcall",
  formulaBonus: { lowQiBambooDamage: 0.1 },
})
