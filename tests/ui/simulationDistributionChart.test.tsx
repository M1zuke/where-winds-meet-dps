import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { SimulationDistributionPanel } from "../../src/ui/features/simulation/simulation-distribution-panel/SimulationDistributionPanel"
import { damageHistogram } from "../../src/ui/features/simulation/simulation-distribution-panel/damageHistogram"
import { compactDamage } from "../../src/ui/features/simulation/damageFormat"

const totals = Array.from({ length: 200 }, (_unused, index) => 371_000 + (index % 40) * 2100).sort(
  (left, right) => left - right,
)

function renderChart(sortedTotals = totals, expectedTotalDamage = 410_000) {
  const { container } = render(
    <I18nProvider>
      <SimulationDistributionPanel
        sortedTotals={sortedTotals}
        meanTotalDamage={411_950}
        expectedTotalDamage={expectedTotalDamage}
      />
    </I18nProvider>,
  )
  return container
}

function plot(container: HTMLElement): HTMLElement {
  return container.querySelector("svg")!.parentElement as HTMLElement
}

describe("SimulationDistributionPanel", () => {
  it("draws one bar per bin across the full plot width", () => {
    const container = renderChart()
    const bars = container.querySelectorAll("svg rect")
    const bins = damageHistogram(totals).bins

    expect(bars).toHaveLength(bins.length + 1)
  })

  it("runs the damage axis from the worst parse to the best without rounding outward", () => {
    const container = renderChart()
    const bars = [...container.querySelectorAll("svg rect")].slice(1)
    const first = bars[0]
    const last = bars[bars.length - 1]

    expect(Number(first.getAttribute("x"))).toBeLessThan(1)
    expect(Number(last.getAttribute("x")) + Number(last.getAttribute("width"))).toBeGreaterThan(99)
    expect(screen.getByText(compactDamage(totals[0]))).toBeInTheDocument()
    expect(screen.getByText(compactDamage(totals[totals.length - 1]))).toBeInTheDocument()
  })

  it("scales the tallest bar to the top of the plot without clipping", () => {
    const container = renderChart()
    const heights = [...container.querySelectorAll("svg rect")].map((bar) =>
      Number(bar.getAttribute("height")),
    )

    expect(Math.max(...heights)).toBeLessThanOrEqual(100)
    expect(Math.max(...heights)).toBeGreaterThan(0)
  })

  it("marks the median, the mean and the deterministic expectation", () => {
    const container = renderChart()
    const lines = [...container.querySelectorAll("svg line")].filter(
      (line) => line.getAttribute("x1") === line.getAttribute("x2"),
    )

    expect(lines).toHaveLength(3)
  })

  it("leaves out the expectation line when it falls outside the sample", () => {
    const container = renderChart(totals, 50)
    const lines = [...container.querySelectorAll("svg line")].filter(
      (line) => line.getAttribute("x1") === line.getAttribute("x2"),
    )

    expect(lines).toHaveLength(2)
    expect(screen.queryByText("Expected")).not.toBeInTheDocument()
  })

  it("reads out the bin range and its run count under the pointer", () => {
    const container = renderChart()
    const target = plot(container)
    target.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 220 }) as DOMRect

    fireEvent.mouseMove(target, { clientX: 100 })

    expect(screen.getByText(/runs$/)).toBeInTheDocument()
  })

  it("drops the readout once the pointer leaves", () => {
    const container = renderChart()
    const target = plot(container)
    target.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 220 }) as DOMRect

    fireEvent.mouseMove(target, { clientX: 100 })
    fireEvent.mouseLeave(target)

    expect(screen.queryByText(/runs$/)).not.toBeInTheDocument()
  })

  it("says nothing at all without runs", () => {
    renderChart([])

    expect(screen.getByText("(none)")).toBeInTheDocument()
  })
})
