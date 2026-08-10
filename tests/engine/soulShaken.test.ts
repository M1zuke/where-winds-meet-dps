// Soul Shaken (hand-ported in `src/engine/buffs/mechanics.ts` since it lives
// in the `debuffDefinitions` bucket the extractor doesn't read).
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { mechanicBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

function bleedTick(tags: string[] = []) {
  return makeSkill("test", { name: "Bleed Tick", skillType: "sustain", tags })
}

function allDamageBoostSum(effects: { statKey: string; amount: number }[]): number {
  return effects
    .filter((effect) => effect.statKey === "allDamageBoost")
    .reduce((sum, effect) => sum + effect.amount, 0)
}

describe("Soul Shaken — BuffEngine unit", () => {
  const TIER_6 = { wolfchasersArt: true, wolfchasersArtTier: 6 }

  it("SpearHeavy (5-hit cast) ramps to 5 stacks ⇒ +50% all-damage on Bleed Tick", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearHeavy", 0, { hitCount: 5, castTime: 1.5 })
    const result = engine.calculateDamageEffects(bleedTick(), 1.6)
    expect(allDamageBoostSum(result.effects)).toBeCloseTo(0.5, 6)
  })

  it("does not affect an unrelated skill", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearHeavy", 0, { hitCount: 5, castTime: 1.5 })
    const result = engine.calculateDamageEffects(makeSkill("test", { name: "Other" }), 1.6)
    expect(result.effects).toHaveLength(0)
  })

  it("neither SpearHeavy nor SpearQ grants a stack without wolfchasersArt tier 6 — one shared gate", () => {
    const engine = new BuffEngine({}, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearHeavy1Hit", 0, {})
    engine.processSkillCast("cast:spearQ", 1, {})
    const result = engine.calculateDamageEffects(bleedTick(), 1.1)
    expect(result.effects).toHaveLength(0)
  })

  it("SpearHeavy and SpearQ casts stack into the same Soul Shaken window", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearHeavy1Hit", 0, {})
    engine.processSkillCast("cast:spearQ", 1, {})
    const result = engine.calculateDamageEffects(bleedTick(), 1.1)
    expect(allDamageBoostSum(result.effects)).toBeCloseTo(0.2, 6)
  })

  it("SpearQ grants a stack at wolfchasersArt tier 6 even when Soul Shaken isn't already active", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearQ", 0, {})
    const result = engine.calculateDamageEffects(bleedTick(), 0.1)
    expect(allDamageBoostSum(result.effects)).toBeCloseTo(0.1, 6)
  })

  it("a single 5-hit SpearQ cast at wolfchasersArt tier 6 stacks Soul Shaken to 5 (+50%)", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearQ", 0, { hitCount: 5, castTime: 1.417 })
    const result = engine.calculateDamageEffects(bleedTick(), 1.5)
    expect(allDamageBoostSum(result.effects)).toBeCloseTo(0.5, 6)
  })

  it("a later SpearQ cast renews Soul Shaken instead of letting the window lapse", () => {
    const engine = new BuffEngine(TIER_6, [], mechanicBuffDefs())
    engine.processSkillCast("cast:spearQ", 0, { hitCount: 5, castTime: 1.417 })
    engine.processSkillCast("cast:spearQ", 20, { hitCount: 5, castTime: 1.417 })
    const result = engine.calculateDamageEffects(bleedTick(), 30)
    expect(allDamageBoostSum(result.effects)).toBeCloseTo(0.5, 6)
  })
})

describe("Soul Shaken — end to end through simulateTimeline", () => {
  it("boosts bellstrikeUmbra's Bleed Tick DoT damage relative to a build without wolfchasersArt (default rotation already casts SpearHeavy + SpearQ)", () => {
    const rotation = defaultRotationForClass("bellstrikeUmbra")!
    const withoutWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const withWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "Wolfchaser's Art", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const before = simulateTimeline(withoutWolf)
    const after = simulateTimeline(withWolf)
    const bleedDamage = (timeline: ReturnType<typeof simulateTimeline>) =>
      timeline.perSkill
        .filter((skill) => skill.name.startsWith("Bleed Tick"))
        .reduce((sum, skill) => sum + skill.expectedDamage, 0)
    expect(bleedDamage(after)).toBeGreaterThan(bleedDamage(before))
  })
})
