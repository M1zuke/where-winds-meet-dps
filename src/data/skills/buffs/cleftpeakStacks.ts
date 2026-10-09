import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { cleftpeak } from "../../sets/cleftpeak"
import { stat } from "../../../engine/effects/effect"

const BONUS_PER_STACK = 0.01
const MAX_STACKS = 5

export const cleftpeakStacks = defineBuff({
  id: BUFF.cleftpeakStacks,
  name: "Cleftpeak",
  requires: { set: cleftpeak.siteKey },
  affectsAll: true,
  stackOnDamage: true,
  duration: 5.1,
  maxStacks: MAX_STACKS,
  summary: "allDamageBoost +1%/stack, up to 5 stacks",
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", BONUS_PER_STACK * ctx.self.stacks)] : []),
})
