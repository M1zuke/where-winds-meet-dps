import { describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { jadeware } from "../../src/data/skills/buffs/jadeware"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import type { QiPhase } from "../../src/engine/effects/context"

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

describe("Jadeware pays out against low-Qi targets only", () => {
  const effectsAt = (phase: QiPhase) => {
    const effects = jadeware.effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    return effects({ phase } as never)
  }

  it("gives nothing while the target's Qi is untouched", () => {
    expect(effectsAt("normal")).toEqual([])
  })

  it.each(["below30", "exhausted"] as const)("gives both bonuses while %s", (phase) => {
    expect(effectsAt(phase)).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.075 },
    ])
  })

  const engineWithSet = (armorSet: string) =>
    new BuffEngine(
      { classId: "bellstrikeSplendor", armorSet, qiBreakTime: 25, bossBreakDuration: 10 },
      buffDefsForClass("bellstrikeSplendor"),
    )

  const contributionAt = (engine: BuffEngine, time: number) => {
    engine.triggerDeclaredBuffs([BUFF.jadeware], "cast:swordQ", 24)
    return engine.calculateDamageEffects(builtinSkill("bellstrikeSplendor", SKILL.swordq), time)
      .breakdown[BUFF.jadeware]
  }

  it("contributes nothing inside its own window while the target is at full Qi", () => {
    expect(contributionAt(engineWithSet("jadeware"), 24.5)).toBeUndefined()
  })

  it("contributes both bonuses once the same window overlaps the break", () => {
    expect(contributionAt(engineWithSet("jadeware"), 26)).toBeCloseTo(0.175, 10)
  })

  it("contributes nothing without the set equipped", () => {
    expect(contributionAt(engineWithSet("hawkwing"), 26)).toBeUndefined()
  })
})
