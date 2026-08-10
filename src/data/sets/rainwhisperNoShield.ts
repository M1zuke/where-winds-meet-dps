import { defineSet } from "./define"
import { SET_ID } from "./ids"

// The same `requiresSet` identity as full Rainwhisper (`data/sets/rainwhisper.ts`)
// — the reference site has one set with two states, not two sets — but its
// own, smaller 4-piece crit-damage value and no 2-piece bonus.
export const rainwhisperNoShield = defineSet({
  id: SET_ID.rainwhisperNoShield,
  name: "Rainwhisper (no shield)",
  siteKey: "rainwhisper",
  formulaBonus: { critDamage: 0.1 },
})
