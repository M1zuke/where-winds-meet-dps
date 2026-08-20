import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2 pieces: 8% precision (2026-08-17), in the same fraction-of-100 unit
// `hawking`'s 4.5% affinity carries as 0.045. The set tooltip reproduced in the
// community umbrella guide reads "+0.1%" instead — do not "correct" this value
// down to match it; that figure does not describe the set at gear level.
//
// The 4-piece is the three `mistwillow*` defs in `src/data/skills/buffs/`,
// granted by `buffEngine.ts`'s `processMistwillowBuffGrant`.
export const mistwillow = defineSet({
  id: SET_ID.mistwillow,
  name: "Mistwillow",
  siteKey: "mistwillow",
  panelBonus: { stat: "precisionRate", value: 0.08 },
})
