import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import type { BuffModule } from "../../engine/buffs/buffModule"
import { INNER_WAY_NODE } from "./ids"
import { wolfchasersArt } from "./wolfchasersArt"

// This module and `wolfchasersArt.ts` import each other — it for these
// factories' `buffDefs` entry, this module for `soulShakenBuffDef`'s tier
// lookup — and `wolfchasersArt.ts` calls the factories while its own `const`
// is still in TDZ. So every export below is a hoisted function, never a
// `const`, and nothing at this module's top level may read `wolfchasersArt`
// (only a call made once loading has finished, e.g. inside a getter, may).
export function potentRiverFlowBuffDef() {
  return defineClassBuff({
    id: BUFF.potentRiverFlow,
    name: "Potent River Flow",
    requires: { param: PARAM.wolfchasersArt },
    affectsAll: true,
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
    affectsAll: true,
    duration: 15,
    buffAppliesOnCastEnd: true,
    effects: [stat("allDamageBoost", 0.05)],
  })
}

// Memoized rather than read fresh: `requires.minTier` is read per active
// module per damage event (`buffEngine.ts`, `catalog.ts`), inside the 60 fps
// timeline simulation `runEngine` runs repeatedly — the getter, not a plain
// field, only buys the deferral the file header explains; it shouldn't also
// re-run `requireInnerWayNodeTier`'s tier-table scan on every read.
let soulShakenMinTier: number | undefined

// Hand-authored port of the reference site's "mechanic list" Soul Shaken def
// (`kb.soulShaken` in the deobfuscated bundle). Both Spear Q's and Spear
// Heavy's stacks are the same Wolfchaser's Art mechanic, gated the same way.
export function soulShakenBuffDef(): BuffModule {
  return defineClassBuff({
    id: BUFF.soulShaken,
    name: "Soul Shaken",
    requires: {
      param: PARAM.wolfchasersArt,
      get minTier(): number {
        return (soulShakenMinTier ??= requireInnerWayNodeTier(
          wolfchasersArt,
          INNER_WAY_NODE.soulShaken,
        ))
      },
    },
    duration: 15,
    maxStacks: 5,
    stacksPerHit: true,
    summary: "+10.0% all/stack",
    // Omit the effect at 0 stacks rather than a no-op stat, matching the
    // pre-conversion display path's `if (value !== 0)` guard on a per-stack bonus.
    effects: (ctx) => (ctx.self.stacks > 0 ? [stat("allDamageBoost", 0.1 * ctx.self.stacks)] : []),
  })
}
