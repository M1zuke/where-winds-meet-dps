import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { projectileTravelFrames } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "../../src/data/skills/bellstrike-splendor/vagrantSwordBolts"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"
const FPS = 60
const PREPULL_NAME = "SwordHeavyCharged[Prepull]"
const WAVE_OFFSETS_FROM_RELEASE = [6, 16, 45]

const swordMorph: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function runPrepullThenShadowStep() {
  const rotation = makeRotation(CLASS, {
    steps: [
      makeStep({ skillId: SKILL.swordHeavyChargedPrepull }),
      makeStep({ skillId: SKILL.swordq }),
    ],
  })
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: swordMorph,
    activeCustomRotation: rotation,
    set: null,
  })
}

describe("the pre-pull Vagrant Sword lands its waves after the release, in flight", () => {
  const result = runPrepullThenShadowStep()
  const prepullCast = result.casts!.find((cast) => cast.skillName === PREPULL_NAME)!
  const prepullEvents = result.timeline!.filter((event) => event.skillName === PREPULL_NAME)
  const releaseFrame = Math.round(prepullCast.timeSec * FPS)
  const flightFrames = projectileTravelFrames(
    VAGRANT_SWORD_WAVE_PROJECTILE,
    prepullCast.distanceMeters,
  )

  it("lands the three waves 6, 16 and 45 f after the release plus each wave's flight", () => {
    const waveFrames = prepullEvents.filter((event) => event.damage > 0).map((event) => event.frame)
    expect(waveFrames).toEqual(
      WAVE_OFFSETS_FROM_RELEASE.map((offset) => Math.round(releaseFrame + offset + flightFrames)),
    )
  })

  it("opens the fight window at the first wave's landing, not at the release", () => {
    const firstWave = prepullEvents.find((event) => event.damage > 0)!
    expect(result.fightStartSec).toBeCloseTo(firstWave.frame / FPS, 6)
    expect(firstWave.frame).toBeGreaterThan(releaseFrame)
  })

  it("counts nothing before the first wave: the release event deals no damage and the breakdown holds three hits", () => {
    const releaseEvent = prepullEvents.find((event) => event.frame === releaseFrame)!
    expect(releaseEvent.damage).toBe(0)
    expect(releaseEvent.inWindow).toBe(false)
    expect(result.perSkill.find((row) => row.name === PREPULL_NAME)?.count).toBe(3)
  })
})
