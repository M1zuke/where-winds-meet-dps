import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { bleedTick } from "../../src/data/skills/bellstrike-umbra/bleed-tick"
import { bleedDetonation } from "../../src/data/skills/bellstrike-umbra/bleed-detonation"
import { makeSkill } from "../../src/engine/skill"
import type { Skill } from "../../src/engine/skill"

const genericHit = makeSkill("bellstrikeUmbra", {
  name: "Generic Hit",
  castTag: "cast:genericTestHit",
  receives: [BUFF.soulShaken],
})

function engineWithSoulShakenStacks(stacks: number): BuffEngine {
  const engine = new BuffEngine(
    { classId: "bellstrikeUmbra" },
    buffDefsForClass("bellstrikeUmbra"),
    groupBuffDefs(),
  )
  // Spear Heavy's own grant path is ungated — stand in for it directly.
  engine.applyBuff(BUFF.soulShaken, 0, null, stacks)
  return engine
}

function allDamageBoostOf(effects: readonly { statKey: string; amount: number }[]): number {
  return effects
    .filter((effect) => effect.statKey === "allDamageBoost")
    .reduce((sum, effect) => sum + effect.amount, 0)
}

function effectsFor(skill: Skill, stacks = 3) {
  return engineWithSoulShakenStacks(stacks).calculateDamageEffects(skill, 1).effects
}

describe("Soul-Shaken's Qi-only bonus", () => {
  it("adds 0.4 to Bleeding's Qi rate and triples its Qi index, leaving its allDamageBoost stack bonus unchanged", () => {
    const generic = effectsFor(genericHit)
    const bleed = effectsFor(bleedTick)
    expect(allDamageBoostOf(bleed)).toBe(allDamageBoostOf(generic))
    expect(allDamageBoostOf(generic)).toBeCloseTo(0.3, 9)
    expect(bleed).toEqual(
      expect.arrayContaining([
        { statKey: "qiRateAdd", amount: 0.4 },
        { statKey: "qiDamageIndexMultiplier", amount: 2 },
      ]),
    )
    expect(generic.some((effect) => effect.statKey === "qiRateAdd")).toBe(false)
  })

  it("adds 0.3 to Blood Burst's Qi rate only, without a Qi index multiplier", () => {
    const generic = effectsFor(genericHit)
    const detonation = effectsFor(bleedDetonation)
    expect(allDamageBoostOf(detonation)).toBe(allDamageBoostOf(generic))
    expect(detonation).toEqual(expect.arrayContaining([{ statKey: "qiRateAdd", amount: 0.3 }]))
    expect(detonation.some((effect) => effect.statKey === "qiDamageIndexMultiplier")).toBe(false)
  })
})

describe("Qi Imbalance's Qi-only bonus", () => {
  it("adds 10% Qi damage taken in every phase, without touching HP damage outside the break", () => {
    const engine = new BuffEngine(
      { classId: "bellstrikeSplendor", qiBreakTime: 100, bossBreakDuration: 10 },
      buffDefsForClass("bellstrikeSplendor"),
    )
    const effects = engine.calculateDamageEffects(bleedTick, 1, [BUFF.qiImbalance]).effects
    expect(effects).toEqual([
      { statKey: "target.qiDamageTaken", amount: 0.1 },
      // Qi Struggle Enhancement, the class's own always-on Qi bonus.
      { statKey: "qiDamageBoost", amount: 0.1 },
    ])
  })
})
