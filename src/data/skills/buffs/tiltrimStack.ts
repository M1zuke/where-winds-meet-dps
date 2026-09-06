import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { tiltrim } from "../../sets/tiltrim"
import { isInebriate } from "../bamboocut-draught/buffs/inebriate"

// 4 pieces: damage dealt while Inebriate grants a stack, and each stack raises
// Physical and every Attribute Attack by 1%. The per-stack part is carried as
// a damage boost, the engine having no attack-value percentage.
export const tiltrimStack = defineBuff({
  id: BUFF.tiltrimStack,
  name: "Tiltrim",
  requires: { set: tiltrim.siteKey },
  affectsAll: true,
  duration: 5.1,
  maxStacks: 5,
  stackOnDamage: true,
  summary: "physBoost +1%/stack, attributeDamageBoost +1%/stack while Inebriate (max 5 stacks)",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("physBoost", ctx.self.stacks * 0.01), stat("attributeDamageBoost", ctx.self.stacks * 0.01)]
      : [],
})
