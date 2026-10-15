import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultEnhancementLevels, enhancementCap } from "../../src/definitions/baseStats"
import { gearLevelForBreakthrough } from "../../src/definitions/baseStats/breakthroughs"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmContext } from "../../src/ui/components/confirm-dialog/confirmContext"
import { EnhancementTab } from "../../src/ui/features/talents/enhancement-tab/EnhancementTab"
import type { GearLevel, GearPiece, Inputs } from "../../src/engine/types"

const inputsAtBreakthrough17: Inputs = {
  ...defaultInputs,
  breakthrough: 17,
  enhancements: defaultEnhancementLevels(17),
}

function inputsWithDiscAtGearLevel(gearLevel: GearLevel): Inputs {
  const disc = {
    id: "disc-under-test",
    slot: "disc",
    level: gearLevel,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: Array.from({ length: 5 }, () => ({ word: "", value: 0, retuned: false })),
    attunement: "",
    attunementValue: 0,
    relayed: false,
  } as unknown as GearPiece
  return {
    ...defaultInputs,
    breakthrough: 18,
    enhancements: defaultEnhancementLevels(18),
    inventory: [disc],
    equipped: { ...defaultInputs.equipped, disc: disc.id },
  }
}

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
  return screen.getByRole("heading", { level: 2, name: heading }).closest<HTMLElement>(".panel")!
}

function headerFor(heading: string): HTMLElement {
  return screen.getByRole("heading", { level: 2, name: heading }).parentElement!
}

describe("the Enhancement tab", () => {
  it("heads one card per slot in the weapon/armour pairing the layout wants", () => {
    renderTab()
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)
    expect(headings).toEqual([
      "Strategic Sword",
      "Heavenquaker Spear",
      "Helm",
      "Armor",
      "Disc",
      "Pendant",
      "Greaves",
      "Bracer",
    ])
  })

  it("shows the breakthrough's default level and its stats on every card", () => {
    renderTab(inputsAtBreakthrough17)
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

  it("resets every slot to the highest level the breakthrough allows", async () => {
    const onChange = vi.fn()
    renderTab(
      { ...inputsAtBreakthrough17, enhancements: { ...defaultInputs.enhancements } },
      onChange,
    )
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }))
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.lastCall![0].enhancements).toEqual(defaultEnhancementLevels(17))
  })

  it("shows the average-level bonus", () => {
    renderTab(inputsAtBreakthrough17)
    expect(screen.getByText("Average Enhancement Level").parentElement).toHaveTextContent("65")
    expect(screen.getByText("Average-Level Max HP").parentElement).toHaveTextContent(
      (9864).toLocaleString(),
    )
    expect(screen.getByText("Average-Level Max HP %").parentElement).toHaveTextContent("20.00%")
  })

  it("hints at the level a higher gear level unlocks on a gear-limited card", () => {
    renderTab(inputsWithDiscAtGearLevel(96))
    expect(headerFor("Disc")).toHaveTextContent("Up to 70 at gear level 100")
  })

  it("shows no gear level hint on a card already at the breakthrough maximum", () => {
    renderTab(inputsWithDiscAtGearLevel(100))
    expect(cardFor("Disc")).not.toHaveTextContent("at gear level")
  })
})
