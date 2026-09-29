import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own airborne-heavy-attack damage bonus lives in
// `data/skills/buffs/swiftGaleAirborneHeavyBoost.ts`. No built-in rotation
// carries an airborne heavy attack, so it never reaches a skill on a dummy —
// authored for the build it belongs to, not active there.
export const swiftGale = defineSet({
  id: SET_ID.swiftGale,
  name: "Swift Gale",
  siteKey: "swiftGale",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "maxPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
