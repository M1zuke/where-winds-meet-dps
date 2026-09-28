// The generic next-step hit gate (docs/TIMELINE.md § "Conditional hits"): a
// hit's own `requiresNextStepSkillIds` only lands when the rotation step
// immediately following its cast names one of the listed skills, and its own
// `castFramesWhenGated` overrides the cast's length only once that hit
// actually occurred. Every skill below is placeholder content authored only
// for this file.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function timelineInputs(rotation: Rotation, skills: Skill[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: [],
    activeCustomRotation: rotation,
    set: null,
  }
}

function rotationOf(skills: Skill[]): Rotation {
  return makeRotation(CLASS, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

function gatedForm(followUpId: string): Skill {
  return makeSkill(CLASS, {
    name: "Gated Form",
    castFrames: 20,
    hits: [
      makeHit({ frame: 10, physMultiplier: 1, physFixed: 100 }),
      makeHit({
        frame: 40,
        physMultiplier: 1,
        physFixed: 50,
        requiresNextStepSkillIds: [followUpId],
        castFramesWhenGated: 45,
      }),
    ],
  })
}

function followUp(): Skill {
  return makeSkill(CLASS, {
    name: "Follow Up",
    castFrames: 5,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })
}

function otherStep(): Skill {
  return makeSkill(CLASS, {
    name: "Other Step",
    castFrames: 5,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })
}

describe("a hit's own requiresNextStepSkillIds", () => {
  it("lands, and its own castFramesWhenGated overrides the cast's length, when the next step names it", () => {
    const follow = followUp()
    const gated = gatedForm(follow.id)
    const result = simulateTimeline(timelineInputs(rotationOf([gated, follow]), [gated, follow]))
    const followCast = result.casts?.find((cast) => cast.skillName === "Follow Up")
    expect(result.perSkill.find((row) => row.name === "Gated Form")?.count).toBe(2)
    expect(followCast?.timeSec).toBeCloseTo(45 / 60)
  })

  it("does not land, and the cast keeps its own static length, when the next step names something else", () => {
    const gated = gatedForm("bellstrikeUmbra-never-cast")
    const other = otherStep()
    const result = simulateTimeline(timelineInputs(rotationOf([gated, other]), [gated, other]))
    expect(result.perSkill.find((row) => row.name === "Gated Form")?.count).toBe(1)
    const otherCast = result.casts?.find((cast) => cast.skillName === "Other Step")
    expect(otherCast?.timeSec).toBeCloseTo(20 / 60)
  })

  it("does not land when it is the rotation's own last step", () => {
    const gated = gatedForm("bellstrikeUmbra-never-cast")
    const result = simulateTimeline(timelineInputs(rotationOf([gated]), [gated]))
    expect(result.perSkill.find((row) => row.name === "Gated Form")?.count).toBe(1)
  })
})
