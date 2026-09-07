import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2-piece ACR_PROB, gear-level ladder (in-game, 2026-09-07), in the same
// fraction-of-100 unit `hawking`'s affinity carries. The set tooltip reproduced
// in the community umbrella guide reads "+0.1%" instead — do not "correct" this
// value down to match it; that figure does not describe the set at gear level.
//
// The 4-piece is the three `mistwillow*` defs in `src/data/skills/buffs/`,
// granted by `buffEngine.ts`'s `processMistwillowBuffGrant`.
export const mistwillow = defineSet({
  id: SET_ID.mistwillow,
  name: "Mistwillow",
  siteKey: "mistwillow",
  panelBonus: {
    stat: "precisionRate",
    value: { 86: 0.056, 91: 0.066, 96: 0.08, 100: 0.093, 105: 0.108 },
  },
})
