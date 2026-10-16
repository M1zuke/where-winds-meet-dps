// Scoped to Bamboocut Draught's reach for the Mistwillow set
// (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { SET_ID } from "../../src/data/sets/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { ATTACK } from "../../src/data/skills/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bamboocutDraught"

const LIGHT_ATTACKS = [
  SKILL.lightAttack,
  SKILL.bloombreak,
  SKILL.bladeAgainstWaves,
  SKILL.dualBladesLightAttack1,
  SKILL.dualBladesLightAttack2,
  SKILL.dualBladesLightAttack3,
  SKILL.dualBladesLightAttack4,
]

const HEAVY_ATTACKS = [
  SKILL.dragonquenchInebriate,
  SKILL.dragonquenchInebriateCancel,
  SKILL.dragonquenchInebriateSecond,
  SKILL.dragonquenchInebriateSecondCancel,
  SKILL.dragonquenchInebriateThird,
  SKILL.dragonquenchInebriateThirdCancel,
  SKILL.boundvessel,
  SKILL.boundvesselDrinkCancel,
  SKILL.bladeVessel,
  SKILL.tidepour,
]

describe("light attacks of Bamboocut Draught grant the light stance and receive the heavy one", () => {
  it.each(LIGHT_ATTACKS)("%s", (skillId) => {
    const skill = builtinSkill(CLASS, skillId)
    expect(skill.tags).toContain(ATTACK.light)
    expect(skill.tags).not.toContain(ATTACK.heavy)
    expect(skill.receives).toEqual(
      expect.arrayContaining([BUFF.mistwillowHeavyBuff, BUFF.mistwillowBuff]),
    )
    expect(skill.receives).not.toContain(BUFF.mistwillowLightBuff)
  })
})

describe("heavy attacks of Bamboocut Draught grant the heavy stance and receive the light one", () => {
  it.each(HEAVY_ATTACKS)("%s", (skillId) => {
    const skill = builtinSkill(CLASS, skillId)
    expect(skill.tags).toContain(ATTACK.heavy)
    expect(skill.tags).not.toContain(ATTACK.light)
    expect(skill.receives).toEqual(
      expect.arrayContaining([BUFF.mistwillowLightBuff, BUFF.mistwillowBuff]),
    )
    expect(skill.receives).not.toContain(BUFF.mistwillowHeavyBuff)
  })
})

describe("the Mistwillow stances open on the first light and heavy hit", () => {
  function stanceBuffsOnHeavyAttack(armorSet: string | null): string[] {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: armorSet,
      activeCustomRotation: testRotation(CLASS, {
        steps: [SKILL.bloombreak, SKILL.boundvessel].map((skillId) => makeStep({ skillId })),
        openingStacks: { [STATUS.bingePoints]: 100 },
      }),
    })
    const heavyCast = result.casts!.find(
      (cast) => cast.skillName === builtinSkill(CLASS, SKILL.boundvessel).name,
    )!
    return heavyCast.buffs.map((buff) => buff.id)
  }

  it("merges into Mistwillow once a light and a heavy attack have both landed", () => {
    expect(stanceBuffsOnHeavyAttack(SET_ID.mistwillow)).toContain(BUFF.mistwillowBuff)
  })

  it("is inert without the set", () => {
    const ids = stanceBuffsOnHeavyAttack(null)
    expect(ids).not.toContain(BUFF.mistwillowBuff)
    expect(ids).not.toContain(BUFF.mistwillowHeavyBuff)
    expect(ids).not.toContain(BUFF.mistwillowLightBuff)
  })
})
