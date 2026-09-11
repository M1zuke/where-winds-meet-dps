import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { artBonus } from "../../../engine/effects/effect"
import { tiltrim } from "../../sets/tiltrim"
import { isInebriate } from "../bamboocut-draught/buffs/inebriate"

const PER_STACK = 0.01

// 4 pieces: damage dealt while Inebriate grants a stack, and each stack raises
// Physical and every Attribute Attack by 1%. It scales the attack values
// themselves, so it multiplies the attack term rather than joining the boost
// sum.
export const tiltrimStack = defineBuff({
  id: BUFF.tiltrimStack,
  name: "Tiltrim",
  requires: { set: tiltrim.siteKey },
  affectsAll: true,
  duration: 5.1,
  maxStacks: 5,
  stackOnDamage: true,
  summary: "Physical and Attribute Attack +1%/stack while Inebriate (max 5 stacks)",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx)) return []
    const scale = ctx.self.stacks * PER_STACK
    return [
      artBonus("minPhysPctBonus", scale),
      artBonus("maxPhysPctBonus", scale),
      artBonus("attributeAttackPctBonus", scale),
    ]
  },
})
