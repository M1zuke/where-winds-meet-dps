// Scoped to Bellstrike Splendor — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"

const CLASS = "bellstrikeSplendor"

describe("additional-attack talent — receives wiring, one weapon tag one art buff", () => {
  const skills = builtinSkillsForClass(CLASS)
  const swordSkills = skills.filter((candidate) => (candidate.tags ?? []).includes(WEAPON.sword))
  const spearSkills = skills.filter((candidate) => (candidate.tags ?? []).includes(WEAPON.spear))

  it("covers a nonzero number of skills on each art", () => {
    expect(swordSkills.length).toBeGreaterThan(0)
    expect(spearSkills.length).toBeGreaterThan(0)
  })

  it("every sword-tagged skill lists the sword buff, and no spear-tagged skill does", () => {
    for (const candidate of swordSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.namelessSwordAdditionalAttack)
    }
    for (const candidate of spearSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.namelessSwordAdditionalAttack,
      )
    }
  })

  it("every spear-tagged skill lists the spear buff, and no sword-tagged skill does", () => {
    for (const candidate of spearSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.namelessSpearAdditionalAttack)
    }
    for (const candidate of swordSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.namelessSpearAdditionalAttack,
      )
    }
  })
})
