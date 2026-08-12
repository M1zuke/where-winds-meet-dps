import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { PROP } from "../../ids"
import { SET_ID } from "../../../sets/ids"
import { stat } from "../../../../engine/effects/effect"

const FULL_STACKS = 5

export const shatteredRidgeDeflect = defineClassBuff({
  id: BUFF.shatteredRidgeDeflect,
  name: "Shattered Ridge (Max Stacks)",
  requires: { set: SET_ID.shatteredRidge },
  triggeredBy: [],
  stackOnDamage: true,
  affectsProperty: PROP.shatteredRidgeBoost,
  duration: 5,
  maxStacks: FULL_STACKS,
  summary: "allDamageBoost +8% at max stacks",
  effects: (ctx) =>
    ctx.event.kind === "damage" && ctx.self.stacks >= FULL_STACKS
      ? [stat("allDamageBoost", 0.08)]
      : [],
})
