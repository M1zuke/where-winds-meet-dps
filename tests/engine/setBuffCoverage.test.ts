import { describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import type { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
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

// In-game Martial Art Skill roster as of 2026-09-24, independent of which
// built-in skill files already carry PROP.isMartialSkillQ — a skill missing
// from the tag entirely (Realmplay, once) would otherwise never surface.
// Stonesplit Strength's own roster is a separate, documented deviation and is
// excluded here.
const MARTIAL_ART_SKILL_IDS: Record<string, readonly string[]> = {
  bellstrikeUmbra: [
    "bellstrikeUmbra-swordq",
    "bellstrikeUmbra-swordqfollowup",
    "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
    "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
    "bellstrikeUmbra-sword-martial-qqq",
    "bellstrikeUmbra-spearq",
    "bellstrikeUmbra-spearq-5-hit-cancel",
  ],
  bellstrikeSplendor: [
    "bellstrikeSplendor-swordq",
    "bellstrikeSplendor-swordq-2nd",
    "bellstrikeSplendor-spearq",
    "bellstrikeSplendor-spearq-prepull",
    "bellstrikeSplendor-spearq-0-hit-cancel",
  ],
  bamboocutDraught: [
    "bamboocutDraught-peakfall",
    "bamboocutDraught-peakfall-prepull",
    "bamboocutDraught-castlink",
    "bamboocutDraught-reveldrift",
    "bamboocutDraught-reveldrift-cancel",
    "bamboocutDraught-realmplay",
  ],
  silkbindJade: [
    "silkbindJade-umbq",
    "silkbindJade-umbq-prepull",
    "silkbindJade-fanq",
    "silkbindJade-fanq-prepull",
    "silkbindJade-fanqcancel",
  ],
}

describe("every Martial Art skill activates Jadeware", () => {
  it.each(Object.keys(MARTIAL_ART_SKILL_IDS))("%s", (classId) => {
    const skills = builtinSkillsForClass(classId)
    const missing = MARTIAL_ART_SKILL_IDS[classId]!.filter((id) => {
      const skill = skills.find((candidate) => candidate.id === id)
      return (
        !skill ||
        !skill.tags?.includes(PROP.isMartialSkillQ) ||
        !skill.triggersBuffs?.includes(BUFF.jadeware)
      )
    })
    expect(missing).toEqual([])
  })
})

describe("Jadeware pays its Affinity DMG for the whole window and its Direct Affinity against a target below full Qi", () => {
  const engineWithSet = (armorSet: string) =>
    buffEngineWith(
      { classId: "bellstrikeSplendor", armorSet },
      buffDefsForClass("bellstrikeSplendor"),
      [],
      exhaustedFrom(25, 10),
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

  const belowFullQi = {
    isBroken: () => false,
    fractionAt: () => 0.5,
    phaseAt: () => "normal" as const,
  }

  it("contributes both bonuses outside any break while the target's Qi is below full", () => {
    const engine = buffEngineWith(
      { classId: "bellstrikeSplendor", armorSet: "jadeware", targetMaxHp: 100 },
      buffDefsForClass("bellstrikeSplendor"),
      [],
      belowFullQi,
    )
    expect(contributionAt(engine, 25.5, 0)).toBeCloseTo(0.175, 10)
  })

  it("contributes the Affinity DMG alone while the target's Qi is full, whatever its remaining HP", () => {
    const engine = buffEngineWith(
      { classId: "bellstrikeSplendor", armorSet: "jadeware", targetMaxHp: 100 },
      buffDefsForClass("bellstrikeSplendor"),
    )
    expect(contributionAt(engine, 25.5, 40)).toBeCloseTo(0.1, 10)
  })

  it("contributes nothing without the set equipped", () => {
    expect(contributionAt(engineWithSet("hawkwing"), 25.5)).toBeUndefined()
  })
})
