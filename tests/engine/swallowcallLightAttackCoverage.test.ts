// In-game values as of 2026-09-24: Swallowcall's Light Attack damage bonus
// reaches every class's Light Attack alike — every such skill the app
// currently models must list the receiver, and a charged form that switches
// away from being a Light Attack must never gain it by accident.
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"

const CLASS_101_SKILLS_BY_CLASS: Record<string, readonly string[]> = {
  bamboocutDraught: [
    "bamboocutDraught-light-attack",
    "bamboocutDraught-bloombreak",
    "bamboocutDraught-dual-blades-light-attack-1",
    "bamboocutDraught-dual-blades-light-attack-2",
    "bamboocutDraught-dual-blades-light-attack-3",
    "bamboocutDraught-dual-blades-light-attack-4",
  ],
  silkbindJade: [
    "silkbindJade-hidden-sword-light-1",
    "silkbindJade-hidden-sword-light-2",
    "silkbindJade-hidden-sword-light-3",
    "silkbindJade-hidden-sword-light-4",
    "silkbindJade-hidden-sword-light-5",
    "silkbindJade-umb-heavylight",
  ],
}

// In-game values as of 2026-09-24: charging a Light Attack turns it into its
// own Charged Skill, out of a Light-Attack-only bonus's own reach.
const EXCLUDED_CHARGED_FORM = "silkbindJade-fanlightcharged"

describe("Swallowcall Light Attack reach — completeness", () => {
  for (const [classId, skillIds] of Object.entries(CLASS_101_SKILLS_BY_CLASS)) {
    it(`${classId}: every class-101 skill the app models carries the receiver`, () => {
      const skills = builtinSkillsForClass(classId)
      for (const skillId of skillIds) {
        const skill = skills.find((candidate) => candidate.id === skillId)
        expect(skill, skillId).toBeDefined()
        expect(skill!.receives ?? [], skillId).toContain(BUFF.swallowcallLightAttackBoost)
      }
    })
  }

  it("a charged form that becomes its own Charged Skill never carries the receiver", () => {
    const skill = builtinSkillsForClass("silkbindJade").find(
      (candidate) => candidate.id === EXCLUDED_CHARGED_FORM,
    )
    expect(skill).toBeDefined()
    expect(skill!.receives ?? []).not.toContain(BUFF.swallowcallLightAttackBoost)
  })
})
