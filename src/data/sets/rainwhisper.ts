import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// 2 pieces: 8% precision (in-game set tooltip, 18 Aug 2026), in the same
// fraction-of-100 unit `hawking`'s 4.5% affinity carries as 0.045.
//
// The 4-piece crit-damage bonus lives in
// `data/skills/buffs/rainwhisperCritDamage.ts`, not here: its magnitude follows
// the HP-shield window, which only the buff engine can read.
export const rainwhisper = defineSet({
  id: SET_ID.rainwhisper,
  name: "Rainwhisper",
  siteKey: "rainwhisper",
  panelBonus: { stat: "precisionRate", value: 0.08 },
})
