import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, makeHit } from "../../src/engine/skill"

// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotations this file addresses by id, never by
// asserting an absolute DPS number.
const CLASS = "bellstrikeUmbra"

describe("a profile's built-in rotation ping/fps override changes only that rotation's latency", () => {
  const [builtinA, builtinB] = builtinRotationsForClass(CLASS)

  it("shifts the overridden built-in's first cast time and leaves the other built-in's untouched", () => {
    const baselineA = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtinA.id,
    })
    const baselineB = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtinB.id,
    })

    const overrides = { [builtinA.id]: { pingMs: 500, averageFps: 30 } }
    const overriddenA = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtinA.id,
      builtinRotationPingFpsOverrides: overrides,
    })
    const stillBaselineB = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtinB.id,
      builtinRotationPingFpsOverrides: overrides,
    })

    expect(overriddenA.casts![0].timeSec).not.toBeCloseTo(baselineA.casts![0].timeSec, 5)
    expect(stillBaselineB.casts![0].timeSec).toBeCloseTo(baselineB.casts![0].timeSec, 10)
  })
})

describe("a custom rotation ignores the built-in ping/fps override map and keeps its own values", () => {
  it("runs at its own zero-latency setting even when the override map names its id", () => {
    const skill = makeSkill(CLASS, { name: "Solo", castFrames: 10, hits: [makeHit()] })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      pingMs: 0,
      averageFps: 60,
    })
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      customSkills: [skill],
      activeCustomRotation: rotation,
      builtinRotationPingFpsOverrides: { [rotation.id]: { pingMs: 500, averageFps: 30 } },
    })

    expect(result.casts![0].timeSec).toBe(0)
  })
})
