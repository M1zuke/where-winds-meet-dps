import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"

// In-game rule as of 2026-10-18: a training stake is never staggered or controlled.
export const chaosScript = defineBuff({
  id: BUFF.chaosScript,
  name: "Chaos Script",
  requires: {
    param: PARAM.chaosScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.chaosScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "damage +6% against a staggered and +10% against a controlled target; a training stake is neither",
  effects: () => [],
})
