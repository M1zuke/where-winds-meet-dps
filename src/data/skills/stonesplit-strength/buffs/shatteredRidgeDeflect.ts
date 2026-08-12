import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { PROP } from "../../ids"
import { propKeyOf } from "../../../../engine/buffs/tags"
import { shatteredRidge } from "../../../sets/shatteredRidge"
import { stat } from "../../../../engine/effects/effect"

const FULL_STACKS = 5

export const shatteredRidgeDeflect = defineClassBuff({
  id: BUFF.shatteredRidgeDeflect,
  name: "Shattered Ridge (Max Stacks)",
  requires: { set: shatteredRidge.siteKey },
  triggeredBy: [],
  stackOnDamage: true,
  affectsProperty: propKeyOf(PROP.shatteredRidgeBoost),
  duration: 5,
  maxStacks: FULL_STACKS,
  summary: "allDamageBoost +8% at max stacks",
  effects: (ctx) =>
    ctx.event.kind === "damage" && ctx.self.stacks >= FULL_STACKS
      ? [stat("allDamageBoost", 0.08)]
      : [],
})
