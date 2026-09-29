import { describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"

const UNIVERSAL_SET_BUFFS = [BUFF.jadeware]

describe("every registered class has a skill that triggers each universal set buff", () => {
  it.each(CLASS_IDS())("%s", (classId) => {
    for (const buffId of UNIVERSAL_SET_BUFFS) {
      expect(
        builtinSkillsForClass(classId).some((skill) => skill.triggersBuffs?.includes(buffId)),
        `${classId} has no skill triggering ${buffId} — list it in that skill's triggersBuffs`,
      ).toBe(true)
    }
  })
})

describe("every Martial Art skill activates Jadeware", () => {
  it.each(CLASS_IDS())("%s", (classId) => {
    const silent = builtinSkillsForClass(classId)
      .filter((skill) => skill.tags?.includes(PROP.isMartialSkillQ))
      .filter((skill) => !skill.triggersBuffs?.includes(BUFF.jadeware))
      .map((skill) => skill.name)
    expect(silent).toEqual([])
  })
})

describe("Jadeware pays out both bonuses for the whole window", () => {
  const engineWithSet = (armorSet: string) =>
    new BuffEngine(
      { classId: "bellstrikeSplendor", armorSet, qiBreakTime: 25, bossBreakDuration: 10 },
      buffDefsForClass("bellstrikeSplendor"),
    )

  const contributionAt = (engine: BuffEngine, time: number, damageSoFar = 0) => {
    engine.triggerDeclaredBuffs([BUFF.jadeware], "cast:swordQ", 24)
    return engine.calculateDamageEffects(
      builtinSkill("bellstrikeSplendor", SKILL.swordq),
      time,
      [],
      damageSoFar,
    ).breakdown[BUFF.jadeware]
  }

  it("opens the window at the triggering cast's end, not at the trigger frame", () => {
    expect(contributionAt(engineWithSet("jadeware"), 24.5)).toBeUndefined()
  })

  it("contributes both bonuses once the window has opened", () => {
    expect(contributionAt(engineWithSet("jadeware"), 25.5)).toBeCloseTo(0.175, 10)
  })

  it("contributes both bonuses well outside any break, once the target has taken any Qi damage", () => {
    const engine = new BuffEngine(
      {
        classId: "bellstrikeSplendor",
        armorSet: "jadeware",
        qiBreakTime: 100,
        bossBreakDuration: 10,
        targetMaxHp: 100,
      },
      buffDefsForClass("bellstrikeSplendor"),
    )
    expect(contributionAt(engine, 25.5, 1)).toBeCloseTo(0.175, 10)
  })

  it("contributes nothing outside any break while the target is still at full Qi", () => {
    const engine = new BuffEngine(
      {
        classId: "bellstrikeSplendor",
        armorSet: "jadeware",
        qiBreakTime: 100,
        bossBreakDuration: 10,
        targetMaxHp: 100,
      },
      buffDefsForClass("bellstrikeSplendor"),
    )
    expect(contributionAt(engine, 25.5, 0)).toBeUndefined()
  })

  it("contributes nothing without the set equipped", () => {
    expect(contributionAt(engineWithSet("hawkwing"), 25.5)).toBeUndefined()
  })
})
