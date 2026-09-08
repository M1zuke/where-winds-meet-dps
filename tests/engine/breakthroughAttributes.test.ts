// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  BREAKTHROUGH_TIERS,
  breakthroughAttributes,
  getBreakthrough,
} from "../../src/definitions/baseStats/breakthroughs"
import {
  averageEnhancementBonus,
  DEFAULT_ENHANCEMENTS,
  DEFAULT_ODDITIES,
  effectiveMaxHp,
  enhancementHpTotal,
  getConfiguredBase,
  oddityHpTotal,
  playerAttributes,
  TALENT_POINT_GROUPS,
  totalMaxHp,
  totalPhysDef,
} from "../../src/definitions/baseStats"
import {
  BODY_PER_POINT,
  DEFENSE_PER_POINT,
} from "../../src/definitions/baseStats/attributeConversion"
import { TALENT_POINTS, TALENT_POINT_TIERS } from "../../src/data/baseStats"
import { arsenalHp } from "../../src/engine/panel"
import { gearHpTotal } from "../../src/engine/gearStats"
import { APP_PLAYER_LEVEL } from "../../src/engine/buffs/levelAttributeBonus"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { DisabledTalentPoints, GearPiece, Inputs } from "../../src/engine/types"
import baseStatsByLevel from "../../src/data/baseStats/baseStats.json"

function talentStatTotal(stat: "maxHp" | "physDef"): number {
  return TALENT_POINT_TIERS.flatMap((tier) => TALENT_POINTS[tier]).reduce(
    (total, point) => total + (point.effects[stat] ?? 0),
    0,
  )
}

function disableTalentGroup(stat: "maxHp" | "physDef"): DisabledTalentPoints {
  const group = TALENT_POINT_GROUPS.find((candidate) => candidate.stats[0] === stat)!
  const out: DisabledTalentPoints = {}
  for (const member of group.members) out[member.tier] = [...(out[member.tier] ?? []), member.id]
  return out
}

const SELECTABLE = BREAKTHROUGH_TIERS.map((tier) => tier.breakthrough)

function attributeValue(breakthrough: number, stat: string): number {
  return breakthroughAttributes(breakthrough).find((entry) => entry.stat === stat)?.value ?? 0
}

function atBreakthrough(breakthrough: number): Inputs {
  return { ...defaultInputs, breakthrough }
}

describe("breakthrough drives the player's base attributes", () => {
  it("reads a different attribute row for every measured tier", () => {
    const rows = [14, 15, 16, 17].map((breakthrough) => playerAttributes(breakthrough).power)
    expect(new Set(rows).size).toBe(rows.length)
  })

  it("moves the derived base when only the breakthrough changes", () => {
    const lower = getConfiguredBase(atBreakthrough(14), [])
    const higher = getConfiguredBase(atBreakthrough(17), [])
    expect(higher["phys.min"]).toBeGreaterThan(lower["phys.min"])
    expect(higher["phys.max"]).toBeGreaterThan(lower["phys.max"])
    expect(higher.precision).toBeGreaterThan(lower.precision)
    expect(higher.critRate).toBeGreaterThan(lower.critRate)
    expect(higher.affinityRate).toBeGreaterThan(lower.affinityRate)
  })

  it("carries the change through to a full set of engine inputs", () => {
    const lower = withDerivedStats(atBreakthrough(14))
    const higher = withDerivedStats(atBreakthrough(17))
    expect(higher.phys.min).toBeGreaterThan(lower.phys.min)
    expect(higher.precision).toBeGreaterThan(lower.precision)
  })

  it("shifts each attribute by exactly the difference between the two tiers' rows", () => {
    for (const stat of ["power", "agility", "momentum", "body", "defense"] as const) {
      const rowDelta = attributeValue(17, stat) - attributeValue(15, stat)
      const derivedDelta = playerAttributes(17)[stat] - playerAttributes(15)[stat]
      expect(derivedDelta).toBeCloseTo(rowDelta, 10)
    }
  })

  it("adds gear attributes on top of the tier's row rather than replacing it", () => {
    expect(playerAttributes(16).power).toBeGreaterThan(attributeValue(16, "power"))
  })

  it("grants Constitution and Defense the same amount the tier grants Power", () => {
    for (const breakthrough of SELECTABLE) {
      const power = attributeValue(breakthrough, "power")
      expect(attributeValue(breakthrough, "body")).toBe(power)
      expect(attributeValue(breakthrough, "defense")).toBe(power)
    }
  })
})

