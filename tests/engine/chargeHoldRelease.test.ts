// The generic charged-hold capability (docs/TIMELINE.md § "Meters"): a
// `meterDrains` entry may carry `chargeRelease`, naming the lower-stage form
// a step plays instead when its own drain cannot sustain to its own stop
// frame. `bellstrikeUmbra` already registers the shared Endurance meter
// (`src/data/resources/enduranceMeter.ts`) — every skill below is placeholder
// content authored only for this file.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import type { UnclaimedOddityNodes } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
}

function timelineInputs(rotation: Rotation, skills: Skill[], patch: Partial<Inputs> = {}): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: [],
    activeCustomRotation: rotation,
    set: null,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    ...patch,
  }
}

function rotationOf(skills: Skill[]): Rotation {
  return makeRotation(CLASS, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

function stageThree(): Skill {
  return makeSkill(CLASS, {
    name: "Held Stage Three",
    castFrames: 30,
    hits: [makeHit({ frame: 30, physMultiplier: 1, physFixed: 300 })],
  })
}

function stageOneDraining(fallback: Skill, perSecond: number): Skill {
  return makeSkill(CLASS, {
    name: "Held Stage One",
    castFrames: 90,
    meterDrains: [
      {
        meterId: METER_ID,
        perSecond,
        fromFrame: 0,
        stopAfterSec: 1,
        chargeRelease: { fallbackSkillId: fallback.id },
      },
    ],
    hits: [makeHit({ frame: 90, physMultiplier: 1, physFixed: 100 })],
  })
}

function noop(): Skill {
  return makeSkill(CLASS, {
    name: "Noop",
    castFrames: 6,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })
}

describe("a charged hold's chargeRelease", () => {
  it("holds exactly the named stage when its own drain can sustain to its own stop frame", () => {
    const fallback = stageThree()
    const held = stageOneDraining(fallback, 50)
    const result = simulateTimeline(timelineInputs(rotationOf([held]), [held, fallback]))
    expect(result.perSkill.find((row) => row.name === "Held Stage One")?.count).toBe(1)
    expect(result.perSkill.find((row) => row.name === "Held Stage Three")).toBeUndefined()
    expect(result.warnings.some((warning) => warning.includes("released early"))).toBe(false)
  })

  it("releases early onto the named fallback, flagged, when its drain would empty first", () => {
    const fallback = stageThree()
    const held = stageOneDraining(fallback, 100)
    const result = simulateTimeline(timelineInputs(rotationOf([held]), [held, fallback]))
    expect(result.perSkill.find((row) => row.name === "Held Stage One")).toBeUndefined()
    expect(result.perSkill.find((row) => row.name === "Held Stage Three")?.count).toBe(1)
    expect(
      result.warnings.some(
        (warning) => warning.includes("released early") && warning.includes("Held Stage Three"),
      ),
    ).toBe(true)
    expect(result.invalidStepIds ?? []).toEqual([])
  })

  it("steps down one level at a time through a chain, never skipping a fallback that could also sustain", () => {
    const stage3 = stageThree()
    const stage2 = makeSkill(CLASS, {
      name: "Held Stage Two Chained",
      castFrames: 60,
      meterDrains: [
        {
          meterId: METER_ID,
          perSecond: 100,
          fromFrame: 0,
          stopAfterSec: 1,
          chargeRelease: { fallbackSkillId: stage3.id },
        },
      ],
      hits: [makeHit({ frame: 60, physMultiplier: 1, physFixed: 200 })],
    })
    const stage1 = stageOneDraining(stage2, 100)
    const spendsMost = makeSkill(CLASS, {
      name: "Spends Most",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 75 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([spendsMost, stage1]), [spendsMost, stage1, stage2, stage3]),
    )
    expect(result.perSkill.find((row) => row.name === "Held Stage One")).toBeUndefined()
    expect(result.perSkill.find((row) => row.name === "Held Stage Two Chained")).toBeUndefined()
    expect(result.perSkill.find((row) => row.name === "Held Stage Three")?.count).toBe(1)
  })

  it("stops at an intermediate fallback that can sustain, without cascading further down the chain", () => {
    const stage3 = stageThree()
    const stage2 = makeSkill(CLASS, {
      name: "Held Stage Two Sustains",
      castFrames: 60,
      meterDrains: [
        {
          meterId: METER_ID,
          perSecond: 15,
          fromFrame: 0,
          stopAfterSec: 1,
          chargeRelease: { fallbackSkillId: stage3.id },
        },
      ],
      hits: [makeHit({ frame: 60, physMultiplier: 1, physFixed: 200 })],
    })
    const stage1 = stageOneDraining(stage2, 100)
    const spendsMost = makeSkill(CLASS, {
      name: "Spends Most",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 60 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([spendsMost, stage1]), [spendsMost, stage1, stage2, stage3]),
    )
    expect(result.perSkill.find((row) => row.name === "Held Stage One")).toBeUndefined()
    expect(result.perSkill.find((row) => row.name === "Held Stage Two Sustains")?.count).toBe(1)
    expect(result.perSkill.find((row) => row.name === "Held Stage Three")).toBeUndefined()
    expect(
      result.warnings.some(
        (warning) =>
          warning.includes("released early") && warning.includes("Held Stage Two Sustains"),
      ),
    ).toBe(true)
  })

  it("never resolves for a pre-pull cast, whose drain never actually runs", () => {
    const fallback = stageThree()
    const drainsMeterFirst = makeSkill(CLASS, {
      name: "Drains Meter First",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 80 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const prePullHeld = makeSkill(CLASS, {
      name: "Prepull Held Stage",
      prePull: true,
      castFrames: 90,
      meterDrains: [
        {
          meterId: METER_ID,
          perSecond: 100,
          fromFrame: 0,
          stopAfterSec: 1,
          chargeRelease: { fallbackSkillId: fallback.id },
        },
      ],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([prePullHeld, drainsMeterFirst]), [
        prePullHeld,
        drainsMeterFirst,
        fallback,
      ]),
    )
    expect(result.perSkill.find((row) => row.name === "Held Stage Three")).toBeUndefined()
    expect(result.warnings.some((warning) => warning.includes("released early"))).toBe(false)
  })

  it("pays a cast-start meterCosts entry at its own frame, ahead of a later drain the release projects against", () => {
    const fallback = stageThree()
    const held = makeSkill(CLASS, {
      name: "Held With Cost",
      castFrames: 48,
      meterCosts: [{ meterId: METER_ID, amount: 6 }],
      meterDrains: [
        {
          meterId: METER_ID,
          perSecond: 14,
          fromFrame: 12,
          stopAfterSec: 0.3,
          chargeRelease: { fallbackSkillId: fallback.id },
        },
      ],
      hits: [makeHit({ frame: 48, physMultiplier: 1, physFixed: 10 })],
    })
    const after = noop()
    const result = simulateTimeline(
      timelineInputs(rotationOf([held, after]), [held, after, fallback]),
    )
    expect(result.warnings.some((warning) => warning.includes("before the cursor"))).toBe(false)
    expect(result.perSkill.find((row) => row.name === "Held With Cost")?.count).toBe(1)
    const heldCast = result.casts?.find((cast) => cast.skillName === "Held With Cost")
    const noopCast = result.casts?.find((cast) => cast.skillName === "Noop")
    expect(heldCast?.meterLevels?.find((level) => level.id === METER_ID)?.amount).toBe(80)
    expect(noopCast?.meterLevels?.find((level) => level.id === METER_ID)?.amount).toBeCloseTo(69.8)
  })
})
