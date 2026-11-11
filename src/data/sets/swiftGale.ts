import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own airborne-heavy-attack damage bonus lives in
// `data/skills/buffs/swiftGaleAirborneHeavyBoost.ts`.
export const swiftGale = defineSet({
  id: SET_ID.swiftGale,
  group: "gear",
  name: "Swift Gale",
  siteKey: "swiftGale",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "maxPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
