import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"
const SWORD_ENERGY_WAVES = 3

function swordMorphAt(tier: number | null): Inputs["mindMethods"] {
  return [
    tier === null ? { name: "", stacks: "" } : { name: "Sword Morph", stacks: `tier ${tier}` },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
}

const swordMorphTier6 = swordMorphAt(6)
const swordMorphTier5 = swordMorphAt(5)
const swordMorphTier3 = swordMorphAt(3)
const noSwordMorph = swordMorphAt(null)

type Step = string | number

function waitSkill(frames: number) {
  return makeSkill(CLASS, {
    name: `Wait ${frames}`,
    castFrames: frames,
    hits: [makeHit({ frame: 0 })],
  })
}

function run(steps: Step[], mindMethods: Inputs["mindMethods"]) {
  const waits = new Map<number, ReturnType<typeof waitSkill>>()
  for (const step of steps)
    if (typeof step === "number" && !waits.has(step)) waits.set(step, waitSkill(step))
  const rotation = makeRotation(CLASS, {
    steps: steps.map((step) =>
      makeStep({ skillId: typeof step === "number" ? waits.get(step)!.id : step }),
    ),
  })
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    customSkills: [...waits.values()],
    activeCustomRotation: rotation,
    set: null,
  })
  return {
    result,
    hitsOf: (skillName: string) =>
      result.perSkill.find((row) => row.name === skillName)?.count ?? 0,
    invalidCount: (result.invalidStepIds ?? []).length,
  }
}

const hitsOfHeavy = (steps: Step[], mindMethods: Inputs["mindMethods"]) =>
  run(steps, mindMethods).hitsOf("SwordHeavyCharged")

describe("Sword Morph's multi-wave window gates Vagrant Sword's three-wave release", () => {
  it("flags SwordHeavyCharged 2 Hit as illegal while the window is down, legal once bootstrapped", () => {
    const down = run([SKILL.swordHeavyCharged2Hit], swordMorphTier6)
    const up = run([SKILL.swordSpecial, SKILL.swordHeavyCharged2Hit], swordMorphTier6)
    expect(down.invalidCount).toBe(1)
    expect(up.invalidCount).toBe(0)
  })

  it("Shadow Step bootstraps the window for the release that follows, at every Sword Morph rank", () => {
    const afterShadowStep = hitsOfHeavy(
      [SKILL.swordq, SKILL.swordSpecial, SKILL.swordHeavyCharged],
      swordMorphTier3,
    )
    const single = hitsOfHeavy([SKILL.swordq, SKILL.swordHeavyCharged], swordMorphTier3)
    expect(afterShadowStep).toBe(SWORD_ENERGY_WAVES)
    expect(single).toBe(1)
  })

  it("Shadow Step's window ends 300 f after its cast start, not after its bolt", () => {
    const pressedInsideWindow = hitsOfHeavy(
      [SKILL.swordSpecial, 240, SKILL.swordHeavyCharged],
      swordMorphTier6,
    )
    const pressedAfterWindow = hitsOfHeavy(
      [SKILL.swordSpecial, 265, SKILL.swordHeavyCharged],
      swordMorphTier6,
    )
    expect(pressedInsideWindow).toBe(SWORD_ENERGY_WAVES)
    expect(pressedAfterWindow).toBe(1)
  })

  it("the pre-pull form's own release opens the window at Sword Morph tier 4+", () => {
    const afterPrepull = run(
      [SKILL.swordHeavyChargedPrepull, SKILL.swordHeavyCharged2Hit],
      swordMorphTier6,
    )
    expect(afterPrepull.invalidCount).toBe(0)
  })

  it("the pre-pull form's own release opens no window below Sword Morph tier 4", () => {
    const afterPrepull = run(
      [SKILL.swordHeavyChargedPrepull, SKILL.swordHeavyCharged2Hit],
      swordMorphTier3,
    )
    expect(afterPrepull.invalidCount).toBe(1)
  })

  it("the pre-pull form is a single bolt without Sword Morph", () => {
    const prepullHits = (mindMethods: Inputs["mindMethods"]) =>
      run([SKILL.swordHeavyChargedPrepull, SKILL.swordq], mindMethods).hitsOf(
        "SwordHeavyCharged[Prepull]",
      )
    expect(prepullHits(noSwordMorph)).toBe(1)
    expect(prepullHits(swordMorphTier3)).toBe(SWORD_ENERGY_WAVES)
  })

  it("Energy Surge, a three-wave release, re-opens the window at Sword Morph tier 4+", () => {
    const withEnergySurge = run(
      [SKILL.swordHeavyChargedPrepull, 200, SKILL.energySurge, SKILL.swordHeavyCharged2Hit],
      swordMorphTier6,
    )
    const withoutEnergySurge = run(
      [SKILL.swordHeavyChargedPrepull, 200, 51, SKILL.swordHeavyCharged2Hit],
      swordMorphTier6,
    )
    expect(withEnergySurge.invalidCount).toBe(0)
    expect(withoutEnergySurge.invalidCount).toBe(1)
  })

  it("a three-wave release sustains its own window into the next cast", () => {
    const sustained = hitsOfHeavy(
      [SKILL.swordSpecial, SKILL.swordHeavyCharged, SKILL.swordHeavyCharged],
      swordMorphTier6,
    )
    expect(sustained).toBe(2 * SWORD_ENERGY_WAVES)
  })

  it("a press late in the window still renews it at the release, even though the window lapses before the release", () => {
    const steps = [SKILL.swordSpecial, 200, SKILL.swordHeavyCharged, SKILL.swordHeavyCharged]
    expect(hitsOfHeavy(steps, swordMorphTier6)).toBe(2 * SWORD_ENERGY_WAVES)
    expect(hitsOfHeavy(steps, swordMorphTier3)).toBe(SWORD_ENERGY_WAVES + 1)
  })

  it("Sword Morph below tier 4 does not sustain the window past its bootstrapped length", () => {
    const steps = [
      SKILL.swordSpecial,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
    ]
    const belowTier4Total = hitsOfHeavy(steps, swordMorphTier3)
    const tier5Total = hitsOfHeavy(steps, swordMorphTier5)
    expect(belowTier4Total).toBeLessThan(tier5Total)
  })
})

