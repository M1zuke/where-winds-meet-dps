// Bleed ticks and Blood Burst are Sword-typed (lvl-110 workbook
// skill-type column), so they take swordBoost AND allMartialBoost like any
// Sword skill; mystic skills and their DoTs take neither. Guards the
// data-driven typing against a reintroduced per-skill exclusion.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

function rotationOf(skillNames: string[]) {
  const skills = builtinSkillsForClass("bellstrikeUmbra")
  const steps = skillNames.map((name) => {
    const skill = skills.find((s) => s.name === name)
    if (!skill) throw new Error(`no built-in skill "${name}" for bellstrikeUmbra`)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation("bellstrikeUmbra", { name: `test-${skillNames.join("+")}`, steps })
}

function simulate(skillNames: string[], overrides: Partial<Inputs> = {}) {
  return simulateTimeline({
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    activeCustomRotation: rotationOf(skillNames),
    ...overrides,
  })
}

function damageOf(result: ReturnType<typeof simulateTimeline>, name: string): number {
  return result.perSkill
    .filter((p) => p.name === name)
    .reduce((sum, p) => sum + p.expectedDamage, 0)
}

// 6 hits of the canDetonate 3-hit skill ⇒ bleed ticks plus exactly one
// detonation (see bleedDetonation.test.ts).
const BLEED_ROTATION = ["SwordSpecial 3-Hit", "SwordSpecial 3-Hit"]
const BURST_ROTATION = ["Dragon's Breath 1 Hit", "Poet1", "Poet2"]

describe("all-martial and sword boost reach every Sword-typed row", () => {
  const base = simulate(BLEED_ROTATION)

  it("allMartialBoost raises Bleeding ticks and Blood Burst", () => {
    const boosted = simulate(BLEED_ROTATION, { allMartialBoost: 0.1 })
    expect(damageOf(base, "Bleeding (DoT)")).toBeGreaterThan(0)
    expect(damageOf(boosted, "Bleeding (DoT)")).toBeGreaterThan(damageOf(base, "Bleeding (DoT)"))
    expect(damageOf(base, "Blood Burst")).toBeGreaterThan(0)
    expect(damageOf(boosted, "Blood Burst")).toBeGreaterThan(damageOf(base, "Blood Burst"))
  })

  it("swordBoost raises Bleeding ticks and Blood Burst", () => {
    const boosted = simulate(BLEED_ROTATION, { swordBoost: 0.1 })
    expect(damageOf(boosted, "Bleeding (DoT)")).toBeGreaterThan(damageOf(base, "Bleeding (DoT)"))
    expect(damageOf(boosted, "Blood Burst")).toBeGreaterThan(damageOf(base, "Blood Burst"))
  })

  it("per point, allMartialBoost and swordBoost are identical on an all-Sword rotation", () => {
    const viaAllMartial = simulate(BLEED_ROTATION, { allMartialBoost: 0.05 })
    const viaSword = simulate(BLEED_ROTATION, { swordBoost: 0.05 })
    expect(viaAllMartial.totalDamage).toBeCloseTo(viaSword.totalDamage, 6)
  })
})

describe("mystic skills and their DoTs take neither weapon boost", () => {
  it("allMartialBoost and swordBoost leave a burst-mystic rotation (incl. Combustion DoT) untouched", () => {
    const base = simulate(BURST_ROTATION)
    const boosted = simulate(BURST_ROTATION, { allMartialBoost: 0.1, swordBoost: 0.1 })
    expect(damageOf(base, "Combustion (DoT)")).toBeGreaterThan(0)
    expect(boosted.totalDamage).toBe(base.totalDamage)
  })

  it("singleMysticBoost leaves the bleed rotation untouched", () => {
    const base = simulate(BLEED_ROTATION)
    const boosted = simulate(BLEED_ROTATION, { singleMysticBoost: 0.1 })
    expect(boosted.totalDamage).toBe(base.totalDamage)
  })
})
