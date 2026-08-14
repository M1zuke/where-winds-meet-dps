import { describe, it, expect } from "vitest"
import { smoothPath } from "../../src/ui/features/rotation/rotation-dps-graph-panel/smoothPath"

function controlPoints(path: string): { x: number; y: number }[] {
  return path
    .split(/(?=[MC])/)
    .filter((segment) => segment.startsWith("C"))
    .flatMap((segment) =>
      segment
        .slice(1)
        .split(",")
        .slice(0, 2)
        .map((pair) => pair.trim().split(/\s+/).map(Number))
        .map(([x, y]) => ({ x, y })),
    )
}

describe("smoothPath", () => {
  it("joins every point with a curve rather than a straight segment", () => {
    const path = smoothPath([
      { x: 0, y: 50 },
      { x: 50, y: 10 },
      { x: 100, y: 40 },
    ])

    expect(path.startsWith("M 0 50")).toBe(true)
    expect(path.match(/C/g)).toHaveLength(2)
    expect(path).not.toContain("L")
  })

  it("keeps every control point inside its own segment, so the curve invents no value", () => {
    const points = [
      { x: 0, y: 90 },
      { x: 10, y: 10 },
      { x: 20, y: 80 },
      { x: 30, y: 15 },
      { x: 100, y: 50 },
    ]
    const path = smoothPath(points)

    const boxes = points.slice(0, -1).map((start, index) => ({ start, end: points[index + 1] }))
    const controls = controlPoints(path)

    expect(controls).toHaveLength(boxes.length * 2)
    controls.forEach((control, index) => {
      const { start, end } = boxes[Math.floor(index / 2)]
      expect(control.x).toBeGreaterThanOrEqual(Math.min(start.x, end.x))
      expect(control.x).toBeLessThanOrEqual(Math.max(start.x, end.x))
      expect(control.y).toBeGreaterThanOrEqual(Math.min(start.y, end.y))
      expect(control.y).toBeLessThanOrEqual(Math.max(start.y, end.y))
    })
  })

  it("ends on the last point exactly", () => {
    const path = smoothPath([
      { x: 0, y: 0 },
      { x: 40, y: 70 },
      { x: 100, y: 25 },
    ])

    expect(path.endsWith("100 25")).toBe(true)
  })

  it("degrades to a move for a single point and to nothing for none", () => {
    expect(smoothPath([{ x: 5, y: 6 }])).toBe("M 5 6")
    expect(smoothPath([])).toBe("")
  })
})
