import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import type { GearSlotAnalysisRow } from "../../src/engine/gearAnalysis"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"

const ANALYSIS_ROWS: GearSlotAnalysisRow[] = []

vi.mock("../../src/ui/hooks/useGearAnalysis", () => ({
  useGearAnalysis: () => ({ rows: ANALYSIS_ROWS, isPending: false }),
}))

function piece(id: string, slot: GearPiece["slot"], extra: Partial<GearPiece> = {}): GearPiece {
  return {
    id,
    slot,
    level: 91,
    rarity: "legendary",
    minPhys: 1000,
    maxPhys: 2000,
    hp: 0,
    physDef: 0,
    words: [
      { word: "crit", value: 0.03, retuned: false },
      { word: "power", value: 40, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "physPen",
    attunementValue: 0.03,
    relayed: false,
    ...extra,
  }
}

function Harness({ initialInventory }: { initialInventory: GearPiece[] }) {
  const [inputs, setInputs] = useState<Inputs>({
    ...defaultInputs,
    inventory: initialInventory,
    equipped: { ...defaultInputs.equipped, helm: initialInventory[0].id },
  })
  return (
    <I18nProvider>
      <ConfirmProvider>
        <GearTab inputs={inputs} engineInputs={inputs} onChange={setInputs} currentDps={40000} />
      </ConfirmProvider>
    </I18nProvider>
  )
}

function renderHarness(initialInventory: GearPiece[]) {
  render(<Harness initialInventory={initialInventory} />)
}

function helmSlotTile(): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent?.includes("Helm"))!
}

describe("GearPiece.label rendering", () => {
  it("shows a labelled equipped piece's label on its slot tile, alongside level and rarity", () => {
    renderHarness([piece("helm", "helm", { label: "Retune slot 3" })])

    const tile = within(helmSlotTile())
    expect(tile.getByText("Retune slot 3")).toBeInTheDocument()
    expect(tile.getByText("lv91 · Legendary")).toBeInTheDocument()
  })

  it("renders an unlabelled piece's slot tile exactly as it does today", () => {
    renderHarness([piece("helm", "helm")])

    const tile = within(helmSlotTile())
    expect(tile.getByText("lv91 · Legendary")).toBeInTheDocument()
    expect(tile.queryByText("Retune slot 3")).not.toBeInTheDocument()
  })

  it("shows the note marker only on a piece with a note", () => {
    renderHarness([piece("helm", "helm", { note: "Keep this one" })])

    expect(within(helmSlotTile()).getByTitle("Has a note")).toBeInTheDocument()
  })

  it("shows no note marker on a piece without a note", () => {
    renderHarness([piece("helm", "helm")])

    expect(within(helmSlotTile()).queryByTitle("Has a note")).not.toBeInTheDocument()
  })

  it("updates the slot tile when the name field is edited", () => {
    renderHarness([piece("helm", "helm")])
    fireEvent.click(helmSlotTile())

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Retune slot 3" } })

    expect(within(helmSlotTile()).getByText("Retune slot 3")).toBeInTheDocument()
  })

  it("leaves the piece unlabelled when the name field holds only whitespace", () => {
    renderHarness([piece("helm", "helm")])
    fireEvent.click(helmSlotTile())

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } })

    const tile = within(helmSlotTile())
    expect(tile.getByText("lv91 · Legendary")).toBeInTheDocument()
    expect(tile.queryByText("Retune slot 3")).not.toBeInTheDocument()
  })
})
