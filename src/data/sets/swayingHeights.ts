import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own vs-high-HP damage bonus lives in
// `data/skills/buffs/swayingHeightsHighHpBonus.ts`: it reads the target's own
// remaining HP fraction, which only the buff engine can read.
export const swayingHeights = defineSet({
  id: SET_ID.swayingHeights,
  name: "Swaying Heights",
  siteKey: "swayingHeights",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "minPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
