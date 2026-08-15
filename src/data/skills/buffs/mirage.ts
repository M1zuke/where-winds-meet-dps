import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"

// A pure state marker: no stat effect of its own, `mirageBonus` reads its
// active window via `requiresBuffActive`.
export const mirage = defineBuff({
  id: BUFF.mirage,
  name: "Mirage",
  duration: 30,
  effects: [],
})
