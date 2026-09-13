// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { classDefinition } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { computeSkillDamage } from "../../src/engine/formula"
import type { FormulaContext } from "../../src/engine/formula"
import { makeSkill } from "../../src/engine/skill"
import { WEAPON } from "../../src/data/skills/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import {
  additionalAttackRankAt,
  ADDITIONAL_ATTACK_RANKS,
} from "../../src/data/skills/buffs/additionalAttackRanks"

const CLASS = "bellstrikeUmbra"

const umbraOwnBuffDefs = () => classDefinition(CLASS)!.classBuffDefs

function skill(receives: string[]) {
  return makeSkill("test", { name: "probe", receives })
}

function fixedDamagePctBonusAt(breakthrough: number, receives: string[]): number {
  const engine = new BuffEngine({ breakthrough }, [], umbraOwnBuffDefs())
  return engine.calculateDamageEffects(skill(receives), 0).artBonuses.fixedDamagePctBonus ?? 0
}

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
      expect(candidate.receives ?? [], candidate.id).toContain(BUFF.strategicSwordAdditionalAttack)
    }
    for (const candidate of spearSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.strategicSwordAdditionalAttack,
      )
    }
  })

  it("every spear-tagged skill lists the spear buff, and no sword-tagged skill does", () => {
    for (const candidate of spearSkills) {
      expect(candidate.receives ?? [], candidate.id).toContain(
        BUFF.heavenquakerSpearAdditionalAttack,
      )
    }
    for (const candidate of swordSkills) {
      expect(candidate.receives ?? [], candidate.id).not.toContain(
        BUFF.heavenquakerSpearAdditionalAttack,
      )
    }
  })
})

describe("additional-attack talent — reaches the formula's flat terms", () => {
  const baseCtx: FormulaContext = {
    smallPhys: 977.23,
    largePhys: 2983.92,
    outerPen: 29.2,
    bellstrike: { min: 274, max: 687.63, pen: 18 },
    stonesplit: { min: 0, max: 0, pen: 0 },
    silkbind: { min: 0, max: 0, pen: 0 },
    bamboocut: { min: 0, max: 0, pen: 0 },
    primaryAttribute: "Bellstrike",
    precisionPanel: 0.9,
    critPanel: 0.3,
    affinityPanel: 0.4,
    directCritPanel: 0,
    directAffinityPanel: 0,
    physDmgBoostPanel: 0,
    critDmgBoostPanel: 0.5,
    affinityDmgBoostPanel: 0.4,
    attributeDmgBoostPanel: 0.09,
    sustainDmgBoostPanel: 0,
    generalDamageBoost: 0,
    chargeBonus: 0,
    effectiveDefense: 307,
    fatigueDamageTaken: 0,
    hasSixHenZhi: false,
    food: false,
    set: null,
    tianGong: null,
    classSpecificAttunement: {
      "classSpecificAttunement 1": 0,
      "classSpecificAttunement 2": 0,
      "classSpecificAttunement 3": 0,
    },
    shareDebuffs: { henZhi: false, easyHurt: false },
  }

  const SWORD_ROW = {
    name: "Sword Row",
    physMultiplier: 0.544068,
    physFixed: 150.6,
    attributeMultiplier: 0.816102,
    attributeFixed: 82,
    correction: 1,
    skillType: "weapon" as const,
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
  }

  it("contributes nothing at breakthrough 17 and rank 1 (0.0725) at breakthrough 18", () => {
    expect(fixedDamagePctBonusAt(17, [BUFF.strategicSwordAdditionalAttack])).toBe(0)
    expect(fixedDamagePctBonusAt(18, [BUFF.strategicSwordAdditionalAttack])).toBeCloseTo(
      additionalAttackRankAt(ADDITIONAL_ATTACK_RANKS, 18)!.flatBonus,
      10,
    )
  })

  it("a sword skill with a flat term deals more at breakthrough 18 than at 17, matching the flat terms scaled by rank 1", () => {
    const bonusAt17 = fixedDamagePctBonusAt(17, [BUFF.strategicSwordAdditionalAttack])
    const bonusAt18 = fixedDamagePctBonusAt(18, [BUFF.strategicSwordAdditionalAttack])

    const at17 = computeSkillDamage({ ...SWORD_ROW, fixedDamagePctBonus: bonusAt17 }, baseCtx, 1)
    const at18 = computeSkillDamage({ ...SWORD_ROW, fixedDamagePctBonus: bonusAt18 }, baseCtx, 1)
    expect(at18.expectedDamage).toBeGreaterThan(at17.expectedDamage)

    const preScaled = computeSkillDamage(
      {
        ...SWORD_ROW,
        physFixed: SWORD_ROW.physFixed * (1 + bonusAt18),
        attributeFixed: SWORD_ROW.attributeFixed * (1 + bonusAt18),
      },
      baseCtx,
      1,
    )
    expect(at18.expectedDamage).toBeCloseTo(preScaled.expectedDamage, 9)
  })

  it("a spear skill is unmoved by the sword buff — its own artBonus is exactly the spear rank, never doubled", () => {
    const spearBonus = fixedDamagePctBonusAt(21, [BUFF.heavenquakerSpearAdditionalAttack])
    expect(spearBonus).toBeCloseTo(
      additionalAttackRankAt(ADDITIONAL_ATTACK_RANKS, 21)!.flatBonus,
      10,
    )
  })
})
