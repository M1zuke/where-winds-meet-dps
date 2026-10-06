import { describe, expect, it } from "vitest"
import { freeMorph } from "../../src/data/skills/mystic/free-morph"
import { wolflikeFrenzy } from "../../src/data/skills/mystic/wolflike-frenzy"
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
