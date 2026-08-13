export { PATH_LABELS, PENETRATION_PATHS, PERCENT_PATHS } from "../../data/stats/statLines"

export function fmtPenetration(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return String(Math.round(value * 1000) / 10)
}

export function fmt(value: number, isPercent: boolean, isPenetration = false): string {
  if (!Number.isFinite(value)) return "—"
  if (isPenetration) return fmtPenetration(value)
  if (isPercent) return `${(value * 100).toFixed(2)}%`
  if (Math.abs(value) < 0.01 && value !== 0) return value.toFixed(4)
  return value.toFixed(2)
}

export function readPath(obj: unknown, path: string): number {
  const parts = path.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p]
    else return 0
  }
  return typeof cur === "number" ? cur : 0
}
