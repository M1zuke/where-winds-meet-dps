import { useState } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, GearWordId, Inputs } from "../../src/engine/types"
import { tunementDrawChances, tunementSetChance } from "../../src/engine/tunementChance"
import { weaponTypeForSlot } from "../../src/definitions/classes/registry"
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

describe("GearPieceForm — the draw chance in a tunement's word list", () => {
  function wordComboboxes(): HTMLElement[] {
    return screen
      .getAllByRole("combobox")
      .filter((element) => element.closest("[class*=wordRow]") !== null)
  }

  function optionsOfLine(lineIndex: number): HTMLElement[] {
    fireEvent.focus(wordComboboxes()[lineIndex])
    return screen.getAllByRole("option")
  }

  function optionNamed(options: HTMLElement[], label: string): HTMLElement {
    return options.find(
      (option) => option.title === label || option.title.startsWith(`${label} — `),
    )!
  }

  function expectedTitle(piece: GearPiece, lineIndex: number, label: string, word: GearWordId) {
    const weapon = weaponTypeForSlot(inputs.classId, piece.slot)
    const chance = tunementDrawChances(piece, weapon, lineIndex).get(word) ?? 0
    return `${label} — ${(chance * 100).toFixed(1)}%`
  }

  it("shows each word's chance to roll on a tunable line", () => {
    const piece = makePiece()
    renderForm(piece)
    expect(wordComboboxes()).toHaveLength(piece.words.length)
    const options = optionsOfLine(2)
    for (const [label, word] of [
      ["Max Physical Attack", "maxPhys"],
      ["Affinity Rate", "affinity"],
      ["Agility", "agility"],
    ] as const) {
      expect(optionNamed(options, label).title).toBe(expectedTitle(piece, 2, label, word))
    }
    expect(optionNamed(options, "Max Physical Attack").title).not.toContain("— 0.0%")
  })

  it("shows 0 % for a word another tunable line already holds", () => {
    renderForm(makePiece())
    expect(optionNamed(optionsOfLine(2), "Critical Rate").title).toBe("Critical Rate — 0.0%")
  })

  it("shows the first line's chances from its own pool", () => {
    const piece = makePiece()
    renderForm(piece)
    expect(optionNamed(optionsOfLine(0), "Max Physical Attack").title).toBe(
      expectedTitle(piece, 0, "Max Physical Attack", "maxPhys"),
    )
  })

  it("lists None first, then rollable words alphabetically, then 0 % words alphabetically", () => {
    renderForm(makePiece())
    const options = optionsOfLine(2)
    const [none, ...words] = options.map((option) => option.title)
    expect(none).toBe("(none)")
    const isZero = (title: string) => title.endsWith("— 0.0%")
    const firstZero = words.findIndex(isZero)
    expect(firstZero).toBeGreaterThan(0)
    const rollable = words.slice(0, firstZero)
    const zero = words.slice(firstZero)
    expect(rollable.some(isZero)).toBe(false)
    expect(zero.every(isZero)).toBe(true)
    for (const group of [rollable, zero]) {
      expect(group).toEqual([...group].sort((left, right) => left.localeCompare(right)))
    }
  })

  it("disables a word another tunable line already holds, and ignores a click on it", () => {
    renderForm(makePiece())
    const critical = optionNamed(optionsOfLine(2), "Critical Rate")
    expect(critical).toHaveAttribute("aria-disabled", "true")
    fireEvent.mouseDown(critical)
    expect(wordComboboxes()[2]).toHaveValue("")
  })

  it("keeps every word choosable on the first line, whose word may roll once more", () => {
    const piece = makePiece()
    piece.words[1] = { word: "maxPhys", value: 40, retuned: false }
    renderForm(piece)
    expect(optionNamed(optionsOfLine(0), "Max Physical Attack")).not.toHaveAttribute(
      "aria-disabled",
    )
  })

  it("keeps a word choosable on the line that holds it", () => {
    renderForm(makePiece())
    expect(optionNamed(optionsOfLine(1), "Critical Rate")).not.toHaveAttribute("aria-disabled")
  })

  it("shows the chosen word's chance in the closed field", () => {
    const piece = makePiece()
    renderForm(piece)
    expect(wordComboboxes()[1]).toHaveAttribute(
      "title",
      expectedTitle(piece, 1, "Critical Rate", "crit"),
    )
  })

  it("shows how likely the piece's whole set of tunements is", () => {
    const piece = makePiece()
    piece.words[0] = { word: "maxPhys", value: 70, retuned: false }
    renderForm(piece)
    const weapon = weaponTypeForSlot(inputs.classId, piece.slot)
    const chance = tunementSetChance(piece, weapon)!
    expect(chance).toBeGreaterThan(0)
    expect(screen.getByText("Chance of these tunements")).toBeInTheDocument()
    expect(
      screen.getByText(
        `${(chance * 100).toFixed(2)}% (1 : ${Math.round(1 / chance).toLocaleString()})`,
      ),
    ).toBeInTheDocument()
  })

  it("shows the chance with one retune and names the retuned line", () => {
    const piece = makePiece()
    piece.words[0] = { word: "maxPhys", value: 70, retuned: false }
    piece.words[1] = { word: "crit", value: 0.05, retuned: true }
    renderForm(piece)
    expect(screen.getByText(/Chance with one retune \(line 2\)/)).toBeInTheDocument()
    expect(screen.getByText(/Lines 2–5 with one retune \(line 2\)/)).toBeInTheDocument()
  })

  it("shows chances at every gear level", () => {
    const piece = makePiece({ level: 91 })
    renderForm(piece)
    expect(optionNamed(optionsOfLine(2), "Max Physical Attack").title).toBe(
      expectedTitle(piece, 2, "Max Physical Attack", "maxPhys"),
    )
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
