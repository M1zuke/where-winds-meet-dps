import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"

function engineWithSet(armorSet: string, params: Record<string, unknown> = {}): BuffEngine {
  return new BuffEngine({ classId: "test", armorSet, ...params }, GLOBAL_BUFF_DEFS)
}

describe("Ivorybloom — crit rate and crit damage, permanent on a dummy", () => {
  const martialSkill = makeSkill("test", {
    name: "Any Hit",
    receives: [BUFF.ivorybloomFullHpBonus],
  })

  it("adds the crit rate as an art bonus and the crit damage as a stat, with the set equipped", () => {
    const engine = engineWithSet("ivorybloom")
    const result = engine.calculateDamageEffects(martialSkill, 0)
    expect(result.artBonuses.extraCritRate).toBeCloseTo(0.05, 10)
    expect(result.effects).toContainEqual({ statKey: "critDamageBoost", amount: 0.15 })
  })

  it("contributes nothing without the set equipped", () => {
    const engine = engineWithSet("hawkwing")
    const result = engine.calculateDamageEffects(martialSkill, 0)
    expect(result.artBonuses.extraCritRate).toBeUndefined()
    expect(result.effects).toEqual([])
  })
})

describe("Swaying Heights — damage bonus scales with the target's own remaining HP", () => {
  const anySkill = makeSkill("test", {
    name: "Any Hit",
    receives: [BUFF.swayingHeightsHighHpBonus],
  })
  const boostAt = (fraction: number) => {
    const engine = engineWithSet("swayingHeights", { targetMaxHp: 1000 })
    return engine.calculateDamageEffects(anySkill, 0, [], 1000 * (1 - fraction)).breakdown[
      BUFF.swayingHeightsHighHpBonus
    ]
  }

  it("contributes nothing at or below 50% HP", () => {
    expect(boostAt(0.5)).toBe(0)
    expect(boostAt(0.3)).toBe(0)
  })

  it("contributes +5% just above 50% HP", () => {
    expect(boostAt(0.51)).toBeCloseTo(0.05, 10)
  })

  it("adds +1% per further 5%, capped at +10% from 75% HP up", () => {
    expect(boostAt(0.6)).toBeCloseTo(0.06, 10)
    expect(boostAt(0.75)).toBeCloseTo(0.1, 10)
    expect(boostAt(1)).toBeCloseTo(0.1, 10)
  })
})

describe("Etherwrath — physical/attribute attack stacks on any damaging hit", () => {
  const anySkill = makeSkill("test", { name: "Any Hit", receives: [BUFF.etherwrathAttackBoost] })

  it("grants a stack per damaging hit, up to 5, worth 1% each on every attack term", () => {
    const engine = engineWithSet("etherwrath")
    for (let hitIndex = 0; hitIndex < 6; hitIndex++) engine.processDamageHit(hitIndex, anySkill)
    const result = engine.calculateDamageEffects(anySkill, 5.5)
    expect(result.artBonuses.minPhysPctBonus).toBeCloseTo(0.05, 10)
    expect(result.artBonuses.maxPhysPctBonus).toBeCloseTo(0.05, 10)
    expect(result.artBonuses.attributeAttackPctBonus).toBeCloseTo(0.05, 10)
  })

  it("reaches a skill that never declared it, since the bonus affects every attack", () => {
    const engine = engineWithSet("etherwrath")
    const bystander = makeSkill("test", { name: "Bystander" })
    engine.processDamageHit(0, bystander)
    expect(engine.calculateDamageEffects(bystander, 0.5).artBonuses.minPhysPctBonus).toBeCloseTo(
      0.01,
      10,
    )
  })
})

describe("Etherwrath — 5-stack attribute penetration, gated to the skills that receive it", () => {
  const penetrationReceiver = makeSkill("test", {
    name: "Falcon",
    receives: [BUFF.etherwrathPenetrationBoost],
  })

  it("contributes nothing below 5 stacks", () => {
    const engine = engineWithSet("etherwrath")
    for (let hitIndex = 0; hitIndex < 4; hitIndex++)
      engine.processDamageHit(hitIndex, penetrationReceiver)
    const result = engine.calculateDamageEffects(penetrationReceiver, 3.5)
    expect(result.artBonuses.minPhysPctBonus).toBeCloseTo(0.04, 10)
    expect(result.effects).toEqual([])
  })

  it("adds +4% attribute penetration of all four types once 5 stacks are reached", () => {
    const engine = engineWithSet("etherwrath")
    for (let hitIndex = 0; hitIndex < 5; hitIndex++)
      engine.processDamageHit(hitIndex, penetrationReceiver)
    const result = engine.calculateDamageEffects(penetrationReceiver, 4.5)
    expect(result.effects).toContainEqual({ statKey: "bellstrike.penetration", amount: 0.04 })
    expect(result.effects).toContainEqual({ statKey: "stonesplit.penetration", amount: 0.04 })
    expect(result.effects).toContainEqual({ statKey: "silkbind.penetration", amount: 0.04 })
    expect(result.effects).toContainEqual({ statKey: "bamboocut.penetration", amount: 0.04 })
  })

  it("contributes nothing to a skill outside its own receives list", () => {
    const engine = engineWithSet("etherwrath")
    for (let hitIndex = 0; hitIndex < 5; hitIndex++)
      engine.processDamageHit(hitIndex, penetrationReceiver)
    const other = makeSkill("test", { name: "Other" })
    const result = engine.calculateDamageEffects(other, 4.5)
    expect(result.effects).toEqual([])
  })
})

