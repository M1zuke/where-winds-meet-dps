import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import {
  innerWayHasNode,
  requireInnerWayNodeTier,
} from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "./ids"
import { starReacher } from "./starReacher"

// Star Reacher's Lingering Bone Mark bonus.
//
//   Base: 5% Physical Attack bonus for 8s (10% if target is Airborne).
//   T3:   duration 8s → 12s.
//   T6:   magnitudes 5%/10% → 7.5%/15%.
//
// The buff module reads `ctx.build.paramTier(PARAM.starReacher)` to pick
// the magnitude and the gating node to pick the duration, mirroring the
// battleAnthemBuffs.ts pattern (`allDamageBoost +10%, +15% from tier 4`).
//
// T1 (HP-gated 3% damage / 10%-of-damage heal on airborne targets with
// your Lingering Bone) and T4 (+15% Phys on Exhausted, +25% on <30% Qi)
// are flagged on the def but cannot fire here — they need engine changes
// (HP not exposed at hit time, phase-gated physBoost not modeled in
// `applyBuffEffects`). The node ownership pins live in
// `tests/data/innerWays.test.ts`; this module only resolves the values
// the engine can already apply.
//
// Hoisted factory, not a `const`: the module cycle (this file imports
// `starReacher`, and `starReacher.ts` imports this file for its
// `buffDefs` entry) means whichever file loads second would otherwise
// see the other's binding in TDZ. The `wolfchasersArt` header warns about
// this — same shape applies here. Call `starReacherLingeringBoneBuff()`
// from inside `starReacher.ts`'s `defineInnerWay` callback so the buff is
// built lazily, after both modules have finished initializing.
export function starReacherLingeringBoneBuff() {
  return defineClassBuff({
    id: BUFF.lingeringBone,
    name: "Lingering Bone Mark (Star Reacher)",
    requires: {
      param: PARAM.starReacher,
      // Defer with a getter so `starReacher` is not read while the
      // back-import of this module is still in TDZ. The
      // `wolfchasersArtBuffs.ts` `soulShakenBuffDef` getter is the same
      // shape; only `innerWayHasNode` reads (in `duration`/`effects`)
      // happen at engine-run time, well after the module cycle has
      // resolved.
      get minTier(): number {
        return requireInnerWayNodeTier(
          starReacher,
          INNER_WAY_NODE.starReacherExtendedDuration,
        )
      },
    },
    duration: (ctx: { build: { paramTier: (id: string) => number } }): number =>
      innerWayHasNode(
        starReacher,
        ctx.build.paramTier(PARAM.starReacher),
        INNER_WAY_NODE.starReacherExtendedDuration,
      )
        ? 12
        : 8,
    rateLimit: { count: 1, window: 1 },
    affectsAll: true,
    summary: "physBoost +5% (+10% airborne), +2.5%/+5% from tier 6",
    effects: (ctx: {
      build: { paramTier: (id: string) => number }
      self: { reachesEvent: boolean }
    }) => {
      const tier = ctx.build.paramTier(PARAM.starReacher)
      const raised = innerWayHasNode(
        starReacher,
        tier,
        INNER_WAY_NODE.starReacherRaisedBaseBonuses,
      )
      // Until the buff engine threads a target-airborne status flag through
      // `EffectContext`, this module emits the LOWER of the two magnitudes
      // (Lingering-Bone-only, not the doubled Airborne variant). The raised
      // tier (T6) likewise only emits the raised Lingering-Bone amount.
      // The engine work for the airborne-gated doubling is bundled with the
      // T1 HP-gate work item flagged on the def.
      const baseAmount = raised ? 0.075 : 0.05
      return ctx.self.reachesEvent ? [stat("physBoost", baseAmount)] : []
    },
  })
}
