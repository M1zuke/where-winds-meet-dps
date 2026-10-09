import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own stacking attack bonus lives in
// `data/skills/buffs/etherwrathAttackBoost.ts`: it ramps on the hits landed
// this fight, which only the buff engine can read.
export const etherwrath = defineSet({
  id: SET_ID.etherwrath,
  name: "Etherwrath",
  siteKey: "etherwrath",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "minPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
