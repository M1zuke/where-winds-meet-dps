import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { GearPieceForm } from "../../src/ui/features/gear/gear-piece-form/GearPieceForm"
import { attunementComboboxOptions } from "../../src/ui/features/gear/shared/attunementComboboxOptions"
import { attunementsFor } from "../../src/engine/attunements"

const splendorInputs: Inputs = { ...defaultInputs, classId: "bellstrikeSplendor" }

function pieceHolding(attunement: string): GearPiece {
  return {
    id: "p1",
    slot: "helm",
    level: 96,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: Array.from({ length: 5 }, () => ({ word: "", value: 0, retuned: false })) as never,
    attunement,
    attunementValue: 0.05,
    relayed: false,
  }
}

describe("an attunement the class does not offer", () => {
  it("is listed as stored, marked no longer available and not selectable", () => {
    const options = attunementComboboxOptions(
      (key, fallback) => fallback ?? key,
      attunementsFor("helm", "bellstrikeSplendor"),
      "spearQ",
    )
    expect(options.find((option) => option.value === "spearQ")).toMatchObject({
      label: "Heavenquaker Spear Martial Art Skill DMG Boost",
      detail: "common.noLongerAvailable",
      disabled: true,
    })
  })

  it("keeps an id no option carries at all, labelled by the id", () => {
    const options = attunementComboboxOptions((key, fallback) => fallback ?? key, [], "gone")
    expect(options.find((option) => option.value === "gone")).toMatchObject({
      label: "gone",
      disabled: true,
    })
  })

  it("adds no extra entry for an id the class offers", () => {
    const offered = attunementsFor("helm", "bellstrikeSplendor")
    const options = attunementComboboxOptions(
      (key, fallback) => fallback ?? key,
      offered,
      "swordCharged",
    )
    expect(options).toHaveLength(offered.length + 1)
  })

  it("shows in the gear piece form as the stored line, not as None", () => {
    render(
      <I18nProvider>
        <GearPieceForm
          piece={pieceHolding("spearQ")}
          inputs={splendorInputs}
          onChange={() => {}}
          wordMaxRows={[]}
          wordMaxPending={false}
          showWordMax={false}
        />
      </I18nProvider>,
    )
    expect(
      screen.getByDisplayValue("Heavenquaker Spear Martial Art Skill DMG Boost"),
    ).toBeInTheDocument()
  })
})
