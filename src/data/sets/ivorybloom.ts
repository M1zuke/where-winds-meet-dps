import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The 4-piece's own crit rate/damage bonus lives in
// `data/skills/buffs/ivorybloomFullHpBonus.ts`: it only pays out at full HP,
// which only the buff engine can read.
export const ivorybloom = defineSet({
  id: SET_ID.ivorybloom,
  name: "Ivorybloom",
  siteKey: "ivorybloom",
  // In-game values as of 2026-09-24.
  panelBonus: {
    stat: "critRate",
    value: { 86: 0.063, 91: 0.074, 96: 0.09, 100: 0.104, 105: 0.121 },
  },
})
