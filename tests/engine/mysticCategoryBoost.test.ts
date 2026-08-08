import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass, builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

function rotationOf(classId: string, skillNames: string[]) {
  const skills = builtinSkillsForClass(classId)
  const steps = skillNames.map((name) => {
    const skill = skills.find((s) => s.name === name)
    if (!skill) throw new Error(`no built-in skill "${name}" for ${classId}`)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation(classId, { name: `test-${skillNames.join("+")}`, steps })
}

function dotDamage(r: ReturnType<typeof simulateTimeline>, name: string): number {
  return r.perSkill
    .filter((p) => p.name.includes(name) && p.name.includes("(DoT)"))
    .reduce((a, p) => a + p.expectedDamage, 0)
}

function totalOf(classId: string, skillNames: string[], overrides: Partial<Inputs> = {}): number {
  const rotation = rotationOf(classId, skillNames)
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
    const skills = builtinSkillsForClass("bellstrikeUmbra")
    const tagOf = (name: string) => skills.find((s) => s.name === name)?.tags ?? []
    expect(tagOf("Poet1")).toContain("mystic:burst")
    expect(tagOf("Dragon's Breath 1 Hit")).toContain("mystic:burst")
    expect(tagOf("Soaring")).toContain("mystic:control")
    expect(tagOf("Toad[Cancel]")).toContain("mystic:area-debuff")
    expect(tagOf("Flute of the Tides Cancel")).toContain("mystic:area-damage")
    expect(tagOf("Flute of the Tides Full")).toContain("mystic:area")
  })

  it("builtinDebuffsForClass(bellstrikeUmbra) DoTs carry the applying skill's mystic category", () => {
    const debuffs = builtinDebuffsForClass("bellstrikeUmbra")
    const catOf = (name: string) => debuffs.find((d) => d.name === name)?.dot?.mysticCategory
    expect(catOf("Combustion")).toBe("burst")
    expect(catOf("Smolder")).toBe("burst")
    expect(catOf("Toad Poison")).toBe("area-debuff")
    expect(catOf("Flute Ripple")).toBe("area-damage")
    expect(catOf("Bleed Tick")).toBeFalsy()
  })
})

describe("the merged Single-Target Mystic Skill DMG Boost moves both single-target categories", () => {
  it("raises totalDamage for a burst-only rotation (Dragon's Breath + Drunken Poet)", () => {
    const skillNames = ["Dragon's Breath 1 Hit", "Poet1", "Poet2"]
    const base = totalOf("bellstrikeUmbra", skillNames, { singleMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillNames, { singleMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })

  it("raises totalDamage for a control-only rotation (Soaring)", () => {
    const skillNames = ["Soaring"]
    const base = totalOf("bellstrikeUmbra", skillNames, { singleMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillNames, { singleMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })
})

describe("mystic DoT ticks inherit the boost of the ability that applies them", () => {
  it("Combustion (DoT) grows with Single-Target Mystic Skill DMG Boost on a burst rotation", () => {
    const skillNames = ["Dragon's Breath 1 Hit", "Poet1", "Poet2"]
    const base = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", skillNames),
      singleMysticBoost: 0,
    })
    const boosted = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", skillNames),
      singleMysticBoost: 0.1,
    })
    const baseCombustion = dotDamage(base, "Combustion")
    const boostedCombustion = dotDamage(boosted, "Combustion")
    expect(baseCombustion).toBeGreaterThan(0)
    expect(boostedCombustion).toBeGreaterThan(baseCombustion)
  })
})

describe("the merged Area Mystic Skill DMG Boost moves every area category", () => {
  const burstNames = ["Dragon's Breath 1 Hit", "Poet1", "Poet2"]

  it("raises a Toad[Cancel] (area-debuff) rotation, incl. its Toad Poison DoT", () => {
    const toadNames = [
      "Toad[Cancel]",
      "Toad[Cancel]",
      "Toad[Cancel]",
      "Toad[Cancel]",
      "Toad[Cancel]",
    ]

    const toadBase = totalOf("bellstrikeUmbra", toadNames, { areaMysticBoost: 0 })
    const toadBoosted = totalOf("bellstrikeUmbra", toadNames, { areaMysticBoost: 0.1 })
    expect(toadBoosted).toBeGreaterThan(toadBase)

    const toadBaseSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", toadNames),
      areaMysticBoost: 0,
    })
    const toadBoostedSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", toadNames),
      areaMysticBoost: 0.1,
    })
    expect(dotDamage(toadBoostedSim, "Toad Poison")).toBeGreaterThan(
      dotDamage(toadBaseSim, "Toad Poison"),
    )
  })

  it("raises a Flute of the Tides Cancel (area-damage) rotation, incl. its Flute Ripple DoT", () => {
    const fluteNames = [
      "Flute of the Tides Cancel",
      "Flute of the Tides Cancel",
      "Flute of the Tides Cancel",
    ]

    const fluteBase = totalOf("bellstrikeUmbra", fluteNames, { areaMysticBoost: 0 })
    const fluteBoosted = totalOf("bellstrikeUmbra", fluteNames, { areaMysticBoost: 0.1 })
    expect(fluteBoosted).toBeGreaterThan(fluteBase)

    const fluteBaseSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", fluteNames),
      areaMysticBoost: 0,
    })
    const fluteBoostedSim = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", fluteNames),
      areaMysticBoost: 0.1,
    })
    expect(dotDamage(fluteBoostedSim, "Flute Ripple")).toBeGreaterThan(
      dotDamage(fluteBaseSim, "Flute Ripple"),
    )
  })

  it("raises a Flute of the Tides Full (plain `mystic:area`) rotation", () => {
    const skillNames = ["Flute of the Tides Full"]
    const base = totalOf("bellstrikeUmbra", skillNames, { areaMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", skillNames, { areaMysticBoost: 0.1 })
    expect(boosted).toBeGreaterThan(base)
  })

  it("leaves a burst rotation untouched", () => {
    const base = totalOf("bellstrikeUmbra", burstNames, { areaMysticBoost: 0 })
    const boosted = totalOf("bellstrikeUmbra", burstNames, { areaMysticBoost: 0.1 })
    expect(boosted).toBe(base)
  })

  it("is not moved by the single-target stat, and vice versa", () => {
    const toadNames = ["Toad[Cancel]", "Toad[Cancel]"]
    const toadBase = totalOf("bellstrikeUmbra", toadNames, { singleMysticBoost: 0 })
    const toadBoosted = totalOf("bellstrikeUmbra", toadNames, { singleMysticBoost: 0.1 })
    expect(toadBoosted).toBe(toadBase)
  })
})

describe("negative cases — unaffected skills", () => {
  it("neither mystic stat changes a weapon-only rotation", () => {
    const skillNames = ["Sword Martial Q", "SpearQ"]
    const base = totalOf("bellstrikeUmbra", skillNames, {
      singleMysticBoost: 0,
      areaMysticBoost: 0,
    })
    const boosted = totalOf("bellstrikeUmbra", skillNames, {
      singleMysticBoost: 0.1,
      areaMysticBoost: 0.1,
    })
    expect(boosted).toBe(base)
  })
})
