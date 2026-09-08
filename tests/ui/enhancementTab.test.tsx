import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { enhancementCap } from "../../src/definitions/baseStats"
import { gearLevelForBreakthrough } from "../../src/definitions/baseStats/breakthroughs"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmContext } from "../../src/ui/components/confirm-dialog/confirmContext"
import { EnhancementTab } from "../../src/ui/features/talents/enhancement-tab/EnhancementTab"
import type { Inputs } from "../../src/engine/types"

function renderTab(inputs: Inputs = defaultInputs, onChange: (next: Inputs) => void = () => {}) {
  return render(
    <I18nProvider>
      <ConfirmContext.Provider value={() => Promise.resolve(true)}>
        <EnhancementTab inputs={inputs} onChange={onChange} />
      </ConfirmContext.Provider>
    </I18nProvider>,
  )
}

function cardFor(heading: string): HTMLElement {
  return screen.getByRole("heading", { level: 2, name: heading }).parentElement!
}

describe("the Enhancement tab", () => {
  it("heads one card per slot in the weapon/armour pairing the layout wants", () => {
    renderTab()
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)
    expect(headings).toEqual([
      "Left Weapon",
      "Right Weapon",
      "Helm",
      "Armor",
      "Disc",
      "Pendant",
      "Greaves",
      "Bracer",
    ])
  })

  it("shows the level 65 default and its stats on every card", () => {
    renderTab()
    const discCard = cardFor("Disc")
    expect(discCard).toHaveTextContent("65")
    expect(discCard).toHaveTextContent("Max Phys")
    expect(discCard).toHaveTextContent("160")
  })

  it("increments a slot's level on the + button, up to its cap", () => {
    const cap = enhancementCap(
      gearLevelForBreakthrough(defaultInputs.breakthrough),
      defaultInputs.breakthrough,
    )
    const inputs: Inputs = {
      ...defaultInputs,
      enhancements: { ...defaultInputs.enhancements, disc: cap - 1 },
    }
    const onChange = vi.fn()
    renderTab(inputs, onChange)
    const discCard = cardFor("Disc")
    fireEvent.click(discCard.querySelector('[aria-label="Increase level"]')!)
    expect(onChange.mock.lastCall![0].enhancements.disc).toBe(cap)
  })

  it("never lets the level go past the cap", () => {
    const cap = enhancementCap(
      gearLevelForBreakthrough(defaultInputs.breakthrough),
      defaultInputs.breakthrough,
    )
    const inputs: Inputs = {
      ...defaultInputs,
      enhancements: { ...defaultInputs.enhancements, disc: cap },
    }
    const onChange = vi.fn()
    renderTab(inputs, onChange)
    const discCard = cardFor("Disc")
    expect(discCard.querySelector('[aria-label="Increase level"]')).toBeDisabled()
    fireEvent.click(discCard.querySelector('[aria-label="Increase level"]')!)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("decrements a slot's level on the − button, down to zero", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      enhancements: { ...defaultInputs.enhancements, disc: 1 },
    }
    const onChange = vi.fn()
    renderTab(inputs, onChange)
    const discCard = cardFor("Disc")
    fireEvent.click(discCard.querySelector('[aria-label="Decrease level"]')!)
    expect(onChange.mock.lastCall![0].enhancements.disc).toBe(0)
  })

  it("never decrements below zero", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      enhancements: { ...defaultInputs.enhancements, disc: 0 },
    }
    renderTab(inputs)
    const discCard = cardFor("Disc")
    expect(discCard.querySelector('[aria-label="Decrease level"]')).toBeDisabled()
  })

  it("does not let a level stored above the current cap be incremented further", () => {
    const cap = enhancementCap(
      gearLevelForBreakthrough(defaultInputs.breakthrough),
      defaultInputs.breakthrough,
    )
    const inputs: Inputs = {
      ...defaultInputs,
      enhancements: { ...defaultInputs.enhancements, disc: cap + 50 },
    }
    renderTab(inputs)
    const discCard = cardFor("Disc")
    expect(discCard).toHaveTextContent(String(cap + 50))
    expect(discCard.querySelector('[aria-label="Increase level"]')).toBeDisabled()
  })

  it("shows the average-level bonus", () => {
    renderTab()
    expect(screen.getByText("Average Enhancement Level").parentElement).toHaveTextContent("65")
    expect(screen.getByText("Average-Level Max HP").parentElement).toHaveTextContent(
      (9864).toLocaleString(),
    )
    expect(screen.getByText("Average-Level Max HP %").parentElement).toHaveTextContent("20.00%")
  })
})
