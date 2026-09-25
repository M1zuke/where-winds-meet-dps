import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"

// In-game values as of 2026-09-24: the shield lasts 10 s, opening 0.5 s after
// the granting cast starts.
export const rainwhisperShield = defineBuff({
  id: BUFF.rainwhisperShield,
  name: "HP Shield",
  duration: 10,
  buffAppliesAfterSec: 0.5,
  effects: [],
})
