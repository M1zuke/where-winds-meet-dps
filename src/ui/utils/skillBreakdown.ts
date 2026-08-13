import { breakdownNameOf } from "../../engine/skill"
import type { SkillTickResult } from "../../engine/types"

export interface BreakdownRow {
  name: string
  count: number
  castTimeSec: number
  expectedDamage: number
  percentOfTotal: number
  dpsOfCastTime: number
}

export function groupByBreakdownName(rows: SkillTickResult[]): BreakdownRow[] {
  const grouped = new Map<string, BreakdownRow>()
  for (const row of rows) {
    const name = breakdownNameOf(row.breakdownName, row.name)
    const castTimeSec = row.castTimeSec ?? 0
    const existing = grouped.get(name)
    if (existing) {
      existing.count += row.count
      existing.castTimeSec += castTimeSec
      existing.expectedDamage += row.expectedDamage
      existing.percentOfTotal += row.percentOfTotal
    } else {
      grouped.set(name, {
        name,
        count: row.count,
        castTimeSec,
        expectedDamage: row.expectedDamage,
        percentOfTotal: row.percentOfTotal,
        dpsOfCastTime: 0,
      })
    }
  }
  const out = [...grouped.values()]
  for (const row of out) {
    row.dpsOfCastTime = row.castTimeSec > 0 ? row.expectedDamage / row.castTimeSec : 0
  }
  return out.sort((rowA, rowB) => rowB.expectedDamage - rowA.expectedDamage)
}
