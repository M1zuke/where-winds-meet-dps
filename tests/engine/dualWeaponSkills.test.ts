import { describe, expect, it } from "vitest"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import type { Skill } from "../../src/engine/skill"
import { weaponTagOf } from "../../src/engine/buffs/tags"
import { SKILL as UMBRA } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as SPLENDOR } from "../../src/data/skills/bellstrike-splendor/ids"
import { SKILL as STONESPLIT } from "../../src/data/skills/stonesplit-strength/ids"
import { SKILL as DRAUGHT } from "../../src/data/skills/bamboocut-draught/ids"
import { SKILL as JADE } from "../../src/data/skills/silkbind-jade/ids"
import { builtinSkill, testRotation } from "../builtins"

interface DualCase {
  classId: string
  dualId: string
  weaponTag: string
  castFrames: number
  hitFrames: number[]
  weaponSkillId: string
  otherWeaponSkillId: string
}

const CASES: DualCase[] = [
  {
    classId: "bellstrikeUmbra",
    dualId: UMBRA.swordDual,
    weaponTag: "weapon:Sword",
    castFrames: 47,
    hitFrames: [13, 33],
    weaponSkillId: UMBRA.swordq,
    otherWeaponSkillId: UMBRA.spearspecial,
  },
  {
    classId: "bellstrikeUmbra",
    dualId: UMBRA.spearDual,
    weaponTag: "weapon:Spear",
    castFrames: 60,
    hitFrames: [18],
    weaponSkillId: UMBRA.spearspecial,
    otherWeaponSkillId: UMBRA.swordq,
  },
  {
    classId: "bellstrikeSplendor",
    dualId: SPLENDOR.swordDual,
    weaponTag: "weapon:Sword",
    castFrames: 47,
    hitFrames: [13, 33],
    weaponSkillId: SPLENDOR.swordq,
    otherWeaponSkillId: SPLENDOR.spearq,
  },
  {
    classId: "bellstrikeSplendor",
    dualId: SPLENDOR.spearDual,
    weaponTag: "weapon:Spear",
    castFrames: 60,
    hitFrames: [18],
    weaponSkillId: SPLENDOR.spearq,
    otherWeaponSkillId: SPLENDOR.swordq,
  },
  {
    classId: "stonesplitStrength",
    dualId: STONESPLIT.moBladeDual,
    weaponTag: "weapon:Mo Blade",
    castFrames: 50,
    hitFrames: [29],
    weaponSkillId: STONESPLIT.phalanxq,
    otherWeaponSkillId: STONESPLIT.snowpartingspecial,
  },
  {
    classId: "bamboocutDraught",
    dualId: DRAUGHT.gauntletsDual,
    weaponTag: "weapon:Gauntlets",
    castFrames: 48,
    hitFrames: [14, 37],
    weaponSkillId: DRAUGHT.lightAttack,
    otherWeaponSkillId: DRAUGHT.dualBladesLightAttack1,
  },
  {
    classId: "silkbindJade",
    dualId: JADE.umbrellaDual,
    weaponTag: "weapon:Umbrella",
    castFrames: 46,
    hitFrames: [12, 18],
    weaponSkillId: JADE.umbq,
    otherWeaponSkillId: JADE.fanq,
  },
  {
    classId: "silkbindJade",
    dualId: JADE.fanDual,
    weaponTag: "weapon:Fan",
    castFrames: 51,
    hitFrames: [7, 36],
    weaponSkillId: JADE.fanq,
    otherWeaponSkillId: JADE.umbq,
  },
]

function run(classId: string, rotation: Rotation) {
  return simulateTimeline({
    ...defaultInputs,
    classId,
    activeCustomRotation: rotation,
  })
}

function rotationOf(classId: string, skills: Skill[]): Rotation {
  return testRotation(classId, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

const isDirectSwap = (castName: string) => castName.startsWith("Weapon Swap")

describe.each(CASES)("dual-weapon skill $dualId", (testCase) => {
  const dual = builtinSkill(testCase.classId, testCase.dualId)
  const sameWeapon = builtinSkill(testCase.classId, testCase.weaponSkillId)
  const otherWeapon = builtinSkill(testCase.classId, testCase.otherWeaponSkillId)

  it("is a registered weapon-swap skill of its weapon", () => {
    expect(dual.isWeaponSwap).toBe(true)
    expect(dual.skillType).toBe("weapon")
    expect(weaponTagOf(dual)).toBe(testCase.weaponTag.slice("weapon:".length))
    expect(dual.castFrames).toBe(testCase.castFrames)
    expect(dual.hits.map((skillHit) => skillHit.frame)).toEqual(testCase.hitFrames)
  })

  it("counts as the weapon change when a rotation places it, so no direct swap is inserted", () => {
    const result = run(testCase.classId, rotationOf(testCase.classId, [otherWeapon, dual]))
    const casts = result.casts!
    expect(casts.some((cast) => isDirectSwap(cast.skillName))).toBe(false)
    expect(casts.map((cast) => cast.skillName)).toEqual([otherWeapon.name, dual.name])
  })

  it("still inserts the direct swap when the next skill of the weapon is placed without it", () => {
    const result = run(testCase.classId, rotationOf(testCase.classId, [otherWeapon, sameWeapon]))
    expect(result.casts!.filter((cast) => isDirectSwap(cast.skillName))).toHaveLength(1)
  })

  it("deals damage on its own breakdown row", () => {
    const result = run(testCase.classId, rotationOf(testCase.classId, [otherWeapon, dual]))
    const row = result.perSkill.find((entry) => entry.name === dual.name)
    expect(row?.expectedDamage).toBeGreaterThan(0)
  })
})

describe("dual-weapon skills share the 3 s swap cooldown", () => {
  it("holds the second dual-weapon skill until 3 s after the first one starts", () => {
    const classId = "bellstrikeUmbra"
    const sword = builtinSkill(classId, UMBRA.swordq)
    const spearDual = builtinSkill(classId, UMBRA.spearDual)
    const swordDual = builtinSkill(classId, UMBRA.swordDual)
    const result = run(classId, rotationOf(classId, [sword, spearDual, swordDual]))
    const [, spearDualCast, swordDualCast] = result.casts!
    expect(spearDualCast.skillName).toBe(spearDual.name)
    expect(swordDualCast.skillName).toBe(swordDual.name)
    expect(swordDualCast.timeSec - spearDualCast.timeSec).toBeGreaterThanOrEqual(3 - 1 / FPS)
  })
})

describe("dual-weapon skills are never inserted automatically", () => {
  it("appears in no built-in rotation", () => {
    for (const testCase of CASES) {
      const dual = builtinSkill(testCase.classId, testCase.dualId)
      for (const rotation of builtinRotationsForClass(testCase.classId)) {
        expect(rotation.steps.some((step) => step.skillId === dual.id)).toBe(false)
      }
    }
  })
})
