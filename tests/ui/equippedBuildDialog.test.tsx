import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { graduationInputs } from "../../src/engine/graduation"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"
import { getAttunement } from "../../src/engine/attunements"
import { SET_BY_ID } from "../../src/definitions/sets/registry"
import { statLineLabel } from "../../src/data/stats/statLines"
import enCatalogue from "../../src/i18n/locales/en.json"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { formatNumber } from "../../src/ui/utils/numberFormatting"
import { fmt } from "../../src/ui/utils/statFormatting"
import { EquippedBuildDialog } from "../../src/ui/features/gear/equipped-build-dialog/EquippedBuildDialog"
import { ARSENAL_KEYS, BOW_SET_KEYS } from "../../src/ui/features/gear/shared/buildSetKeys"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"

vi.mock("../../src/ui/hooks/useGearAnalysis", () => ({
  useGearAnalysis: () => ({ rows: [], isPending: false }),
}))

const fixture = graduationInputs(defaultInputs)!

function renderDialog(inputs: Inputs = fixture, currentDps = 54321.1) {
  render(
    <I18nProvider>
      <EquippedBuildDialog inputs={inputs} currentDps={currentDps} onClose={() => undefined} />
    </I18nProvider>,
  )
}

describe("EquippedBuildDialog", () => {
  it("names the build and shows every slot", () => {
    renderDialog()

    expect(screen.getByRole("dialog", { name: "Build summary" })).toBeInTheDocument()
    expect(screen.getByText("Bellstrike Umbra")).toBeInTheDocument()
    expect(screen.getByText(`DPS ${formatNumber(54321.1)}`)).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(8)
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent(
      statLineLabel("swordBoost"),
    )
    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent(
      getAttunement("bleedingDamage")!.label,
    )
  })

  it("has no relayed-words checkbox", () => {
    renderDialog()

    expect(screen.queryByRole("checkbox")).toBeNull()
  })

  it("reads an unequipped slot as empty while every other slot still renders", () => {
    const withEmptyHelm: Inputs = { ...fixture, equipped: { ...fixture.equipped, helm: null } }
    renderDialog(withEmptyHelm)

    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent("Empty slot")
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent(
      statLineLabel("swordBoost"),
    )
    expect(screen.getAllByRole("article")).toHaveLength(8)
  })

  it("reports the build's own set, bow set, arsenal and enabled count", () => {
    renderDialog()

    const armorSet = fixture.set ? SET_BY_ID[fixture.set] : null
    const enabledCount =
      fixture.martialArtsTalents.filter((talent) => talent.enabled).length +
      Object.values(fixture.oddities).reduce(
        (total, nodes) => total + nodes.filter((node) => node.enabled).length,
        0,
      )

    expect(screen.getByText("Armor Set").nextElementSibling).toHaveTextContent(
      armorSet ? armorSet.name : "(unselected)",
    )
    expect(screen.getByText("Bow Set").nextElementSibling).toHaveTextContent(
      fixture.bowSet
        ? (enCatalogue as Record<string, string>)[BOW_SET_KEYS[fixture.bowSet]]
        : "(unselected)",
    )
    expect(screen.getByText("Arsenal").nextElementSibling).toHaveTextContent(
      (enCatalogue as Record<string, string>)[ARSENAL_KEYS[fixture.arsenal]],
    )
    expect(screen.getByText("Talents & Oddities").nextElementSibling).toHaveTextContent(
      `${enabledCount} enabled`,
    )
  })

  it("replaces the piece cards with the panel stats on the Panel Stats tab", () => {
    renderDialog()

    fireEvent.click(screen.getByRole("tab", { name: "Panel Stats" }))

    expect(screen.queryAllByRole("article")).toHaveLength(0)

    const withSets = applyBowSet(applyArmorSet(withDerivedStats(fixture)))
    expect(screen.getByText(statLineLabel("maxPhys")).parentElement).toHaveTextContent(
      fmt(withSets.phys.max, false),
    )
  })

  it("focuses Close and dismisses from the keyboard", () => {
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <EquippedBuildDialog inputs={fixture} currentDps={54321.1} onClose={onClose} />
      </I18nProvider>,
    )

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe("GearTab build summary button", () => {
  it("opens the equipped build dialog", () => {
    render(
      <I18nProvider>
        <ConfirmProvider>
          <GearTab
            inputs={fixture}
            engineInputs={fixture}
            onChange={() => {}}
            currentDps={54321.1}
          />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.queryByRole("dialog", { name: "Build summary" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Build summary" }))
    expect(screen.getByRole("dialog", { name: "Build summary" })).toBeInTheDocument()
  })
})
