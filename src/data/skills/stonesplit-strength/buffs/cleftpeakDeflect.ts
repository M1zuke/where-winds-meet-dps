import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { cleftpeak } from "../../../sets/cleftpeak"
import { stat } from "../../../../engine/effects/effect"

const FULL_STACKS = 5

export const cleftpeakDeflect = defineClassBuff({
  id: BUFF.cleftpeakDeflect,
  name: "Cleftpeak (Max Stacks)",
  requires: { set: cleftpeak.siteKey },
  stackOnDamage: true,
  duration: 5,
  maxStacks: FULL_STACKS,
  summary: "allDamageBoost +8% at max stacks",
  effects: (ctx) =>
    ctx.event.kind === "damage" && ctx.self.stacks >= FULL_STACKS
      ? [stat("allDamageBoost", 0.08)]
      : [],
})
