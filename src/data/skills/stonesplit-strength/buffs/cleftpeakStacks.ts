import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { cleftpeak } from "../../../sets/cleftpeak"
import { damageMultiplier } from "../../../../engine/effects/effect"

const BONUS_PER_STACK = 0.01
const MAX_STACKS = 5

export const cleftpeakStacks = defineClassBuff({
  id: BUFF.cleftpeakStacks,
  name: "Cleftpeak",
  requires: { set: cleftpeak.siteKey },
  affectsAll: true,
  stackOnDamage: true,
  duration: 5.1,
  maxStacks: MAX_STACKS,
  summary: "damage ×(1 + 1%/stack), up to 5 stacks, multiplicative with the max-stack bonus",
  effects: (ctx) =>
    ctx.self.stacks > 0 ? [damageMultiplier(1 + BONUS_PER_STACK * ctx.self.stacks)] : [],
})
