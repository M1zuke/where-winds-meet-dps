// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, it, expect } from "vitest"
import { appliesForSkill } from "../../src/engine/buffs/catalog"
import { builtinSkillsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

describe("appliesForSkill — the Skill Editor's TRIGGERS column (buff half)", () => {
  it("a set-gated buff (jadeware) surfaces for the skill that triggers it, with a non-empty effect and the set name as its gate", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    expect(swordQ).toBeTruthy()
    const rows = appliesForSkill(swordQ!)
    const jadeware = rows.find((r) => r.id === "jadeware")
    expect(jadeware).toBeTruthy()
    expect(jadeware!.effect.length).toBeGreaterThan(0)
    expect(jadeware!.requires).toBe("Jadeware")
  })

  it("never throws for any built-in skill", () => {
    for (const s of builtinSkillsForClass(CLASS)) {
      expect(() => appliesForSkill(s)).not.toThrow()
    }
  })
})

describe("buff engine — ungated buffs genuinely apply to imported skills", () => {
  function run(neuter: boolean): number {
    const rotation = defaultRotationForClass(CLASS)!
    const custom = neuter
      ? builtinSkillsForClass(CLASS).map((s) => ({ ...s, name: "__no_site_tag__", tags: [] }))
      : []
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: custom,
      activeCustomRotation: rotation,
    }
    return simulateTimeline(inputs).dps
  }

  it("ungated buffs change imported-skill damage", () => {
    const withBuffs = run(false)
    const without = run(true)
    expect(withBuffs).toBeGreaterThan(0)
    expect(without).toBeGreaterThan(0)
    expect(withBuffs).not.toBeCloseTo(without, 3)
  })
})
