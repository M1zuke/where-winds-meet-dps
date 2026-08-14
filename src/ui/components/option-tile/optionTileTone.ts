export type OptionTileTone = "neutral" | "positive" | "negative" | "current"

export function deltaTone(deltaDps: number): OptionTileTone {
  if (!Number.isFinite(deltaDps)) return "neutral"
  if (deltaDps > 0) return "positive"
  if (deltaDps < 0) return "negative"
  return "neutral"
}
