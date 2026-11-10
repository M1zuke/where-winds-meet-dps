import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { FPS } from "../../src/engine/timeline"

const CLASS = "silkbindJade"
const EXTRA_QI = 5
const LANDING_DELAY_FRAMES = Math.round(0.1 * FPS)

const drain = (qiFlat: number) =>
  makeSkill(CLASS, {
    name: `Test Drain ${qiFlat}`,
    castFrames: 60,
    hits: [makeHit({ frame: 0, physMultiplier: 1, qiRate: 0, qiFlat })],
  })

const probe = (name: string, receives: string[], hitCount = 1, qiFlat = 0) =>
  makeSkill(CLASS, {
    name,
    castFrames: 30 * hitCount,
    receives,
    hits: Array.from({ length: hitCount }, (_, index) =>
      makeHit({ frame: index * 30, physMultiplier: 1, qiRate: 0, qiFlat }),
    ),
  })

function run(skills: Skill[], seed?: number) {
  return runEngine(
    {
      ...defaultInputs,
      classId: CLASS,
      customSkills: skills,
      activeCustomRotation: makeRotation(CLASS, {
        steps: skills.map((skill) => makeStep({ skillId: skill.id })),
      }),
    },
    seed === undefined ? undefined : { seed },
  )
}

const directEntries = (result: ReturnType<typeof runEngine>) =>
  result.qiDamageLog!.filter((entry) => entry.kind === "direct")

describe("Low Qi Follow-up's extra Qi damage on a critical hit", () => {
  it("lands 6 frames after the hit as a direct Qi hit of at most 5 while the target holds under 30% Qi", () => {
    const result = run([drain(600), probe("Test Receiver", [BUFF.lowQiFollowUp])])
    const entries = directEntries(result)
    const probeEntry = entries.find((entry) => entry.qi === 0)!
    const landed = entries.filter(
      (entry) => entry.frame === probeEntry.frame + LANDING_DELAY_FRAMES,
    )
    expect(landed).toHaveLength(1)
    expect(landed[0].qi).toBeGreaterThan(0)
    expect(landed[0].qi).toBeLessThanOrEqual(EXTRA_QI)
  })

  it("reads the Qi the hit leaves behind, not the Qi it found", () => {
    const crossing = run([drain(500), probe("Test Crossing", [BUFF.lowQiFollowUp], 1, 100)])
    const staying = run([drain(500), probe("Test Staying", [BUFF.lowQiFollowUp], 1, 0)])
    const extraOf = (result: ReturnType<typeof runEngine>) =>
      directEntries(result).filter((entry) => entry.qi > 0 && entry.qi <= EXTRA_QI)
    expect(extraOf(crossing)).toHaveLength(1)
    expect(extraOf(staying)).toHaveLength(0)
  })

  it("deals nothing for a skill that does not receive the buff", () => {
    const result = run([drain(600), probe("Test Bystander", [])])
    expect(directEntries(result).filter((entry) => entry.qi > 0 && entry.qi <= EXTRA_QI)).toEqual(
      [],
    )
  })

  it("deals exactly 5 after a rolled critical hit and nothing after any other outcome", () => {
    const hitCount = 12
    const result = run([drain(600), probe("Test Rolled", [BUFF.lowQiFollowUp], hitCount)], 11)
    const entries = directEntries(result)
    const probeFrames = entries.filter((entry) => entry.qi === 0).map((entry) => entry.frame)
    const landings = probeFrames.map((frame) =>
      entries.find((entry) => entry.frame === frame + LANDING_DELAY_FRAMES && entry.qi > 0),
    )
    const landed = landings.filter((landing) => landing !== undefined)
    expect(landed.every((landing) => landing.qi === EXTRA_QI)).toBe(true)
    expect(landed.length).toBeGreaterThan(0)
    expect(landed.length).toBeLessThan(probeFrames.length)
  })
})
