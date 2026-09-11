import type { ParseRun } from "../../../../engine/dpsWorker"

export interface ParseSummary {
  runCount: number
  meanTotalDamage: number
  meanDps: number
  bestTotalDamage: number
  bestDps: number
  worstTotalDamage: number
  worstDps: number
  rangeFraction: number
  meanAbrasionHits: number
  meanNormalHits: number
  meanCriticalHits: number
  meanAffinityHits: number
  meanAbrasionDamage: number
  meanNormalDamage: number
  meanCriticalDamage: number
  meanAffinityDamage: number
}

export function parseSummary(runs: readonly ParseRun[]): ParseSummary | null {
  if (runs.length === 0) return null

  let totalDamage = 0
  let dps = 0
  let abrasion = 0
  let normal = 0
  let critical = 0
  let affinity = 0
  let abrasionDamage = 0
  let normalDamage = 0
  let criticalDamage = 0
  let affinityDamage = 0
  let best = runs[0]
  let worst = runs[0]

  for (const run of runs) {
    totalDamage += run.totalDamage
    dps += run.dps
    abrasion += run.abrasionHits
    normal += run.normalHits
    critical += run.criticalHits
    affinity += run.affinityHits
    abrasionDamage += run.abrasionDamage
    normalDamage += run.normalDamage
    criticalDamage += run.criticalDamage
    affinityDamage += run.affinityDamage
    if (run.totalDamage > best.totalDamage) best = run
    if (run.totalDamage < worst.totalDamage) worst = run
  }

  const meanTotalDamage = totalDamage / runs.length
  return {
    runCount: runs.length,
    meanTotalDamage,
    meanDps: dps / runs.length,
    bestTotalDamage: best.totalDamage,
    bestDps: best.dps,
    worstTotalDamage: worst.totalDamage,
    worstDps: worst.dps,
    rangeFraction:
      meanTotalDamage > 0 ? (best.totalDamage - worst.totalDamage) / meanTotalDamage : 0,
    meanAbrasionHits: abrasion / runs.length,
    meanNormalHits: normal / runs.length,
    meanCriticalHits: critical / runs.length,
    meanAffinityHits: affinity / runs.length,
    meanAbrasionDamage: abrasionDamage / runs.length,
    meanNormalDamage: normalDamage / runs.length,
    meanCriticalDamage: criticalDamage / runs.length,
    meanAffinityDamage: affinityDamage / runs.length,
  }
}

export function sortedParses(runs: readonly ParseRun[]): ParseRun[] {
  return [...runs].sort((left, right) => left.totalDamage - right.totalDamage)
}
