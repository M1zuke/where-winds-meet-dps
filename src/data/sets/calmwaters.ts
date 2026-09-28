import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// The 4-piece's own 1/3/5%-by-HP-band heal is not modelled: the app carries no
// player HP resource a heal could apply to. Its Endurance gain
// (`src/data/skills/universal/buffs/calmwatersPerfectDodgeGain.ts`) reads this
// set being equipped through its own `buffParam`.
export const calmwaters = defineSet({
  id: SET_ID.calmwaters,
  name: "Calmwaters",
  siteKey: "calmwaters",
  buffParam: PARAM.calmwatersSet,
  // In-game values as of 2026-09-28.
  panelBonus: {
    stat: "physDef",
    value: { 86: 27.4, 91: 32, 96: 39, 100: 45.4, 105: 52.8 },
  },
})
