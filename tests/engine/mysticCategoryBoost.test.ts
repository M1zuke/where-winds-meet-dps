import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinDebuff, builtinSkill, dotRow } from "../builtins"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

function rotationOf(classId: string, skillIds: string[]) {
  const steps = skillIds.map((skillId) => {
    const skill = builtinSkill(classId, skillId)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation(classId, { name: `test-${skillIds.join("+")}`, steps })
}

function dotDamage(r: ReturnType<typeof simulateTimeline>, debuffId: string): number {
  return r.perSkill
    .filter((p) => p.name === dotRow("bellstrikeUmbra", debuffId))
    .reduce((a, p) => a + p.expectedDamage, 0)
}

function totalOf(classId: string, skillIds: string[], overrides: Partial<Inputs> = {}): number {
  const rotation = rotationOf(classId, skillIds)
  const inputs: Inputs = {
    ...defaultInputs,
    classId,
    activeCustomRotation: rotation,
    ...overrides,
  }
  return simulateTimeline(inputs).totalDamage
}

describe("data sanity — mystic category tags", () => {
  it("bellstrikeUmbra's built-in skills carry the expected mystic:* tags", () => {
    const tagOf = (skillId: string) => builtinSkill("bellstrikeUmbra", skillId).tags ?? []
    expect(tagOf(UNIVERSAL_SKILL.poet1)).toContain("mystic:burst")
    expect(tagOf(UNIVERSAL_SKILL.fireBreath1Hit)).toContain("mystic:burst")
    expect(tagOf(UNIVERSAL_SKILL.soaring)).toContain("mystic:control")
    expect(tagOf(UNIVERSAL_SKILL.toadCancel)).toContain("mystic:area-debuff")
    expect(tagOf(UNIVERSAL_SKILL.fluteOfTheTidesCancel)).toContain("mystic:area-damage")
    expect(tagOf(UNIVERSAL_SKILL.fluteOfTheTidesFull)).toContain("mystic:area")
  })

  it("builtinDebuffsForClass(bellstrikeUmbra) DoTs carry the applying skill's mystic category", () => {
    const catOf = (debuffId: string) =>
      builtinDebuff("bellstrikeUmbra", debuffId).dot?.mysticCategory
    expect(catOf(DEBUFF.combustion)).toBe("burst")
    expect(catOf(DEBUFF.darkFire)).toBe("burst")
    expect(catOf(DEBUFF.toadPoison)).toBe("area-debuff")
    expect(catOf(DEBUFF.fluteRipple)).toBe("area-damage")
    expect(catOf(DEBUFF.bleedTick)).toBeFalsy()
  })
})

describe("the merged Single-Target Mystic Skill DMG Boost moves both single-target categories", () => {
  it("raises totalDamage for a burst-only rotation (Dragon's Breath + Drunken Poet)", () => {
    const skillIds = [UNIVERSAL_SKILL.fireBreath1Hit, UNIVERSAL_SKILL.poet1, UNIVERSAL_SKILL.poet2]
    const base = totalOf("bellstrikeUmbra", skillIds, { singleMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillIds, { singleMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })

  it("raises totalDamage for a control-only rotation (Soaring)", () => {
    const skillIds = [UNIVERSAL_SKILL.soaring]
    const base = totalOf("bellstrikeUmbra", skillIds, { singleMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillIds, { singleMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })
})

describe("mystic DoT ticks inherit the boost of the ability that applies them", () => {
  it("Combustion (DoT) grows with Single-Target Mystic Skill DMG Boost on a burst rotation", () => {
    const skillIds = [UNIVERSAL_SKILL.fireBreath1Hit, UNIVERSAL_SKILL.poet1, UNIVERSAL_SKILL.poet2]
    const base = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", skillIds),
      singleMysticBoost: 0,
    })
    const boosted = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", skillIds),
      singleMysticBoost: 0.1,
    })
    const baseCombustion = dotDamage(base, DEBUFF.combustion)
    const boostedCombustion = dotDamage(boosted, DEBUFF.combustion)
    expect(baseCombustion).toBeGreaterThan(0)
    expect(boostedCombustion).toBeGreaterThan(baseCombustion)
  })
})

describe("the merged Area Mystic Skill DMG Boost moves every area category", () => {
  const burstIds = [UNIVERSAL_SKILL.fireBreath1Hit, UNIVERSAL_SKILL.poet1, UNIVERSAL_SKILL.poet2]

  it("raises a Toad[Cancel] (area-debuff) rotation, incl. its Toad Poison DoT", () => {
    const toadIds = [
      UNIVERSAL_SKILL.toadCancel,
      UNIVERSAL_SKILL.toadCancel,
      UNIVERSAL_SKILL.toadCancel,
      UNIVERSAL_SKILL.toadCancel,
      UNIVERSAL_SKILL.toadCancel,
    ]

    const toadBase = totalOf("bellstrikeUmbra", toadIds, { areaMysticBoost: 0 })
    const toadBoosted = totalOf("bellstrikeUmbra", toadIds, { areaMysticBoost: 0.1 })
    expect(toadBoosted).toBeGreaterThan(toadBase)

    const toadBaseSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", toadIds),
      areaMysticBoost: 0,
    })
    const toadBoostedSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", toadIds),
      areaMysticBoost: 0.1,
    })
    expect(dotDamage(toadBoostedSim, DEBUFF.toadPoison)).toBeGreaterThan(
      dotDamage(toadBaseSim, DEBUFF.toadPoison),
    )
  })

  it("raises a Flute of the Tides Cancel (area-damage) rotation, incl. its Flute Ripple DoT", () => {
    const fluteIds = [
      UNIVERSAL_SKILL.fluteOfTheTidesCancel,
      UNIVERSAL_SKILL.fluteOfTheTidesCancel,
      UNIVERSAL_SKILL.fluteOfTheTidesCancel,
    ]

    const fluteBase = totalOf("bellstrikeUmbra", fluteIds, { areaMysticBoost: 0 })
    const fluteBoosted = totalOf("bellstrikeUmbra", fluteIds, { areaMysticBoost: 0.1 })
    expect(fluteBoosted).toBeGreaterThan(fluteBase)

    const fluteBaseSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", fluteIds),
      areaMysticBoost: 0,
    })
    const fluteBoostedSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", fluteIds),
      areaMysticBoost: 0.1,
    })
    expect(dotDamage(fluteBoostedSim, DEBUFF.fluteRipple)).toBeGreaterThan(
      dotDamage(fluteBaseSim, DEBUFF.fluteRipple),
    )
  })

  it("raises a Flute of the Tides Full (plain `mystic:area`) rotation", () => {
    const skillIds = [UNIVERSAL_SKILL.fluteOfTheTidesFull]
    const base = totalOf("bellstrikeUmbra", skillIds, { areaMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillIds, { areaMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })

  it("leaves a burst rotation untouched", () => {
    const base = totalOf("bellstrikeUmbra", burstIds, { areaMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", burstIds, { areaMysticBoost: 0.1 })
    expect(boosted).toBe(base)
  })

  it("is not moved by the single-target stat, and vice versa", () => {
    const toadIds = [UNIVERSAL_SKILL.toadCancel, UNIVERSAL_SKILL.toadCancel]
    const toadBase = totalOf("bellstrikeUmbra", toadIds, { singleMysticBoost: 0 })
    const toadBoosted = totalOf("bellstrikeUmbra", toadIds, { singleMysticBoost: 0.1 })
    expect(toadBoosted).toBe(toadBase)
  })
})

describe("negative cases — unaffected skills", () => {
  it("neither mystic stat changes a weapon-only rotation", () => {
    const skillIds = [SKILL.swordq, SKILL.spearq]
    const base = totalOf("bellstrikeUmbra", skillIds, {
      singleMysticBoost: 0,
      areaMysticBoost: 0,
    })
    const boosted = totalOf("bellstrikeUmbra", skillIds, {
      singleMysticBoost: 0.1,
      areaMysticBoost: 0.1,
    })
    expect(boosted).toBe(base)
  })
})
