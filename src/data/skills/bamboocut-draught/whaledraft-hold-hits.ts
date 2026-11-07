import { hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import type { SkillHit } from "../../../engine/skill"
import { STATUS } from "./ids"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

// In-game values as of 2026-09-29: the hold restores 8 Binge Points per
// second, 16 in Carouse — modelled as one discrete grant per full second
// held, the closest faithful reading of a continuous per-second resume rate
// the ledger's discrete Binge status can carry.
export function whaledraftHoldGainHits(seconds: number): SkillHit[] {
  return Array.from({ length: seconds }, (_, index) =>
    hit(index, {
      frame: (index + 1) * 60,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: STATUS.bingePoints, stacks: 8 }),
        applyBuff({
          target: STATUS.bingePoints,
          stacks: 8,
          condition: { buffId: STATUS.carouse, op: "gte", stacks: 1 },
        }),
        ...deepdazeEntryTriggers(),
      ],
    }),
  )
}
