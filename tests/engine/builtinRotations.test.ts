// Scoped to Bellstrike Umbra — the only implemented class. The other seven
// classes' unverified imported data now lives under `reference/classes/` (see
// CLAUDE.md § "Implemented classes"), so sweeping them here only asserted
// that their rotations parse, which read as validation they have not had.
import { describe, expect, it } from "vitest"
import {
  builtinRotationsForClass,
  builtinSkillsForClass,
  defaultRotationForClass,
} from "../../src/engine/builtinLibrary"
import { resolveRotation } from "../../src/engine/rotation"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"

const CLASS = "bellstrikeUmbra"

describe("builtinRotationsForClass — full rotation set", () => {
  it("exposes at least 2 built-in rotations", () => {
    expect(builtinRotationsForClass(CLASS).length).toBeGreaterThanOrEqual(2)
  })

  it("every returned rotation has at least one step", () => {
    const rotations = builtinRotationsForClass(CLASS)
    expect(rotations.length).toBeGreaterThan(0)
    for (const r of rotations) {
      expect(r.steps.length).toBeGreaterThan(0)
    }
  })
})

describe("defaultRotationForClass — resolves into the built-in set", () => {
  it("the default rotation's id is present in builtinRotationsForClass and has steps", () => {
    const def = defaultRotationForClass(CLASS)
    expect(def).not.toBeNull()
    const all = builtinRotationsForClass(CLASS)
    expect(all.some((r) => r.id === def!.id)).toBe(true)
    expect(def!.steps.length).toBeGreaterThan(0)
  })
})

describe("builtinSkillsForClass — every built-in rotation resolves with zero orphan steps", () => {
  it("resolveRotation reports no missing-skill warning for any rotation", () => {
    const skills = builtinSkillsForClass(CLASS)
    for (const rotation of builtinRotationsForClass(CLASS)) {
      const { warnings } = resolveRotation(rotation, skills, [])
      const orphanWarning = warnings.find((w) => w.includes("missing skill"))
      expect(orphanWarning, `"${rotation.name}": ${warnings.join("; ")}`).toBeUndefined()
    }
  })
})

describe("selectedBuiltinRotationId — changes the computed DPS", () => {
  it("selecting a non-default built-in rotation changes DPS", () => {
    const all = builtinRotationsForClass(CLASS)
    const def = defaultRotationForClass(CLASS)!
    const nonDefault = all.find((r) => r.id !== def.id)
    expect(nonDefault).toBeTruthy()

    const baseline = runEngine({ ...defaultInputs, classId: CLASS })
    const withSelection = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: nonDefault!.id,
    })
    expect(withSelection.dps).not.toBeCloseTo(baseline.dps, 6)
  })

  it("the default rotation yields dps > 0", () => {
    expect(runEngine({ ...defaultInputs, classId: CLASS }).dps).toBeGreaterThan(0)
  })
})
