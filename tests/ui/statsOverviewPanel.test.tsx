import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { StatsOverviewPanel } from "../../src/ui/components/stats-overview-panel/StatsOverviewPanel"
import { finalCritAffinityRates } from "../../src/ui/components/stats-overview-panel/finalCritAffinityRates"
import { fmt } from "../../src/ui/utils/statFormatting"

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
})