describe("Max HP", () => {
  it("grows when Constitution or Defense grows with the breakthrough", () => {
    const lower = totalMaxHp(15, [])
    const higher = totalMaxHp(17, [])
    expect(higher).toBeGreaterThan(lower)
  })

  it("sums the base level's HP, the Arsenal's HP, Constitution/Defense converted at their documented rates, and the enhancement layer, without the average-level percentage", () => {
    const attrs = playerAttributes(17)
    const baseHp = (baseStatsByLevel as Record<string, Record<string, number>>)[
      String(APP_PLAYER_LEVEL)
    ]!.HP_MAX
    const bonus = averageEnhancementBonus(DEFAULT_ENHANCEMENTS)
    const expected =
      baseHp +
      talentStatTotal("maxHp") +
      arsenalHp(17) +
      attrs.body * BODY_PER_POINT.hp +
      attrs.defense * DEFENSE_PER_POINT.hp +
      enhancementHpTotal(DEFAULT_ENHANCEMENTS) +
      bonus.maxHp +
      oddityHpTotal(DEFAULT_ODDITIES)
    expect(totalMaxHp(17, [])).toBeCloseTo(expected, 9)
  })

  it("applies the average-level percentage only to the effective figure, leaving the raw total alone", () => {
    const bonus = averageEnhancementBonus(DEFAULT_ENHANCEMENTS)
    expect(bonus.percent).toBeGreaterThan(0)
    expect(effectiveMaxHp(17, [])).toBeCloseTo(totalMaxHp(17, []) * (1 + bonus.percent), 9)
  })

  it("adds the equipped armor's own HP on top of the unequipped total", () => {
    const helm: GearPiece = {
      id: "max-hp-test-helm",
      slot: "helm",
      level: 96,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    const delta = totalMaxHp(17, [helm]) - totalMaxHp(17, [])
    expect(delta).toBeCloseTo(gearHpTotal([helm]), 9)
    expect(delta).toBeGreaterThan(0)
  })
})

describe("the character-level row's Physical Defense column", () => {
  it("carries W_DEF 128 at the pinned level", () => {
    const row = (baseStatsByLevel as Record<string, Record<string, number>>)[
      String(APP_PLAYER_LEVEL)
    ]!
    expect(row.W_DEF).toBe(128)
  })

  it("reaches totalPhysDef, moving it by exactly the row's own value", () => {
    const zeroEnhancements = Object.fromEntries(
      Object.keys(DEFAULT_ENHANCEMENTS).map((slot) => [slot, 0]),
    ) as typeof DEFAULT_ENHANCEMENTS
    const disabledPhysDef = disableTalentGroup("physDef")
    const withoutOddities = totalPhysDef(17, [], disabledPhysDef, zeroEnhancements, {})
    const row = (baseStatsByLevel as Record<string, Record<string, number>>)[
      String(APP_PLAYER_LEVEL)
    ]!
    const attrs = playerAttributes(17, disabledPhysDef)
    expect(withoutOddities - attrs.defense * DEFENSE_PER_POINT.physDef).toBeCloseTo(row.W_DEF, 9)
  })
})

describe("the talent board's Max HP and Physical Defense grants", () => {
  it("add +7000 Max HP at breakthrough 17, reachable through totalMaxHp", () => {
    const delta = totalMaxHp(17, []) - totalMaxHp(17, [], disableTalentGroup("maxHp"))
    expect(delta).toBeCloseTo(7000, 9)
  })

  it("add +92.4 Physical Defense at breakthrough 17, reachable through totalPhysDef", () => {
    const delta = totalPhysDef(17, []) - totalPhysDef(17, [], disableTalentGroup("physDef"))
    expect(delta).toBeCloseTo(92.4, 9)
  })

  it("bring Body and Defense to 169 at breakthrough 17 with every point taken", () => {
    const attrs = playerAttributes(17)
    expect(attrs.body).toBe(169)
    expect(attrs.defense).toBe(169)
  })
})

describe("tiers with no measured attribute row", () => {
  it("resolves every selectable tier without throwing", () => {
    for (const breakthrough of SELECTABLE) {
      expect(() => getBreakthrough(breakthrough)).not.toThrow()
      expect(breakthroughAttributes(breakthrough).length).toBeGreaterThan(0)
    }
  })

  it("clamps a tier below the measured range up to the lowest measured tier", () => {
    for (const breakthrough of [12, 13]) {
      expect(breakthroughAttributes(breakthrough)).toEqual(breakthroughAttributes(14))
    }
  })

  it("reports every tier from 18 up from its own row, not the highest measured one below it", () => {
    for (const breakthrough of [18, 19, 20, 21]) {
      expect(breakthroughAttributes(breakthrough)).not.toEqual(breakthroughAttributes(17))
      expect(breakthroughAttributes(breakthrough)).toHaveLength(6)
    }
  })

  it("never reports weaker attributes for a higher breakthrough", () => {
    for (const [index, breakthrough] of SELECTABLE.slice(1).entries()) {
      const previous = playerAttributes(SELECTABLE[index])
      const current = playerAttributes(breakthrough)
      expect(current.power).toBeGreaterThanOrEqual(previous.power)
      expect(current.agility).toBeGreaterThanOrEqual(previous.agility)
      expect(current.momentum).toBeGreaterThanOrEqual(previous.momentum)
    }
  })
})

describe("the merged tier table", () => {
  it("keeps the target-side columns for every selectable tier", () => {
    for (const tier of BREAKTHROUGH_TIERS) {
      expect(tier.defense).toBeGreaterThan(0)
      expect(typeof tier.resistance).toBe("number")
      expect(typeof tier.levelRange).toBe("string")
      expect(tier.name).not.toBe("")
    }
  })

  it("is sorted ascending, which the clamp relies on for its bounds", () => {
    expect(SELECTABLE).toEqual([...SELECTABLE].sort((left, right) => left - right))
  })

  it("still resolves breakthrough 16 to the row the anchor profiles were recorded against", () => {
    // The tier-16 row the pre-coupling engine hardcoded; every validated anchor
    // profile sits at breakthrough 16.
    expect(attributeValue(16, "power")).toBe(138)
    expect(attributeValue(16, "agility")).toBe(138)
    expect(attributeValue(16, "momentum")).toBe(138)
    expect(attributeValue(16, "precisionRate")).toBe(0.153)
  })
})
