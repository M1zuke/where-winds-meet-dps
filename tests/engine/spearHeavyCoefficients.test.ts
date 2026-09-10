// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

describe("SpearHeavy (spear Charged Skill) coefficients", () => {
  it("does not carry the same row on every hit", () => {
    const rows = builtinSkill(CLASS, SKILL.spearheavy).hits.map((hit) => hit.physMultiplier)
    expect(new Set(rows).size).toBeGreaterThan(1)
  })

  it("sums its five hits' physical coefficient to the skill's full-cast total", () => {
    const total = builtinSkill(CLASS, SKILL.spearheavy).hits.reduce(
      (sum, hit) => sum + hit.physMultiplier,
      0,
    )
    expect(total).toBeCloseTo(3.95903, 5)
  })
})
