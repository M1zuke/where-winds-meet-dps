import { defineSet } from "../../definitions/sets/setDef"
import { SET_ID } from "./ids"

// The real bonus is the deflect buff, gated on `siteKey` through
// `requiresSet`: `data/skills/buffs/shatteredRidgeDeflect.json`.
export const shatteredRidge = defineSet({
  id: SET_ID.shatteredRidge,
  name: "Shattered Ridge",
  siteKey: "shatteredridge",
  panelBonus: { stat: "minPhys", value: 78 },
})
