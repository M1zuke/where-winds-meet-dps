import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-24: each strike adds a stack for 5 s, up to 4,
// and the final strike deals +20 % per stack.
export const poetFinalStrikeStack = defineBuff({
  id: BUFF.poetFinalStrikeStack,
  name: "Drunken Fist Breakthrough",
  duration: 5,
  maxStacks: 4,
  summary: "+20% final-strike damage per stack",
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", 0.2 * ctx.self.stacks)] : []),
})
