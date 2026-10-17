import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeBuff } from "../../src/engine/buff"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"
import { postToDpsWorker, retainedResponse } from "../../src/ui/hooks/dpsWorkerClient"
import { withBowSet } from "../helpers/withGearSet"

vi.mock("../../src/ui/hooks/useGearAnalysis", () => ({
  useGearAnalysis: () => ({ rows: [], isPending: false }),
}))

vi.mock("../../src/ui/hooks/dpsWorkerClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/ui/hooks/dpsWorkerClient")>()),
  postToDpsWorker: vi.fn(),
  retainedResponse: vi.fn(() => null),
}))

function piece(id: string, slot: GearPiece["slot"], extra: Partial<GearPiece> = {}): GearPiece {
  return {
    id,
    slot,
    level: 96,
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

const INVENTORY = [
  piece("sword", "leftWeapon", { set: "hawkwing" }),
  piece("spear", "rightWeapon", { set: "hawkwing" }),
  piece("disc", "disc"),
  piece("spareDisc", "disc"),
]

const STARTING_INPUTS: Inputs = {
  ...defaultInputs,
  classId: "bellstrikeUmbra",
  inventory: INVENTORY,
  equipped: { ...defaultInputs.equipped, leftWeapon: "sword", rightWeapon: "spear", disc: "disc" },
}

const latest = { inputs: STARTING_INPUTS }

function Harness({
  initial,
  configure = (inputs) => inputs,
}: {
  initial: Inputs
  configure?: (inputs: Inputs) => Inputs
}) {
  const [inputs, setInputs] = useState(initial)
  function change(next: Inputs): void {
    latest.inputs = next
    setInputs(next)
  }
  return (
    <I18nProvider>
      <ConfirmProvider>
        <GearTab
          inputs={inputs}
          configuredInputs={configure(inputs)}
          engineInputs={inputs}
          customGraduationBuild={null}
          onChange={change}
          currentDps={40000}
        />
      </ConfirmProvider>
    </I18nProvider>
  )
}

function renderTab(initial: Inputs = STARTING_INPUTS, configure?: (inputs: Inputs) => Inputs) {
  latest.inputs = initial
  return render(<Harness initial={initial} configure={configure} />)
}

function tileOf(slotLabel: string): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent?.startsWith(slotLabel))!
}

function setOf(pieceId: string): string | undefined {
  return latest.inputs.inventory.find((candidate) => candidate.id === pieceId)?.set
}

function openSetDialog(): HTMLElement {
  fireEvent.click(screen.getByRole("button", { name: /^(Gear set|Bow set)$/ }))
  return screen.getByRole("dialog")
}

beforeEach(() => {
  vi.mocked(postToDpsWorker).mockClear()
  vi.mocked(retainedResponse).mockImplementation(() => null)
})

