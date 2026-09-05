import { applyBuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../../engine/skill"
import { STATUS } from "../ids"

// Deepdaze is entered at 200 Binge Points only while it is not already
// running (in-game state text, 2026-09-05).
export const deepdazeEntryTriggers: HitTrigger[] = [
  applyBuff({
    target: STATUS.inebriateDeepdaze,
    stacks: 1,
    conditions: [
      { buffId: STATUS.bingePoints, op: "gte", stacks: 200 },
      { buffId: STATUS.inebriateDeepdaze, op: "eq", stacks: 0 },
    ],
  }),
]
