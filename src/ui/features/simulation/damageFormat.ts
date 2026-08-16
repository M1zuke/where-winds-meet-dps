export function fullNumber(value: number): string {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "—"
}

export function compactDamage(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const magnitude = Math.abs(value)
  if (magnitude >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M"
  if (magnitude >= 10_000) return (value / 1000).toFixed(0) + "k"
  if (magnitude >= 1000) return (value / 1000).toFixed(1) + "k"
  return value.toFixed(0)
}

export function fixed(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—"
}

export function signedPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—"
  const percent = fraction * 100
  const sign = percent > 0.005 ? "+" : percent < -0.005 ? "−" : "±"
  return `${sign}${Math.abs(percent).toFixed(1)} %`
}
