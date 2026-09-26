import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

const swordHorizonSlotted: Inputs["mindMethods"] = [
  { name: "Sword Horizon", stacks: "tier 6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function invalidStepIdsFor(skillIds: string[], mindMethods: Inputs["mindMethods"]) {
  const rotation = makeRotation(CLASS, { steps: skillIds.map((skillId) => makeStep({ skillId })) })
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: rotation,
    set: null,
  })
  return result.invalidStepIds ?? []
}

describe("Sword Horizon gates the Crisscross follow-ups", () => {
  it("flags Crisscross - Inner Track, Crisscross - Inner Balance III and Crisscross - Second Track without Sword Horizon", () => {
    const flags = invalidStepIdsFor(
      [SKILL.swordMartialQqq, SKILL.crosswindBlade, SKILL.swordRChargeFollowUp],
      defaultInputs.mindMethods,
    )
    expect(flags).toHaveLength(3)
  })

  it("does not flag them with Sword Horizon slotted", () => {
    const flags = invalidStepIdsFor(
      [SKILL.swordMartialQqq, SKILL.crosswindBlade, SKILL.swordRChargeFollowUp],
      swordHorizonSlotted,
    )
    expect(flags).toHaveLength(0)
  })
})

describe("Sword Horizon cuts the forced cast length on the forms that feed into a Crisscross follow-up", () => {
  function castFramesFor(skillId: string, mindMethods: Inputs["mindMethods"]): number {
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId })] })
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods,
      activeCustomRotation: rotation,
      set: null,
    })
    return result.castDuration * 60
  }

  it("Sword Martial QQ shortens from 64 to 61 frames", () => {
    expect(castFramesFor(SKILL.swordqfollowup, defaultInputs.mindMethods)).toBeCloseTo(64, 6)
    expect(castFramesFor(SKILL.swordqfollowup, swordHorizonSlotted)).toBeCloseTo(61, 6)
  })

  it("SwordSpecial 3-Hit shortens from 57 to 64 frames", () => {
    expect(castFramesFor(SKILL.swordspecial3Hit, defaultInputs.mindMethods)).toBeCloseTo(57, 6)
    expect(castFramesFor(SKILL.swordspecial3Hit, swordHorizonSlotted)).toBeCloseTo(64, 6)
  })

  it("SwordSpecial 4-Hit shortens from 84 to 77 frames", () => {
    expect(castFramesFor(SKILL.swordspecial4Hit, defaultInputs.mindMethods)).toBeCloseTo(84, 6)
    expect(castFramesFor(SKILL.swordspecial4Hit, swordHorizonSlotted)).toBeCloseTo(77, 6)
  })
})
