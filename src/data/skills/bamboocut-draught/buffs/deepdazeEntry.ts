import { applyBuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger, TriggerCondition } from "../../../../engine/skill"
import type { QiPhase } from "../../../../engine/effects/context"
import { BUFF } from "../../buffs/ids"
import { STATUS } from "../ids"
import {
  INEBRIATE_DEEPDAZE_DURATION_FRAMES,
  SKYSPEAK_DEEPDAZE_EXTENSION_FRAMES,
} from "../../../classes/bamboocut-draught/gates"

interface DeepdazeEntrySpec {
  conditions?: TriggerCondition[]
  phase?: QiPhase
  forceRestart?: boolean
}

// Deepdaze lasts 5 s, 10 s with Skyspeak tier 3 (in-game state text,
// 2026-09-06).
export function deepdazeEntryTriggers(spec: DeepdazeEntrySpec = {}): HitTrigger[] {
  const { conditions = [], phase, forceRestart = false } = spec
  const threshold: TriggerCondition[] = [
    ...conditions,
    { buffId: STATUS.bingePoints, op: "gte", stacks: 200 },
    ...(forceRestart ? [] : [{ buffId: STATUS.inebriateDeepdaze, op: "eq" as const, stacks: 0 }]),
  ]
  return [
    // Ordered first: triggers apply in sequence within a hit, and the
    // Deepdaze-open triggers below would otherwise flip `inebriateDeepdaze`
    // before this one re-checks the same "not already running" threshold.
    // Granted by the same class controller that opens Deepdaze at full Binge
    // Points (in-game values as of 2026-09-16).
    applyBuff({ target: STATUS.enhanceSpecialSkill, stacks: 1, conditions: threshold, phase }),
    applyBuff({
      target: STATUS.inebriateDeepdaze,
      stacks: 1,
      conditions: [...threshold, { buffId: BUFF.skyspeakDeepdazeDuration, op: "eq", stacks: 0 }],
      phase,
    }),
    applyBuff({
      target: STATUS.inebriateDeepdaze,
      stacks: 1,
      durationFrames: INEBRIATE_DEEPDAZE_DURATION_FRAMES + SKYSPEAK_DEEPDAZE_EXTENSION_FRAMES,
      conditions: [...threshold, { buffId: BUFF.skyspeakDeepdazeDuration, op: "gte", stacks: 1 }],
      phase,
    }),
  ]
}
