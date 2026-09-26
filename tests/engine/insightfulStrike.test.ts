// Concentration's own effects are modeled on the timeline path
// (`concentration.test.ts` / `engine/buffs/concentration.ts`) with a
// game-accurate activation counter, so the panel must NOT bake a flat,
// always-on directAffinityRate for this inner way — that would count the same
// effect through two channels.
import { describe, expect, it } from "vitest"
import { getMindMethodContributions } from "../../src/definitions/baseStats"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { makeSkill } from "../../src/engine/skill"
import type { MechanicSetup } from "../../src/engine/mechanics/types"
import type { Inputs } from "../../src/engine/types"
import { insightfulStrike } from "../../src/data/innerWays/insightfulStrike"
import { insightfulStrikeMechanic } from "../../src/data/innerWays/insightfulStrikeMechanic"
import { PROP, ROLE } from "../../src/data/skills/ids"

const NS_TIER_6 = { name: "Insightful Strike", stacks: "tier 6" } as const
const NS_TIER_5 = { name: "Insightful Strike", stacks: "tier 5" } as const
const FPS = 60
const CLASS_ID = "bellstrikeUmbra"

const mingInputs = (mm: Inputs["mindMethods"]): Inputs => ({
  ...defaultInputs,
  classId: CLASS_ID,
  breakthrough: 17,
  mindMethods: mm,
})

function weaponHitTrain(durationSec: number, intervalSec = 0.3): number[] {
  const hits: number[] = []
  for (let t = 0; t < durationSec; t += intervalSec) hits.push(t)
  return hits
}

function setupFor(mindMethods: Inputs["mindMethods"]): MechanicSetup {
  return {
    inputs: mingInputs(mindMethods),
    classId: CLASS_ID,
    fps: FPS,
    rotationDurationSec: 60,
    // Focus is built from every damaging hit, weapon or not — `weaponHitTimesSec`
    // stays empty so the mechanic would starve if it read the wrong array.
    hitTimesSec: weaponHitTrain(60),
    weaponHitTimesSec: [],
    dotTickTimesSec: [],
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: true,
    effectiveRates: { precision: 1, critRate: 0.5, affinityRate: 0.42 },
  }
}

const FRAME_NEAR_SATURATION = 30 * FPS
const FRAME_PARTIAL_RAMP = 3 * FPS

describe("Insightful Strike — panel stat rework", () => {
  it("adds phys min/max/pen, NOT bellstrike attack or direct affinity (that now comes from Concentration alone)", () => {
    const withNS = getMindMethodContributions(
      mingInputs([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod]),
    )
    const without = getMindMethodContributions(
      mingInputs([emptyMindMethod, emptyMindMethod, emptyMindMethod, emptyMindMethod]),
    )
    const d = (p: string) => (withNS[p] ?? 0) - (without[p] ?? 0)
    expect(d("phys.min")).toBeCloseTo(23.3, 6)
    expect(d("phys.max")).toBeCloseTo(46.7, 6)
    expect(d("phys.penetration")).toBeCloseTo(0.051, 6)
    expect(d("directAffinityRate")).toBeCloseTo(0, 6)
    expect(d("bellstrike.min")).toBeCloseTo(0, 6)
    expect(d("bellstrike.max")).toBeCloseTo(0, 6)
    expect(d("bellstrike.penetration")).toBeCloseTo(0, 6)
  })
})

describe("Insightful Strike — Concentration's all-damage bonus is counted once", () => {
  it("declares no scalars of its own, so the mechanic's Concentration-gated effect is the only source", () => {
    expect("scalars" in insightfulStrike).toBe(false)
  })

  it("contributes no allDamageBoost effect before Concentration has had any chance to proc", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)
    expect(state).not.toBeNull()
    const contribution = mechanic.contributeAt?.(state!, 0, makeSkill(CLASS_ID), setup)
    expect(contribution).toBeNull()
  })

  it("scales the allDamageBoost effect by Concentration's active probability, never flat and never twice", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const contribution = mechanic.contributeAt?.(
      state,
      FRAME_PARTIAL_RAMP,
      makeSkill(CLASS_ID),
      setup,
    )
    const allDamageEffects = contribution?.effects?.filter((e) => e.statKey === "allDamageBoost")
    expect(allDamageEffects).toHaveLength(1)
    expect(allDamageEffects![0].amount).toBeGreaterThan(0)
    expect(allDamageEffects![0].amount).toBeLessThan(0.015)
  })
})

