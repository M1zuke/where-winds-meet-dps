export interface PathPoint {
  x: number
  y: number
}

const SMOOTHING = 0.2

const clampBetween = (value: number, edge: number, otherEdge: number) =>
  Math.min(Math.max(value, Math.min(edge, otherEdge)), Math.max(edge, otherEdge))

export function smoothPath(points: PathPoint[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const segments = [`M ${points[0].x} ${points[0].y}`]
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index]
    const end = points[index + 1]
    const before = points[index - 1] ?? start
    const after = points[index + 2] ?? end

    const startControl = {
      x: clampBetween(start.x + (end.x - before.x) * SMOOTHING, start.x, end.x),
      y: clampBetween(start.y + (end.y - before.y) * SMOOTHING, start.y, end.y),
    }
    const endControl = {
      x: clampBetween(end.x - (after.x - start.x) * SMOOTHING, start.x, end.x),
      y: clampBetween(end.y - (after.y - start.y) * SMOOTHING, start.y, end.y),
    }
    segments.push(
      `C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`,
    )
  }
  return segments.join(" ")
}
