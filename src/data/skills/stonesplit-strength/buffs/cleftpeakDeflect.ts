import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { cleftpeak } from "../../../sets/cleftpeak"
import { damageMultiplier } from "../../../../engine/effects/effect"

const FULL_STACKS = 5

export const cleftpeakDeflect = defineClassBuff({
  id: BUFF.cleftpeakDeflect,
  name: "Cleftpeak (Max Stacks)",
  requires: { set: cleftpeak.siteKey },
  stackOnDamage: true,
  duration: 5.1,
  maxStacks: FULL_STACKS,
  summary: "damage ×1.08 at max stacks, multiplicative with the Cleftpeak ramp",
  effects: (ctx) =>
    ctx.event.kind === "damage" && ctx.self.stacks >= FULL_STACKS ? [damageMultiplier(1.08)] : [],
})
