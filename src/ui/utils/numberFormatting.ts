export function formatNumber(value: number, digits = 2): string {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—"
}

export function formatCompactDamage(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const sign = value < 0 ? "-" : ""
  const magnitude = Math.abs(value)
  if (magnitude >= 1_000_000_000) return `${sign}${(magnitude / 1_000_000_000).toFixed(1)}B`
  if (magnitude >= 1_000_000) return `${sign}${(magnitude / 1_000_000).toFixed(1)}M`
  if (magnitude >= 1_000) return `${sign}${(magnitude / 1_000).toFixed(1)}K`
  return formatNumber(value, 0)
}
