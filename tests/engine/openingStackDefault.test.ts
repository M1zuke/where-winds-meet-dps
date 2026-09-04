// Scoped to bamboocutDraught — the only class declaring an opening-stack
// default (TESTING.md § "Class scoping" — a stack count, not a damage
// figure).
import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { classDefinition } from "../../src/definitions/classes/registry"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

function fillerRotationResult(openingStacks?: Record<string, number>) {
  const skill = makeSkill(CLASS, {
    name: "Filler",
    castFrames: 60,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [skill],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id, hitCount: 1 })],
      ...(openingStacks ? { openingStacks } : {}),
    }),
  }
  return simulateTimeline(inputs)
}

describe("bamboocutDraught — Binge Points opening-stack default", () => {
  it("declares Binge Points and Draught as its opening-stack counters", () => {
    expect(classDefinition(CLASS)!.openingStackBuffIds).toEqual([
      STATUS.bingePoints,
      STATUS.draught,
    ])
  })

  it("seeds the default when the rotation carries no explicit entry, and shows it on the first cast's chip", () => {
    const [firstCast] = fillerRotationResult().casts ?? []
    const chip = firstCast?.buffs.find((buff) => buff.id === STATUS.bingePoints)
    expect(chip).toMatchObject({ stacks: 60, maxStacks: 200 })
  })

  it("an explicit opening-stacks entry overrides the default", () => {
    const [firstCast] = fillerRotationResult({ [STATUS.bingePoints]: 150 }).casts ?? []
    const chip = firstCast?.buffs.find((buff) => buff.id === STATUS.bingePoints)
    expect(chip).toMatchObject({ stacks: 150, maxStacks: 200 })
  })

  it("the same default also resolves a hit variant's cast-length gate — the seeded ledger and the layout pass agree", () => {
    const skill = makeSkill(CLASS, {
      name: "Gated filler",
      castFrames: 90,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          variants: [
            {
              id: "hv-default-gate",
              label: "Gated",
              conditions: [{ buffId: STATUS.bingePoints, op: "gte", stacks: 60 }],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 1,
              attributeFixed: 0,
              castFrames: 30,
            },
          ],
        }),
      ],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      set: null,
      customSkills: [skill],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: skill.id, hitCount: 1 })],
      }),
    }
    expect(simulateTimeline(inputs).rotationDuration).toBeCloseTo(30 / FPS, 10)
  })
})
