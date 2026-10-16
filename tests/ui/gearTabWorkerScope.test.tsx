import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"
import { postToDpsWorker } from "../../src/ui/hooks/dpsWorkerClient"

vi.mock("../../src/ui/hooks/dpsWorkerClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/ui/hooks/dpsWorkerClient")>()),
  postToDpsWorker: vi.fn(),
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

const INVENTORY = [
  piece("weapon", "leftWeapon"),
  piece("helm", "helm"),
  piece("spareHelm", "helm"),
  piece("spareWeapon", "leftWeapon"),
]

function inputsWithEquippedHelm(helmId: string): Inputs {
  return {
    ...defaultInputs,
    inventory: INVENTORY,
    equipped: { ...defaultInputs.equipped, leftWeapon: "weapon", helm: helmId },
  }
}

function tabElement(inputs: Inputs) {
  return (
    <I18nProvider>
      <ConfirmProvider>
        <GearTab
          inputs={inputs}
          engineInputs={inputs}
          customGraduationBuild={null}
          onChange={() => {}}
          currentDps={40000}
        />
      </ConfirmProvider>
    </I18nProvider>
  )
}

function postsOfKind(kind: string) {
  return vi
    .mocked(postToDpsWorker)
    .mock.calls.map(([request]) => request)
    .filter((request) => request.kind === kind)
}

function selectBenchPiece(slotLabel: string) {
  fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))
  const benchTile = within(screen.getByRole("tabpanel"))
    .getAllByRole("button")
    .find(
      (button) => button.textContent?.includes("FP(E)") && button.textContent.includes(slotLabel),
    )!
  fireEvent.click(benchTile)
}

beforeEach(() => {
  vi.mocked(postToDpsWorker).mockClear()
})

describe("GearTab worker scope", () => {
  it("posts no inventory sweep while the analysis subtab is shown", () => {
    render(tabElement(inputsWithEquippedHelm("helm")))

    expect(postsOfKind("dpsDeltas")).toHaveLength(0)
    expect(postsOfKind("selectedPieceDelta")).toHaveLength(0)
  })

  it("sweeps only the unequipped pieces of the filtered slot", () => {
    render(tabElement(inputsWithEquippedHelm("helm")))

    fireEvent.click(screen.getByRole("tab", { name: "Inventory" }))
    const unfilteredSweep = postsOfKind("dpsDeltas").at(-1)
    expect(unfilteredSweep).toMatchObject({ pieceIds: ["spareHelm", "spareWeapon"] })

    selectBenchPiece("Helm")

    expect(postsOfKind("dpsDeltas").at(-1)).toMatchObject({ pieceIds: ["spareHelm"] })
  })

  it("posts the selected piece's delta only while it is unequipped", () => {
    const { rerender } = render(tabElement(inputsWithEquippedHelm("helm")))
    selectBenchPiece("Helm")

    expect(postsOfKind("selectedPieceDelta").at(-1)).toMatchObject({ pieceId: "spareHelm" })
    const postsWhileUnequipped = postsOfKind("selectedPieceDelta").length

    rerender(tabElement(inputsWithEquippedHelm("spareHelm")))

    expect(postsOfKind("selectedPieceDelta")).toHaveLength(postsWhileUnequipped)
  })
})
