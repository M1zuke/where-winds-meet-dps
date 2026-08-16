import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import type { GearSlotAnalysisRow } from "../../src/engine/gearAnalysis"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"

const ANALYSIS_ROWS: GearSlotAnalysisRow[] = [
  {
    slot: "leftWeapon",
    pieceId: "weapon",
    retuneGain: 120,
    reattuneGain: 40,
    relayGain: 900,
    unequipLoss: 3000,
  },
  {
    slot: "helm",
    pieceId: "helm",
    retuneGain: 300,
    reattuneGain: -10,
    relayGain: null,
    unequipLoss: 1000,
  },
  {
    slot: "bracer",
    pieceId: null,
    retuneGain: null,
    reattuneGain: null,
    relayGain: null,
    unequipLoss: 0,
  },
]

vi.mock("../../src/ui/hooks/useGearAnalysis", () => ({
  useGearAnalysis: () => ({ rows: ANALYSIS_ROWS, isPending: false }),
}))

function piece(id: string, slot: GearPiece["slot"]): GearPiece {
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
  }
}

function renderTab() {
  const inventory = [piece("weapon", "leftWeapon"), piece("helm", "helm"), piece("spare", "helm")]
  const inputs: Inputs = {
    ...defaultInputs,
    inventory,
    equipped: { ...defaultInputs.equipped, leftWeapon: "weapon", helm: "helm" },
  }
  render(
    <I18nProvider>
      <ConfirmProvider>
        <GearTab inputs={inputs} engineInputs={inputs} onChange={() => {}} currentDps={40000} />
      </ConfirmProvider>
    </I18nProvider>,
  )
}

function analysisRow(slotLabel: string): HTMLElement {
  return screen.getByRole("cell", { name: slotLabel }).closest("tr")!
}

describe("GearTab analysis subtab", () => {
  it("opens on the analysis, not on the inventory", () => {
    renderTab()

    expect(screen.getByRole("columnheader", { name: /Tuned Stats/ })).toBeInTheDocument()
    expect(screen.queryByText("FP(E)")).not.toBeInTheDocument()
  })

  it("shows the inventory once its subtab is selected", () => {
    renderTab()

    fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))

    expect(screen.getAllByText("FP(E)").length).toBeGreaterThan(0)
    expect(screen.queryByRole("columnheader", { name: /Tuned Stats/ })).not.toBeInTheDocument()
  })

  it("lists only the slots that carry a piece, heaviest tuned-stat contribution first", () => {
    renderTab()

    const slots = screen
      .getAllByRole("row")
      .map((row) => row.firstElementChild?.textContent ?? "")
      .filter((label) => label === "Left Weapon" || label === "Helm" || label === "Bracer")

    expect(slots).toEqual(["Left Weapon", "Helm"])
  })

  it("ranks each action column on its own, and dashes the slots with nothing to gain", () => {
    renderTab()

    const weaponCells = within(analysisRow("Left Weapon")).getAllByRole("cell")
    const helmCells = within(analysisRow("Helm")).getAllByRole("cell")

    expect(weaponCells[1]).toHaveTextContent("#2")
    expect(helmCells[1]).toHaveTextContent("#1")
    expect(weaponCells[2]).toHaveTextContent("#1")
    expect(helmCells[2]).toHaveTextContent("—")
    expect(weaponCells[3]).toHaveTextContent("#1")
    expect(helmCells[3]).toHaveTextContent("—")
  })

  it("keeps the DPS gain out of the rank cell, on its hover title", () => {
    renderTab()

    const retune = within(analysisRow("Left Weapon")).getAllByRole("cell")[1]

    expect(retune.textContent).toBe("#2")
    expect(retune).toHaveAttribute("title", "+120")
  })

  it("states each slot's tuned-stat loss as a share of total DPS, and their total", () => {
    renderTab()

    expect(within(analysisRow("Left Weapon")).getAllByRole("cell")[4]).toHaveTextContent(
      "-3,000(7.5 %)",
    )
    expect(screen.getByRole("cell", { name: /Total tuned-stat DPS contribution/ })).toBeVisible()
    expect(screen.getByText("-4,000")).toBeInTheDocument()
  })
})

describe("GearTab column layout", () => {
  function selectBenchPiece() {
    fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))
    const benchTile = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("FP(E)"))!
    fireEvent.click(benchTile)
  }

  it("puts the stat preview directly under the subtab card, with nothing between", () => {
    renderTab()
    selectBenchPiece()

    const subtabCard = screen.getByRole("tabpanel").parentElement!
    const preview = screen.getByText(/If equipped/)

    expect(subtabCard.nextElementSibling?.contains(preview)).toBe(true)
  })

  it("keeps the analyzers in the other column, so neither column waits on the other", () => {
    renderTab()

    const subtabColumn = screen.getByRole("tabpanel").parentElement!.parentElement!
    const detailsColumn = screen.getByText("Gear details").closest("div.panel")!.parentElement!

    expect(detailsColumn).not.toBe(subtabColumn)
    expect(detailsColumn.contains(screen.getByText("Retunement"))).toBe(true)
  })
})

describe("GearTab gear buttons", () => {
  it("keeps import and create together in the equipped head, on either subtab", () => {
    renderTab()

    const head = screen.getByRole("heading", { name: "Equipped" }).parentElement!

    expect(within(head).getByRole("button", { name: "Import gear" })).toBeInTheDocument()
    expect(within(head).getByRole("button", { name: "+ Create Gear" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))

    expect(within(head).getByRole("button", { name: "+ Create Gear" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "+ New piece" })).not.toBeInTheDocument()
  })

  it("opens the create dialog from the equipped head", () => {
    renderTab()

    fireEvent.click(screen.getByRole("button", { name: "+ Create Gear" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
