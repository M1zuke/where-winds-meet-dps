import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GearPieceForm } from "../../src/ui/features/gear/gear-piece-form/GearPieceForm"

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
      { word: "power", value: 30, retuned: false },
      { word: "crit", value: 0.05, retuned: false },
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
      <GearPieceForm
        piece={piece}
        inputs={inputs}
        onChange={setPiece}
        wordMaxRows={[]}
        wordMaxPending={false}
        showWordMax={false}
      />
    </I18nProvider>
  )
}

function renderForm(piece: GearPiece) {
  render(<Harness initialPiece={piece} />)
}

function rButtons(): HTMLElement[] {
  return screen.getAllByTitle("Retune")
}

function cogButtons(): HTMLElement[] {
  return screen.getAllByTitle("Retune options")
}

describe("GearPieceForm — the R button", () => {
  it("renders the first line's R button disabled, at every gear level", () => {
    for (const level of [86, 91, 96, 100, 105] as const) {
      const { unmount } = render(<Harness initialPiece={makePiece({ level })} />)
      expect(rButtons()[0]).toBeDisabled()
      unmount()
    }
  })

  it("turning R on for one line turns it off for every other line", () => {
    renderForm(makePiece())
    fireEvent.click(rButtons()[1])
    expect(rButtons()[1].className).toContain("is-on")

    fireEvent.click(rButtons()[2])
    expect(rButtons()[2].className).toContain("is-on")
    expect(rButtons()[1].className).not.toContain("is-on")
  })

  it("leaves the first line's R off-limits even after clicking it", () => {
    renderForm(makePiece())
    fireEvent.click(rButtons()[0])
    expect(rButtons()[0].className).not.toContain("is-on")
  })

  it("keeps a stored piece's two retuned lines until the user edits an R button", () => {
    const stored = makePiece({
      words: [
        { word: "power", value: 30, retuned: false },
        { word: "crit", value: 0.05, retuned: true },
        { word: "affinity", value: 0.03, retuned: true },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
    })
    renderForm(stored)
    expect(rButtons()[1].className).toContain("is-on")
    expect(rButtons()[2].className).toContain("is-on")
  })
})

describe("GearPieceForm — the settings button", () => {
  it("is disabled while that row's R is off, and enabled once it is on", () => {
    renderForm(makePiece())
    expect(cogButtons()[1]).toBeDisabled()

    fireEvent.click(rButtons()[1])
    expect(cogButtons()[1]).not.toBeDisabled()
  })

  it("opens the retune options dialog for that row", () => {
    renderForm(makePiece())
    fireEvent.click(rButtons()[1])
    fireEvent.click(cogButtons()[1])
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(within(screen.getByRole("dialog")).getByText("Retune options")).toBeInTheDocument()
  })
})
