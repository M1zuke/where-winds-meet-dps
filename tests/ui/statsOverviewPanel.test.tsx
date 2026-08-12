import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { StatsOverviewPanel } from "../../src/ui/components/stats-overview-panel/StatsOverviewPanel"
import { fmt } from "../../src/ui/utils/statFormatting"

describe("StatsOverviewPanel", () => {
  it("shows final crit and affinity rates separately", () => {
    const withSets = applyBowSet(applyArmorSet(withDerivedStats(defaultInputs)))
    const effective = effectiveRates(withSets)
    const finalEffectiveCritRate =
      effective.precision * (effective.critRate + withSets.directCritRate)
    const finalEffectiveAffinityRate =
      effective.precision * (effective.affinityRate + withSets.directAffinityRate)

    render(
      <I18nProvider>
        <StatsOverviewPanel inputs={defaultInputs} />
      </I18nProvider>,
    )

    expect(screen.getByText("Final Crit").parentElement).toHaveTextContent(
      fmt(finalEffectiveCritRate, true),
    )
    expect(screen.getByText("Final Affinity").parentElement).toHaveTextContent(
      fmt(finalEffectiveAffinityRate, true),
    )
    expect(screen.queryByText("Final Crit/Affinity")).not.toBeInTheDocument()
  })
})
