import type { ExpectedOutcomeRates } from "../../../../engine/dpsWorker"
import type { ParseSummary } from "../simulation-summary-bar/summaryStats"

export type OutcomeCategory = "critical" | "normal" | "affinity" | "abrasion"

export const OUTCOME_ORDER: readonly OutcomeCategory[] = [
  "critical",
  "normal",
  "affinity",
  "abrasion",
]

export interface OutcomeRow {
  category: OutcomeCategory
  meanHits: number
  observedShare: number
  expectedShare: number | null
  deltaPoints: number | null
}

const MEAN_HITS_BY_CATEGORY: Record<OutcomeCategory, (summary: ParseSummary) => number> = {
  critical: (summary) => summary.meanCriticalHits,
  normal: (summary) => summary.meanNormalHits,
  affinity: (summary) => summary.meanAffinityHits,
  abrasion: (summary) => summary.meanAbrasionHits,
}

const EXPECTED_BY_CATEGORY: Record<OutcomeCategory, keyof ExpectedOutcomeRates> = {
  critical: "crit",
  normal: "normal",
  affinity: "affinity",
  abrasion: "abrasion",
}

export function totalMeanHits(summary: ParseSummary): number {
  return OUTCOME_ORDER.reduce((sum, category) => sum + MEAN_HITS_BY_CATEGORY[category](summary), 0)
}

export function outcomeMix(
  summary: ParseSummary,
  expectedRates: ExpectedOutcomeRates | null,
): OutcomeRow[] {
  const total = totalMeanHits(summary)
  return OUTCOME_ORDER.map((category) => {
    const meanHits = MEAN_HITS_BY_CATEGORY[category](summary)
    const observedShare = total > 0 ? meanHits / total : 0
    const expectedShare = expectedRates ? expectedRates[EXPECTED_BY_CATEGORY[category]] : null
    return {
      category,
      meanHits,
      observedShare,
      expectedShare,
      deltaPoints: expectedShare === null ? null : (observedShare - expectedShare) * 100,
    }
  })
}
