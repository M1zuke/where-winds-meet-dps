import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own Light Attack damage bonus lives in
// `data/skills/buffs/swallowcallLightAttackBoost.ts`: it is scoped to the
// skills that receive it, not a set-wide panel scalar.
export const swallowcall = defineSet({
  id: SET_ID.swallowcall,
  name: "Swallowcall",
  siteKey: "swallowcall",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "minPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
