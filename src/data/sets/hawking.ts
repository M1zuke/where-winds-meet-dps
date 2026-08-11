import { defineSet } from "./define"
import { SET_ID } from "./ids"
import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { hawkwingMechanic } from "./hawkwingMechanic"

const DISPLAY_NAME = "Hawking"

export const hawking = defineSet({
  id: SET_ID.hawking,
  name: DISPLAY_NAME,
  siteKey: "hawkwing",
  // The 4-piece ramp itself is time-averaged, not this flat value — see
  // `hawkwingMechanic.ts`. This is the fallback `formula.ts` uses when that
  // scheduler didn't run.
  formulaBonus: { physBoost: 0.1 },
  panelBonus: { stat: "affinityRate", value: 0.045 },
  mechanics: [
    declareMechanic(hawkwingMechanic(SET_ID.hawking, DISPLAY_NAME), MECHANIC_ORDER.hawkwing),
  ],
})
