import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own Martial Art Skill (class-108) damage bonus lives in
// `data/skills/buffs/starweaveMartialBoost.ts`: it ramps on the hits landed
// this fight, which only the buff engine can read.
export const starweave = defineSet({
  id: SET_ID.starweave,
  name: "Starweave",
  siteKey: "starweave",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "minPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
