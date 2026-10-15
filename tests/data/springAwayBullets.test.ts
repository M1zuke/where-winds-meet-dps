// Scoped to Silkbind Jade's Spring Away data shape; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { umblightcharge } from "../../src/data/skills/silkbind-jade/umblightcharge"
import { umblightcharge12 } from "../../src/data/skills/silkbind-jade/umblightcharge-12"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import type { Skill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { testRotation } from "../builtins"

const BULLET_PROJECTILE = {
  speedMetersPerSecond: 80,
  acceleration: { initialSpeedMetersPerSecond: 10, metersPerSecondSquared: 700 },
  collisionDelayFrames: 2.4,
  maxTravelFrames: 300,
}

const BULLET_ROW = {
  physMultiplier: 0.286244,
  attributeMultiplier: 0.429367,
  physFixed: 79.16,
  attributeFixed: 43.16,
  extraCritDamage: 1,
}

const BULLET_LAUNCH_FRAMES = [47.4, 57, 66.6, 77.4, 87, 96.6, 107.4, 117, 126.6, 137.4, 147, 156.6]

describe.each([
  ["the 6-bullet cast", umblightcharge, 6, 132.05, 0.87],
  ["the 12-bullet cast", umblightcharge12, 12, 192.05, 1.87],
])("%s", (_name, skill, bulletCount, castFrames, hoverSeconds) => {
  it("launches its bullets on the hover cues and ends 35.45 f after the last cue", () => {
    const launchFrames = skill.hits.map((hit) => hit.frame)
    launchFrames.forEach((frame, index) =>
      expect(frame).toBeCloseTo(BULLET_LAUNCH_FRAMES[index], 9),
    )
    expect(launchFrames).toHaveLength(bulletCount)
    expect(skill.castFrames).toBeCloseTo(launchFrames.at(-1)! + 35.45, 9)
    expect(skill.castFrames).toBe(castFrames)
  })

  it("flies every bullet as the accelerating projectile, 10 m/s to an 80 m/s cap", () => {
    for (const bullet of skill.hits) expect(bullet.projectile).toEqual(BULLET_PROJECTILE)
  })

  it("carries the same per-bullet row and non-player factor", () => {
    for (const bullet of skill.hits) expect(bullet).toMatchObject(BULLET_ROW)
    expect(skill.receives).toContain(BUFF.nonPlayerBaseDamage125)
  })

  it("casts the lift on its first bullet, and on no other", () => {
    const liftCasters = skill.hits.filter((hit) =>
      hit.triggers.some((trigger) => trigger.targetId === SKILL.umblightchargeLift),
    )
    expect(liftCasters.map((hit) => hit.id)).toEqual(["hit-0"])
  })

  it("drains Endurance 10 per second over the hover from frame 44.4 to its last cue", () => {
    expect(skill.meterDrains).toEqual([
      { meterId: enduranceMeter.id, perSecond: 10, fromFrame: 44.4, stopAfterSec: hoverSeconds },
    ])
  })
})

describe("Spring Away's Blossom gain", () => {
  const gain = (id: string) => blossomResource.gains.find((rule) => rule.id === id)!

  it("is 3.4 per bullet for each variant, divided across its hits", () => {
    expect(gain("chargedHit")).toMatchObject({
      defaultAmount: 3.4 * 6,
      skillIds: [SKILL.umblightcharge],
      divideAcrossSkillHits: true,
    })
    expect(gain("chargedHit12")).toMatchObject({
      defaultAmount: 3.4 * 12,
      skillIds: [SKILL.umblightcharge12],
      divideAcrossSkillHits: true,
    })
  })
})

describe("Spring Away in a simulated rotation", () => {
  function bulletFrames(skill: Skill, preferredDistanceMeters: number): number[] {
    const rotation = testRotation("silkbindJade", {
      steps: [makeStep({ skillId: skill.id })],
      preferredDistanceMeters,
    })
    const result = simulateTimeline({
      ...defaultInputs,
      classId: "silkbindJade",
      activeCustomRotation: rotation,
    })
    return (result.timeline ?? [])
      .filter((event) => event.kind === "hit" && event.skillName === skill.name)
      .map((event) => event.frame)
  }

  it("spaces bullets k and k + 3 exactly 30 frames apart", () => {
    const frames = bulletFrames(umblightcharge12, 3)
    expect(frames).toHaveLength(12)
    for (let index = 0; index + 3 < frames.length; index++)
      expect(frames[index + 3] - frames[index]).toBe(30)
  })

  it("lands every bullet later when the target stands farther away", () => {
    const near = bulletFrames(umblightcharge, 3)
    const far = bulletFrames(umblightcharge, 20)
    near.forEach((frame, index) => expect(far[index]).toBeGreaterThan(frame))
  })
})
