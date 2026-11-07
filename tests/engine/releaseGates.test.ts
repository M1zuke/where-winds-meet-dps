// A charged skill whose released stage the game picks from a requirement read
// partway into the cast (docs/TIMELINE.md § "Meters"). The shared Endurance
// meter stands in for any resource; every skill below is placeholder content.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { isSkill, makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"
import { enduranceMeter, enduranceRequires } from "../../src/data/resources/enduranceMeter"

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
  Jiangnan: [705, 719],
}

function inputsFor(skills: Skill[], rotationSkills: Skill[]): Inputs {
  const rotation: Rotation = makeRotation(CLASS, {
    steps: rotationSkills.map((skill) => makeStep({ skillId: skill.id })),
  })
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: [],
    activeCustomRotation: rotation,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
  }
}

const damagingHit = () => makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })

const spender = (amount: number, castFrames: number) =>
  makeSkill(CLASS, {
    name: `Spends ${amount}`,
    castFrames,
    meterCosts: [{ meterId: METER_ID, amount }],
    hits: [damagingHit()],
  })

const stage = (name: string, patch: Partial<Skill> = {}) =>
  makeSkill(CLASS, { name, castFrames: 30, hits: [damagingHit()], ...patch })

function castNames(result: ReturnType<typeof simulateTimeline>): string[] {
  return (result.casts ?? []).map((cast) => cast.skillName)
}

describe("a release gate", () => {
  it("reads the meter at its own frame into the cast, after regeneration, not at the press", () => {
    const spend = spender(30, 80)
    const low = stage("Low Stage")
    const high = stage("High Stage", {
      castFrames: 120,
      releaseGates: [
        {
          atFrame: 60,
          requires: [enduranceRequires("gt", 60)],
          fallbackSkillId: low.id,
        },
      ],
    })
    const result = simulateTimeline(inputsFor([spend, low, high], [spend, high]))
    // 80 - 30 = 50, regeneration resumes 72 f after the spend: 51.33 at the
    // press (frame 80) and 61.33 a second later, so the gate at 60 f passes.
    expect(castNames(result)).toEqual(["Spends 30", "High Stage"])
  })

  it("releases the fallback when the requirement fails there, without flagging the step illegal", () => {
    const spend = spender(40, 80)
    const low = stage("Low Stage")
    const high = stage("High Stage", {
      releaseGates: [
        {
          atFrame: 10,
          requires: [enduranceRequires("gt", 60)],
          fallbackSkillId: low.id,
        },
      ],
    })
    const result = simulateTimeline(inputsFor([spend, low, high], [spend, high]))
    expect(castNames(result)).toEqual(["Spends 40", "Low Stage"])
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(
      result.warnings.some(
        (warning) => warning.includes("High Stage") && warning.includes("released onto Low Stage"),
      ),
    ).toBe(true)
    expect(result.perSkill.find((row) => row.name === "High Stage")).toBeUndefined()
    expect(result.perSkill.find((row) => row.name === "Low Stage")?.count).toBe(1)
  })

  it("steps down through the fallback's own gate, one stage at a time", () => {
    const spend = spender(50, 80)
    const lowest = stage("Lowest Stage")
    const middle = stage("Middle Stage", {
      releaseGates: [
        { atFrame: 5, requires: [enduranceRequires("gt", 35)], fallbackSkillId: lowest.id },
      ],
    })
    const high = stage("High Stage", {
      releaseGates: [
        { atFrame: 5, requires: [enduranceRequires("gt", 40)], fallbackSkillId: middle.id },
      ],
    })
    const passesOnlyTheFirstGate = simulateTimeline(
      inputsFor([spend, lowest, middle, high], [spend, high]),
    )
    expect(castNames(passesOnlyTheFirstGate)).toEqual(["Spends 50", "Lowest Stage"])
  })

  it("lets the first gate that fails decide when several are authored", () => {
    const spend = spender(40, 80)
    const lowest = stage("Lowest Stage")
    const middle = stage("Middle Stage")
    const high = stage("High Stage", {
      releaseGates: [
        { atFrame: 5, requires: [enduranceRequires("gt", 60)], fallbackSkillId: lowest.id },
        { atFrame: 5, requires: [enduranceRequires("gt", 10)], fallbackSkillId: middle.id },
      ],
    })
    const result = simulateTimeline(inputsFor([spend, lowest, middle, high], [spend, high]))
    expect(castNames(result)).toEqual(["Spends 40", "Lowest Stage"])
  })

  it("pays a cost that lands partway into the cast by the skill actually released, not the named one", () => {
    const spend = spender(40, 80)
    const observer = stage("Observer", { castFrames: 6 })
    const low = stage("Low Stage", { castFrames: 120 })
    const high = stage("High Stage", {
      castFrames: 120,
      meterCosts: [{ meterId: METER_ID, amount: 30, atFrame: 50 }],
      releaseGates: [
        { atFrame: 5, requires: [enduranceRequires("gt", 60)], fallbackSkillId: low.id },
      ],
    })
    const result = simulateTimeline(
      inputsFor([spend, low, high, observer], [spend, high, observer]),
    )
    const level = result.casts?.[2]?.meterLevels?.find((entry) => entry.id === METER_ID)
    // 80 - 40 = 40 stays below 60, so Low Stage is released and the named
    // skill's 30 never leaves the meter: 40 plus a full second of regeneration
    // once the 72 f pause is over (40 + 10 * (80 + 120 - 72) / 60).
    expect(level?.amount).toBeCloseTo(40 + (10 * (80 + 120 - 72)) / 60, 2)
  })

  it("survives a stored skill round trip and rejects a malformed gate", () => {
    const gated = stage("Gated", {
      releaseGates: [
        {
          atFrame: 19.32,
          requires: [{ anyOf: [{ param: "someParam", minTier: 4 }, enduranceRequires("gt", 25)] }],
          fallbackSkillId: "some-other-skill",
        },
      ],
    })
    const stored = JSON.parse(JSON.stringify(gated)) as Skill
    expect(isSkill(stored)).toBe(true)
    expect(stored.releaseGates).toEqual(gated.releaseGates)
    expect(
      isSkill({ ...stored, releaseGates: [{ atFrame: 1, requires: [], fallbackSkillId: "x" }] }),
    ).toBe(false)
    expect(
      isSkill({
        ...stored,
        releaseGates: [{ atFrame: 1, requires: gated.releaseGates![0].requires }],
      }),
    ).toBe(false)
  })
})
