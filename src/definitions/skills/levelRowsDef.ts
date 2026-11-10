import type { CoefficientRow, LevelRows, LevelScale } from "../../engine/skill"

function rowsByKey(scale: LevelScale, rows: Readonly<Record<number, CoefficientRow>>): LevelRows {
  const keyed: Record<string, CoefficientRow> = {}
  for (const [key, row] of Object.entries(rows)) keyed[key] = row
  return { scale, rows: keyed }
}

export function artLevelRows(rows: Readonly<Record<number, CoefficientRow>>): LevelRows {
  return rowsByKey("artLevel", rows)
}

export function mysticTierRows(rows: Readonly<Record<number, CoefficientRow>>): LevelRows {
  return rowsByKey("mysticTier", rows)
}

export function defineLevelRows<const T extends Readonly<Record<string, LevelRows>>>(rows: T): T {
  return rows
}

export function highestRow(levelRows: LevelRows): CoefficientRow {
  const keys = Object.keys(levelRows.rows).map(Number)
  return levelRows.rows[String(Math.max(...keys))]!
}
