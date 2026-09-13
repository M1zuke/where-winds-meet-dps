// Scoped to Silkbind Jade — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"

const CLASS = "silkbindJade"

describe("additional-attack talent — receives wiring, one weapon tag one art buff", () => {
  const skills = builtinSkillsForClass(CLASS)
  const fanSkills = skills.filter((candidate) => (candidate.tags ?? []).includes(WEAPON.fan))
  const umbrellaSkills = skills.filter((candidate) =>
    (candidate.tags ?? []).includes(WEAPON.umbrella),
  )

  it("covers a nonzero number of skills on each art", () => {
    expect(fanSkills.length).toBeGreaterThan(0)
    expect(umbrellaSkills.length).toBeGreaterThan(0)
  })

  it("every Fan-tagged skill lists the Inkwell Fan buff, and no Umbrella-tagged skill does", () => {
    for (const candidate of fanSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.inkwellFanAdditionalAttack)
    }
    for (const candidate of umbrellaSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(BUFF.inkwellFanAdditionalAttack)
    }
  })

  it("every Umbrella-tagged skill lists the Vernal Umbrella buff, and no Fan-tagged skill does", () => {
    for (const candidate of umbrellaSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.vernalUmbrellaAdditionalAttack)
    }
    for (const candidate of fanSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.vernalUmbrellaAdditionalAttack,
      )
    }
  })
})
