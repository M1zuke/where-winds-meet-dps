// Scoped to Bamboocut Draught's Inebriate-enhanced skills (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import type { Skill } from "../../src/engine/skill"
import { ROLE } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bamboocutDraught"
const BELOW_TIPSY_BINGE_POINTS = 60

function damageOf(skill: Skill, bingePoints: number): number {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    customSkills: [skill],
    activeCustomRotation: testRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
  return result.perSkill.find((row) => row.name === skill.name)!.expectedDamage
}

describe("a skill every hit of which is Inebriate-enhanced needs no Tipsy for the crit-damage talent", () => {
  const tidepour = builtinSkill(CLASS, SKILL.tidepour)
  const untagged: Skill = {
    ...tidepour,
    tags: (tidepour.tags ?? []).filter((tag) => tag !== ROLE.inebriateEnhanced),
  }

  it("carries the role tag", () => {
    expect(tidepour.tags).toContain(ROLE.inebriateEnhanced)
  })

  it("deals more below the Tipsy threshold than the same skill without the role tag", () => {
    expect(damageOf(tidepour, BELOW_TIPSY_BINGE_POINTS)).toBeGreaterThan(
      damageOf(untagged, BELOW_TIPSY_BINGE_POINTS),
    )
  })

  it("deals the same at the Tipsy threshold, where the state gate already holds", () => {
    expect(damageOf(tidepour, 100)).toBe(damageOf(untagged, 100))
  })
})

describe("plain Peakfall and Castlink stay on the state gate", () => {
  it.each([SKILL.peakfall, SKILL.peakfallPrepull, SKILL.castlink])(
    "%s carries no role tag",
    (skillId) => {
      expect(builtinSkill(CLASS, skillId).tags).not.toContain(ROLE.inebriateEnhanced)
    },
  )
})
