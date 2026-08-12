import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { graduationInputs } from "../../src/engine/graduation"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GraduationBuildDialog } from "../../src/ui/features/gear/graduation-build-dialog/GraduationBuildDialog"
import { fmt } from "../../src/ui/utils/statFormatting"

describe("GraduationBuildDialog", () => {
  it("shows the class benchmark summary and all eight gear pieces", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={defaultInputs}
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
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent(
      "Sword Martial Boost",
    )
    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent("Bleed Boost")
  })

  it("switches to the stats tab and reports the graduation build's panel stats", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={defaultInputs}
          theoreticalDps={12345.67}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole("tab", { name: "Panel Stats" }))

    expect(screen.queryAllByRole("article")).toHaveLength(0)

    const benchmark = applyBowSet(applyArmorSet(withDerivedStats(graduationInputs(defaultInputs)!)))
    const effective = effectiveRates(benchmark)
    const finalEffectiveCritRate =
      effective.precision * (effective.critRate + benchmark.directCritRate)

    expect(screen.getByText("Final Crit").parentElement).toHaveTextContent(
      fmt(finalEffectiveCritRate, true),
    )
    expect(screen.getByText("Max Phys").parentElement).toHaveTextContent(
      fmt(benchmark.phys.max, false),
    )
  })

  it("focuses Close and dismisses from the keyboard", () => {
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={{ ...defaultInputs, classId: "stonesplitStrength" }}
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
