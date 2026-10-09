// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

describe("SpearHeavy (spear Charged Skill, stage 2) coefficients", () => {
  it("does not carry the same row on every hit", () => {
    const rows = builtinSkill(CLASS, SKILL.spearheavy).hits.map((hit) => hit.physMultiplier)
    expect(new Set(rows).size).toBeGreaterThan(1)
  })

  it("has 15 drill hits and a finisher, summing to the row's 0.995 share", () => {
    const hits = builtinSkill(CLASS, SKILL.spearheavy).hits
    expect(hits).toHaveLength(16)
    const total = hits.reduce((sum, hit) => sum + hit.physMultiplier, 0)
    expect(total).toBeCloseTo(6.223119, 5)
  })
})

describe("SpearHeavy Stage 1 coefficients", () => {
  it("has 8 drill hits and a finisher, summing to the row's 0.60 share", () => {
    const hits = builtinSkill(CLASS, SKILL.spearheavyStage1).hits
    expect(hits).toHaveLength(9)
    const total = hits.reduce((sum, hit) => sum + hit.physMultiplier, 0)
    expect(total).toBeCloseTo(3.752634, 5)
  })
})
