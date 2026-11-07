import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { SCRIPT_MIN_BREAKTHROUGH } from "./scriptOptions"
import { stat } from "../../../engine/effects/effect"

const BONUS_PER_STACK = 0.035

// In-game values as of 2026-10-18.
export const voidskyScript = defineBuff({
  id: BUFF.voidskyScript,
  name: "Voidsky Script",
  requires: {
    param: PARAM.voidskyScript,
    minBreakthrough: SCRIPT_MIN_BREAKTHROUGH.voidskyScript,
  },
  affectsAll: true,
  stackOnDamage: true,
  damageGrantTiming: "preScore",
  damageGrantListensTo: "anyDamage",
  stackOnDamageRateLimit: { count: 1, window: 60 },
  duration: 120,
  maxStacks: 3,
  summary: "critDmg +3.5%/stack, up to 3 stacks; one stack per 60 s of damage",
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("critDamageBoost", BONUS_PER_STACK * ctx.self.stacks)] : []),
})
