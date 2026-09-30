// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotations this file addresses by id.
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

const CLASS = "bellstrikeUmbra"

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

describe("editing the Rotation Editor's ping/fps fields for a built-in rotation", () => {
  it("writes the profile's override map, keyed by the built-in's own id, and leaves the rotation alone", () => {
    const builtin = builtinRotationsForClass(CLASS)[0]
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtin.id,
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.change(screen.getByLabelText("Ping (ms)"), { target: { value: "80" } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.builtinRotationPingFpsOverrides).toEqual({
      [builtin.id]: { pingMs: 80, averageFps: builtin.averageFps },
    })
    expect(next.activeCustomRotation).toBeNull()
  })
})

describe("editing the Rotation Editor's ping/fps fields for a custom rotation", () => {
  it("writes the rotation itself, never the built-in override map", () => {
    const rotation = makeRotation(CLASS, { steps: [] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      activeCustomRotation: rotation,
      selectedBuiltinRotationId: null,
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.change(screen.getByLabelText("Ping (ms)"), { target: { value: "80" } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.pingMs).toBe(80)
    expect(next.builtinRotationPingFpsOverrides).toBeUndefined()
  })
})

describe("forking a built-in rotation to custom", () => {
  it("copies the built-in's effective, overridden ping/fps onto the new custom rotation", () => {
    const builtin = builtinRotationsForClass(CLASS)[0]
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtin.id,
      builtinRotationPingFpsOverrides: { [builtin.id]: { pingMs: 80, averageFps: 144 } },
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.click(screen.getByRole("button", { name: "Fork to Custom" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.pingMs).toBe(80)
    expect(next.activeCustomRotation?.averageFps).toBe(144)
  })
})

describe("resetting a built-in rotation's ping/fps override", () => {
  it("removes only that rotation's entry from the override map", () => {
    const [builtinA, builtinB] = builtinRotationsForClass(CLASS)
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtinA.id,
      builtinRotationPingFpsOverrides: {
        [builtinA.id]: { pingMs: 80, averageFps: 144 },
        [builtinB.id]: { pingMs: 20, averageFps: 120 },
      },
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.builtinRotationPingFpsOverrides).toEqual({
      [builtinB.id]: { pingMs: 20, averageFps: 120 },
    })
  })
})
