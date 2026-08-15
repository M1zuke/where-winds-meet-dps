// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotations this file addresses by id.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import {
  builtinRotationsForClass,
  builtinSkillsForClass,
  defaultRotationForClass,
} from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import {
  NO_ROTATION_OPTION_ID,
  inputsWithRotationOption,
  rotationOptions,
  selectedRotationOptionId,
  usesCustomRotation,
} from "../../src/ui/features/rotation/rotationOptions"

const classId = "bellstrikeUmbra"
const umbraInputs = { ...defaultInputs, classId }

describe("rotationOptions", () => {
  it("lists the built-ins then the customs, with no synthetic entry in front", () => {
    const mine = makeRotation(classId, { name: "Mine" })
    const options = rotationOptions(classId, [mine])

    expect(options.map((option) => option.id)).toEqual([
      ...builtinRotationsForClass(classId).map((rotation) => rotation.id),
      mine.id,
    ])
    expect(options.map((option) => option.id)).not.toContain(NO_ROTATION_OPTION_ID)
  })

  it("leaves out another class's saved rotations", () => {
    const foreign = makeRotation("stonesplitStrength", { name: "Not mine" })
    const options = rotationOptions(classId, [foreign])

    expect(options.map((option) => option.id)).not.toContain(foreign.id)
  })

  it("marks exactly one built-in as the class default", () => {
    const marked = rotationOptions(classId, []).filter((option) => option.isClassDefault)

    expect(marked).toHaveLength(1)
    expect(marked[0].id).toBe(defaultRotationForClass(classId)!.id)
  })

  it("carries a rotation for every option, so each one can be simulated", () => {
    for (const option of rotationOptions(classId, [makeRotation(classId, { name: "Mine" })])) {
      expect(option.rotation).not.toBeNull()
    }
  })
})

describe("selectedRotationOptionId", () => {
  it("falls back to the class default when nothing is chosen", () => {
    expect(selectedRotationOptionId(umbraInputs)).toBe(defaultRotationForClass(classId)!.id)
  })

  it("is the built-in id when one is chosen", () => {
    const builtin = builtinRotationsForClass(classId)[0]
    const inputs = { ...umbraInputs, selectedBuiltinRotationId: builtin.id }

    expect(selectedRotationOptionId(inputs)).toBe(builtin.id)
  })

  it("prefers an active custom rotation over a selected built-in", () => {
    const mine = makeRotation(classId, { name: "Mine" })
    const inputs = {
      ...umbraInputs,
      activeCustomRotation: mine,
      selectedBuiltinRotationId: builtinRotationsForClass(classId)[0].id,
    }

    expect(selectedRotationOptionId(inputs)).toBe(mine.id)
    expect(usesCustomRotation(inputs)).toBe(true)
  })

  it("ignores an active rotation belonging to another class", () => {
    const foreign = makeRotation("stonesplitStrength", { name: "Not mine" })
    const inputs = { ...umbraInputs, activeCustomRotation: foreign }

    expect(usesCustomRotation(inputs)).toBe(false)
    expect(selectedRotationOptionId(inputs)).toBe(defaultRotationForClass(classId)!.id)
  })

  it("has no selection for a class with no rotations at all", () => {
    expect(selectedRotationOptionId({ ...umbraInputs, classId: "nonexistentClass" })).toBe(
      NO_ROTATION_OPTION_ID,
    )
  })
})

describe("inputsWithRotationOption", () => {
  const multiHitSkill = builtinSkillsForClass(classId).find((skill) => skill.hits.length > 1)!
  const options = rotationOptions(classId, [
    makeRotation(classId, {
      name: "Mine",
      steps: [makeStep({ skillId: multiHitSkill.id, hitCount: 1 })],
    }),
  ])
  const builtin = options.find((option) => option.group === "builtin")!
  const custom = options.find((option) => option.group === "custom")!

  it("records a built-in by id rather than copying it into the custom slot", () => {
    const next = inputsWithRotationOption(umbraInputs, builtin)

    expect(next.selectedBuiltinRotationId).toBe(builtin.id)
    expect(next.activeCustomRotation).toBeNull()
  })

  it("loads a custom rotation and drops any selected built-in", () => {
    const next = inputsWithRotationOption(
      { ...umbraInputs, selectedBuiltinRotationId: builtin.id },
      custom,
    )

    expect(next.activeCustomRotation?.id).toBe(custom.id)
    expect(next.selectedBuiltinRotationId).toBeNull()
  })

  it("re-clamps a saved step's hit count to what the skill now has", () => {
    expect(custom.rotation!.steps[0].hitCount).toBe(1)

    const next = inputsWithRotationOption(umbraInputs, custom)

    expect(next.activeCustomRotation!.steps[0].hitCount).toBe(multiHitSkill.hits.length)
  })

  it("leaves the rest of the build untouched", () => {
    const next = inputsWithRotationOption(umbraInputs, builtin)

    expect({ ...next, selectedBuiltinRotationId: null }).toEqual({
      ...umbraInputs,
      selectedBuiltinRotationId: null,
    })
  })
})
