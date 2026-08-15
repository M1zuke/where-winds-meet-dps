import { breakdownNameOf } from "../../engine/skill"
import type { SkillTickResult } from "../../engine/types"

export interface BreakdownRow {
  name: string
  count: number
  expectedDamage: number
  percentOfTotal: number
}

export function groupByBreakdownName(rows: SkillTickResult[]): BreakdownRow[] {
  const grouped = new Map<string, BreakdownRow>()
  for (const row of rows) {
    const name = breakdownNameOf(row.breakdownName, row.name)
    const existing = grouped.get(name)
    if (existing) {
      existing.count += row.count
      existing.expectedDamage += row.expectedDamage
      existing.percentOfTotal += row.percentOfTotal
    } else {
      grouped.set(name, {
        name,
        count: row.count,
        expectedDamage: row.expectedDamage,
        percentOfTotal: row.percentOfTotal,
      })
    }
  }
  return [...grouped.values()].sort((rowA, rowB) => rowB.expectedDamage - rowA.expectedDamage)
}
