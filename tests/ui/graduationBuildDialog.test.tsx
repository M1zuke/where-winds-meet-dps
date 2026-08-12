import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GraduationBuildDialog } from "../../src/ui/features/gear/graduation-build-dialog/GraduationBuildDialog"

describe("GraduationBuildDialog", () => {
  it("shows the class benchmark summary and all eight gear pieces", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          classId="bellstrikeUmbra"
          theoreticalDps={12345.67}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("dialog", { name: "Graduation build" })).toBeInTheDocument()
    expect(screen.getByText("Bellstrike Umbra")).toBeInTheDocument()
    expect(screen.getByText("DPS 12,345.67")).toBeInTheDocument()
    expect(screen.getByText("All enabled")).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(8)
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent("Max Bellstrike")
    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent("Bleed Boost")
  })

  it("focuses Close and dismisses from the keyboard", () => {
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <GraduationBuildDialog
          classId="stonesplitStrength"
          theoreticalDps={null}
          onClose={onClose}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
