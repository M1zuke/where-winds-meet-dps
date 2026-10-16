import { describe, expect, it } from "vitest"
import {
  hiddenTimelineBuffIds,
  receivesForSkill,
  specMechanicIds,
} from "../../src/engine/buffs/catalog"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

const CLASS = "bellstrikeUmbra"

describe("catalog receives — Vulnerability (Teammate) follows the Tank Spear Debuff toggle", () => {
  it("reads inactive by default (toggle off) and requires names the Tank Spear Debuff", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    const rows = receivesForSkill(swordQ, CLASS, { ...defaultInputs, classId: CLASS })
    const row = rows.find((r) => r.id === "vulnerabilityTeammate")
    expect(row).toBeTruthy()
    expect(row!.active).toBe(false)
    expect(row!.requires).toMatch(/Tank Spear Debuff/)
  })

  it("reads active once the Tank Spear Debuff (Vulnerability) toggle is on", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      shareEasyHurt: true,
      combatSettings: { ...defaultCombatSettings() },
    }
    const rows = receivesForSkill(swordQ, CLASS, inputs)
    expect(rows.find((r) => r.id === "vulnerabilityTeammate")!.active).toBe(true)
  })
})

describe("catalog receives — gear-stat boost rows follow the skill's typing", () => {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    swordBoost: 0.05,
    allMartialBoost: 0.03,
  }

  it("Bleed Tick and Blood Burst list Sword Martial Boost and All Martial Boost", () => {
    for (const skillId of [SKILL.bleedTick, SKILL.bleedDetonation]) {
      const rows = receivesForSkill(builtinSkill(CLASS, skillId), CLASS, inputs)
      const sword = rows.find((r) => r.id === "stat:swordBoost")
      const allMartial = rows.find((r) => r.id === "stat:allMartialBoost")
      expect(sword, `${skillId} should list swordBoost`).toBeTruthy()
      expect(sword!.effect).toBe("+5.0% damage")
      expect(allMartial, `${skillId} should list allMartialBoost`).toBeTruthy()
      expect(allMartial!.effect).toBe("+3.0% damage")
    }
  })

  it("a burst-mystic cast lists the single-target mystic stat and no weapon stats", () => {
    const rows = receivesForSkill(builtinSkill(CLASS, MYSTIC_SKILL.fireBreath1Hit), CLASS, inputs)
    expect(rows.some((r) => r.id === "stat:singleMysticBoost")).toBe(true)
    expect(rows.some((r) => r.id === "stat:allMartialBoost")).toBe(false)
    expect(rows.some((r) => r.id === "stat:swordBoost")).toBe(false)
  })
})

// Both derivations stay scoped to a class's own `classBuffDefs`, never
// `buffDefsForClass`'s composed set (which folds in `GLOBAL_BUFF_DEFS`):
// `dragonHeadLowHp` is a global and `alwaysActive`, and must not be caught
// by either.
describe("specMechanicIds and hiddenTimelineBuffIds stay scoped to the class's own classBuffDefs", () => {
  it("the Spec Mechanics column is exactly the five bleed and additional-attack passives", () => {
    const ids = specMechanicIds(CLASS)
    expect(ids).toEqual(
      new Set([
        "bellstrikeUmbraBleedPen",
        "bellstrikeUmbraBleedingDamage",
        "bellstrikeUmbraBleedCoefficient",
        "strategicSwordAdditionalAttack",
        "heavenquakerSpearAdditionalAttack",
      ]),
    )
    expect(ids.has("soulShaken")).toBe(false)
    expect(ids.has("dragonHeadLowHp")).toBe(false)
  })

  it("the timeline chip-hiding set is the same five", () => {
    const ids = hiddenTimelineBuffIds(CLASS)
    expect(ids).toEqual(
      new Set([
        "bellstrikeUmbraBleedPen",
        "bellstrikeUmbraBleedingDamage",
        "bellstrikeUmbraBleedCoefficient",
        "strategicSwordAdditionalAttack",
        "heavenquakerSpearAdditionalAttack",
      ]),
    )
    expect(ids.has("dragonHeadLowHp")).toBe(false)
  })
})
