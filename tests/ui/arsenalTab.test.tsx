import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { arsenalScoreCap, defaultArsenalScores } from "../../src/definitions/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmContext } from "../../src/ui/components/confirm-dialog/confirmContext"
import { ArsenalTab } from "../../src/ui/features/talents/arsenal-tab/ArsenalTab"
import type { Inputs } from "../../src/engine/types"

function renderTab(inputs: Inputs, onChange: (next: Inputs) => void = () => {}) {
  return render(
    <I18nProvider>
      <ConfirmContext.Provider value={() => Promise.resolve(true)}>
        <ArsenalTab inputs={inputs} onChange={onChange} />
      </ConfirmContext.Provider>
    </I18nProvider>,
  )
}

function cardFor(heading: string): HTMLElement {
  return screen.getByRole("heading", { level: 2, name: heading }).parentElement!.parentElement!
}

describe("the Arsenal tab", () => {
  it("lists the unlocked stores newest first, current on top", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)
    expect(headings).toEqual([
      "Tier 91 Arsenal",
      "Tier 86 Arsenal",
      "Tier 81 Arsenal",
      "Tier 71 Arsenal",
      "Tier 61 Arsenal",
      "Tier 56 Arsenal",
      "Tier 51 Arsenal",
      "Tier 41 Arsenal",
    ])
  })

  it("chips the current store Current even when its score sits exactly at Total Mastery", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    expect(cardFor("Tier 91 Arsenal")).toHaveTextContent("Current")
  })

  it("chips a graduated past store Graduated and pays its flat HP", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    const card = cardFor("Tier 86 Arsenal")
    expect(card).toHaveTextContent("Graduated")
    expect(card).toHaveTextContent("4,000")
  })

  it("chips a past store below Total Mastery Below Mastery and pays the overflow formula, not the flat amount", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      breakthrough: 17,
      arsenalScores: { ...defaultArsenalScores(), 7: 0 },
    }
    renderTab(inputs)
    const card = cardFor("Tier 86 Arsenal")
    expect(card).toHaveTextContent("Below Mastery")
    expect(card).not.toHaveTextContent("4,000")
  })

  it("reports how many arsenals unlock later", () => {
    renderTab({ ...defaultInputs, breakthrough: 13 })
    expect(screen.getByText(/unlock at a later Breakthrough/)).toHaveTextContent("4")
  })

  it("clamps an edit to a past store's cap", () => {
    const onChange = vi.fn()
    renderTab({ ...defaultInputs, breakthrough: 17 }, onChange)
    const card = cardFor("Tier 86 Arsenal")
    fireEvent.change(within(card).getByRole("spinbutton"), { target: { value: "999999" } })
    expect(onChange.mock.lastCall![0].arsenalScores[7]).toBe(arsenalScoreCap(7))
  })

  it("lets an edit to the current store run past its cap", () => {
    const onChange = vi.fn()
    renderTab({ ...defaultInputs, breakthrough: 17 }, onChange)
    const card = cardFor("Tier 91 Arsenal")
    fireEvent.change(within(card).getByRole("spinbutton"), { target: { value: "7200" } })
    expect(onChange.mock.lastCall![0].arsenalScores[8]).toBe(7200)
  })

  it("resets every store back to its Total Mastery", async () => {
    const onChange = vi.fn()
    const inputs: Inputs = {
      ...defaultInputs,
      breakthrough: 17,
      arsenalScores: { ...defaultArsenalScores(), 8: 7200 },
    }
    renderTab(inputs, onChange)
    fireEvent.click(screen.getByText("Reset to default"))
    await Promise.resolve()
    await Promise.resolve()
    expect(onChange.mock.lastCall![0].arsenalScores).toEqual(defaultArsenalScores())
  })
})
