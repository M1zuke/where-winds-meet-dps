import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2-piece ACR_PROB, gear-level ladder (in-game, 2026-09-07), in the same
// fraction-of-100 unit `hawking`'s affinity carries.
//
// The 4-piece crit-damage bonus lives in
// `data/skills/buffs/rainwhisperCritDamage.ts`, not here: its magnitude follows
// the HP-shield window, which only the buff engine can read.
export const rainwhisper = defineSet({
  id: SET_ID.rainwhisper,
  name: "Rainwhisper",
  siteKey: "rainwhisper",
  panelBonus: {
    stat: "precisionRate",
    value: { 86: 0.056, 91: 0.066, 96: 0.08, 100: 0.093, 105: 0.108 },
  },
})
