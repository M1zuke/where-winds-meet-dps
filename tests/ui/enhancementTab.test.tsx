import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { DEFAULT_ENHANCEMENTS } from "../../src/definitions/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmContext } from "../../src/ui/components/confirm-dialog/confirmContext"
import { EnhancementTab } from "../../src/ui/features/talents/enhancement-tab/EnhancementTab"
import type { Inputs } from "../../src/engine/types"

function renderTab(onChange: (next: Inputs) => void = () => {}) {
  return render(
    <I18nProvider>
      <ConfirmContext.Provider value={() => Promise.resolve(true)}>
        <EnhancementTab inputs={defaultInputs} onChange={onChange} />
      </ConfirmContext.Provider>
    </I18nProvider>,
  )
}

describe("the Enhancement tab", () => {
  it("heads one card per enhanceable slot, weapons before accessories", () => {
    renderTab()
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)
    expect(headings).toEqual(["Left Weapon", "Right Weapon", "Disc", "Pendant"])
  })

  it("puts the minimum attack line above the maximum one inside a card", () => {
    renderTab()
    const weaponCard = screen.getByText("Left Weapon").parentElement!
    const labels = [...weaponCard.querySelectorAll("label > span:first-child")].map(
      (node) => node.textContent,
    )
    expect(labels).toEqual(["Min Phys", "Max Phys"])
  })

  it("caps a typed value at the figure enhancements.json authors", () => {
    const onChange = vi.fn()
    renderTab(onChange)
    const disc = DEFAULT_ENHANCEMENTS.find((node) => node.slot === "disc")!
    const discCard = screen.getByText("Disc").parentElement!
    const input = discCard.querySelector("input")!
    fireEvent.change(input, { target: { value: String(disc.value + 1) } })
    const next = onChange.mock.lastCall![0] as Inputs
    expect(next.enhancements.find((node) => node.id === disc.id)!.value).toBe(disc.value)
  })

  it("keeps a lowered value the user types", () => {
    const onChange = vi.fn()
    renderTab(onChange)
    const disc = DEFAULT_ENHANCEMENTS.find((node) => node.slot === "disc")!
    const discCard = screen.getByText("Disc").parentElement!
    const input = discCard.querySelector("input")!
    fireEvent.change(input, { target: { value: "40" } })
    const next = onChange.mock.lastCall![0] as Inputs
    expect(next.enhancements.find((node) => node.id === disc.id)!.value).toBe(40)
  })
})
