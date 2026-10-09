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
      expect(affinity.maxBonus).toBeCloseTo(0.04256, 6)
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

    it("the stage attack rows follow the breakthrough, and nothing unrelated moves", () => {
      const at17 = getDefaultTalentsForClass("bellstrikeUmbra", 17)
      const at18 = getDefaultTalentsForClass("bellstrikeUmbra", 18)
      const byName17 = Object.fromEntries(at17.map((d) => [d.name, d]))
      const byName18 = Object.fromEntries(at18.map((d) => [d.name, d]))
      expect(byName17["Sword Bellstrike Attack Min"].maxBonus).toBe(98)
      expect(byName17["Sword Bellstrike Attack Max"].maxBonus).toBe(196)
      expect(byName18["Sword Bellstrike Attack Min"].maxBonus).toBe(106)
      expect(byName18["Sword Bellstrike Attack Max"].maxBonus).toBe(212)
      expect(byName18["Spear Bellstrike Attack Min"].maxBonus).toBe(106)
      expect(byName18["Spear Bellstrike Attack Max"].maxBonus).toBe(212)
      for (const name of ["Sword Bellstrike Attack Min", "Sword Bellstrike Attack Max"]) {
        expect(byName18[name].scalesWith).toEqual(byName17[name].scalesWith)
        expect(byName18[name].scaleMax).toEqual(byName17[name].scaleMax)
      }
    })

    // In-game talent caps as of 2026-09-24: node 1 and node 3 of both arts
    // raise their Power/Max-Bellstrike-Attack threshold and cap at breakthrough
    // 18-21, on top of the stage-13 values live at 16-17.
    it("the talent caps that scale with a resource stat rise at breakthrough 18-21", () => {
      const byBreakthrough = (breakthrough: number) =>
        Object.fromEntries(
          getDefaultTalentsForClass("bellstrikeUmbra", breakthrough).map((d) => [d.name, d]),
        )
      const at17 = byBreakthrough(17)
      expect(at17["Affinity Rate UP"].maxBonus).toBeCloseTo(0.04256, 6)
      expect(at17["Affinity Rate UP"].scaleMax).toBe(280)
      expect(at17["Physical Attack UP"].maxBonus).toBe(73.9)
      expect(at17["Physical Attack UP"].scaleMax).toBe(280)
      expect(at17["Bellstrike Penetration Scale"].maxBonus).toBeCloseTo(0.22, 6)
      expect(at17["Bellstrike Penetration Scale"].scaleMax).toBe(655)
      expect(at17["Attribute Damage Scale"].maxBonus).toBeCloseTo(0.11, 6)
      expect(at17["Attribute Damage Scale"].scaleMax).toBe(655)

      const expectedByBreakthrough: Record<
        number,
        Record<string, number> & { resourceScaleMax: number; attributeScaleMax: number }
      > = {
        18: {
          affinity: 0.0456,
          phys: 79.2,
          pen: 0.236,
          attr: 0.118,
          resourceScaleMax: 300,
          attributeScaleMax: 702.4,
        },
        19: {
          affinity: 0.0494,
          phys: 85.8,
          pen: 0.252,
          attr: 0.126,
          resourceScaleMax: 325,
          attributeScaleMax: 750,
        },
        20: {
          affinity: 0.05548,
          phys: 96.36,
          pen: 0.276,
          attr: 0.138,
          resourceScaleMax: 365,
          attributeScaleMax: 821.4,
        },
        21: {
          affinity: 0.06156,
          phys: 106.92,
          pen: 0.296,
          attr: 0.148,
          resourceScaleMax: 405,
          attributeScaleMax: 881,
        },
      }
      for (const [breakthrough, expected] of Object.entries(expectedByBreakthrough)) {
        const byName = byBreakthrough(Number(breakthrough))
        expect(byName["Affinity Rate UP"].maxBonus, breakthrough).toBeCloseTo(expected.affinity, 6)
        expect(byName["Affinity Rate UP"].scaleMax, breakthrough).toBe(expected.resourceScaleMax)
        expect(byName["Physical Attack UP"].maxBonus, breakthrough).toBeCloseTo(expected.phys, 6)
        expect(byName["Physical Attack UP"].scaleMax, breakthrough).toBe(expected.resourceScaleMax)
        expect(byName["Bellstrike Penetration Scale"].maxBonus, breakthrough).toBeCloseTo(
          expected.pen,
          6,
        )
        expect(byName["Bellstrike Penetration Scale"].scaleMax, breakthrough).toBe(
          expected.attributeScaleMax,
        )
        expect(byName["Attribute Damage Scale"].maxBonus, breakthrough).toBeCloseTo(
          expected.attr,
          6,
        )
        expect(byName["Attribute Damage Scale"].scaleMax, breakthrough).toBe(
          expected.attributeScaleMax,
        )
      }
    })

    // In-game talent caps as of 2026-09-24.
    it("silkbindJade's talent caps rise at breakthrough 18-21 too", () => {
      const byBreakthrough = (breakthrough: number) =>
        Object.fromEntries(
          getDefaultTalentsForClass("silkbindJade", breakthrough).map((d) => [d.name, d]),
        )
      const at17 = byBreakthrough(17)
      expect(at17["Critical Rate UP"].maxBonus).toBeCloseTo(0.085, 6)
      expect(at17["Critical Rate UP"].scaleMax).toBe(280)
      expect(at17["Physical Attack UP"].maxBonus).toBe(73.9)
      expect(at17["Physical Attack UP"].scaleMax).toBe(280)
      expect(at17["Silkbind Penetration Scale"].maxBonus).toBeCloseTo(0.22, 6)
      expect(at17["Silkbind Penetration Scale"].scaleMax).toBe(328)
      expect(at17["Attribute Damage Scale"].maxBonus).toBeCloseTo(0.11, 6)
      expect(at17["Attribute Damage Scale"].scaleMax).toBe(328)

      const expectedByBreakthrough: Record<
        number,
        {
          crit: number
          phys: number
          pen: number
          attr: number
          agilityScaleMax: number
          silkbindScaleMax: number
        }
      > = {
        18: {
          crit: 0.0912,
          phys: 79.2,
          pen: 0.236,
          attr: 0.118,
          agilityScaleMax: 300,
          silkbindScaleMax: 351.2,
        },
        19: {
          crit: 0.0988,
          phys: 85.8,
          pen: 0.252,
          attr: 0.126,
          agilityScaleMax: 325,
          silkbindScaleMax: 375.0,
        },
        20: {
          crit: 0.111,
          phys: 96.36,
          pen: 0.276,
          attr: 0.138,
          agilityScaleMax: 365,
          silkbindScaleMax: 410.7,
        },
        21: {
          crit: 0.1231,
          phys: 106.92,
          pen: 0.296,
          attr: 0.148,
          agilityScaleMax: 405,
          silkbindScaleMax: 440.5,
        },
      }
      for (const [breakthrough, expected] of Object.entries(expectedByBreakthrough)) {
        const byName = byBreakthrough(Number(breakthrough))
        expect(byName["Critical Rate UP"].maxBonus, breakthrough).toBeCloseTo(expected.crit, 6)
        expect(byName["Critical Rate UP"].scaleMax, breakthrough).toBe(expected.agilityScaleMax)
        expect(byName["Physical Attack UP"].maxBonus, breakthrough).toBeCloseTo(expected.phys, 6)
        expect(byName["Physical Attack UP"].scaleMax, breakthrough).toBe(expected.agilityScaleMax)
        expect(byName["Silkbind Penetration Scale"].maxBonus, breakthrough).toBeCloseTo(
          expected.pen,
          6,
        )
        expect(byName["Silkbind Penetration Scale"].scaleMax, breakthrough).toBe(
          expected.silkbindScaleMax,
        )
        expect(byName["Attribute Damage Scale"].maxBonus, breakthrough).toBeCloseTo(
          expected.attr,
          6,
        )
        expect(byName["Attribute Damage Scale"].scaleMax, breakthrough).toBe(
          expected.silkbindScaleMax,
        )
      }
    })
  })
})
