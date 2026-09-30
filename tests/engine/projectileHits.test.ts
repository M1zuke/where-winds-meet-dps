import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, resolvedHitFrame } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const SPEED_METERS_PER_SECOND = 10
const MAX_TRAVEL_FRAMES = 300

function landingFrameAt(preferredDistanceMeters: number): number {
  const skill = makeSkill(CLASS, {
    name: "Projectile Test",
    castFrames: 400,
    approach: "approach",
    reachMeters: 100,
    hits: [
      makeHit({
        frame: 20,
        physMultiplier: 1,
        physFixed: 10,
        projectile: {
          speedMetersPerSecond: SPEED_METERS_PER_SECOND,
          maxTravelFrames: MAX_TRAVEL_FRAMES,
        },
      }),
    ],
  })
  const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [skill],
    activeCustomRotation: rotation,
    combatSettings: { ...defaultCombatSettings(), preferredDistanceMeters },
  }
  const result = simulateTimeline(inputs)
  const hitEvent = (result.timeline ?? []).find(
    (event) => event.kind === "hit" && event.skillName === "Projectile Test",
  )!
  return hitEvent.frame
}

describe("resolvedHitFrame — a projectile hit", () => {
  it("lands at its own base frame when no distance is supplied", () => {
    const hit = makeHit({
      frame: 20,
      projectile: { speedMetersPerSecond: SPEED_METERS_PER_SECOND, maxTravelFrames: 300 },
    })
    expect(resolvedHitFrame(hit, () => true)).toBe(20)
  })

  it("adds the travel time in frames for the live target distance", () => {
    const hit = makeHit({
      frame: 20,
      projectile: { speedMetersPerSecond: SPEED_METERS_PER_SECOND, maxTravelFrames: 300 },
    })
    // 30 m at 10 m/s is 3 s, 180 frames at the nominal 60 fps grid.
    expect(resolvedHitFrame(hit, () => true, 30)).toBe(200)
  })

  it("caps the travel time at its own maximum, however far the target is", () => {
    const hit = makeHit({
      frame: 20,
      projectile: { speedMetersPerSecond: SPEED_METERS_PER_SECOND, maxTravelFrames: 300 },
    })
    expect(resolvedHitFrame(hit, () => true, 1000)).toBe(320)
  })

  it("leaves an ordinary hit's frame alone regardless of distance", () => {
    const hit = makeHit({ frame: 42 })
    expect(resolvedHitFrame(hit, () => true, 30)).toBe(42)
  })
})

describe("a projectile hit inside the full timeline", () => {
  it("lands later against a farther target, at the base frame plus its travel time", () => {
    expect(landingFrameAt(10)).toBe(20 + (10 / SPEED_METERS_PER_SECOND) * 60)
    expect(landingFrameAt(30)).toBe(20 + (30 / SPEED_METERS_PER_SECOND) * 60)
  })

  it("caps the landing frame at the launch frame plus its own maximum travel time", () => {
    expect(landingFrameAt(90)).toBe(20 + MAX_TRAVEL_FRAMES)
  })
})
