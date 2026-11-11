import { describe, expect, it } from "vitest"
import { getDefaultTalentsForClass } from "../../src/definitions/baseStats"
import { artAttackStageAt } from "../../src/data/baseStats/artAttackStages"
import {
  ADDITIONAL_ATTACK_RANKS,
  additionalAttackRankAt,
} from "../../src/data/skills/buffs/additionalAttackRanks"

const AFFINITY_PER_POINT = 0.000152
const CRITICAL_PER_POINT = 0.000304
const PHYSICAL_PER_POINT = 0.264

const STAGES = [
  { breakthrough: 22, attributeCap: 432, stage: { min: 143, max: 286 } },
  { breakthrough: 23, attributeCap: 462, stage: { min: 153, max: 306 } },
]

describe.each([
  [
    "bellstrikeUmbra",
    "Affinity Rate UP",
    AFFINITY_PER_POINT,
    "Bellstrike Penetration Scale",
    0.0336,
  ],
  [
    "bellstrikeSplendor",
    "Affinity Rate UP",
    AFFINITY_PER_POINT,
    "Bellstrike Penetration Scale",
    0.0336,
  ],
  [
    "stonesplitStrength",
    "Critical Rate UP",
    CRITICAL_PER_POINT,
    "Stonesplit Penetration Scale",
    0.0672,
  ],
  ["silkbindJade", "Critical Rate UP", CRITICAL_PER_POINT, "Silkbind Penetration Scale", 0.0672],
  [
    "bamboocutDraught",
    "Critical Rate UP",
    CRITICAL_PER_POINT,
    "Bamboocut Penetration Scale",
    0.0672,
  ],
])(
  "%s talent ladders at breakthrough 22 and 23",
  (classId, rateName, ratePerPoint, penName, penPerPoint) => {
    it.each(STAGES)(
      "raise the attribute cap to $attributeCap and flatten penetration at 30 and attribute scale at 0.15 at $breakthrough",
      ({ breakthrough, attributeCap }) => {
        const byName = Object.fromEntries(
          getDefaultTalentsForClass(classId, breakthrough).map((talent) => [talent.name, talent]),
        )
        expect(byName[rateName].maxBonus).toBeCloseTo(attributeCap * ratePerPoint, 6)
        expect(byName[rateName].scaleMax).toBe(attributeCap)
        expect(byName["Physical Attack UP"].maxBonus).toBeCloseTo(
          attributeCap * PHYSICAL_PER_POINT,
          6,
        )
        expect(byName["Physical Attack UP"].scaleMax).toBe(attributeCap)
        expect(byName[penName].maxBonus).toBeCloseTo(0.3, 6)
        expect(byName[penName].scaleMax).toBeCloseTo(30 / penPerPoint, 6)
        expect(byName["Attribute Damage Scale"].maxBonus).toBeCloseTo(0.15, 6)
        expect(byName["Attribute Damage Scale"].scaleMax).toBeCloseTo(30 / penPerPoint, 6)
      },
    )
  },
)

describe("art attack and additional attack ladders at breakthrough 22 and 23", () => {
  it.each(STAGES)("give every class the $breakthrough stage attack", ({ breakthrough, stage }) => {
    expect(artAttackStageAt(breakthrough)).toEqual(stage)
    for (const classId of ["bellstrikeUmbra", "bamboocutDraught"]) {
      const byName = Object.fromEntries(
        getDefaultTalentsForClass(classId, breakthrough).map((talent) => [talent.name, talent]),
      )
      for (const talent of Object.values(byName))
        if (talent.name.endsWith("Attack Min")) expect(talent.maxBonus).toBe(stage.min)
        else if (talent.name.endsWith("Attack Max")) expect(talent.maxBonus).toBe(stage.max)
    }
  })

  it("continues the additional attack ladder for every art, not Bamboocut Draught alone", () => {
    expect(additionalAttackRankAt(ADDITIONAL_ATTACK_RANKS, 22)).toEqual({
      breakthrough: 22,
      flatBonus: 0.4,
      coefficientBonus: 0.04,
    })
    expect(additionalAttackRankAt(ADDITIONAL_ATTACK_RANKS, 23)).toEqual({
      breakthrough: 23,
      flatBonus: 0.5,
      coefficientBonus: 0.05,
    })
  })
})
