import { describe, expect, it } from "vitest"
import { freeMorph } from "../../src/data/skills/mystic/free-morph"
import { wolflikeFrenzy } from "../../src/data/skills/mystic/wolflike-frenzy"
import { flamingMeteor } from "../../src/data/skills/mystic/flaming-meteor"
import { lionsRoar } from "../../src/data/skills/mystic/lions-roar"
import { lionsRoarThrow } from "../../src/data/skills/mystic/lions-roar-throw"
import { DEBUFF } from "../../src/data/skills/mystic/ids"
import { resolvedHitFrame } from "../../src/engine/skill"
import type { Skill } from "../../src/engine/skill"

function sumOfRatios(skill: Skill, power: number): number {
  return skill.hits.reduce((total, h) => total + h.physMultiplier / power, 0)
}

const CASES: [string, Skill, number, number][] = [
  ["Free Morph", freeMorph, 7.17042, 1079.54],
  ["Wolflike Frenzy", wolflikeFrenzy, 6.80056, 1023.96],
]

describe.each(CASES)(
  "%s — coefficients sum to the documented per-cast total",
  (_name, skill, power, flat) => {
    it("phys coefficient ratios sum to 1.0", () => {
      expect(sumOfRatios(skill, power)).toBeCloseTo(1, 10)
    })

    it("phys flat terms sum to the documented total", () => {
      const total = skill.hits.reduce((sum, h) => sum + h.physFixed, 0)
      expect(total).toBeCloseTo(flat, 6)
    })

    it("attribute multiplier is 1.5x the physical multiplier on every hit", () => {
      for (const h of skill.hits)
        expect(h.attributeMultiplier).toBeCloseTo(h.physMultiplier * 1.5, 10)
    })

    it("carries no attribute flat term", () => {
      for (const h of skill.hits) expect(h.attributeFixed).toBe(0)
    })

    it("hits land in non-decreasing frame order, the last matching castFrames", () => {
      const frames = skill.hits.map((h) => h.frame)
      for (let i = 1; i < frames.length; i++)
        expect(frames[i]).toBeGreaterThanOrEqual(frames[i - 1]!)
      expect(frames.at(-1)).toBe(skill.castFrames)
    })

    it("is a stationary 8 m cast, reflecting no scripted displacement", () => {
      expect(skill.reachMeters).toBe(8)
      expect(skill.approach).toBe("stationary")
      expect(skill.displacement).toBeUndefined()
    })
  },
)

describe("Flaming Meteor", () => {
  const POWER = 11.01916
  const FLAT = 1660.42

  it("phys coefficient ratios (stomp, blade explosion, crash) sum to the documented total", () => {
    const total = flamingMeteor.hits.reduce((sum, hit) => sum + hit.physMultiplier / POWER, 0)
    expect(total).toBeCloseTo(0.25 + 0.55 + 0.385, 10)
  })

  it("phys flat terms sum to the documented total", () => {
    const total = flamingMeteor.hits.reduce((sum, hit) => sum + hit.physFixed, 0)
    expect(total).toBeCloseTo(FLAT * (0.25 + 0.55 + 0.385), 6)
  })

  it("attribute multiplier is 1.5x the physical multiplier on every hit, with no attribute flat term", () => {
    for (const hit of flamingMeteor.hits) {
      expect(hit.attributeMultiplier).toBeCloseTo(hit.physMultiplier * 1.5, 10)
      expect(hit.attributeFixed).toBe(0)
    }
  })

  it("is a stationary 40 m cast, reflecting no scripted displacement", () => {
    const skill: Skill = flamingMeteor
    expect(skill.reachMeters).toBe(40)
    expect(skill.approach).toBe("stationary")
    expect(skill.displacement).toBeUndefined()
  })

  it("the blade explosion is a projectile that lands later against a farther target", () => {
    const bladeExplosion = flamingMeteor.hits[1]!
    expect(bladeExplosion.projectile).toBeDefined()
    const near = resolvedHitFrame(bladeExplosion, () => true, 10)
    const far = resolvedHitFrame(bladeExplosion, () => true, 30)
    expect(far).toBeGreaterThan(near)
    expect(near).toBeGreaterThanOrEqual(bladeExplosion.frame)
  })

  it("the stomp and crash are ordinary, fixed-frame hits", () => {
    expect(flamingMeteor.hits[0]!.projectile).toBeUndefined()
    expect(flamingMeteor.hits[2]!.projectile).toBeUndefined()
  })
})

describe("Lion's Roar", () => {
  it("has a bell hit and 14 roar hits, in non-decreasing frame order", () => {
    expect(lionsRoar.hits).toHaveLength(15)
    const frames = lionsRoar.hits.map((hit) => hit.frame)
    for (let index = 1; index < frames.length; index++)
      expect(frames[index]).toBeGreaterThanOrEqual(frames[index - 1]!)
  })

  it("phys coefficient ratios (bell + 14 roar hits) sum to the documented total, without Toad Venom", () => {
    const POWER = 3.60865
    const total = lionsRoar.hits.reduce((sum, hit) => sum + hit.physMultiplier / POWER, 0)
    expect(total).toBeCloseTo(0.2 + 14 * 0.07, 10)
  })

  it("every roar hit doubles its ratio under a Toad Venom hit variant", () => {
    const roarHits = lionsRoar.hits.slice(1)
    expect(roarHits).toHaveLength(14)
    for (const roarHit of roarHits) {
      const withoutVenom = resolvedHitFrame(roarHit, () => false)
      expect(withoutVenom).toBe(roarHit.frame)
      const variant = roarHit.variants?.[0]
      expect(variant?.conditions).toEqual([{ buffId: DEBUFF.toadPoison, op: "gte", stacks: 1 }])
      expect(variant?.physMultiplier).toBeCloseTo(roarHit.physMultiplier * 1.5, 10)
    }
  })

  it("is a stationary 20 m cast, reflecting no approach dash", () => {
    const skill: Skill = lionsRoar
    expect(skill.reachMeters).toBe(20)
    expect(skill.approach).toBe("stationary")
    expect(skill.displacement).toBeUndefined()
  })

  it("the Throw follow-up is its own single-hit skill, cast length at its animation's own END", () => {
    expect(lionsRoarThrow.hits).toHaveLength(1)
    expect(lionsRoarThrow.castFrames).toBe(150)
    expect(lionsRoarThrow.hits[0]!.frame).toBeLessThan(lionsRoarThrow.castFrames)
  })
})
