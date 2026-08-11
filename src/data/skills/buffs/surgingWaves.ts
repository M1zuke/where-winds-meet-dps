import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "./ids"
import { CAST, ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"

export const surgingWaves = defineBuff({
  id: BUFF.surgingWaves,
  name: "Surging Waves",
  triggeredBy: [CAST.dragonHeadPlus],
  duration: 6,
  maxStacks: 40,
  affects: [ROLE.dragonHead],
  stacks: (ctx) => (ctx.build.param(PARAM.allySurgingWaves) ? 40 : 8),
  summary: "+1.3% all/stack",
  // Omit the effect at 0 stacks rather than a no-op stat, matching the
  // pre-conversion display path's `if (value !== 0)` guard on a per-stack bonus.
  effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", 0.0125 * ctx.self.stacks)] : []),
})
