import { describe, expect, it } from "vitest"
import {
  userTalentContributions,
  getConfiguredBase,
  getDefaultTalentsForClass,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { Inputs, MartialArtsTalent } from "../../src/engine/types"

const baseTalent: MartialArtsTalent = {
  id: "t1",
  name: "Test Talent",
  enabled: true,
  stat: "affinityRate",
  maxBonus: 0.034,
  scalesWith: "power",
  scaleMax: 225,
}

describe("user-defined martial-arts talents", () => {
  it("scales by attribute / scaleMax up to maxBonus", () => {
    const out = userTalentContributions([baseTalent], { power: 100, agility: 0, momentum: 0 })
    expect(out.affinityRate).toBeCloseTo((100 / 225) * 0.034, 5)
  })

  it("caps at maxBonus when attribute exceeds scaleMax", () => {
    const out = userTalentContributions([baseTalent], { power: 500, agility: 0, momentum: 0 })
    expect(out.affinityRate).toBeCloseTo(0.034, 6)
  })

  it("contributes nothing when disabled", () => {
    const out = userTalentContributions([{ ...baseTalent, enabled: false }], {
      power: 225,
      agility: 0,
      momentum: 0,
    })
    expect(out.affinityRate ?? 0).toBe(0)
  })

  it("maps `stat` to the same paths as the JSON-driven boosts", () => {
    const out = userTalentContributions([{ ...baseTalent, stat: "maxPhys", maxBonus: 60 }], {
      power: 225,
      agility: 0,
      momentum: 0,
    })
    expect(out["phys.max"]).toBe(60)
  })

  it("getConfiguredBase reflects talents only — JSON path no longer contributes", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      martialArtsTalents: [{ ...baseTalent, maxBonus: 0.05, scaleMax: 1 }],
    }
    const withTalent = getConfiguredBase(inputs, [])
    const without = getConfiguredBase({ ...inputs, martialArtsTalents: [] }, [])
    expect(withTalent.affinityRate - without.affinityRate).toBeCloseTo(0.05, 6)
    expect(without.affinityRate).toBeCloseTo(without.affinityRate, 6)
  })

  describe("class default seeding", () => {
    it("returns the eight bellstrikeUmbra class defaults", () => {
      const defaults = getDefaultTalentsForClass("bellstrikeUmbra")
      expect(defaults).toHaveLength(8)
      expect(defaults.map((d) => d.name).sort()).toEqual([
        "Affinity Rate UP",
        "Attribute Damage Scale",
        "Bellstrike Penetration Scale",
        "Physical Attack UP",
        "Spear Bellstrike Attack Max",
        "Spear Bellstrike Attack Min",
        "Sword Bellstrike Attack Max",
        "Sword Bellstrike Attack Min",
      ])
      expect(defaults.every((d) => d.enabled)).toBe(true)
    })

    it("returns nothing for a class without configured defaults", () => {
      expect(getDefaultTalentsForClass("bamboocutWindTwinblade")).toEqual([])
    })

    it("Bellstrike Penetration Scale scales off derived max bellstrike, not the raw input", () => {
      const build = (rawMax: number): Inputs => ({
        ...defaultInputs,
        classId: "bellstrikeUmbra",
        arsenal: "bellstrike",
        martialArtsTalents: getDefaultTalentsForClass("bellstrikeUmbra"),
        bellstrike: { ...defaultInputs.bellstrike, max: rawMax },
      })
      const low = withDerivedStats(build(0))
      const high = withDerivedStats(build(9999))
      expect(low.bellstrike.max).toBeGreaterThan(400)
      expect(low.bellstrike.max).toBeCloseTo(high.bellstrike.max, 9)
      expect(low.bellstrike.penetration).toBeGreaterThan(0)
      expect(low.bellstrike.penetration).toBeCloseTo(high.bellstrike.penetration, 9)
    })

    it("seeded defaults match the JSON's bonus + scaling", () => {
      const byName = Object.fromEntries(
        getDefaultTalentsForClass("bellstrikeUmbra").map((d) => [d.name, d]),
      )
      const phys = byName["Physical Attack UP"]
      expect(phys.stat).toBe("maxPhys")
      expect(phys.maxBonus).toBe(73.9)
      expect(phys.scalesWith).toBe("power")
      expect(phys.scaleMax).toBe(280)
      const affinity = byName["Affinity Rate UP"]
      expect(affinity.stat).toBe("affinityRate")
      expect(affinity.maxBonus).toBeCloseTo(0.043, 6)
      expect(affinity.scalesWith).toBe("power")
      expect(affinity.scaleMax).toBe(280)
      const swordMinBell = byName["Sword Bellstrike Attack Min"]
      expect(swordMinBell.stat).toBe("minBellstrike")
      expect(swordMinBell.maxBonus).toBe(98)
      expect(swordMinBell.scaleMax).toBe(0)
      const swordMaxBell = byName["Sword Bellstrike Attack Max"]
      expect(swordMaxBell.stat).toBe("maxBellstrike")
      expect(swordMaxBell.maxBonus).toBe(196)
      expect(swordMaxBell.scaleMax).toBe(0)
      const spearMinBell = byName["Spear Bellstrike Attack Min"]
      expect(spearMinBell.stat).toBe("minBellstrike")
      expect(spearMinBell.maxBonus).toBe(98)
      expect(spearMinBell.scaleMax).toBe(0)
      const spearMaxBell = byName["Spear Bellstrike Attack Max"]
      expect(spearMaxBell.stat).toBe("maxBellstrike")
      expect(spearMaxBell.maxBonus).toBe(196)
      expect(spearMaxBell.scaleMax).toBe(0)
      const bellPen = byName["Bellstrike Penetration Scale"]
      expect(bellPen.stat).toBe("bellstrikePenetration")
      expect(bellPen.maxBonus).toBeCloseTo(0.22, 6)
      expect(bellPen.scalesWith).toBe("bellstrike.max")
      expect(bellPen.scaleMax).toBe(655)
      const attrDmg = byName["Attribute Damage Scale"]
      expect(attrDmg.stat).toBe("attributeDamage")
      expect(attrDmg.maxBonus).toBeCloseTo(0.11, 6)
      expect(attrDmg.scalesWith).toBe("bellstrike.max")
      expect(attrDmg.scaleMax).toBe(655)
    })

    // Sword and Spear each grant their own independent +98/+196 Bellstrike
    // Attack talent row — a deliberate double contribution, not a duplicate.
    it("Sword + Spear flat Bellstrike Attack bonuses stack (double contribution)", () => {
      const contributions = userTalentContributions(getDefaultTalentsForClass("bellstrikeUmbra"), {
        power: 280,
        agility: 0,
        momentum: 0,
        "bellstrike.max": 655,
      })
      expect(contributions["bellstrike.min"]).toBe(196)
      expect(contributions["bellstrike.max"]).toBe(392)
    })
  })
})
