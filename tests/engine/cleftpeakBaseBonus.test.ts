import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { makeSkill } from "../../src/engine/skill"
import { cleftpeak } from "../../src/data/sets/cleftpeak"

const OTHER_CLASS = "bellstrikeUmbra"

function engine(armorSet?: string) {
  return new BuffEngine({ classId: OTHER_CLASS, armorSet }, buffDefsForClass(OTHER_CLASS))
}

function factorFor(engineUnderTest: BuffEngine, skillType: string, time: number) {
  return engineUnderTest.calculateDamageEffects(
    makeSkill(OTHER_CLASS, { name: "probe", skillType }),
    time,
  ).damageFactor
}

describe("Cleftpeak's base ramp is registered as a global gear-set buff", () => {
  it("is listed in GLOBAL_BUFF_DEFS", () => {
    expect(GLOBAL_BUFF_DEFS.some((module) => module.id === BUFF.cleftpeakStacks)).toBe(true)
  })

  it("reaches a class other than Stonesplit Strength once that class wears the set", () => {
    const ridged = engine(cleftpeak.siteKey)
    for (let hit = 0; hit < 5; hit++) ridged.processDamageHit(hit * 0.1)
    expect(factorFor(ridged, "weapon", 0.5)).toBeCloseTo(1.05, 9)
  })

  it("reaches a damage-over-time tick the same as an ordinary hit", () => {
    const ridged = engine(cleftpeak.siteKey)
    for (let hit = 0; hit < 5; hit++) ridged.processDamageHit(hit * 0.1)
    expect(factorFor(ridged, "sustain", 0.5)).toBeCloseTo(factorFor(ridged, "weapon", 0.5), 9)
    expect(factorFor(ridged, "sustain", 0.5)).toBeCloseTo(1.05, 9)
  })

  it("contributes nothing without the set equipped", () => {
    const unequipped = engine()
    unequipped.processDamageHit(0)
    expect(factorFor(unequipped, "weapon", 0)).toBe(1)
  })
})

describe("Cleftpeak's max-stack half stays Stonesplit Strength's own", () => {
  it("is not listed in GLOBAL_BUFF_DEFS", () => {
    expect(GLOBAL_BUFF_DEFS.some((module) => module.id === BUFF.cleftpeakDeflect)).toBe(false)
  })

  it("does not reach a class other than Stonesplit Strength", () => {
    const ids = new Set(buffDefsForClass(OTHER_CLASS).map((module) => module.id))
    expect(ids.has(BUFF.cleftpeakDeflect)).toBe(false)
  })
})
