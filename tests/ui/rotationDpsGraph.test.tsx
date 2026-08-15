import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { RotationDpsGraphPanel } from "../../src/ui/features/rotation/rotation-dps-graph-panel/RotationDpsGraphPanel"
import styles from "../../src/ui/features/rotation/rotation-dps-graph-panel/RotationDpsGraphPanel.module.scss"
import type { Result, TimelineEvent } from "../../src/engine/types"

function event(timeSec: number, damage: number): TimelineEvent {
  return {
    frame: Math.round(timeSec * 60),
    timeSec,
    skillName: "Test Skill",
    type: "weapon",
    kind: "hit",
    damage,
    inWindow: true,
  }
}

function resultWith(timeline: TimelineEvent[], rotationDuration: number): Result {
  const totalDamage = timeline.reduce((sum, entry) => sum + entry.damage, 0)
  return {
    dps: rotationDuration > 0 ? totalDamage / rotationDuration : 0,
    totalDamage,
    rotationDuration,
    graduationRate: null,
    perSkill: [],
    ranking: [],
    warnings: [],
    timeline,
  }
}

function renderGraph(result: Result) {
  return render(
    <I18nProvider>
      <RotationDpsGraphPanel result={result} />
    </I18nProvider>,
  ).container
}

function linePath(container: HTMLElement, className: string = styles.line): string {
  return container.querySelector("." + className)!.getAttribute("d")!
}

function anchors(container: HTMLElement, className?: string): { x: number; y: number }[] {
  return linePath(container, className)
    .split(/(?=[ML])/)
    .filter((segment) => segment.trim() !== "")
    .map((segment) =>
      segment
        .replace(/^[ML]\s*/, "")
        .trim()
        .split(/\s+/)
        .map(Number),
    )
    .map(([x, y]) => ({ x, y }))
}

describe("RotationDpsGraphPanel", () => {
  it("spans the plot from the zero point to the rotation's end", () => {
    const container = renderGraph(resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4))
    const drawn = anchors(container)

    expect(drawn[0].x).toBe(0)
    expect(drawn[0].y).toBe(100)
    expect(drawn[drawn.length - 1].x).toBe(100)
  })

  it("closes the cumulative curve on the rotation's own DPS", () => {
    const result = resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4)
    const container = renderGraph(result)

    const drawn = anchors(container, styles.cumulativeLine)
    const averageY = Number(container.querySelector("." + styles.averageLine)!.getAttribute("y1"))

    expect(drawn[drawn.length - 1].x).toBe(100)
    expect(drawn[drawn.length - 1].y).toBeCloseTo(averageY, 3)
  })

  it("joins the points with straight segments, never curves", () => {
    const container = renderGraph(resultWith([event(1, 100), event(2, 200), event(3, 300)], 3))

    expect(anchors(container)).toHaveLength(4)
    expect(linePath(container).match(/L/g)).toHaveLength(3)
    expect(linePath(container)).not.toContain("C")
  })

  it("spans the full height without clipping the peak", () => {
    const container = renderGraph(resultWith([event(1, 5000), event(4, 1000)], 4))

    for (const { y } of anchors(container)) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })

  it("reads out the time and DPS of the point under the pointer", () => {
    const result = resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4)
    const container = renderGraph(result)
    const plot = container.querySelector("." + styles.plot)!
    plot.getBoundingClientRect = () => ({ left: 0, width: 400 }) as DOMRect

    fireEvent.mouseMove(plot, { clientX: 200 })

    expect(screen.getByText("2.00s")).toBeInTheDocument()
    expect(screen.getByText("2,000 DPS")).toBeInTheDocument()
    expect(screen.getByText("3,000 DPS so far")).toBeInTheDocument()
  })

  it("drops the readout once the pointer leaves", () => {
    const container = renderGraph(resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4))
    const plot = container.querySelector("." + styles.plot)!
    plot.getBoundingClientRect = () => ({ left: 0, width: 400 }) as DOMRect

    fireEvent.mouseMove(plot, { clientX: 200 })
    fireEvent.mouseLeave(plot)

    expect(screen.queryByText("2.00s")).not.toBeInTheDocument()
  })

  it("flips the readout to the left half once the point passes midway", () => {
    const container = renderGraph(resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4))
    const plot = container.querySelector("." + styles.plot)!
    plot.getBoundingClientRect = () => ({ left: 0, width: 400 }) as DOMRect

    fireEvent.mouseMove(plot, { clientX: 40 })
    expect(container.querySelector("." + styles.hoverTooltip)!.className).not.toContain(
      styles.flipped,
    )

    fireEvent.mouseMove(plot, { clientX: 390 })
    expect(container.querySelector("." + styles.hoverTooltip)!.className).toContain(styles.flipped)
  })

  it("shows an empty state when the rotation produces no timeline", () => {
    renderGraph(resultWith([], 0))

    expect(screen.getByText("(none)")).toBeInTheDocument()
  })
})
