import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"
import { declareMechanic } from "../../engine/mechanics"
import { hawkwingMechanic } from "./hawkwingMechanic"

const DISPLAY_NAME = "Hawkwing"

export const hawkwing = defineSet({
  id: SET_ID.hawkwing,
  name: DISPLAY_NAME,
  siteKey: "hawkwing",
  // The 4-piece ramp itself is time-averaged, not this flat value — see
  // `hawkwingMechanic.ts`. This is the fallback `formula.ts` uses when that
  // scheduler didn't run.
  formulaBonus: { physBoost: 0.1 },
  // 2-piece BASH_PROB, gear-level ladder (in-game, 2026-09-07).
  panelBonus: {
    stat: "affinityRate",
    value: { 86: 0.032, 91: 0.037, 96: 0.045, 100: 0.052, 105: 0.061 },
  },
  mechanics: [declareMechanic(hawkwingMechanic(SET_ID.hawkwing, DISPLAY_NAME))],
})
