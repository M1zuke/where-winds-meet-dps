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

describe("Soul Shaken — BuffEngine unit", () => {
  it("SpearHeavy (5-hit cast) ramps to 5 stacks ⇒ +50% all-damage on Bleed Tick", () => {
    const e = new BuffEngine({}, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearHeavy", 0, { hitCount: 5, castTime: 1.5 })
    const r = e.calculateDamageEffects(bleedTick(), 1.6)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.5, 6)
  })

  it("does not affect an unrelated skill", () => {
    const e = new BuffEngine({}, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearHeavy", 0, { hitCount: 5, castTime: 1.5 })
    const r = e.calculateDamageEffects(makeSkill("test", { name: "Other" }), 1.6)
    expect(r.effects).toHaveLength(0)
  })

  it("SpearQ grants no stack without wolfchasersArt tier 6, even while Soul Shaken is active", () => {
    const e = new BuffEngine({}, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearHeavy1Hit", 0, {})
    e.processSkillCast("cast:spearQ", 1, {})
    const r = e.calculateDamageEffects(bleedTick(), 1.1)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.1, 6)
  })

  it("SpearQ grants a stack at wolfchasersArt tier 6 even when Soul Shaken isn't already active", () => {
    const params = { wolfchasersArt: true, wolfchasersArtTier: 6 }
    const e = new BuffEngine(params, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearQ", 0, {})
    const r = e.calculateDamageEffects(bleedTick(), 0.1)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.1, 6)
  })

  it("a single 5-hit SpearQ cast at wolfchasersArt tier 6 stacks Soul Shaken to 5 (+50%)", () => {
    const params = { wolfchasersArt: true, wolfchasersArtTier: 6 }
    const e = new BuffEngine(params, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearQ", 0, { hitCount: 5, castTime: 1.417 })
    const r = e.calculateDamageEffects(bleedTick(), 1.5)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.5, 6)
  })

  it("a later SpearQ cast renews Soul Shaken instead of letting the window lapse", () => {
    const params = { wolfchasersArt: true, wolfchasersArtTier: 6 }
    const e = new BuffEngine(params, [], mechanicBuffDefs())
    e.processSkillCast("cast:spearQ", 0, { hitCount: 5, castTime: 1.417 })
    e.processSkillCast("cast:spearQ", 20, { hitCount: 5, castTime: 1.417 })
    const r = e.calculateDamageEffects(bleedTick(), 30)
    const total = r.effects
      .filter((x) => x.statKey === "allDamageBoost")
      .reduce((a, b) => a + b.amount, 0)
    expect(total).toBeCloseTo(0.5, 6)
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
    const bleedDmg = (r: ReturnType<typeof simulateTimeline>) =>
      r.perSkill
        .filter((p) => p.name.startsWith("Bleed Tick"))
        .reduce((a, p) => a + p.expectedDamage, 0)
    expect(bleedDmg(after)).toBeGreaterThan(bleedDmg(before))
  })
})
