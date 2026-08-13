import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { graduationInputs } from "../../src/engine/graduation"
import { statLineLabel } from "../../src/data/stats/statLines"
import { getAttunement } from "../../src/engine/attunements"
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
          relayedTheoreticalDps={11111.11}
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
      statLineLabel("swordBoost"),
    )
    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent(
      getAttunement("bleedingDamage")!.label,
    )
  })

  it("relays every word, swaps to the relayed bow set and shows the relayed DPS", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={defaultInputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText("Bow Set").nextElementSibling).toHaveTextContent("Crit")
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent("77.8")

    fireEvent.click(screen.getByRole("checkbox", { name: /Relayed words/ }))

    expect(screen.getByText("DPS 11,111.11")).toBeInTheDocument()
    expect(screen.getByText("Bow Set").nextElementSibling).toHaveTextContent("Affinity")

    const relayedWeapon = screen.getByRole("article", { name: "Left Weapon" })
    expect(relayedWeapon).toHaveTextContent("73.13")
    expect(relayedWeapon).toHaveTextContent("46.44")
    expect(relayedWeapon).not.toHaveTextContent("77.8")
  })

  it("carries the relayed toggle into the panel stats", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={defaultInputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole("tab", { name: "Panel Stats" }))
    const maxRollPhys = screen.getByText(statLineLabel("maxPhys")).parentElement?.textContent

    fireEvent.click(screen.getByRole("checkbox", { name: /Relayed words/ }))
    const relayedPhys = screen.getByText(statLineLabel("maxPhys")).parentElement?.textContent

    const relayed = applyBowSet(
      applyArmorSet(withDerivedStats(graduationInputs(defaultInputs, "relayed")!)),
    )
    expect(relayedPhys).toContain(fmt(relayed.phys.max, false))
    expect(relayedPhys).not.toBe(maxRollPhys)
  })

  it("switches to the stats tab and reports the graduation build's panel stats", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={defaultInputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
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
    expect(screen.getByText(statLineLabel("maxPhys")).parentElement).toHaveTextContent(
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
          relayedTheoreticalDps={null}
          onClose={onClose}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
