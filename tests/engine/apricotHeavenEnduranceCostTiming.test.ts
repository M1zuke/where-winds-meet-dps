import { describe, expect, it } from "vitest"
import { apricotHeavenNormal } from "../../src/data/skills/silkbind-jade/apricot-heaven-normal"
import { apricotHeavenEnhanced } from "../../src/data/skills/silkbind-jade/apricot-heaven-enhanced"
import { apricotHeavenRise } from "../../src/data/skills/silkbind-jade/apricot-heaven-rise"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"

describe("Apricot Heaven — second Endurance cost timing", () => {
  for (const [name, skill] of [
    ["normal fall", apricotHeavenNormal],
    ["enhanced fall", apricotHeavenEnhanced],
  ] as const) {
    it(`${name}: the second -5 Endurance sits on a zero-damage marker 1.6 s after the hold decision (110.4 f)`, () => {
      const costHit = skill.hits.find((candidate) =>
        candidate.triggers.some(
          (trigger) => trigger.kind === "meterDelta" && trigger.targetId === enduranceMeter.id,
        ),
      )
      expect(costHit).toBeDefined()
      expect(costHit!.frame).toBe(110.4)
      expect(costHit!.physMultiplier).toBe(0)
      expect(costHit!.attributeMultiplier).toBe(0)
      expect(costHit!.physFixed).toBe(0)
      expect(costHit!.attributeFixed).toBe(0)
    })

    it(`${name}: no damaging hit carries the second Endurance cost`, () => {
      const damagingHitsWithCost = skill.hits.filter(
        (candidate) =>
          candidate.physMultiplier + candidate.physFixed > 0 &&
          candidate.triggers.some(
            (trigger) => trigger.kind === "meterDelta" && trigger.targetId === enduranceMeter.id,
          ),
      )
      expect(damagingHitsWithCost).toHaveLength(0)
    })
  }
})

describe("Apricot Heaven — the rise is its own trajectory hit", () => {
  it("is summoned by both casts at 54.18 f after the 14.4 f hold decision", () => {
    for (const skill of [apricotHeavenNormal, apricotHeavenEnhanced]) {
      const carrier = skill.hits[0]!
      expect(carrier.frame).toBe(68.58)
      expect(carrier.triggers.map((trigger) => trigger.targetId)).toEqual([SKILL.apricotHeavenRise])
      expect(skill.receives).not.toContain(BUFF.trajectorySkill)
    }
  })

  it("carries the trajectory talents the falls never receive", () => {
    expect(apricotHeavenRise.receives).toEqual(
      expect.arrayContaining([
        BUFF.trajectorySkill,
        BUFF.windWall,
        BUFF.combo,
        BUFF.springThunder,
        BUFF.thunderousBloom,
      ]),
    )
    expect(apricotHeavenRise.hits[0]!.extraCritDamage).toBe(1)
  })

  it("lands the falls 27.15 f after their earliest release", () => {
    expect(apricotHeavenNormal.hits[1]!.frame).toBe(113.55)
    expect(apricotHeavenEnhanced.hits[2]!.frame).toBe(203.55)
  })

  it("pays its 10 Blossoms across the rise and the fall", () => {
    expect(blossomResource.gains.find((rule) => rule.id === "apricotHeavenHit")).toMatchObject({
      defaultAmount: 10,
      skillIds: [SKILL.apricotHeavenNormal, SKILL.apricotHeavenEnhanced, SKILL.apricotHeavenRise],
      hitsPerCast: 2,
    })
  })
})
