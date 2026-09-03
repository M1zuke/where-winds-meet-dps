import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { equippedPiecesFor, withDerivedStats } from "../../src/engine/derivedInputs"
import { totalFormlessAttack } from "../../src/definitions/baseStats"
import { EMPTY_EQUIPPED } from "../../src/engine/types"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { StatsOverviewPanel } from "../../src/ui/components/stats-overview-panel/StatsOverviewPanel"
import { finalCritAffinityRates } from "../../src/ui/components/stats-overview-panel/finalCritAffinityRates"
import { fmt } from "../../src/ui/utils/statFormatting"

function withFormlessAndBellstrikeHelm(formlessMaxRoll: number): Inputs {
  const helm: GearPiece = {
    id: "formless-helm",
    slot: "helm",
    level: 91,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: [
      { word: "maxFormless", value: formlessMaxRoll, retuned: false },
      { word: "minBellstrike", value: 20, retuned: false },
      { word: "maxBellstrike", value: 30, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
  return { ...defaultInputs, inventory: [helm], equipped: { ...EMPTY_EQUIPPED, helm: helm.id } }
}

describe("finalCritAffinityRates", () => {
  it("uses the full crit rate when crit and affinity total less than 100 percent", () => {
    const rates = finalCritAffinityRates({
      precision: 0.8,
      critRate: 0.4,
      directCritRate: 0.1,
      affinityRate: 0.25,
      directAffinityRate: 0.15,
    })

    expect(rates.critRate).toBeCloseTo(0.4)
    expect(rates.affinityRate).toBeCloseTo(0.4)
  })

  it("limits crit to the rate left after affinity when their total exceeds 100 percent", () => {
    const rates = finalCritAffinityRates({
      precision: 0.8,
      critRate: 0.7,
      directCritRate: 0.1,
      affinityRate: 0.2,
      directAffinityRate: 0.1,
    })

    expect(rates.critRate).toBeCloseTo(0.56)
    expect(rates.affinityRate).toBeCloseTo(0.3)
  })
})

describe("StatsOverviewPanel", () => {
  it("shows final crit and affinity rates separately", () => {
    const withSets = applyBowSet(applyArmorSet(withDerivedStats(defaultInputs)))
    const effective = effectiveRates(withSets)
    const finalRates = finalCritAffinityRates({
      precision: effective.precision,
      critRate: effective.critRate,
      directCritRate: withSets.directCritRate,
      affinityRate: effective.affinityRate,
      directAffinityRate: withSets.directAffinityRate,
    })

    render(
      <I18nProvider>
        <StatsOverviewPanel inputs={defaultInputs} />
      </I18nProvider>,
    )

    expect(screen.getByText("Final Crit").parentElement).toHaveTextContent(
      fmt(finalRates.critRate, true),
    )
    expect(screen.getByText("Final Affinity").parentElement).toHaveTextContent(
      fmt(finalRates.affinityRate, true),
    )
    expect(screen.queryByText("Final Crit/Affinity")).not.toBeInTheDocument()
  })

  it("reads Formless attack out of the primary attribute row and onto its own", () => {
    const inputs = withFormlessAndBellstrikeHelm(40)
    const equipped = equippedPiecesFor(inputs)
    const formless = totalFormlessAttack(inputs, equipped)
    const withSets = applyBowSet(applyArmorSet(withDerivedStats(inputs)))

    render(
      <I18nProvider>
        <StatsOverviewPanel inputs={inputs} />
      </I18nProvider>,
    )

    expect(screen.getByText("Min Formless Attack").parentElement).toHaveTextContent(
      fmt(formless.min, false),
    )
    expect(screen.getByText("Max Formless Attack").parentElement).toHaveTextContent(
      fmt(formless.max, false),
    )
    expect(screen.getByText("Min Bellstrike Attack").parentElement).toHaveTextContent(
      fmt(withSets.bellstrike.min - formless.min, false),
    )
    expect(screen.getByText("Max Bellstrike Attack").parentElement).toHaveTextContent(
      fmt(withSets.bellstrike.max - formless.max, false),
    )
  })

  it("counts an equipped Formless word on the Formless row, not the attribute's own", () => {
    const bare = totalFormlessAttack(defaultInputs, equippedPiecesFor(defaultInputs))
    const withWord = withFormlessAndBellstrikeHelm(40)
    const geared = totalFormlessAttack(withWord, equippedPiecesFor(withWord))

    expect(geared.max - bare.max).toBeCloseTo(40, 9)
    expect(geared.min).toBeCloseTo(bare.min, 9)
  })
})
