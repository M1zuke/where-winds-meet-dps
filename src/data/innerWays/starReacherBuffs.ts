import { defineClassBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat, healFraction, type Effect } from "../../engine/effects/effect"
import type { EffectContext } from "../../engine/effects/context"
import {
  innerWayHasNode,
  requireInnerWayNodeTier,
} from "../../definitions/innerWays/innerWayDef"
import {
  STAR_REACHER_BELOW30_PHYS_BONUS_T4,
  STAR_REACHER_EXHAUSTED_PHYS_BONUS_T4,
  STAR_REACHER_HP_GATE_DAMAGE_BONUS_T1,
  STAR_REACHER_HP_GATE_HEAL_FRACTION_T1,
  STAR_REACHER_HP_GATE_THRESHOLD,
} from "./starReacher"
import { INNER_WAY_NODE } from "./ids"
import { starReacher } from "./starReacher"

// Star Reacher's Lingering Bone Mark bonus.
//
//   Base: 5% Physical Attack bonus for 8s (10% if target is Airborne).
//   T3:   duration 8s → 12s.
//   T4:   +15% phys on Exhausted, +25% on <30% Qi (independent of Lingering
//         Bone — applies for any Star Reacher hit on a phase-matching
//         target).
//   T6:   magnitudes 5%/10% → 7.5%/15%.
//
// The buff module reads `ctx.build.paramTier(PARAM.starReacher)` to pick
// the magnitude and the gating node to pick the duration, mirroring the
// battleAnthemBuffs.ts pattern (`allDamageBoost +10%, +15% from tier 4`).
//
// T1 (HP-gated 3% damage / 10%-of-damage heal on airborne targets with
// your Lingering Bone) is now wired: the HP-above-75% branch emits
// `physBoost +3%` additively on top of the airborne-doubled bonus, and
// the HP-below-or-equal-75% branch emits the FRACTION (0.1) via the
// `healFraction` Effect kind. The timeline hit loop resolves
// `healFraction` to a flat HP gain equal to `fraction * rolledDamage`,
// post-formula, and applies it to the simulation-local HP ledger
// (clamped to `[0, hpMax]`). Sinks that don't need the fraction
// (buff engine, art-sink, hit-sink pre-formula) no-op it; only the
// timeline's post-formula loop resolves it. See `timeline.ts`
// `processHealEmissions`.
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
    summary: "physBoost +5% (+10% airborne), +2.5%/+5% from tier 6; +15%/+25% on Exhausted/<30% Qi from tier 4",
    effects: (ctx: EffectContext) => {
      if (!ctx.self.reachesEvent) return []
      const tier = ctx.build.paramTier(PARAM.starReacher)
      const raised = innerWayHasNode(
        starReacher,
        tier,
        INNER_WAY_NODE.starReacherRaisedBaseBonuses,
      )
      // Lingering-Bone bonus: 5% (T6 → 7.5%) doubled to 10% (T6 → 15%) when
      // the target is Airborne — `EffectContext.target.airborne` was added
      // alongside this read so the doubled magnitude is now reachable.
      const airborneBase = raised ? 0.15 : 0.1
      const lingAmount = ctx.target.airborne
        ? airborneBase
        : raised
          ? 0.075
          : 0.05
      const out: Effect[] = [stat("physBoost", lingAmount)]
      // T4: unconditional phase-gated bonus on top of the Lingering-Bone
      // amount. Reads `ctx.target.phase` (added to `EffectContext` alongside
      // `target.airborne`) so the bonus is conditional on the target's
      // current Qi phase.
      const tier4Exhausted = innerWayHasNode(
        starReacher,
        tier,
        INNER_WAY_NODE.starReacherExhaustedBonus,
      )
      if (tier4Exhausted) {
        if (ctx.target.phase === "exhausted") {
          out.push(stat("physBoost", STAR_REACHER_EXHAUSTED_PHYS_BONUS_T4))
        } else if (ctx.target.phase === "below30") {
          out.push(stat("physBoost", STAR_REACHER_BELOW30_PHYS_BONUS_T4))
        }
      }
      // T1: airborne-only HP-conditional split. "+3% damage if HP > 75%;
      // restore HP = 10% of damage done otherwise." Both branches require
      // `target.airborne === true` per the in-game text. The damage branch
      // is a real `physBoost` additively stacked on the airborne-doubled
      // bonus above. The heal branch emits `healFraction(0.1)`, which the
      // timeline resolves post-formula against the rolled damage and
      // applies to its simulation-local HP ledger (clamped). Buff engine,
      // art-sink, and pre-formula hit-sink all no-op the kind — only the
      // timeline's `processHealEmissions` reads it.
      const tier1HpGated = innerWayHasNode(
        starReacher,
        tier,
        INNER_WAY_NODE.starReacherHpGatedLingeringBone,
      )
      if (tier1HpGated && ctx.target.airborne) {
        const hpFraction = ctx.self.hpMax > 0 ? ctx.self.hp / ctx.self.hpMax : 1
        if (hpFraction > STAR_REACHER_HP_GATE_THRESHOLD) {
          out.push(stat("physBoost", STAR_REACHER_HP_GATE_DAMAGE_BONUS_T1))
        } else {
          out.push(healFraction(STAR_REACHER_HP_GATE_HEAL_FRACTION_T1))
        }
      }
      return out
    },
  })
}
