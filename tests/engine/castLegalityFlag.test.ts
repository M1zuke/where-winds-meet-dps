import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { enduranceRequires } from "../../src/data/resources/enduranceMeter"
import { PARAM } from "../../src/data/skills/buffs/ids"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

// Unclaims the Oddity board's own Endurance nodes, isolating the plain meter
// mechanics a legality test is about from that separately-tested contribution
// (mirrors `meterCapability.test.ts`).
const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
}

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[],
  patch: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    set: null,
    ...patch,
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
    // The window ends at "After"'s own hit, at its cast's start, not at its
    // cast's own end — docs/TIMELINE.md § "Fight window".
    expect(result.rotationDuration).toBeCloseTo((90 + 60 + 90) / FPS, 10)
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

describe("a warning's own time", () => {
  it("reports the fight clock, not the engine's absolute seconds", () => {
    const buffOnly = makeSkill(CLASS, { name: "Buff Only", castFrames: 60, hits: [makeHit()] })
    const opener = makeSkill(CLASS, {
      name: "Opener",
      castFrames: 30,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 30,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const skills = [buffOnly, opener, flagged]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate])
    const result = simulateTimeline(inputs)

    // Opener's own hit is the fight's first damaging hit, at absolute 1.00s —
    // Flagged lands half a second later, at absolute 1.50s but fight-clock 0.50s.
    expect(result.fightStartSec).toBeCloseTo(1, 10)
    expect(result.warnings.some((warning) => warning.includes("0.50s"))).toBe(true)
    expect(result.warnings.some((warning) => warning.includes("1.50s"))).toBe(false)
  })
})

describe("an illegal step's reported reason", () => {
  it("names an Endurance-short cast's requirement and its actual value", () => {
    const gated = makeSkill(CLASS, {
      name: "Gated by Meter",
      castFrames: 30,
      castConditions: [enduranceRequires("gte", 200)],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const inputs = timelineInputs(rotationOf([gated]), [gated], [], {
      unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    })
    const result = simulateTimeline(inputs)

    const [stepId] = result.invalidStepIds!
    const [reason] = result.invalidStepReasons![stepId]
    expect(reason).toEqual({
      kind: "meter",
      id: "endurance",
      name: "Endurance",
      op: "gte",
      required: 200,
      actual: 80,
    })
    expect(
      result.warnings.some(
        (warning) =>
          warning.includes("Endurance") && warning.includes("200") && warning.includes("80"),
      ),
    ).toBe(true)
  })

  it("names a missing buff a cast's condition requires", () => {
    const gate = makeBuff(CLASS, {
      name: "River Flow",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 30,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const inputs = timelineInputs(rotationOf([flagged]), [flagged], [gate])
    const result = simulateTimeline(inputs)

    const [stepId] = result.invalidStepIds!
    const [reason] = result.invalidStepReasons![stepId]
    expect(reason).toEqual({
      kind: "buff",
      id: gate.id,
      name: "River Flow",
      op: "gte",
      required: 1,
      actual: 0,
    })
    expect(result.warnings.some((warning) => warning.includes("River Flow"))).toBe(true)
  })

  it("names both conditions a cast fails at once", () => {
    const gate = makeBuff(CLASS, {
      name: "River Flow",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 30,
      castConditions: [enduranceRequires("gte", 200), { buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const inputs = timelineInputs(rotationOf([flagged]), [flagged], [gate], {
      unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    })
    const result = simulateTimeline(inputs)

    const [stepId] = result.invalidStepIds!
    const reasons = result.invalidStepReasons![stepId]
    expect(reasons).toEqual([
      { kind: "meter", id: "endurance", name: "Endurance", op: "gte", required: 200, actual: 80 },
      { kind: "buff", id: gate.id, name: "River Flow", op: "gte", required: 1, actual: 0 },
    ])
    const [warning] = result.warnings
    expect(warning).toContain("Endurance")
    expect(warning).toContain("River Flow")
    expect(warning).toContain(" and ")
  })

  it("names the inner way a param condition's build source resolves to, not a plain buff", () => {
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 30,
      castConditions: [{ param: PARAM.swordHorizon }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const inputs = timelineInputs(rotationOf([flagged]), [flagged], [])
    const result = simulateTimeline(inputs)

    const [stepId] = result.invalidStepIds!
    const [reason] = result.invalidStepReasons![stepId]
    expect(reason).toEqual({
      kind: "param",
      id: "swordHorizon",
      name: "Sword Horizon",
      source: { kind: "innerWay", id: "swordHorizon" },
      minTier: undefined,
      actualOn: false,
      actualTier: 0,
    })
    expect(
      result.warnings.some((warning) =>
        warning.includes("needs the inner way Sword Horizon equipped (not equipped)"),
      ),
    ).toBe(true)
  })

  it("falls back to the plain build-param wording when the param resolves to no known source", () => {
    const flagged = makeSkill(CLASS, {
      name: "Flagged",
      castFrames: 30,
      castConditions: [{ param: "dragonHeadLowHpMaxBonus" }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const inputs = timelineInputs(rotationOf([flagged]), [flagged], [])
    const result = simulateTimeline(inputs)

    const [stepId] = result.invalidStepIds!
    const [reason] = result.invalidStepReasons![stepId]
    expect(reason).toEqual({
      kind: "param",
      id: "dragonHeadLowHpMaxBonus",
      name: "Dragon Head Low Hp Max Bonus",
      source: undefined,
      minTier: undefined,
      actualOn: false,
      actualTier: 0,
    })
    const [warning] = result.warnings
    expect(warning).toContain("active (not active)")
    expect(warning).not.toContain("inner way")
  })
})
