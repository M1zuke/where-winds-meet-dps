import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

const BONUS_PER_STACK = 0.04

// In-game values as of 2026-10-18.
export const purewrathScript = defineBuff({
  id: BUFF.purewrathScript,
  name: "Purewrath Script",
  requires: {
    param: PARAM.purewrathScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.purewrathScript,
  },
  affectsAll: true,
  vitalityPerStack: 120,
  duration: 120,
  maxStacks: 3,
  summary: "allMysticBoost +4%/stack, up to 3 stacks; one stack per 120 Vitality spent in combat",
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allMysticBoost", BONUS_PER_STACK * ctx.self.stacks)] : []),
})
