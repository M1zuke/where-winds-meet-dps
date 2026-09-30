import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function timelineInputs(rotation: Rotation, skills: Skill[], buffs: Buff[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    set: null,
  }
}

function rotationOf(skills: Skill[]): Rotation {
  return makeRotation(CLASS, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

describe("a skill's cast legality flag", () => {
  it("still lays out, lands its hit and advances the cursor when its conditions are unmet", () => {
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const grantTrigger = makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1 })
    const granter = makeSkill(CLASS, {
      name: "Granter",
      castFrames: 60,
      hits: [makeHit({ frame: 0, triggers: [grantTrigger] })],
    })
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 90,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const after = makeSkill(CLASS, {
      name: "After",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const skills = [flagged, granter, flagged, after]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate])
    const result = simulateTimeline(inputs)

    expect(result.casts?.map((cast) => cast.skillName)).toEqual([
      "Flagged",
      "Granter",
      "Flagged",
      "After",
    ])
    expect(result.rotationDuration).toBeCloseTo((90 + 60 + 90 + 60) / FPS, 10)
    expect(result.perSkill.find((row) => row.name === "Flagged")?.count).toBe(2)
  })

  it("flags only the step whose conditions actually fail, not a later one that meets them", () => {
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const grantTrigger = makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1 })
    const granter = makeSkill(CLASS, {
      name: "Granter",
      castFrames: 60,
      hits: [makeHit({ frame: 0, triggers: [grantTrigger] })],
    })
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 90,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const skills = [flagged, granter, flagged]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate])
    const result = simulateTimeline(inputs)

    const flaggedSteps = result.casts!.filter((cast) => cast.skillName === "Flagged")
    expect(result.invalidStepIds).toEqual([flaggedSteps[0].stepId])
    expect(
      result.warnings.some((warning) => warning.includes("Flagged") && warning.includes("illegal")),
    ).toBe(true)
  })

  it("does not flag a castSkill-generated cast", () => {
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const sub = makeSkill(CLASS, {
      name: "Sub",
      castFrames: 0,
      triggerable: true,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 60,
      hits: [
        makeHit({ frame: 0, triggers: [makeTrigger({ kind: "castSkill", targetId: sub.id })] }),
      ],
    })
    const skills = [caster]
    const inputs = timelineInputs(rotationOf(skills), [...skills, sub], [gate])
    const result = simulateTimeline(inputs)

    expect(result.invalidStepIds ?? []).toEqual([])
  })
})
