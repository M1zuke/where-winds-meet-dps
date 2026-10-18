import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"

// In-game rule as of 2026-10-18: a training stake is never staggered.
export const karmaScript = defineBuff({
  id: BUFF.karmaScript,
  name: "Karma Script",
  requires: {
    param: PARAM.karmaScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.karmaScript,
  },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "damage +8% against a staggered target; a training stake is never staggered",
  effects: () => [],
})
