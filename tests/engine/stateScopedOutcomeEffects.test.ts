import { describe, expect, it } from "vitest"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { finalCritAtLeast, forceOutcome } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

const CLASS = "test"

const anySkill = () => makeSkill(CLASS, { name: "Any", castTag: "any" })

describe("finalCritAtLeast returned from effects(ctx), scoped by phase", () => {
  const module: BuffModule = {
    id: "phase-scoped-crit",
    name: "Phase Scoped Crit",
    alwaysActive: true,
    affectsAll: true,
    duration: 9999,
    summary: "test",
    effects: (ctx) => (ctx.phase === "exhausted" ? [finalCritAtLeast(0.7, 0.15)] : []),
  }

  it("carries the rule only while the scoped phase holds", () => {
    const exhausted = buffEngineWith({}, [], [module], exhaustedFrom(0, 30))
    expect(exhausted.calculateDamageEffects(anySkill(), 1).conditionalFinalCrit).toEqual({
      threshold: 0.7,
      bonusBelowThreshold: 0.15,
    })

    const normalPhase = buffEngineWith({}, [], [module])
    expect(normalPhase.calculateDamageEffects(anySkill(), 1).conditionalFinalCrit).toBeNull()
  })

  it("a module's own declarative conditionalFinalCrit still wins when both are absent from the effect", () => {
    const declarative: BuffModule = {
      id: "declarative-crit",
      name: "Declarative Crit",
      alwaysActive: true,
      affectsAll: true,
      duration: 9999,
      conditionalFinalCrit: { threshold: 0.75, bonusBelowThreshold: 0.1 },
      summary: "test",
      effects: [],
    }
    const engine = buffEngineWith({}, [], [declarative])
    expect(engine.calculateDamageEffects(anySkill(), 1).conditionalFinalCrit).toEqual({
      threshold: 0.75,
      bonusBelowThreshold: 0.1,
    })
  })
})

describe("forceOutcome('noAbrasion') returned from effects(ctx), scoped by another status", () => {
  const gate: BuffModule = {
    id: "gate",
    name: "Gate",
    duration: 9999,
    summary: "test",
    effects: [],
  }
  const module: BuffModule = {
    id: "state-scoped-no-abrasion",
    name: "State Scoped No Abrasion",
    alwaysActive: true,
    affectsAll: true,
    duration: 9999,
    summary: "test",
    effects: (ctx) => (!ctx.status.isActive("gate") ? [forceOutcome("noAbrasion")] : []),
  }

  it("fires only while the other status is down", () => {
    const engine = buffEngineWith({}, [], [gate, module])
    expect(engine.calculateDamageEffects(anySkill(), 1).forceNoAbrasion).toBe(true)

    engine.applyBuff("gate", 1)
    expect(engine.calculateDamageEffects(anySkill(), 1.5).forceNoAbrasion).toBe(false)
  })
})
