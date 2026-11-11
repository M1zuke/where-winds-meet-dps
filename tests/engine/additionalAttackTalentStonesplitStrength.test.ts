// Scoped to Stonesplit Strength — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/stonesplit-strength/ids"

const CLASS = "stonesplitStrength"

describe("additional-attack talent — receives wiring, one weapon tag one art buff", () => {
  const skills = builtinSkillsForClass(CLASS)
  const moBladeSkills = skills.filter((candidate) =>
    (candidate.tags ?? []).includes(WEAPON.moBlade),
  )
  const hengBladeSkills = skills.filter((candidate) =>
    (candidate.tags ?? []).includes(WEAPON.hengBlade),
  )

  it("covers a nonzero number of skills on each art", () => {
    expect(moBladeSkills.length).toBeGreaterThan(0)
    expect(hengBladeSkills.length).toBeGreaterThan(0)
  })

  it("every Mo Blade-tagged skill lists the Phalanxbane Blade buff, and no Heng Blade-tagged skill does", () => {
    for (const candidate of moBladeSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(
        BUFF.phalanxbaneBladeAdditionalAttack,
      )
    }
    for (const candidate of hengBladeSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.phalanxbaneBladeAdditionalAttack,
      )
    }
  })

  it("every Heng Blade-tagged skill but Break Defense lists the Snowparting Blade buff, and no Mo Blade-tagged skill does", () => {
    for (const candidate of hengBladeSkills.filter(
      (hengBladeSkill) => hengBladeSkill.id !== SKILL.breakDefense,
    )) {
      expect(candidate.receives ?? [], candidate.id).toContain(
        BUFF.snowpartingBladeAdditionalAttack,
      )
    }
    for (const candidate of moBladeSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.snowpartingBladeAdditionalAttack,
      )
    }
  })

  it("Break Defense lists neither art's additional-attack buff", () => {
    const breakDefense = skills.find((candidate) => candidate.id === SKILL.breakDefense)!
    expect(breakDefense.receives ?? []).not.toContain(BUFF.snowpartingBladeAdditionalAttack)
    expect(breakDefense.receives ?? []).not.toContain(BUFF.phalanxbaneBladeAdditionalAttack)
  })
})
