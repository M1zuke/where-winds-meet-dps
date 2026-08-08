import { describe, expect, it } from "vitest"
import { getDefaultTalentsForClass } from "../../src/data/baseStats"
import { poolForClass } from "../../src/data/classes/retunementPools"
import { attunementsFor } from "../../src/engine/attunements"
import {
  builtinRotationsForClass,
  builtinSkillsForClass,
  defaultRotationForClass,
} from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { resolveRotation } from "../../src/engine/rotation"

const CLASS = "stonesplitPower"

function skillNamed(name: string) {
  const skill = builtinSkillsForClass(CLASS).find((candidate) => candidate.name === name)
  expect(skill, `${CLASS} has no built-in skill named ${name}`).toBeTruthy()
  return skill!
}

function totals(name: string) {
  return skillNamed(name).hits.reduce(
    (sum, hit) => ({
      physMultiplier: sum.physMultiplier + hit.physMultiplier,
      physFixed: sum.physFixed + hit.physFixed,
      attributeMultiplier: sum.attributeMultiplier + hit.attributeMultiplier,
      attributeFixed: sum.attributeFixed + hit.attributeFixed,
    }),
    { physMultiplier: 0, physFixed: 0, attributeMultiplier: 0, attributeFixed: 0 },
  )
}

describe("Stonesplit Might built-in data", () => {
  it.each([
    ["MoBladeHeavyCharge-1BW", 5.7895, 1601, 8.6842, 872],
    ["MoBladeHeavyCharge-2BW", 7.2368, 2002, 10.8553, 1090],
    ["MoBladeVariedCombo-2BW", 2.6343, 729, 3.9514, 397],
    ["MoBladeVariedComboGroundSlam-2BW", 1.6464, 455, 2.4696, 248],
    ["SpearSpecial", 1.13, 313, 1.695, 171],
    ["SpearSpecial[Cancel]", 0.339, 93.9, 0.5085, 51.3],
    ["SpearQ", 0.3151, 88, 0.4726, 48],
  ])(
    "%s carries the confirmed level-100 totals",
    (name, physMultiplier, physFixed, attributeMultiplier, attributeFixed) => {
      expect(totals(name)).toEqual({
        physMultiplier,
        physFixed,
        attributeMultiplier,
        attributeFixed,
      })
    },
  )

  it("keeps the confirmed charge timings and two-hit structure", () => {
    const full = skillNamed("MoBladeHeavyCharge-1BW")
    const cancel = skillNamed("MoBladeHeavyCharge-1BW[Cancel]")
    const perception = skillNamed("MoBladeHeavyCharge-1BW[Perception]")
    const perceptionCancel = skillNamed("MoBladeHeavyCharge-1BW[Perception][Cancel]")
    expect([
      full.castFrames,
      cancel.castFrames,
      perception.castFrames,
      perceptionCancel.castFrames,
    ]).toEqual([226, 176, 105, 67])
    expect(full.hits).toHaveLength(2)
  })

  it("resolves every shipped rotation and produces damage", () => {
    const skills = builtinSkillsForClass(CLASS)
    const rotations = builtinRotationsForClass(CLASS)
    expect(rotations).toHaveLength(3)
    for (const rotation of rotations) {
      const { warnings } = resolveRotation(rotation, skills, [])
      expect(warnings.filter((warning) => warning.includes("missing skill"))).toEqual([])
    }
    expect(defaultRotationForClass(CLASS)).not.toBeNull()
    expect(runEngine({ ...defaultInputs, classId: CLASS }).dps).toBeGreaterThan(0)
  })

  it("reuses shared progression while targeting Stonesplit stats", () => {
    const talents = getDefaultTalentsForClass(CLASS)
    expect(talents).toHaveLength(8)
    expect(talents.some((talent) => talent.stat === "minStonesplit")).toBe(true)
    expect(talents.some((talent) => talent.stat === "maxStonesplit")).toBe(true)
    expect(talents.some((talent) => talent.stat === "stonesplitPenetration")).toBe(true)
  })

  it("exposes Stonesplit retunement and the 3.6-6% Mo Blade charged attunement", () => {
    expect(poolForClass(CLASS)?.stats).toContain("Max Stonesplit")
    const option = attunementsFor("helm", CLASS).find((entry) => entry.id === "moBladeCharge")
    expect(option).toMatchObject({ min: 0.036, max: 0.06 })
  })
})
