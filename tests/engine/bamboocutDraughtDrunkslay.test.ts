import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { DEBUFF, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"
const ECHO_ROW = "Drunkslay State"

const grantDeepdaze = makeSkill(CLASS, {
  name: "Test Deepdaze Granter",
  castFrames: 12,
  hits: [
    makeHit({
      frame: 0,
      triggers: [makeTrigger({ kind: "applyBuff", targetId: STATUS.inebriateDeepdaze, stacks: 1 })],
    }),
  ],
})

const marker = makeSkill(CLASS, {
  name: "Test Marker",
  castFrames: 60,
  hits: [
    makeHit({
      frame: 0,
      triggers: [
        makeTrigger({ kind: "releaseEcho", targetId: DEBUFF.drunkslay }),
        makeTrigger({ kind: "applyDebuff", targetId: DEBUFF.drunkslay, stacks: 1 }),
      ],
    }),
  ],
})

const refresher = makeSkill(CLASS, {
  name: "Test Refresher",
  castFrames: 60,
  hits: [
    makeHit({
      frame: 0,
      triggers: [makeTrigger({ kind: "applyDebuff", targetId: DEBUFF.drunkslay, stacks: 1 })],
    }),
  ],
})

const feeder = makeSkill(CLASS, {
  name: "Test Feeder",
  castFrames: 60,
  receives: [BUFF.drunkslayEcho],
  hits: [makeHit({ frame: 0, physMultiplier: 1 })],
})

const idle = makeSkill(CLASS, {
  name: "Test Idle",
  castFrames: 1300,
  hits: [makeHit({ frame: 0 })],
})

const skyspeakAt = (tier: number): Inputs["mindMethods"] => [
  { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: String(tier) },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function run(sequence: Skill[], mindMethods: Inputs["mindMethods"] = skyspeakAt(6)) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    customSkills: [grantDeepdaze, marker, refresher, feeder, idle],
    activeCustomRotation: makeRotation(CLASS, {
      steps: sequence.map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
    }),
    set: null,
  })
}

const rowNamed = (result: ReturnType<typeof runEngine>, name: string) =>
  result.perSkill.find((row) => row.name === name)

describe("the Drunkslay echo", () => {
  it("banks a fifth of the marked target's Inebriate-enhanced damage and deals it when the marking skill hits again", () => {
    const result = run([grantDeepdaze, marker, feeder, feeder, marker])
    const echoRow = rowNamed(result, ECHO_ROW)!
    const fed = rowNamed(result, feeder.name)!
    expect(echoRow.count).toBe(1)
    expect(echoRow.type).toBe("mindMethod")
    expect(echoRow.expectedDamage).toBeCloseTo(0.2 * fed.expectedDamage, 6)
    expect(result.totalDamage).toBeCloseTo(fed.expectedDamage + echoRow.expectedDamage, 6)
  })

  it("deals the banked pot when the mark lapses without being re-hit", () => {
    const result = run([grantDeepdaze, marker, feeder, idle])
    const echoRow = rowNamed(result, ECHO_ROW)!
    const fed = rowNamed(result, feeder.name)!
    expect(echoRow.count).toBe(1)
    expect(echoRow.expectedDamage).toBeCloseTo(0.2 * fed.expectedDamage, 6)
    expect(result.timeline!.find((event) => event.skillName === ECHO_ROW)!.frame).toBe(12 + 1200)
  })

  it("keeps banking through a re-application that carries no release", () => {
    const result = run([grantDeepdaze, marker, feeder, refresher, feeder, marker])
    const echoRow = rowNamed(result, ECHO_ROW)!
    const fed = rowNamed(result, feeder.name)!
    expect(fed.count).toBe(2)
    expect(echoRow.count).toBe(1)
    expect(echoRow.expectedDamage).toBeCloseTo(0.2 * fed.expectedDamage, 6)
  })

  it("holds an unreleased pot past the end of the rotation instead of dealing it", () => {
    const result = run([grantDeepdaze, marker, feeder])
    expect(rowNamed(result, ECHO_ROW)).toBeUndefined()
  })

  it("banks from any source of the mark, whatever the inner ways are", () => {
    for (const mindMethods of [skyspeakAt(5), defaultInputs.mindMethods]) {
      const result = run([grantDeepdaze, marker, feeder, marker], mindMethods)
      const echoRow = rowNamed(result, ECHO_ROW)!
      const fed = rowNamed(result, feeder.name)!
      expect(echoRow.count).toBe(1)
      expect(echoRow.expectedDamage).toBeCloseTo(0.2 * fed.expectedDamage, 6)
    }
  })

  it("feeds nothing from a hit landing outside the mark", () => {
    const result = run([grantDeepdaze, feeder, marker, feeder, marker])
    const echoRow = rowNamed(result, ECHO_ROW)!
    const fed = rowNamed(result, feeder.name)!
    expect(echoRow.expectedDamage).toBeCloseTo(0.1 * fed.expectedDamage, 6)
  })
})