describe("Starweave — Martial Art Skill damage bonus, gated to the skills that receive it", () => {
  const martialSkill = makeSkill("test", {
    name: "Martial Art Skill",
    tags: [PROP.isMartialSkillQ],
    receives: [BUFF.starweaveMartialBoost],
  })
  const otherSkill = makeSkill("test", { name: "Other Skill" })

  it("does not reach a skill outside its own receives list", () => {
    const engine = engineWithSet("starweave")
    engine.processDamageHit(0, martialSkill)
    expect(
      engine.calculateDamageEffects(otherSkill, 0.5).breakdown[BUFF.starweaveMartialBoost],
    ).toBe(undefined)
  })

  it("ramps 3%/stack up to 5 stacks, at most 2 grants per second", () => {
    const engine = engineWithSet("starweave")
    engine.processDamageHit(0, martialSkill)
    engine.processDamageHit(0.1, martialSkill)
    engine.processDamageHit(0.2, martialSkill)
    expect(
      engine.calculateDamageEffects(martialSkill, 0.3).breakdown[BUFF.starweaveMartialBoost],
    ).toBeCloseTo(0.06, 10)
  })

  it("adds a further per-stack bonus at 4+ meters of target distance", () => {
    const engine = engineWithSet("starweave", { distanceMeters: 8 })
    engine.processDamageHit(0, martialSkill)
    expect(
      engine.calculateDamageEffects(martialSkill, 0.5).breakdown[BUFF.starweaveMartialBoost],
    ).toBeCloseTo(0.04, 10)
  })
})

// In-game Martial Art Skill roster as of 2026-09-24, independent of which
// built-in skill files already carry PROP.isMartialSkillQ — a skill missing
// from the tag entirely (Realmplay, once) would otherwise never surface.
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

describe("Starweave reach — every Martial Art Skill across every registered class", () => {
  it.each(Object.keys(MARTIAL_ART_SKILL_IDS))("%s", (classId) => {
    const skills = builtinSkillsForClass(classId)
    const missing = MARTIAL_ART_SKILL_IDS[classId]!.filter((id) => {
      const skill = skills.find((candidate) => candidate.id === id)
      return (
        !skill ||
        !skill.tags?.includes(PROP.isMartialSkillQ) ||
        !skill.receives?.includes(BUFF.starweaveMartialBoost)
      )
    })
    expect(missing).toEqual([])
  })
})

describe("Swallowcall — Light Attack HP damage bonus, gated to the skills that receive it", () => {
  it("contributes +12% to a skill that declares it, nothing to one that doesn't", () => {
    const engine = engineWithSet("swallowcall")
    const lightAttack = makeSkill("test", {
      name: "Light Attack",
      receives: [BUFF.swallowcallLightAttackBoost],
    })
    const other = makeSkill("test", { name: "Other" })
    expect(
      engine.calculateDamageEffects(lightAttack, 0).breakdown[BUFF.swallowcallLightAttackBoost],
    ).toBeCloseTo(0.12, 10)
    expect(
      engine.calculateDamageEffects(other, 0).breakdown[BUFF.swallowcallLightAttackBoost],
    ).toBeUndefined()
  })
})

describe("Swallowcall — conditional +6% physical/attribute attack vs a low-Qi or Qi-Imbalanced target", () => {
  const lightAttack = makeSkill("test", {
    name: "Light Attack",
    receives: [BUFF.swallowcallLightAttackBoost],
  })

  it("contributes nothing against a target at full Qi with no Qi Imbalance", () => {
    const engine = engineWithSet("swallowcall", { qiBreakTime: 100, bossBreakDuration: 10 })
    const result = engine.calculateDamageEffects(lightAttack, 0)
    expect(result.artBonuses.minPhysPctBonus).toBeUndefined()
  })

  it("adds +6% physical and attribute attack once the target's Qi bar has broken", () => {
    const engine = engineWithSet("swallowcall", { qiBreakTime: 1, bossBreakDuration: 10 })
    const result = engine.calculateDamageEffects(lightAttack, 1.5)
    expect(result.artBonuses.minPhysPctBonus).toBeCloseTo(0.06, 10)
    expect(result.artBonuses.maxPhysPctBonus).toBeCloseTo(0.06, 10)
    expect(result.artBonuses.attributeAttackPctBonus).toBeCloseTo(0.06, 10)
  })

  it("adds it against a target in Qi Imbalance even at full Qi", () => {
    const engine = new BuffEngine(
      {
        classId: "bellstrikeSplendor",
        armorSet: "swallowcall",
        qiBreakTime: 100,
        bossBreakDuration: 10,
      },
      buffDefsForClass("bellstrikeSplendor"),
    )
    engine.triggerDeclaredBuffs([BUFF.qiImbalance], "cast:test", 0)
    const result = engine.calculateDamageEffects(lightAttack, 2)
    expect(result.artBonuses.minPhysPctBonus).toBeCloseTo(0.06, 10)
  })
})

describe("Swift Gale — airborne Heavy Attack bonus, unreachable by any built-in skill", () => {
  it.each(CLASS_IDS())("%s carries no receiver for it", (classId) => {
    const receivers = builtinSkillsForClass(classId).filter((skill) =>
      skill.receives?.includes(BUFF.swiftGaleAirborneHeavyBoost),
    )
    expect(receivers).toEqual([])
  })
})
