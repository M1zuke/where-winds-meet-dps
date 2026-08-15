import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { runEngine } from "../../src/engine/dps"
import { builtinRotationsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationTab } from "../../src/ui/features/rotation/rotation-tab/RotationTab"

function renderTab(onChange: (next: Inputs) => void = () => {}) {
  const inputs = applyBowSet(applyArmorSet(withDerivedStats(defaultInputs)))
  render(
    <I18nProvider>
      <ConfirmProvider>
        <RotationTab
          inputs={inputs}
          engineInputs={inputs}
          onChange={onChange}
          result={runEngine(inputs)}
        />
      </ConfirmProvider>
    </I18nProvider>,
  )
  return inputs
}

function optionButtons(): HTMLElement[] {
  return screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-current"))
}

describe("RotationTab subtabs", () => {
  it("opens on the rotation's output, not on the editor", () => {
    renderTab()

    expect(screen.getByText("Rotations")).toBeInTheDocument()
    expect(screen.getByText("DPS Breakdown")).toBeInTheDocument()
    expect(screen.getByText("DPS Graph")).toBeInTheDocument()
    expect(screen.getByText("Cast Timeline")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "+ Add skill" })).not.toBeInTheDocument()
  })

  it("shows the editor once its subtab is selected", () => {
    renderTab()

    fireEvent.click(screen.getByRole("tab", { name: "Rotation Editor" }))

    expect(screen.getByRole("button", { name: "+ New" })).toBeInTheDocument()
    expect(screen.queryByText("DPS Breakdown")).not.toBeInTheDocument()
    expect(screen.queryByText("Cast Timeline")).not.toBeInTheDocument()
  })

  it("lists every rotation the class offers and nothing else", () => {
    renderTab()

    const names = optionButtons().map((button) => button.textContent ?? "")
    const builtins = builtinRotationsForClass(defaultInputs.classId)

    expect(names).toHaveLength(builtins.length)
    for (const rotation of builtins) {
      expect(names.some((name) => name.startsWith(rotation.name))).toBe(true)
    }
    expect(names.some((name) => name.includes("Default class axis"))).toBe(false)
  })

  it("selects a rotation when its list entry is clicked", () => {
    const changes: Inputs[] = []
    renderTab((next) => changes.push(next))
    const target = builtinRotationsForClass(defaultInputs.classId)[0]

    fireEvent.click(
      optionButtons().find((button) => (button.textContent ?? "").startsWith(target.name))!,
    )

    expect(changes).toHaveLength(1)
    expect(changes[0].selectedBuiltinRotationId).toBe(target.id)
    expect(changes[0].activeCustomRotation).toBeNull()
  })

  it("marks the class default active when nothing is pinned, and waits on the sweep", () => {
    renderTab()

    const active = optionButtons().filter(
      (button) => button.getAttribute("aria-current") === "true",
    )

    expect(active).toHaveLength(1)
    expect(active[0].textContent).toContain(defaultRotationForClass(defaultInputs.classId)!.name)
    expect(active[0].textContent).toContain("—")
  })

  it("offers the same rotations through a select for narrow screens", () => {
    renderTab()

    fireEvent.click(screen.getByRole("combobox", { name: "Rotation" }))
    const values = screen.getAllByRole("option").map((option) => option.getAttribute("data-value"))

    expect(values).toEqual(
      builtinRotationsForClass(defaultInputs.classId).map((rotation) => rotation.id),
    )
    expect(values).not.toContain("")
  })
})
