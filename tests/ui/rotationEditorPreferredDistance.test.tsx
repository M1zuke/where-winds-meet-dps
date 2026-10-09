// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotations this file addresses by id.
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

const CLASS = "bellstrikeUmbra"
const FLUTE_ROTATION_ID = "builtin-bellstrikeUmbra-36-bbs"
const LABEL = "Preferred distance to target (m)"

function renderPanel(inputs: Inputs, onChange: (next: Inputs) => void) {
  const result = runEngine(inputs)
  render(
    <I18nProvider>
      <ConfirmProvider>
        <RotationEditorPanel inputs={inputs} onChange={onChange} result={result} />
      </ConfirmProvider>
    </I18nProvider>,
  )
}

function customInputs(skillIds: readonly string[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
    selectedBuiltinRotationId: null,
  }
}

describe("Bellstrike Umbra's built-in rotations", () => {
  it("all start the fight at 6 m", () => {
    for (const rotation of builtinRotationsForClass(CLASS))
      expect(rotation.preferredDistanceMeters, rotation.id).toBe(6)
  })
})

describe("the Rotation Editor's preferred distance for a built-in rotation", () => {
  it("shows the built-in's own distance and cannot be edited", () => {
    renderPanel(
      { ...defaultInputs, classId: CLASS, selectedBuiltinRotationId: FLUTE_ROTATION_ID },
      vi.fn(),
    )

    const input = screen.getByLabelText(LABEL) as HTMLInputElement
    expect(input.value).toBe("6")
    expect(input.disabled).toBe(true)
  })
})

describe("the Rotation Editor's preferred distance for a custom rotation", () => {
  it("writes the rotation itself", () => {
    const onChange = vi.fn()
    renderPanel(customInputs([MYSTIC_SKILL.fluteOfTheTidesFull]), onChange)

    fireEvent.change(screen.getByLabelText(LABEL), { target: { value: "8" } })

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.preferredDistanceMeters).toBe(8)
  })

  it("clamps a distance beyond the longest reach", () => {
    const onChange = vi.fn()
    renderPanel(customInputs([MYSTIC_SKILL.fluteOfTheTidesFull]), onChange)

    fireEvent.change(screen.getByLabelText(LABEL), { target: { value: "99" } })

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.preferredDistanceMeters).toBe(40)
  })

  it("is hidden while nothing in the rotation reads the distance", () => {
    renderPanel(customInputs([]), vi.fn())

    expect(screen.queryByLabelText(LABEL)).toBeNull()
  })
})

describe("forking a built-in rotation to custom", () => {
  it("copies the built-in's own distance onto the new custom rotation", () => {
    const onChange = vi.fn()
    renderPanel(
      { ...defaultInputs, classId: CLASS, selectedBuiltinRotationId: FLUTE_ROTATION_ID },
      onChange,
    )

    fireEvent.click(screen.getByRole("button", { name: "Fork to Custom" }))

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.preferredDistanceMeters).toBe(6)
  })
})
