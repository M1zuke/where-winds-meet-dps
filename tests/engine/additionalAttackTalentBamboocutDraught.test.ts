// Scoped to Bamboocut Draught — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { classDefinition } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeSkill } from "../../src/engine/skill"
import { WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/bamboocut-draught/ids"

const CLASS = "bamboocutDraught"

const bamboocutOwnBuffDefs = () => classDefinition(CLASS)!.classBuffDefs

function skill(receives: string[]) {
  return makeSkill("test", { name: "probe", receives })
}

describe("additional-attack talent — receives wiring, one weapon tag one art buff", () => {
  const skills = builtinSkillsForClass(CLASS)
  const gauntletsSkills = skills.filter((candidate) =>
    (candidate.tags ?? []).includes(WEAPON.gauntlets),
  )
  const twinBladesSkills = skills.filter((candidate) =>
    (candidate.tags ?? []).includes(WEAPON.twinBlades),
  )

  it("covers a nonzero number of skills on each art", () => {
    expect(gauntletsSkills.length).toBeGreaterThan(0)
    expect(twinBladesSkills.length).toBeGreaterThan(0)
  })

  it("every Gauntlets-tagged skill lists the Skystrike Gauntlets buff, and no Twin Blades-tagged skill does", () => {
    for (const candidate of gauntletsSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(
        BUFF.skystrikeGauntletsAdditionalAttack,
      )
    }
    for (const candidate of twinBladesSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.skystrikeGauntletsAdditionalAttack,
      )
    }
  })

  it("every Twin Blades-tagged skill lists the Riven Twinblades buff, and no Gauntlets-tagged skill does", () => {
    for (const candidate of twinBladesSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.rivenTwinbladesAdditionalAttack)
    }
    for (const candidate of gauntletsSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.rivenTwinbladesAdditionalAttack,
      )
    }
  })
})

describe("additional-attack talent — Skystrike Gauntlets coefficient clause reach", () => {
  const factorFor = (breakthrough: number, receives: string[]) =>
    new BuffEngine({ breakthrough }, [], bamboocutOwnBuffDefs()).calculateDamageEffects(
      skill(receives),
      0,
    ).damageFactor

  it("reaches exactly Falcon's Pursuit among the class's built-in skills", () => {
    const carriers = builtinSkillsForClass(CLASS)
      .filter((candidate) =>
        (candidate.receives ?? []).includes(BUFF.skystrikeGauntletsAdditionalAttackCoefficient),
      )
      .map((candidate) => candidate.id)
    expect(carriers).toEqual([SKILL.falconsPursuit])
  })

  it("contributes nothing at breakthrough 17", () => {
    expect(factorFor(17, [BUFF.skystrikeGauntletsAdditionalAttackCoefficient])).toBe(1)
  })

  it("scales ×1.03 at breakthrough 21", () => {
    expect(factorFor(21, [BUFF.skystrikeGauntletsAdditionalAttackCoefficient])).toBeCloseTo(
      1.03,
      10,
    )
  })

  it("scales ×1.05 at breakthrough 23, Bamboocut Draught's extended rank", () => {
    expect(factorFor(23, [BUFF.skystrikeGauntletsAdditionalAttackCoefficient])).toBeCloseTo(
      1.05,
      10,
    )
  })

  it("leaves a Gauntlets row that does not receive it alone", () => {
    expect(factorFor(21, [BUFF.skystrikeGauntletsAdditionalAttack])).toBe(1)
  })
})