describe("Insightful Strike — attack-only effects do not reach damage-over-time ticks", () => {
  it("gives a damage-over-time tick only the affinity-damage effect, below tier 6", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_5, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const dotTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, dotTick, setup)
    const statKeys = contribution?.effects?.map((effect) => effect.statKey)
    expect(statKeys).toEqual(["affinityDamageBoost"])
  })

  it("still gives an ordinary hit all three effects", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const hit = makeSkill(CLASS_ID)
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, hit, setup)
    const statKeys = contribution?.effects?.map((effect) => effect.statKey)
    expect(statKeys).toEqual(
      expect.arrayContaining(["affinityDamageBoost", "directAffinityRate", "allDamageBoost"]),
    )
    expect(statKeys).toHaveLength(3)
  })
})

// The tier-6 DoT bonus is always the last `allDamageBoost` effect the
// mechanic pushes, on top of any attack-only `allDamageBoost` a regular hit
// already carries.
function lastAllDamageBoost(effects: { statKey: string; amount: number }[] | undefined) {
  return effects?.filter((effect) => effect.statKey === "allDamageBoost").at(-1)?.amount
}

describe("Insightful Strike — the tier-6 DoT bonus joins the additive pool, reaching every damage-over-time row and every declared empowered effect, and none below tier 6", () => {
  it("adds an allDamageBoost bonus to a damage-over-time row at tier 6 while Concentration is active", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const dotTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, dotTick, setup)
    expect(lastAllDamageBoost(contribution?.effects)).toBeGreaterThan(0)
  })

  it("reaches a damage-over-time row regardless of which role tags it carries", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const untaggedTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [] })
    const taggedTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [ROLE.dragonHead] })
    const untagged = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, untaggedTick, setup)
    const tagged = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, taggedTick, setup)
    expect(lastAllDamageBoost(untagged?.effects)).toBeCloseTo(
      lastAllDamageBoost(tagged?.effects) ?? 0,
      9,
    )
  })

  it("does not add the DoT bonus to a regular hit, even one carrying a damage-over-time role's own tag", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const bloodBurst = makeSkill(CLASS_ID, { tags: [ROLE.bleedDetonation] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, bloodBurst, setup)
    const allDamageEffects = contribution?.effects?.filter((e) => e.statKey === "allDamageBoost")
    expect(allDamageEffects).toHaveLength(1)
  })

  it("adds the same DoT bonus to a regular hit that declares itself an empowered damage-over-time effect", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_6, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const empowered = makeSkill(CLASS_ID, { tags: [PROP.empoweredDotEffect] })
    const dotTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, empowered, setup)
    const tick = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, dotTick, setup)
    expect(lastAllDamageBoost(contribution?.effects)).toBeCloseTo(
      lastAllDamageBoost(tick?.effects) ?? 0,
      9,
    )
  })

  it("does not add the DoT bonus to a declared empowered effect below tier 6", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_5, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const empowered = makeSkill(CLASS_ID, { tags: [PROP.empoweredDotEffect] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, empowered, setup)
    const allDamageEffects = contribution?.effects?.filter((e) => e.statKey === "allDamageBoost")
    expect(allDamageEffects).toHaveLength(1)
  })

  it("does not add the DoT bonus to a damage-over-time row below tier 6", () => {
    const setup = setupFor([emptyMindMethod, NS_TIER_5, emptyMindMethod, emptyMindMethod])
    const mechanic = insightfulStrikeMechanic()
    const state = mechanic.prepare(setup)!
    const dotTick = makeSkill(CLASS_ID, { isDotTick: true, tags: [] })
    const contribution = mechanic.contributeAt?.(state, FRAME_NEAR_SATURATION, dotTick, setup)
    const allDamageEffects = contribution?.effects?.filter((e) => e.statKey === "allDamageBoost")
    expect(allDamageEffects ?? []).toHaveLength(0)
  })
})
