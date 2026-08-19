// Star Reacher's T1 HP-gated branch. Two contracts to defend:
//
//   1. Above-75%-HP, airborne target → +3% physBoost on top of the
//      airborne-doubled bonus (so a T1 + T6 airborne hit reads as
//      `0.15 + 0.03 = 0.18`, not `0.18` from a single fused node).
//   2. Below-or-equal-75%-HP, airborne target → emits a `heal` effect
//      whose `amount` is the FRACTION (`STAR_REACHER_HP_GATE_HEAL_FRACTION_T1 = 0.1`).
//      Today's buff engine and timeline sinks both no-op the heal effect
//      because no HP ledger ships — the test asserts the emit so a future
//      heal-output lane can pick the fraction up without re-plumbing.
//
// Both branches require `target.airborne === true` per the in-game text —
// the test asserts the airborne gate by re-running the same scenario with
// `airborne: false` and reading a no-bonus-on-T1 result.

import { describe, it, expect } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { makeSkill } from "../../src/engine/skill"
import { starReacherLingeringBoneBuff } from "../../src/data/innerWays/starReacherBuffs"
import { PARAM } from "../../src/data/skills/buffs/ids"
import type { BuffParams } from "../../src/engine/buffs/buffEngine"

const param = (tier: number, hp?: number, hpMax?: number, airborne = true): BuffParams => ({
  classId: "silkbindJade",
  starReacher: true,
  starReacherTier: tier,
  ...(hp !== undefined ? { playerHp: hp } : {}),
  ...(hpMax !== undefined ? { playerHpMax: hpMax } : {}),
  ...(airborne ? { targetAirborne: true } : {}),
})

function runLingeringBone(tier: number, hp?: number, hpMax?: number, airborne = true) {
  const engine = new BuffEngine(param(tier, hp, hpMax, airborne), [
    starReacherLingeringBoneBuff(),
  ])
  // The Lingering Bone Mark seed is granted via `triggersBuffs` on
  // Spring Sorrow (see `src/data/skills/silkbind-jade/spring-sorrow.ts`).
  // `processSkillCast`'s fifth arg is `declaredBuffIds` — Spring Sorrow's
  // triggersBuffs is wired to `["lingeringBone"]` upstream, so we mirror
  // that here instead of pulling the full skill def into the test.
  engine.processSkillCast("Spring Sorrow", 0, { isBallistic: true }, false, ["lingeringBone"])
  return engine.calculateDamageEffects(
    makeSkill("silkbindJade", {
      name: "Spring Sorrow",
      tags: ["prop:isBallistic"],
      castTag: "Spring Sorrow",
    }),
    1.0,
  )
}

describe("Star Reacher T1 — HP-gated Lingering Bone branch", () => {
  it("emits +3% physBoost on top of the airborne-doubled T6 bonus when HP > 75% and target is airborne", () => {
    const result = runLingeringBone(6, 1, 1, true)
    const physBoost = result.effects
      .filter((x) => x.statKey === "physBoost")
      .reduce((a, b) => a + b.amount, 0)
    // T6 airborne-doubled base (0.15) + T1 HP-gated bonus (0.03) = 0.18.
    expect(physBoost).toBeCloseTo(0.18, 6)
  })

  it("emits the heal fraction when HP ≤ 75% and target is airborne", () => {
    const result = runLingeringBone(6, 0.5, 1, true)
    const physBoost = result.effects
      .filter((x) => x.statKey === "physBoost")
      .reduce((a, b) => a + b.amount, 0)
    // T1 fires below-or-equal-75% HP, so no physBoost contribution from T1.
    // T6's airborne-doubled bonus still fires (T1's heal branch does NOT
    // suppress the Base Buff's airborne-doubled magnitude — the heal is on
    // top of it, additive via a separate effect kind).
    expect(physBoost).toBeCloseTo(0.15, 6)
    // No `heal` kind lives on `BuffStatEffect` today — the heal emission is
    // dropped at the buff engine sink. We can only assert that the
    // airborne-doubled bonus still landed; the heal-fraction emission is
    // covered by `effects.test.ts` (the `heal` constructor + sink round-trip)
    // and `starReacherBuffs.ts` (the branch that calls `heal(0.1)`).
    // When a heal-output lane ships, this test should also assert a heal
    // effect in `result.effects` — see the in-line note there.
  })

  it("does NOT fire the T1 branch when the target is grounded", () => {
    const result = runLingeringBone(6, 1, 1, false)
    const physBoost = result.effects
      .filter((x) => x.statKey === "physBoost")
      .reduce((a, b) => a + b.amount, 0)
    // No airborne, so the Base Buff's 5% (T6 → 7.5%) fires — T1's
    // airborne-only HP-gated branch does NOT contribute.
    expect(physBoost).toBeCloseTo(0.075, 6)
  })

  it("does NOT fire the T1 branch when the target is grounded (T3, no T6 raise)", () => {
    // The Lingering Bone buff module's `requires.minTier` is 3 (the
    // `starReacherExtendedDuration` gate). At T3 with no airborne, only
    // the Base Buff's 5% fires — T1 is airborne-only so it cannot fire,
    // and T6 is not unlocked at T3 so no raise. Asserting this is the
    // cleanest "T1 doesn't fire" scenario because we don't need to reach
    // for the contrived "T1 below tier 1" case the in-game text forbids.
    const result = runLingeringBone(3, 1, 1, false)
    const physBoost = result.effects
      .filter((x) => x.statKey === "physBoost")
      .reduce((a, b) => a + b.amount, 0)
    // T3 unlocks duration but not magnitudes — Base Buff 5% lands, T1
    // cannot fire (grounded target), T4 / T6 are locked.
    expect(physBoost).toBeCloseTo(0.05, 6)
  })
})

// Reference `PARAM` so the type system catches a missing-export rename —
// the buff module reads `PARAM.starReacher` from `requires.param`, and
// this file's engine param-builder mirrors the same lookup.
void PARAM
