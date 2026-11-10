import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { DEBUFF, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"

const CLASS = "bamboocutDraught"

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

const markWildstrideStrayhunt = makeSkill(CLASS, {
  name: "Test Wildstride+Strayhunt",
  castFrames: 12,
  hits: [
    makeHit({
      frame: 0,
      triggers: [
        makeTrigger({ kind: "applyDebuff", targetId: DEBUFF.wildstride, stacks: 1 }),
        makeTrigger({ kind: "applyDebuff", targetId: DEBUFF.strayhunt, stacks: 1 }),
      ],
    }),
  ],
})

const feederWithQi = (name: string, qiFlat: number) =>
  makeSkill(CLASS, {
    name,
    castFrames: 60,
    receives: [BUFF.drunkslayEcho],
    hits: [makeHit({ frame: 0, physMultiplier: 1, qiFlat })],
  })

const poke = makeSkill(CLASS, {
  name: "Test Poke",
  castFrames: 10,
  hits: [makeHit({ frame: 0, physMultiplier: 1 })],
})

function run(sequence: Skill[]) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "6" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
    customSkills: [grantDeepdaze, marker, markWildstrideStrayhunt, poke, ...sequence],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [grantDeepdaze, marker, ...sequence, markWildstrideStrayhunt, marker, poke].map(
        (skill) => makeStep({ skillId: skill.id }),
      ),
    }),
    divinecraft: null,
  })
}

const releaseEntries = (result: ReturnType<typeof runEngine>) =>
  result.qiDamageLog!.filter((entry) => entry.kind === "dot")

describe("the Drunkslay Qi echo", () => {
  it("banks 12% of the Qi damage of every fed hit and lands it on the release with the release adjustment", () => {
    const first = feederWithQi("Test Qi Feeder A", 20)
    const second = feederWithQi("Test Qi Feeder B", 30)
    const result = run([first, second])
    const fedLog = result.qiDamageLog!.filter((entry) => entry.kind === "direct")
    const fedEntries = fedLog.filter((entry) => entry.qi > 20)
    expect(fedEntries.length).toBe(2)
    const [release] = releaseEntries(result)
    const banked = 0.12 * (fedEntries[0].qi + fedEntries[1].qi)
    expect(release.qi).toBeCloseTo(banked * 1.2, 6)
  })

  it("caps each banked share at the Qi the target still holds before the hit", () => {
    const drain = feederWithQi("Test Qi Drain", 790)
    const topUp = feederWithQi("Test Qi Top-up", 790)
    const result = run([drain, topUp])
    const fedEntries = result.qiDamageLog!.filter(
      (entry) => entry.kind === "direct" && entry.qi > 700,
    )
    expect(fedEntries.length).toBe(2)
    const remainingBeforeSecond = 800 - fedEntries[0].qi
    const banked =
      0.12 * fedEntries[0].qi + Math.min(0.12 * fedEntries[1].qi, remainingBeforeSecond)
    const [release] = releaseEntries(result)
    expect(0.12 * fedEntries[1].qi).toBeGreaterThan(remainingBeforeSecond)
    expect(release.qi).toBeCloseTo(banked * 1.2, 6)
  })
})
