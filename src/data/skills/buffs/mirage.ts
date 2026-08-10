import { defineBuff } from "./define"
import { BUFF } from "./ids"
import { CAST } from "../ids"

// A pure state marker: no stat effect of its own, `mirageBonus` reads its
// active window via `requiresBuffActive`.
export const mirage = defineBuff({
  id: BUFF.mirage,
  name: "Mirage",
  triggeredBy: [CAST.ghostlySteps],
  duration: 30,
  affects: [],
  effects: [],
})
