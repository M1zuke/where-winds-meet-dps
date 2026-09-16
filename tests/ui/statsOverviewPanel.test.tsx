import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { equippedPiecesFor, withDerivedStats } from "../../src/engine/derivedInputs"
import {
  totalFormlessAttack,
  totalMaxHp,
  totalPlayerAttributes,
} from "../../src/definitions/baseStats"
import { EMPTY_EQUIPPED } from "../../src/engine/types"
import type { GearPiece, Inputs } from "../../src/engine/types"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { StatsOverviewPanel } from "../../src/ui/components/stats-overview-panel/StatsOverviewPanel"
import { finalHitOutcomeRates } from "../../src/ui/components/stats-overview-panel/finalHitOutcomeRates"
import { fmt } from "../../src/ui/utils/statFormatting"

function withFormlessAndBellstrikeWeapon(formlessMaxRoll: number): Inputs {
  const weapon: GearPiece = {
    id: "formless-weapon",
    slot: "leftWeapon",
    level: 96,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: [
      { word: "minBellstrike", value: 20, retuned: false },
      { word: "maxFormless", value: formlessMaxRoll, retuned: true },
      { word: "maxBellstrike", value: 30, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
  return {
    ...defaultInputs,
    inventory: [weapon],
    equipped: { ...EMPTY_EQUIPPED, leftWeapon: weapon.id },
  }
}

describe("finalHitOutcomeRates", () => {
  it("uses the full crit rate when crit and affinity total less than 100 percent", () => {
    const rates = finalHitOutcomeRates({
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
    const rates = finalHitOutcomeRates({
      precision: 0.8,
      critRate: 0.7,
      directCritRate: 0.1,
      affinityRate: 0.2,
      directAffinityRate: 0.1,
    })

    expect(rates.critRate).toBeCloseTo(0.56)
    expect(rates.affinityRate).toBeCloseTo(0.3)
  })

  it("scales the crit chance by no more than 100 percent precision", () => {
    const rates = finalHitOutcomeRates({
      precision: 1.0101,
      critRate: 0.6973,
      directCritRate: 0.046,
      affinityRate: 0,
      directAffinityRate: 0,
    })

    expect(rates.critRate).toBeCloseTo(0.7433, 4)
    expect(rates.critRate).toBeLessThan(0.7433 * 1.0101)
  })

  it("leaves the crit chance untouched while precision sits below the cap", () => {
    const rates = finalHitOutcomeRates({
      precision: 0.9,
      critRate: 0.5,
      directCritRate: 0,
      affinityRate: 0,
      directAffinityRate: 0,
    })

    expect(rates.critRate).toBeCloseTo(0.45, 9)
  })

  it("caps the panel crit rate before the direct crit rate is added on top", () => {
    const rates = finalHitOutcomeRates({
      precision: 1,
      critRate: 0.95,
      directCritRate: 0.05,
      affinityRate: 0,
      directAffinityRate: 0,
    })

    expect(rates.critRate).toBeCloseTo(0.85, 9)
  })

  it("caps the panel affinity rate before the direct affinity rate is added on top", () => {
    const rates = finalHitOutcomeRates({
      precision: 1,
      critRate: 0,
      directCritRate: 0,
      affinityRate: 0.6,
      directAffinityRate: 0.05,
    })

    expect(rates.affinityRate).toBeCloseTo(0.45, 9)
  })

  it("reports the affinity chance independent of precision", () => {
    const lowPrecision = finalHitOutcomeRates({
      precision: 0.5,
      critRate: 0.3,
      directCritRate: 0,
      affinityRate: 0.3,
      directAffinityRate: 0,
    })
    const highPrecision = finalHitOutcomeRates({
      precision: 1,
      critRate: 0.3,
      directCritRate: 0,
      affinityRate: 0.3,
      directAffinityRate: 0,
    })

    expect(lowPrecision.affinityRate).toBeCloseTo(0.3, 9)
    expect(highPrecision.affinityRate).toBeCloseTo(0.3, 9)
  })

  it("scales abrasion by the precision miss and the room left by affinity", () => {
    const rates = finalHitOutcomeRates({
      precision: 0.8,
      critRate: 0.5,
      directCritRate: 0,
      affinityRate: 0.2,
      directAffinityRate: 0,
    })

    expect(rates.critRate).toBeCloseTo(0.4, 9)
    expect(rates.affinityRate).toBeCloseTo(0.2, 9)
    expect(rates.abrasionRate).toBeCloseTo(0.16, 9)
    expect(rates.normalRate).toBeCloseTo(0.24, 9)
  })

  it("leaves no abrasion once precision reaches its cap", () => {
    const rates = finalHitOutcomeRates({
      precision: 1.2,
      critRate: 0.5,
      directCritRate: 0,
      affinityRate: 0.2,
      directAffinityRate: 0,
    })

    expect(rates.abrasionRate).toBeCloseTo(0, 9)
  })

  it("splits every roll into four outcomes that add up to one", () => {
    for (const precision of [0.5, 0.85, 1, 1.25]) {
      for (const affinityRate of [0, 0.2, 0.6]) {
        const rates = finalHitOutcomeRates({
          precision,
          critRate: 0.5,
          directCritRate: 0.05,
          affinityRate,
          directAffinityRate: 0.05,
        })

        expect(
          rates.critRate + rates.affinityRate + rates.abrasionRate + rates.normalRate,
        ).toBeCloseTo(1, 9)
      }
    }
  })
})

describe("StatsOverviewPanel", () => {
  it("shows every hit outcome as its own row, alongside the combined crit and affinity", () => {
    const withSets = applyBowSet(applyArmorSet(withDerivedStats(defaultInputs)))
    const effective = effectiveRates(withSets)
    const finalRates = finalHitOutcomeRates({
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
    expect(screen.getByText("Final Crit & Affinity").parentElement).toHaveTextContent(
      fmt(finalRates.critRate + finalRates.affinityRate, true),
    )
    expect(screen.getByText("Final Abrasion").parentElement).toHaveTextContent(
      fmt(finalRates.abrasionRate, true),
    )
    expect(screen.getByText("Final Normal").parentElement).toHaveTextContent(
      fmt(finalRates.normalRate, true),
    )
  })

  it("reads Formless attack out of the primary attribute row and onto its own", () => {
    const inputs = withFormlessAndBellstrikeWeapon(40)
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

  it("shows Constitution, Defense and Max HP alongside Power, Agility and Momentum", () => {
    const equipped = equippedPiecesFor(defaultInputs)
    const attrs = totalPlayerAttributes(
      defaultInputs.breakthrough,
      equipped,
      defaultInputs.disabledTalentPoints,
    )
    const maxHp = totalMaxHp(
      defaultInputs.breakthrough,
      equipped,
      defaultInputs.disabledTalentPoints,
    )

    render(
      <I18nProvider>
        <StatsOverviewPanel inputs={defaultInputs} />
      </I18nProvider>,
    )

    expect(screen.getByText("Constitution").parentElement).toHaveTextContent(fmt(attrs.body, false))
    expect(screen.getByText("Defense").parentElement).toHaveTextContent(fmt(attrs.defense, false))
    expect(screen.getByText("Max HP").parentElement).toHaveTextContent(fmt(maxHp, false))
  })

  it("points Max HP at the Arsenal tab's own mastery score, without a floor marker", () => {
    render(
      <I18nProvider>
        <StatsOverviewPanel inputs={defaultInputs} />
      </I18nProvider>,
    )

    expect(screen.getByText("Max HP").parentElement).not.toHaveTextContent("≥")
    expect(screen.getByText("Max HP")).toHaveAttribute(
      "title",
      "Includes each unlocked Arsenal's own mastery score, set on the Arsenal tab; defaults to Total Mastery",
    )
  })

  it("counts an equipped Formless word on the Formless row, not the attribute's own", () => {
    const bare = totalFormlessAttack(defaultInputs, equippedPiecesFor(defaultInputs))
    const withWord = withFormlessAndBellstrikeWeapon(40)
    const geared = totalFormlessAttack(withWord, equippedPiecesFor(withWord))

    expect(geared.max - bare.max).toBeCloseTo(40, 9)
    expect(geared.min).toBeCloseTo(bare.min, 9)
  })
})
