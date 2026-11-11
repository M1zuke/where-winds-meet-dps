import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// In-game values as of 2026-11-11: the 4-piece's attack-buff effects come only
// from skills no class here casts, so it carries no buff of its own.
export const cloudshear = defineSet({
  id: SET_ID.cloudshear,
  group: "gear",
  name: "Cloudshear",
  panelBonus: {
    stat: "minPhys",
    value: { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 },
  },
})
