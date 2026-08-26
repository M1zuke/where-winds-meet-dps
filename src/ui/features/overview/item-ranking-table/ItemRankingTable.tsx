import type { ItemRankingRow } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./ItemRankingTable.module.scss"

interface Props {
  rows: ItemRankingRow[]
}

function fmtDpsDelta(dpsDelta: number): string {
  const rounded = Math.round(dpsDelta * 100) / 100
  const formatted = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return rounded > 0 ? `+${formatted}` : formatted
}

function deltaSignClass(dpsDelta: number): string {
  const rounded = Math.round(dpsDelta * 100) / 100
  if (rounded > 0) return "is-positive"
  if (rounded < 0) return "is-negative"
  return "is-zero"
}

export function ItemRankingTable({ rows }: Props) {
  const { t } = useI18n()
  if (!rows.length) return null
  const sorted = [...rows].sort((rowA, rowB) => rowB.liftPercent - rowA.liftPercent)
  const fmt = (value: number, digits = 2) =>
    Number.isFinite(value)
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })
      : "—"
  return (
    <table className={`ranking-table ranking-table-spaced ${styles.rankingTable}`}>
      <thead>
        <tr>
          <th>{t("overview.itemRankingTable.statLine")}</th>
          <th>{t("common.amount")}</th>
          <th>{t("overview.itemRankingTable.dps")}</th>
          <th>{t("overview.itemRankingTable.lift")}</th>
          <th>{t("overview.itemRankingTable.lead")}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, index) => (
          <tr key={row.statLineId + index}>
            <td>{t(row.labelKey, row.label)}</td>
            <td>{row.unit === "percent" ? fmt(row.amount * 100, 2) + " %" : fmt(row.amount, 2)}</td>
            <td
              className={`${styles.dpsDelta} ${deltaSignClass(row.dpsDelta)}`}
              title={`${t("overview.itemRankingTable.expectedDps")}: ${fmt(row.expectedDps, 2)}`}
            >
              {fmtDpsDelta(row.dpsDelta)}
            </td>
            <td>{(row.liftPercent * 100).toFixed(2) + " %"}</td>
            <td style={{ color: row.leadVsMin === "(none)" ? "#666" : "#d8b070" }}>
              {typeof row.leadVsMin === "number" ? row.leadVsMin.toFixed(2) : t("common.none")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
