// Scoped to Bellstrike Umbra — a validated class (CLAUDE.md § "Implemented
// classes") whose class buffs the picker lists.
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { makeBuff } from "../../src/engine/buff"
import { saveCustomBuff } from "../../src/storage"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

const CLASS = "bellstrikeUmbra"
const BUFF_NAME = "Picker test buff"
const BUFF_ID = "picker-test-buff"

function customInputs(permanentBuffIds: string[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: MYSTIC_SKILL.fluteOfTheTidesFull })],
      permanentBuffIds,
    }),
    selectedBuiltinRotationId: null,
  }
}

function renderPanel(inputs: Inputs, onChange: (next: Inputs) => void) {
  render(
    <I18nProvider>
      <ConfirmProvider>
        <RotationEditorPanel inputs={inputs} onChange={onChange} result={runEngine(inputs)} />
      </ConfirmProvider>
    </I18nProvider>,
  )
}

function openBuffPicker(label = /^Permanent buffs/) {
  fireEvent.click(screen.getByRole("button", { name: label }))
}

describe("the Rotation Editor's permanent buff picker", () => {
  beforeEach(() => {
    localStorage.clear()
    saveCustomBuff(makeBuff(CLASS, { id: BUFF_ID, name: BUFF_NAME }))
  })

  it("lists the class buffs in a listbox portaled to the document body", () => {
    renderPanel(customInputs([]), vi.fn())
    openBuffPicker()

    const list = screen.getByRole("listbox", { name: "Permanent buffs" })
    expect(list.parentElement).toBe(document.body)
    expect(list).toHaveAttribute("aria-multiselectable", "true")
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([BUFF_NAME])
  })

  it("writes the toggled id into the rotation's permanentBuffIds and keeps the menu open", () => {
    const onChange = vi.fn()
    renderPanel(customInputs([]), onChange)
    openBuffPicker()
    fireEvent.mouseDown(screen.getByRole("option", { name: BUFF_NAME }))

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.permanentBuffIds).toEqual([BUFF_ID])
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("removes an id that is already selected and shows the selected count", () => {
    const onChange = vi.fn()
    renderPanel(customInputs([BUFF_ID]), onChange)
    openBuffPicker(/^Permanent buffs \(1\)/)
    fireEvent.mouseDown(screen.getByRole("option", { selected: true }))

    const [next] = onChange.mock.calls[0] as [Inputs]
    expect(next.activeCustomRotation?.permanentBuffIds).toEqual([])
  })

  it("closes on an outside click and on Escape", () => {
    renderPanel(customInputs([]), vi.fn())

    openBuffPicker()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("listbox")).toBeNull()

    openBuffPicker()
    fireEvent.keyDown(screen.getByRole("button", { name: /^Permanent buffs/ }), { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})
