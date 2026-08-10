import { defineSet } from "./define"
import { SET_ID } from "./ids"

// The real bonus is the deflect buff, gated on `siteKey` through
// `requiresSet`: `data/skills/buffs/shatteredRidgeDeflect.json`.
export const shatteredRidge = defineSet({
  id: SET_ID.shatteredRidge,
  name: "Shattered Ridge",
  siteKey: "shatteredridge",
})