describe("the set chip", () => {
  it("shows the piece's set with its equipped count", () => {
    renderTab()
    fireEvent.click(tileOf("Strategic Sword"))

    expect(screen.getByRole("button", { name: "Gear set" })).toHaveTextContent("Hawkwing · 2/4")
  })

  it("reads no set on a piece without one", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))

    expect(screen.getByRole("button", { name: "Gear set" })).toHaveTextContent("No set")
  })

  it("opens the set dialog instead of a dropdown", () => {
    renderTab()
    fireEvent.click(tileOf("Strategic Sword"))

    fireEvent.click(screen.getByRole("button", { name: "Gear set" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("writes the chosen set onto the selected piece only", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Only this piece" }))
    fireEvent.click(within(dialog).getByRole("button", { name: /Hawkwing/ }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(setOf("disc")).toBe("hawkwing")
    expect(setOf("sword")).toBe("hawkwing")
    expect(setOf("spareDisc")).toBeUndefined()
  })

  it("badges a relayed piece next to the equipped badge", () => {
    renderTab({
      ...STARTING_INPUTS,
      inventory: [piece("sword", "leftWeapon", { relayed: true }), ...INVENTORY.slice(1)],
    })
    fireEvent.click(tileOf("Strategic Sword"))

    expect(screen.getAllByText("Relayed").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Equipped").length).toBeGreaterThan(0)
  })

  it("is absent on an armor slot", () => {
    renderTab({
      ...STARTING_INPUTS,
      inventory: [...INVENTORY, piece("helm", "helm")],
      equipped: { ...STARTING_INPUTS.equipped, helm: "helm" },
    })
    fireEvent.click(tileOf("Helm"))

    expect(screen.queryByRole("button", { name: "Gear set" })).toBeNull()
  })

  it("keeps the type, level and rarity chips in the header and out of the form", () => {
    renderTab()
    fireEvent.click(tileOf("Strategic Sword"))

    expect(screen.getAllByRole("combobox", { name: "Type" })).toHaveLength(1)
    expect(screen.getAllByRole("combobox", { name: "Level" })).toHaveLength(1)
    expect(screen.getByRole("combobox", { name: "Level" })).toHaveTextContent("Lv96")
    expect(screen.getAllByRole("combobox", { name: "Rarity" })).toHaveLength(1)
  })
})

describe("the gear set dialog", () => {
  it("previews a set without changing the piece until Apply", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("button", { name: /Jadeware/ }))

    expect(within(dialog).getByText("3/4 · 2pc active")).toBeInTheDocument()
    expect(setOf("disc")).toBeUndefined()

    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(setOf("disc")).toBe("jadeware")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("reaches the 2-piece when the previewed set joins two others", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("button", { name: /Hawkwing/ }))

    expect(within(dialog).getByText("3/4 · 2pc active")).toBeInTheDocument()
  })

  it("leaves the piece alone on Cancel and on Escape", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    openSetDialog()

    fireEvent.click(screen.getByRole("button", { name: /Jadeware/ }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(setOf("disc")).toBeUndefined()

    openSetDialog()
    fireEvent.click(screen.getByRole("button", { name: /Jadeware/ }))
    fireEvent.keyDown(document, { key: "Escape" })

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(setOf("disc")).toBeUndefined()
  })

  it("clears the set of every equipped set-bearing piece when No set is applied", () => {
    renderTab()
    fireEvent.click(tileOf("Strategic Sword"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("button", { name: "No set" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(setOf("sword")).toBeUndefined()
    expect(setOf("spear")).toBeUndefined()
  })

  it("clears only this piece's set when Only this piece is ticked", () => {
    renderTab()
    fireEvent.click(tileOf("Strategic Sword"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Only this piece" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "No set" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(setOf("sword")).toBeUndefined()
    expect(setOf("spear")).toBe("hawkwing")
  })

  it("applies to every equipped set-bearing piece by default", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    expect(within(dialog).getByRole("checkbox", { name: "Only this piece" })).not.toBeChecked()
    fireEvent.click(within(dialog).getByRole("button", { name: /Jadeware/ }))
    expect(within(dialog).getByText("3/4 · 2pc active")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(setOf("sword")).toBe("jadeware")
    expect(setOf("spear")).toBe("jadeware")
    expect(setOf("disc")).toBe("jadeware")
    expect(setOf("spareDisc")).toBeUndefined()
  })

  it("counts every card as the all-four result by default and as this piece alone when Only this piece is ticked", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()
    const cardOf = (name: RegExp) => within(dialog).getByRole("button", { name })

    expect(within(cardOf(/Jadeware/)).getByText("0 → 3/4")).toBeInTheDocument()
    expect(within(cardOf(/Hawkwing/)).getByText("2 → 3/4")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Only this piece" }))

    expect(within(cardOf(/Jadeware/)).getByText("0 → 1/4")).toBeInTheDocument()
  })

  it("formats the DPS figures to two decimals with the header's formatter and signs the deltas", () => {
    const choicesResponse = {
      kind: "gearSetChoices",
      reqId: 1,
      target: { kind: "piece", pieceId: "disc" },
      applyToGroup: true,
      currentDps: 77770.456,
      dpsByChoice: { __none: 77770.456, jadeware: 77780.5, hawkwing: 77000.1 },
    }
    vi.mocked(retainedResponse).mockImplementation(((kind: string) =>
      kind === "gearSetChoices" ? choicesResponse : null) as typeof retainedResponse)
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    fireEvent.click(within(dialog).getByRole("button", { name: /Jadeware/ }))

    expect(within(dialog).getAllByText("77,770.46").length).toBeGreaterThan(0)
    expect(within(dialog).getByText("77,780.50")).toBeInTheDocument()
    const diff = within(dialog).getAllByText("+10.04")
    expect(diff.length).toBeGreaterThan(0)
    expect(within(dialog).getByText(/-770\.36/)).toBeInTheDocument()
  })

  it("sorts the cards by DPS gain, highest first", () => {
    vi.mocked(retainedResponse).mockImplementation(((kind: string) =>
      kind === "gearSetChoices"
        ? {
            kind: "gearSetChoices",
            reqId: 1,
            target: { kind: "piece", pieceId: "disc" },
            applyToGroup: true,
            currentDps: 1000,
            dpsByChoice: { __none: 1000, jadeware: 900, hawkwing: 1100, rainwhisper: 1200 },
          }
        : null) as typeof retainedResponse)
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    const names = within(dialog)
      .getAllByRole("button", { pressed: false })
      .concat(within(dialog).queryAllByRole("button", { pressed: true }))
      .map((card) => card.querySelector("span")?.textContent)
      .filter((name): name is string => ["Rainwhisper", "Hawkwing", "Jadeware"].includes(name!))
    expect(names.slice(0, 3)).toEqual(["Rainwhisper", "Hawkwing", "Jadeware"])
  })

  it("keeps a hidden placeholder for every filtered-out card so the dialog keeps its height", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()
    const cardCount = within(dialog).getAllByRole("button", { pressed: false }).length

    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "hawk" } })

    const placeholders = dialog.querySelectorAll('[aria-hidden="true"]')
    expect(within(dialog).getAllByRole("button", { pressed: false }).length).toBeLessThan(cardCount)
    expect(
      [...placeholders].filter((placeholder) => placeholder.querySelector("span")).length,
    ).toBeGreaterThan(0)
  })

  it("filters the cards by name and by stat", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "hawk" } })

    expect(within(dialog).getAllByRole("button", { name: /Hawkwing|Jadeware/ })).toHaveLength(1)
    expect(within(dialog).queryByRole("button", { name: /Jadeware/ })).toBeNull()
  })

  it("shows the short 4-piece line on a card and the full in-game text as its tooltip", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    const dialog = openSetDialog()

    const card = within(dialog).getByRole("button", { name: /Hawkwing/ })

    expect(within(card).getByText(/Affinity hit: \+1\.8% Phys\/Bellstrike Atk/)).toBeInTheDocument()
    expect(card).toHaveAttribute("title", expect.stringContaining("stacking up to 5 times"))
    expect(within(dialog).queryByText("4-piece effect")).toBeNull()
  })

  it("asks the worker for the choices of an equipped piece", () => {
    renderTab()
    fireEvent.click(tileOf("Disc"))
    openSetDialog()

    const request = vi
      .mocked(postToDpsWorker)
      .mock.calls.map(([posted]) => posted)
      .filter((posted) => posted.kind === "gearSetChoices")
      .at(-1)
    expect(request).toMatchObject({ target: { kind: "piece", pieceId: "disc" } })
  })

  it("asks the worker with the configured inputs so custom content reaches the set DPS", () => {
    const customBuff = makeBuff("bellstrikeUmbra", { name: "Custom", effects: [] })
    renderTab(STARTING_INPUTS, (inputs) => ({ ...inputs, customBuffs: [customBuff] }))
    fireEvent.click(tileOf("Disc"))
    openSetDialog()

    const request = vi
      .mocked(postToDpsWorker)
      .mock.calls.map(([posted]) => posted)
      .filter((posted) => posted.kind === "gearSetChoices")
      .at(-1)
    expect(request).toMatchObject({ inputs: { customBuffs: [customBuff] } })
  })

  it("shows the equip hint and posts no choices for a piece that is not equipped", () => {
    renderTab()
    fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))
    const spareTile = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("FP(E)"))
      .at(-1)!
    fireEvent.click(spareTile)
    vi.mocked(postToDpsWorker).mockClear()
    const dialog = openSetDialog()

    expect(within(dialog).getByText("Equip this piece to compare set DPS")).toBeInTheDocument()
    expect(within(dialog).getByRole("checkbox", { name: "Only this piece" })).toBeChecked()
    const choicePosts = vi
      .mocked(postToDpsWorker)
      .mock.calls.filter(([posted]) => posted.kind === "gearSetChoices")
    expect(choicePosts).toHaveLength(0)
  })
})

