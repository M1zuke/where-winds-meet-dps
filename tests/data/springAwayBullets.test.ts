// Scoped to Silkbind Jade's Spring Away data shape; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { umblightcharge } from "../../src/data/skills/silkbind-jade/umblightcharge"
import { umblightcharge12 } from "../../src/data/skills/silkbind-jade/umblightcharge-12"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"

const BULLET_ROW = {
  physMultiplier: 0.286244,
  attributeMultiplier: 0.429367,
  physFixed: 79.16,
  attributeFixed: 43.16,
  extraCritDamage: 1,
}

const framesFrom = (first: number, count: number) =>
  Array.from({ length: count }, (_, index) => first + index * 10)

describe.each([
  ["the 6-bullet cast", umblightcharge, 6, 140, 1],
  ["the 12-bullet cast", umblightcharge12, 12, 200, 2],
])("%s", (_name, skill, bulletCount, castFrames, hoverSeconds) => {
  it("fires its bullets after the lift, one per 10 frames from frame 58", () => {
    expect(skill.hits.map((hit) => hit.frame)).toEqual(framesFrom(58, bulletCount))
    expect(skill.castFrames).toBe(castFrames)
    expect(skill.hits.at(-1)!.frame).toBeLessThan(castFrames)
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

  it("drains Endurance 10 per second over the hover from frame 44", () => {
    expect(skill.meterDrains).toEqual([
      { meterId: enduranceMeter.id, perSecond: 10, fromFrame: 44, stopAfterSec: hoverSeconds },
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
