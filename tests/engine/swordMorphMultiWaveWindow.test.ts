import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"

const swordMorphTier6: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

const swordMorphTier3: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 3" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function damageOf(skillName: string, mindMethods: Inputs["mindMethods"], steps: string[]) {
  const rotation = makeRotation(CLASS, { steps: steps.map((skillId) => makeStep({ skillId })) })
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: rotation,
    set: null,
  })
  return result.perSkill.find((row) => row.name === skillName)?.expectedDamage ?? 0
}

function invalidStepIdsFor(steps: string[], mindMethods: Inputs["mindMethods"]): string[] {
  const rotation = makeRotation(CLASS, { steps: steps.map((skillId) => makeStep({ skillId })) })
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: rotation,
    set: null,
  })
  return result.invalidStepIds ?? []
}

describe("Sword Morph's multi-wave window gates Vagrant Sword's three-wave release", () => {
  it("flags SwordHeavyCharged 2 Hit as illegal while the window is down, legal once bootstrapped", () => {
    const down = invalidStepIdsFor([SKILL.swordHeavyCharged2Hit], swordMorphTier6)
    const up = invalidStepIdsFor([SKILL.swordSpecial, SKILL.swordHeavyCharged2Hit], swordMorphTier6)
    expect(down).toHaveLength(1)
    expect(up).toHaveLength(0)
  })

  it("Shadow Step bootstraps the window for the release that follows, at every Sword Morph rank", () => {
    const afterShadowStep = damageOf("SwordHeavyCharged", swordMorphTier6, [
      SKILL.swordSpecial,
      SKILL.swordHeavyCharged,
    ])
    const single = damageOf("SwordHeavyCharged", swordMorphTier6, [SKILL.swordHeavyCharged])
    expect(afterShadowStep).toBeGreaterThan(single)
  })

  it("the pre-pull form's own release opens the window at Sword Morph tier 4+", () => {
    const afterPrepull = invalidStepIdsFor(
      [SKILL.swordHeavyChargedPrepull, SKILL.swordHeavyCharged2Hit],
      swordMorphTier6,
    )
    expect(afterPrepull).toHaveLength(0)
  })

  it("the pre-pull form's own release opens no window below Sword Morph tier 4", () => {
    const afterPrepull = invalidStepIdsFor(
      [SKILL.swordHeavyChargedPrepull, SKILL.swordHeavyCharged2Hit],
      swordMorphTier3,
    )
    expect(afterPrepull).toHaveLength(1)
  })

  it("Energy Surge opens the window at Sword Morph tier 4+ even when it was not already open", () => {
    const afterEnergySurge = invalidStepIdsFor(
      [SKILL.swordHeavyCharged, SKILL.energySurge, SKILL.swordHeavyCharged2Hit],
      swordMorphTier6,
    )
    expect(afterEnergySurge).toHaveLength(0)
  })

  it("a three-wave release sustains its own window into the next cast", () => {
    const sustained = damageOf("SwordHeavyCharged", swordMorphTier6, [
      SKILL.swordSpecial,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
    ])
    const single = damageOf("SwordHeavyCharged", swordMorphTier6, [SKILL.swordHeavyCharged])
    expect(sustained).toBeGreaterThan(single * 1.9)
  })

  it("Sword Morph below tier 4 does not sustain the window past its bootstrapped length", () => {
    const steps = [
      SKILL.swordSpecial,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged,
    ]
    const belowTier4Total = damageOf("SwordHeavyCharged", swordMorphTier3, steps)
    const tier6Total = damageOf("SwordHeavyCharged", swordMorphTier6, steps)
    expect(belowTier4Total).toBeLessThan(tier6Total)
  })
})
