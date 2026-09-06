import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { tiltrim } from "../../sets/tiltrim"
import { isInebriate } from "../bamboocut-draught/buffs/inebriate"

// 4 pieces: damage under a Martial Art Special Enhancement grants a stack,
// 5 s, max 5, +1% to all attacks including Physical and every Attribute
// Attack while Inebriate (in-game set text, 2026-09-06). The per-stack part
// is carried as a damage boost, the engine having no attack-value percentage.
export const tiltrimStack = defineBuff({
  id: BUFF.tiltrimStack,
  name: "Tiltrim",
  requires: { set: tiltrim.siteKey },
  affectsAll: true,
  duration: 5,
  maxStacks: 5,
  stackOnDamage: true,
  summary: "physBoost +1%/stack, attributeDamageBoost +1%/stack while Inebriate (max 5 stacks)",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [
          stat("physBoost", ctx.self.stacks * 0.01),
          stat("attributeDamageBoost", ctx.self.stacks * 0.01),
        ]
      : [],
})
