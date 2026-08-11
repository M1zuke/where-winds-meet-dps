import breakthroughTiers from "./breakthroughTiers.json"

const BREAKTHROUGHS = breakthroughTiers as ReadonlyArray<{
  breakthrough: number
  name: string
  levelRange: string
  resistance: number
  defense: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  multiplier: number
}>

export function getBreakthrough(bt: number) {
  const t = BREAKTHROUGHS.find((x) => x.breakthrough === bt)
  if (!t) throw new Error(`Unknown breakthrough: ${bt}`)
  return t
}
