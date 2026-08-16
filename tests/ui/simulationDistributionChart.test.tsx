import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { SimulationDistributionPanel } from "../../src/ui/features/simulation/simulation-distribution-panel/SimulationDistributionPanel"
import { parseHistogram } from "../../src/ui/features/simulation/simulation-distribution-panel/parseHistogram"
import { decimalNumber } from "../../src/ui/features/simulation/damageFormat"
import type { ParseRun } from "../../src/engine/dpsWorker"

const DURATION = 60

const runs: ParseRun[] = Array.from({ length: 200 }, (_unused, index) => {
  const totalDamage = 371_000 + (index % 40) * 2100
  return {
    totalDamage,
    dps: totalDamage / DURATION,
    abrasionHits: 1,
    normalHits: 5,
    criticalHits: 3,
    affinityHits: 1,
  }
}).sort((left, right) => left.totalDamage - right.totalDamage)

const dpsValues = runs.map((entry) => entry.dps)

function renderChart(sorted = runs, expectedDps = 410_000 / DURATION) {
  const { container } = render(
    <I18nProvider>
      <SimulationDistributionPanel
        sorted={sorted}
        meanDps={411_950 / DURATION}
        expectedDps={expectedDps}
        rotationDuration={DURATION}
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
    const bins = parseHistogram(dpsValues).bins

    expect(bars).toHaveLength(bins.length + 1)
  })

  it("runs the DPS axis from the worst parse to the best without rounding outward", () => {
    const container = renderChart()
    const bars = [...container.querySelectorAll("svg rect")].slice(1)
    const first = bars[0]
    const last = bars[bars.length - 1]

    expect(Number(first.getAttribute("x"))).toBeLessThan(1)
    expect(Number(last.getAttribute("x")) + Number(last.getAttribute("width"))).toBeGreaterThan(99)
    expect(screen.getByText(decimalNumber(dpsValues[0], 0))).toBeInTheDocument()
    expect(screen.getByText(decimalNumber(dpsValues[dpsValues.length - 1], 0))).toBeInTheDocument()
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
    const container = renderChart(runs, 50)
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

    expect(screen.getByText(/runs · /)).toBeInTheDocument()
    expect(screen.getByText(/DPS$/)).toBeInTheDocument()
    expect(screen.getByText(/dmg$/)).toBeInTheDocument()
  })

  it("drops the readout once the pointer leaves", () => {
    const container = renderChart()
    const target = plot(container)
    target.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 220 }) as DOMRect

    fireEvent.mouseMove(target, { clientX: 100 })
    fireEvent.mouseLeave(target)

    expect(screen.queryByText(/runs · /)).not.toBeInTheDocument()
  })

  it("says nothing at all without runs", () => {
    renderChart([])

    expect(screen.getByText("(none)")).toBeInTheDocument()
  })
})
