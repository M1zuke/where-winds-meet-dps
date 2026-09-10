import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { RetuneOptionsDialog } from "../../src/ui/features/gear/retune-options-dialog/RetuneOptionsDialog"

const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function makePiece(overrides: Partial<GearPiece> = {}): GearPiece {
  return {
    id: "p1",
    slot: "leftWeapon",
    level: 96,
    rarity: "legendary",
    minPhys: 100,
    maxPhys: 200,
    hp: 0,
    physDef: 0,
    words: [
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: false,
    ...overrides,
  }
}

function Harness({ initialPiece }: { initialPiece: GearPiece }) {
  const [piece, setPiece] = useState(initialPiece)
  return (
    <I18nProvider>
      <RetuneOptionsDialog
        piece={piece}
        slotIndex={1}
        inputs={inputs}
        onChange={setPiece}
        onClose={() => {}}
      />
    </I18nProvider>
  )
}

describe("RetuneOptionsDialog", () => {
  it("lists every pool line for a bare piece", () => {
    render(<Harness initialPiece={makePiece()} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByText("Max Physical Attack")).toBeInTheDocument()
    expect(dialog.getByText("Critical Rate")).toBeInTheDocument()
    expect(dialog.getByText("Affinity Rate")).toBeInTheDocument()
  })

  it("greys out a line already sitting on another row instead of hiding it", () => {
    const piece = makePiece({
      words: [
        { word: "crit", value: 0.05, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
    })
    render(<Harness initialPiece={piece} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByText("Critical Rate")).toBeInTheDocument()
    expect(dialog.getByText("Already on this piece")).toBeInTheDocument()
  })

  it("never offers a line unreachable by retuning", () => {
    render(<Harness initialPiece={makePiece()} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.queryByText("Precision Rate")).not.toBeInTheDocument()
    expect(dialog.queryByText("Art of Sword DMG Boost")).not.toBeInTheDocument()
  })

  it("marks a deselected line as retuned out, with no draw chance", () => {
    render(<Harness initialPiece={makePiece()} />)
    const dialog = within(screen.getByRole("dialog"))
    fireEvent.click(dialog.getAllByText("Mark retuned out")[0])
    expect(dialog.getAllByText("Retuned out").length).toBeGreaterThan(0)
  })

  it("shows the single-draw budget note at gear level 86", () => {
    render(<Harness initialPiece={makePiece({ level: 86 })} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(
      dialog.getByText(
        "Gear level 86 grants one retune, ever — this is a single draw, not an average.",
      ),
    ).toBeInTheDocument()
  })

  it("shows the repeatable budget note at gear level 96", () => {
    render(<Harness initialPiece={makePiece({ level: 96 })} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(
      dialog.getByText("Repeatable, subject to an in-game cooldown this app does not model."),
    ).toBeInTheDocument()
  })

  it("reports no probability data at a level with no weighted pool", () => {
    render(<Harness initialPiece={makePiece({ level: 91 })} />)
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByText("No draw-probability data at this gear level yet.")).toBeInTheDocument()
  })
})
