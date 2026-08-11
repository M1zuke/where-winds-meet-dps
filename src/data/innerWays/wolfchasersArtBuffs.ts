import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { CAST } from "../skills/ids"
import { stat } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import type { BuffModule } from "../../engine/buffs/buffModule"
import { INNER_WAY_NODE } from "./ids"
import { wolfchasersArt } from "./wolfchasersArt"

// A hoisted function, not a module-level const: `wolfchasersArt.ts` calls
// `potentRiverFlowBuffDef()`/`wineGuBuffDef()` while still constructing its
// own `defineInnerWay` object, so if that call happened before THIS module's
// own top-level statements had run (the module that loads second in the
// cycle), a shared top-level const here would be just as uninitialized as a
// cross-module one — hence a function, read fresh on every call, instead.
function spearQTriggers(): string[] {
  return [CAST.spearQ, CAST.spearQ0HitCancel, CAST.spearQ5HitCancel, CAST.spearQPrepull]
}

// Hoisted functions, not `const`s: `wolfchasersArt.ts` imports this module
// for its `buffDefs` entry, and this module imports `wolfchasersArt` back for
// Soul Shaken's tier — a `const` here would leave `wolfchasersArt.ts` reading
// an uninitialized binding whichever side of the cycle loads first.
export function potentRiverFlowBuffDef() {
  return defineClassBuff({
    id: BUFF.potentRiverFlow,
    name: "Potent River Flow",
    requires: { param: PARAM.wolfchasersArt },
    triggeredBy: spearQTriggers(),
    duration: 15,
    buffAppliesOnCastEnd: true,
    effects: [stat("allDamageBoost", 0.25)],
  })
}

export function wineGuBuffDef() {
  return defineClassBuff({
    id: BUFF.wineGu,
    name: "Wine Gu",
    requires: { param: PARAM.wolfchasersArt, minTier: 6 },
    triggeredBy: spearQTriggers(),
    duration: 15,
    buffAppliesOnCastEnd: true,
    effects: [stat("allDamageBoost", 0.05)],
  })
}

// Hand-authored port of the reference site's "mechanic list" Soul Shaken def
// (`kb.soulShaken` in the deobfuscated bundle). Both Spear Q's and Spear
// Heavy's stacks are the same Wolfchaser's Art mechanic, gated the same way —
// one module, one trigger set.
export function soulShakenBuffDef(): BuffModule {
  return defineClassBuff({
    id: BUFF.soulShaken,
    name: "Soul Shaken",
    requires: {
      param: PARAM.wolfchasersArt,
      // A getter, not a plain field: `soulShakenBuffDef()` is called while
      // `wolfchasersArt.ts` is still constructing its own `defineInnerWay`
      // object, so `wolfchasersArt` (this module's own cyclic import) is not
      // yet assigned. Deferring the read until something actually asks for
      // `.minTier` — well after both modules have finished loading — avoids
      // that, while keeping the tier ladder's single source of truth.
      get minTier(): number {
        return requireInnerWayNodeTier(wolfchasersArt, INNER_WAY_NODE.soulShaken)
      },
    },
    triggeredBy: [
      ...spearQTriggers(),
      CAST.spearHeavy,
      CAST.spearHeavy1Hit,
      CAST.spearHeavy1HitPrepull,
    ],
    duration: 15,
    maxStacks: 5,
    stacksPerHit: true,
    affects: ["type:sustain"],
    summary: "+10.0% all/stack",
    // Omit the effect at 0 stacks rather than a no-op stat, matching the
    // pre-conversion display path's `if (value !== 0)` guard on a per-stack bonus.
    effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", 0.1 * ctx.self.stacks)] : []),
  })
}
