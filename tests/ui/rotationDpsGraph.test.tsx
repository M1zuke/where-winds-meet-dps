import { render, screen } from "@testing-library/react"
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

describe("RotationDpsGraphPanel", () => {
  it("closes the line on the rotation's own DPS", () => {
    const result = resultWith([event(1, 4000), event(2, 2000), event(4, 2000)], 4)
    const container = renderGraph(result)

    const points = container
      .querySelector("." + styles.line)!
      .getAttribute("points")!
      .split(" ")
      .map((point) => point.split(",").map(Number))
    const [lastX, lastY] = points[points.length - 1]
    const averageY = Number(container.querySelector("." + styles.averageLine)!.getAttribute("y1"))

    expect(lastX).toBe(100)
    expect(lastY).toBeCloseTo(averageY, 3)
  })

  it("plots one vertex per point in the series", () => {
    const container = renderGraph(resultWith([event(1, 100), event(2, 200), event(3, 300)], 3))

    const points = container
      .querySelector("." + styles.line)!
      .getAttribute("points")!
      .split(" ")
    expect(points).toHaveLength(3)
  })

  it("spans the full height without clipping the peak", () => {
    const container = renderGraph(resultWith([event(1, 5000), event(4, 1000)], 4))

    const points = container
      .querySelector("." + styles.line)!
      .getAttribute("points")!
      .split(" ")
      .map((point) => Number(point.split(",")[1]))

    for (const y of points) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })

  it("shows an empty state when the rotation produces no timeline", () => {
    renderGraph(resultWith([], 0))

    expect(screen.getByText("(none)")).toBeInTheDocument()
  })
})
