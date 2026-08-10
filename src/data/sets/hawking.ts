import { defineSet } from "./define"
import { SET_ID } from "./ids"

export const hawking = defineSet({
  id: SET_ID.hawking,
  name: "Hawking",
  siteKey: "hawkwing",
  // The 4-piece ramp itself is time-averaged, not this flat value — see
  // `mechanics/hawkwing.ts` and `paramMap.ts`'s "Hawking 4-piece ramping" note.
  // This is the fallback `formula.ts` uses when that scheduler didn't run.
  formulaBonus: { physBoost: 0.1 },
  panelBonus: { stat: "affinityRate", value: 0.045 },
})
