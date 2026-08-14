import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { runEngine } from "../../src/engine/dps"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationTab } from "../../src/ui/features/rotation/rotation-tab/RotationTab"

function renderTab() {
  const inputs = applyBowSet(applyArmorSet(withDerivedStats(defaultInputs)))
  render(
    <I18nProvider>
      <ConfirmProvider>
        <RotationTab inputs={inputs} onChange={() => {}} result={runEngine(inputs)} />
      </ConfirmProvider>
    </I18nProvider>,
  )
}

describe("RotationTab subtabs", () => {
  it("opens on the rotation's output, not on the editor", () => {
    renderTab()

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
})
