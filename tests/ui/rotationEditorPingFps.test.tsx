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

describe("the Rotation Editor's connection fields for a built-in rotation", () => {
  const builtin = builtinRotationsForClass(CLASS)[0]
  const inputs = {
    ...defaultInputs,
    classId: CLASS,
    selectedBuiltinRotationId: builtin.id,
    builtinRotationPingFpsOverrides: {
      [builtin.id]: { pingMs: 80, averageFps: 144, serverProcessingMs: 48 },
    },
  } as Inputs

  it("shows the built-in's own values, ignoring a stored override, and cannot be edited", () => {
    renderPanel(inputs, vi.fn())

    const fields = [
      ["Ping (ms)", builtin.pingMs],
      ["Average FPS", builtin.averageFps],
      ["Server processing (ms)", builtin.serverProcessingMs],
    ] as const
    for (const [label, expected] of fields) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      expect(input.value).toBe(String(expected))
      expect(input.disabled).toBe(true)
    }
  })

  it("offers no override reset", () => {
    renderPanel(inputs, vi.fn())

    expect(screen.queryByRole("button", { name: "Reset to default" })).toBeNull()
  })
})

describe("editing the Rotation Editor's connection fields for a custom rotation", () => {
  it("writes the rotation itself", () => {
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
    expect(next.activeCustomRotation?.averageFps).toBe(rotation.averageFps)
    expect(next.activeCustomRotation?.serverProcessingMs).toBe(rotation.serverProcessingMs)
  })

  it("writes the server processing time and keeps ping and fps", () => {
    const rotation = makeRotation(CLASS, { steps: [] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      activeCustomRotation: rotation,
      selectedBuiltinRotationId: null,
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.change(screen.getByLabelText("Server processing (ms)"), { target: { value: "50" } })

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.serverProcessingMs).toBe(50)
    expect(next.activeCustomRotation?.pingMs).toBe(rotation.pingMs)
    expect(next.activeCustomRotation?.averageFps).toBe(rotation.averageFps)
  })
})

describe("forking a built-in rotation to custom", () => {
  it("copies the built-in's own ping, fps and server processing time onto the new custom rotation", () => {
    const builtin = builtinRotationsForClass(CLASS)[0]
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: builtin.id,
    }
    const onChange = vi.fn()
    renderPanel(inputs, onChange)

    fireEvent.click(screen.getByRole("button", { name: "Fork to Custom" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.pingMs).toBe(builtin.pingMs)
    expect(next.activeCustomRotation?.averageFps).toBe(builtin.averageFps)
    expect(next.activeCustomRotation?.serverProcessingMs).toBe(builtin.serverProcessingMs)
  })
})
