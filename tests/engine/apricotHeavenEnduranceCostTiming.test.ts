import { describe, expect, it } from "vitest"
import { apricotHeavenNormal } from "../../src/data/skills/silkbind-jade/apricot-heaven-normal"
import { apricotHeavenEnhanced } from "../../src/data/skills/silkbind-jade/apricot-heaven-enhanced"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"

describe("Apricot Heaven — second Endurance cost timing", () => {
  for (const [name, skill] of [
    ["normal fall", apricotHeavenNormal],
    ["enhanced fall", apricotHeavenEnhanced],
  ] as const) {
    it(`${name}: the second -5 Endurance sits on a zero-damage marker at 1.6 s (96 f)`, () => {
      const costHit = skill.hits.find((candidate) =>
        candidate.triggers.some(
          (trigger) => trigger.kind === "meterDelta" && trigger.targetId === enduranceMeter.id,
        ),
      )
      expect(costHit).toBeDefined()
      expect(costHit!.frame).toBe(96)
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
