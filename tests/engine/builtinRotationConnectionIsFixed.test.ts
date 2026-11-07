import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotations this file addresses by id, never by
// asserting an absolute DPS number.
const CLASS = "bellstrikeUmbra"

describe("a built-in rotation runs on its own connection values", () => {
  const [builtin] = builtinRotationsForClass(CLASS)
  const baselineInputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    selectedBuiltinRotationId: builtin.id,
  }

  it("ignores a stored override for it, so the run equals one without the override", () => {
    const withStoredOverride = {
      ...baselineInputs,
      builtinRotationPingFpsOverrides: {
        [builtin.id]: { pingMs: 500, averageFps: 30, serverProcessingMs: 400 },
      },
    } as Inputs

    expect(runEngine(withStoredOverride)).toEqual(runEngine(baselineInputs))
  })
})
