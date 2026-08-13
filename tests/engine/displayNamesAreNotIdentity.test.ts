// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md
// § "Implemented classes").
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function renamedEverything(): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: builtinSkillsForClass(CLASS).map((skill) => ({
      ...skill,
      name: `${skill.id} renamed`,
      breakdownName: undefined,
    })),
    customDebuffs: builtinDebuffsForClass(CLASS).map((debuff) => ({
      ...debuff,
      name: `${debuff.id} renamed`,
      breakdownName: undefined,
    })),
  }
}

describe("renaming every built-in display name", () => {
  const baseline = runEngine({ ...defaultInputs, classId: CLASS })
  const renamed = runEngine(renamedEverything())

  it("reaches the engine at all — every row is reported under a renamed label", () => {
    expect(renamed.perSkill.length).toBeGreaterThan(0)
    for (const row of renamed.perSkill) expect(row.name).toContain("renamed")
  })

  it("moves neither DPS nor total damage", () => {
    expect(baseline.dps).toBeGreaterThan(0)
    expect(renamed.dps).toBeCloseTo(baseline.dps, 10)
    expect(renamed.totalDamage).toBeCloseTo(baseline.totalDamage, 10)
  })

  it("leaves the same number of breakdown rows, each with the same damage", () => {
    expect(renamed.perSkill).toHaveLength(baseline.perSkill.length)
    const byDamage = (rows: typeof baseline.perSkill) =>
      rows.map((row) => row.expectedDamage).sort((left, right) => left - right)
    expect(byDamage(renamed.perSkill)).toEqual(byDamage(baseline.perSkill))
  })

  it("raises no new warning", () => {
    expect(renamed.warnings).toEqual(baseline.warnings)
  })
})
