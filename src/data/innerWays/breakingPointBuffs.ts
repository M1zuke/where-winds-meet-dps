import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import type { BuffModule } from "../../engine/buffs/buffModule"
import { INNER_WAY_NODE } from "./ids"
import { breakingPoint } from "./breakingPoint"

// This module and `breakingPoint.ts` import each other — it for
// `disintegrationBuffDef`'s entry in `breakingPoint.ts`'s `buffDefs`, this
// module for the tier lookup below — and `breakingPoint.ts` calls this
// factory while its own top-level bindings are still in TDZ. So this export
// is a hoisted function, never a `const`, and no field read eagerly by the
// call below (as opposed to inside the deferred `stacks` closure) may depend
// on a module-level `const` — same reason the magnitudes here are inlined
// rather than named.
let perfectDodgeTier: number | undefined

export function disintegrationBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.disintegration,
    name: "Disintegration",
    requires: { param: PARAM.breakingPoint },
    affectsAll: true,
    duration: 5,
    maxStacks: 5,
    stackOnDamage: true,
    stackOnDamagePhase: "exhausted",
    rateLimit: { count: 1, window: 15 },
    summary:
      "phys.penetration +5/stack, critDamageBoost +5%/stack, up to 5 stacks; a Perfect Dodge grants 5 stacks once per 15s at the Perfect Dodge tier",
    stacks: (ctx) =>
      ctx.build.paramTier(PARAM.breakingPoint) >=
      (perfectDodgeTier ??= requireInnerWayNodeTier(
        breakingPoint,
        INNER_WAY_NODE.breakingPointPerfectDodgeStacks,
      ))
        ? 5
        : 0,
    effects: (ctx) =>
      ctx.self.stacks > 0
        ? [
            stat("phys.penetration", 0.05 * ctx.self.stacks),
            stat("critDamageBoost", 0.05 * ctx.self.stacks),
          ]
        : [],
  })
}
