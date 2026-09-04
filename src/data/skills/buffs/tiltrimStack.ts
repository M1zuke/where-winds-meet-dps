import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { tiltrim } from "../../sets/tiltrim"

// 4 pieces: damage under a Martial Art Special Enhancement grants a stack,
// 5 s, max 5, +1% to all attack values each (in-game set tooltip,
// 2026-09-03) — carried as a damage boost, the engine having no attack-value
// percentage. The 5-stack max-HP bonus has no target-HP state and is absent.
export const tiltrimStack = defineBuff({
  id: BUFF.tiltrimStack,
  name: "Tiltrim",
  requires: { set: tiltrim.siteKey },
  duration: 5,
  maxStacks: 5,
  stackOnDamage: true,
  stackOnDamageScoped: true,
  summary: "physBoost +1%/stack, attributeDamageBoost +1%/stack (max 5 stacks)",
  effects: (ctx) => [stat("physBoost", ctx.self.stacks * 0.01), stat("attributeDamageBoost", ctx.self.stacks * 0.01)],
})