describe("the bow pieces", () => {
  it("opens a bow piece with the bow hint and bow set chip count and leaves the analyzers empty", () => {
    renderTab(withBowSet(STARTING_INPUTS, "crit", 100))
    fireEvent.click(tileOf("Bow"))

    expect(
      screen.getByText(
        "Bow and Thumb Ring carry no base stats or tunements. Their only effect is the bow set.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bow set" })).toHaveTextContent("Critical · 2/2")
    expect(screen.getByText("Select a gear piece to analyze retunement gains")).toBeInTheDocument()
    expect(screen.getByText("Select a gear piece to analyze attunement gains")).toBeInTheDocument()
  })

  it("adds an empty bow slot at the clamped breakthrough level with no set", () => {
    renderTab({ ...STARTING_INPUTS, breakthrough: 5 })
    fireEvent.click(tileOf("Bow"))

    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(latest.inputs.bowGear.bow).toEqual({ level: 91, rarity: "legendary", set: null })
  })

  it("deletes a bow piece after confirmation", async () => {
    renderTab(withBowSet(STARTING_INPUTS, "crit", 100))
    fireEvent.click(tileOf("Bow"))

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }))

    await vi.waitFor(() => expect(latest.inputs.bowGear.bow).toBeNull())
    expect(latest.inputs.bowGear.thumbRing).not.toBeNull()
  })

  it("previews and applies a bow set from the bow dialog", () => {
    renderTab(withBowSet(STARTING_INPUTS, "crit", 100))
    fireEvent.click(tileOf("Bow"))
    const dialog = openSetDialog()

    expect(within(dialog).getByRole("heading", { name: "Bow sets" })).toBeInTheDocument()
    expect(within(dialog).queryByRole("checkbox")).toBeNull()
    fireEvent.click(within(dialog).getByRole("button", { name: /Affinity/ }))
    expect(within(dialog).getByText("1/2 · no effect yet")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(latest.inputs.bowGear.bow?.set).toBe("affinity")
    expect(latest.inputs.bowGear.thumbRing?.set).toBe("crit")
  })

  it("clears the gear selection while a bow piece is selected", () => {
    renderTab(withBowSet(STARTING_INPUTS, "crit", 100))
    fireEvent.click(tileOf("Disc"))
    fireEvent.click(tileOf("Bow"))

    expect(screen.queryByRole("button", { name: "Gear set" })).toBeNull()
    expect(screen.queryByRole("combobox", { name: "Type" })).toBeNull()
  })
})
