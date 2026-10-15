import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { projectileTravelFrames } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import {
  DAUNTING_STRIKE_PROJECTILE,
  SHADOW_STEP_PROJECTILE,
} from "../../src/data/skills/bellstrike-splendor/flyingSwordProjectiles"
import { VAGRANT_SWORD_WAVE_PROJECTILE } from "../../src/data/skills/bellstrike-splendor/vagrantSwordBolts"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"
const FPS = 60

const swordMorph: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function run(skillIds: string[]) {
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: swordMorph,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
    set: null,
  })
}

const landingFrames = (result: ReturnType<typeof run>, skillName: string) =>
  result
    .timeline!.filter((event) => event.skillName === skillName && event.damage > 0)
    .map((event) => event.frame)

describe("Energy Surge's waves fly after the press", () => {
  const result = run([SKILL.energySurge])
  const press = result.casts![0]!
  const flight = projectileTravelFrames(VAGRANT_SWORD_WAVE_PROJECTILE, press.distanceMeters)

  it("lands the waves 6, 16 and 45 f after the press plus each wave's flight", () => {
    expect(landingFrames(result, press.skillName)).toEqual(
      [6, 16, 45].map((offset) => Math.round(offset + flight)),
    )
  })

  it("fires the release's events at the press, ahead of the first wave", () => {
    const grant = result.buffWindows!.find(
      (window) => window.id === BUFF.swordMorphMultiWaveWindow,
    )!
    expect(Math.round(grant.startSec * FPS)).toBe(0)
  })
})

describe("Daunting Strike's flying sword lands after its flight", () => {
  const result = run([SKILL.swordq])
  const cast = result.casts![0]!

  it("lands 18 f after the cast start plus its flight", () => {
    const flight = projectileTravelFrames(DAUNTING_STRIKE_PROJECTILE, cast.distanceMeters)
    expect(landingFrames(result, cast.skillName)).toEqual([Math.round(18 + flight)])
  })
})

describe("Shadow Step's bolt lands after its flight", () => {
  const result = run([SKILL.swordSpecial])
  const cast = result.casts![0]!

  it("lands 17 f after the cast start plus its flight", () => {
    const flight = projectileTravelFrames(SHADOW_STEP_PROJECTILE, cast.distanceMeters)
    expect(landingFrames(result, cast.skillName)).toEqual([Math.round(17 + flight)])
  })

  it("opens the multi-wave window at the cast start and the Sword - Dash window at 17 f", () => {
    const frames = (id: string) =>
      result
        .buffWindows!.filter((window) => window.id === id)
        .map((window) => [Math.round(window.startSec * FPS), Math.round(window.endSec * FPS)])
    expect(frames(BUFF.swordMorphMultiWaveWindow)).toEqual([[0, 300]])
    expect(frames(BUFF.shadowStepDashWindow)).toEqual([[17, 167]])
  })
})
