import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { CAST } from "../../ids"
import { stat } from "../../../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "../../../innerWays/ids"
import { wolfchasersArt } from "../../../innerWays/wolfchasersArt"

// Hand-authored port of the reference site's "mechanic list" Soul Shaken def
// (`kb.soulShaken` in the deobfuscated bundle). Both Spear Q's and Spear
// Heavy's stacks are the same Wolfchaser's Art mechanic, gated the same way —
// one module, one trigger set.
export const soulShaken = defineClassBuff({
  id: BUFF.soulShaken,
  name: "Soul Shaken",
  requires: {
    param: PARAM.wolfchasersArt,
    minTier: requireInnerWayNodeTier(wolfchasersArt, INNER_WAY_NODE.soulShaken),
  },
  triggeredBy: [
    CAST.spearQ,
    CAST.spearQ0HitCancel,
    CAST.spearQ5HitCancel,
    CAST.spearQPrepull,
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