describe("the other two paths into a three-wave release", () => {
  it("a press while the Qi Shield holds is three waves with no window open", () => {
    expect(hitsOfHeavy([SKILL.swordq3rd, SKILL.swordHeavyCharged], swordMorphTier3)).toBe(
      SWORD_ENERGY_WAVES,
    )
  })

  it("a press 200 f after the Qi Shield's own frame has lapsed is a single bolt", () => {
    expect(hitsOfHeavy([SKILL.swordq3rd, 200, SKILL.swordHeavyCharged], swordMorphTier3)).toBe(1)
  })

  it("a Qi Shield release below Sword Morph tier 4 leaves no window behind", () => {
    const steps = [SKILL.swordq3rd, SKILL.swordHeavyCharged, 200, SKILL.swordHeavyCharged]
    expect(hitsOfHeavy(steps, swordMorphTier3)).toBe(SWORD_ENERGY_WAVES + 1)
  })

  it("the first Vagrant Sword of the fight, pressed before any damage, is three waves", () => {
    expect(hitsOfHeavy([SKILL.swordHeavyCharged], swordMorphTier6)).toBe(SWORD_ENERGY_WAVES)
    expect(hitsOfHeavy([SKILL.swordHeavyCharged], swordMorphTier3)).toBe(SWORD_ENERGY_WAVES)
  })

  it("a Vagrant Sword pressed after earlier damage, with no window and no shield, is a single bolt", () => {
    expect(hitsOfHeavy([SKILL.swordq, SKILL.swordHeavyCharged], swordMorphTier6)).toBe(1)
  })

  it("every release is a single bolt without Sword Morph", () => {
    expect(hitsOfHeavy([SKILL.swordHeavyCharged], noSwordMorph)).toBe(1)
    expect(hitsOfHeavy([SKILL.swordq3rd, SKILL.swordHeavyCharged], noSwordMorph)).toBe(1)
  })
})

describe("Energy Surge is granted only by a three-wave release", () => {
  it("an in-combat single bolt grants none", () => {
    const afterSingleBolt = run(
      [SKILL.swordq, SKILL.swordHeavyCharged, SKILL.energySurge],
      swordMorphTier6,
    )
    expect(afterSingleBolt.invalidCount).toBe(1)
  })

  it("a three-wave release grants it", () => {
    const afterThreeWaves = run([SKILL.swordHeavyCharged, SKILL.energySurge], swordMorphTier6)
    expect(afterThreeWaves.invalidCount).toBe(0)
  })

  it("the granting release raises Endurance by 20", () => {
    const enduranceAfter = (mindMethods: Inputs["mindMethods"]) =>
      run(
        [SKILL.swordHeavyCharged, 30, SKILL.swordq],
        mindMethods,
      ).result.casts?.[2]?.meterLevels?.find((level) => level.id === enduranceMeter.id)?.amount ?? 0
    expect(enduranceAfter(swordMorphTier6) - enduranceAfter(swordMorphTier5)).toBeCloseTo(20, 5)
  })
})

describe("the Energy Surge interval", () => {
  const regrantsAfter = (waitFrames: number) =>
    run(
      [
        SKILL.swordHeavyCharged,
        waitFrames,
        SKILL.swordSpecial,
        SKILL.swordHeavyCharged,
        SKILL.energySurge,
      ],
      swordMorphTier6,
    ).invalidCount === 0

  it("is shortened 1 s for each sword-energy bullet that hits while it cools", () => {
    expect(regrantsAfter(700)).toBe(false)
    expect(regrantsAfter(800)).toBe(true)
  })
})
