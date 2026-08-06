import { useMemo } from "react"
import type { Result, SkillTickResult } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"

function groupKey(name: string): string {
  return name.replace(/\s*\(\d+ stack\)$/, "")
}

interface GroupedRow {
  name: string
  count: number
  castTimeSec: number
  expectedDamage: number
  percentOfTotal: number
  dpsOfCastTime: number
}

function groupAndSort(rows: SkillTickResult[]): GroupedRow[] {
  const map = new Map<string, GroupedRow>()
  for (const row of rows) {
    const key = groupKey(row.name)
    const castTimeSec = row.castTimeSec ?? 0
    const existing = map.get(key)
    if (existing) {
      existing.count += row.count
      existing.castTimeSec += castTimeSec
      existing.expectedDamage += row.expectedDamage
      existing.percentOfTotal += row.percentOfTotal
    } else {
      map.set(key, {
        name: key,
        count: row.count,
        castTimeSec,
        expectedDamage: row.expectedDamage,
        percentOfTotal: row.percentOfTotal,
        dpsOfCastTime: 0,
      })
    }
  }
  const out = Array.from(map.values())
  for (const row of out) {
    row.dpsOfCastTime = row.castTimeSec > 0 ? row.expectedDamage / row.castTimeSec : 0
  }
  return out.sort((rowA, rowB) => rowB.expectedDamage - rowA.expectedDamage)
}

const fmt = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—"

const PALETTE = [
  "#c0a060",
  "#6a9bd8",
  "#8fbf6a",
  "#d87a7a",
  "#b57ad8",
  "#d8b46a",
  "#6ad8c4",
  "#d86ab0",
  "#9a9a9a",
  "#d8d86a",
  "#7a9ad8",
  "#d89a6a",
]
const colorFor = (index: number) => PALETTE[index % PALETTE.length]

export function RotationBreakdownPanel({ result }: { result: Result }) {
  const { t } = useI18n()
  const rows = useMemo(() => groupAndSort(result.perSkill), [result.perSkill])

  if (rows.length === 0) {
    return <div className="empty-tab">{t("(none)")}</div>
  }

  const maxDmg = rows[0]?.expectedDamage || 1

  return (
    <table className="ranking-table skill-table">
      <thead>
        <tr>
          <th>{t("Skill")}</th>
          <th className="bar-col" />
          <th>{t("Hit Count")}</th>
          <th>{t("Duration")}</th>
          <th>{t("Share")}</th>
          <th>{t("DPS (cast time)")}</th>
          <th>{t("Total Damage")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const ratio = row.expectedDamage / maxDmg
          return (
            <tr key={row.name}>
              <td>{t(row.name)}</td>
              <td className="bar-col">
                <div className="skill-bar-track">
                  <div
                    className="skill-bar-fill"
                    style={{ width: (ratio * 100).toFixed(2) + "%", background: colorFor(index) }}
                  />
                </div>
              </td>
              <td>{row.count}</td>
              <td>{row.castTimeSec.toFixed(2)} s</td>
              <td>{(row.percentOfTotal * 100).toFixed(1)} %</td>
              <td>{fmt(row.dpsOfCastTime, 1)}</td>
              <td>{fmt(row.expectedDamage, 0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
