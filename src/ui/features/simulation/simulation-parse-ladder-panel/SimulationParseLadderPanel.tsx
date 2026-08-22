import type { ParseRun } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { decimalNumber, fixed, fullNumber, signedPercent } from "../damageFormat"
import { ladderAxisSpan, MEDIAN_RANK, parseLadder, type ParseLadderRow } from "./parseLadder"
import styles from "./SimulationParseLadderPanel.module.scss"

function tierClassOf(rank: number): string {
  if (rank >= 99) return styles.tierHigh
  if (rank >= 80) return styles.tierMid
  return styles.tierBase
}

function signClassOf(delta: number): string {
  if (delta > 0.00005) return "is-positive"
  if (delta < -0.00005) return "is-negative"
  return "is-zero"
}

export function SimulationParseLadderPanel({ sorted }: { sorted: readonly ParseRun[] }) {
  const { t } = useI18n()
  const rows = parseLadder(sorted)
  if (rows.length === 0) return <div className="empty-tab">{t("common.none")}</div>

  const axisSpan = ladderAxisSpan(rows) || 1
  const rankLabel = (rank: number) =>
    rank === 100
      ? t("simulation.parseLadder.max")
      : rank === 0
        ? t("simulation.parseLadder.min")
        : rank === MEDIAN_RANK
          ? t("simulation.parseLadder.median")
          : `${rank}`

  const barFor = (row: ParseLadderRow) => {
    const halfWidth = Math.min(50, (Math.abs(row.deltaFromMedian) / axisSpan) * 50)
    return row.deltaFromMedian >= 0
      ? { left: "50%", width: halfWidth + "%" }
      : { right: "50%", width: halfWidth + "%" }
  }

  return (
    <table className={`ranking-table skill-table ${styles.ladder}`}>
      <thead>
        <tr>
          <th>{t("simulation.parseLadder.rank")}</th>
          <th className={styles.centered}>{t("common.dps")}</th>
          <th className={styles.centered}>{t("common.damage")}</th>
          <th className="bar-col">
            {t("simulation.parseLadder.vsMedian")} (±{fixed(axisSpan * 100, 1)} %)
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const sign = signClassOf(row.deltaFromMedian)
          return (
            <tr key={row.rank} className={row.rank === MEDIAN_RANK ? styles.medianRow : ""}>
              <th scope="row" className={`${styles.rank} ${tierClassOf(row.rank)}`}>
                {rankLabel(row.rank)}
              </th>
              <td className={`${styles.dps} ${styles.centered}`}>{decimalNumber(row.dps, 2)}</td>
              <td className={`${styles.damage} ${styles.centered}`}>
                {fullNumber(row.totalDamage)}
              </td>
              <td className="bar-col">
                <div className="skill-bar-track">
                  <div className={`${styles.divergingFill} ${sign}`} style={barFor(row)} />
                  <div className={styles.centreTick} />
                </div>
              </td>
              <td className={`${styles.delta} ${sign}`}>{signedPercent(row.deltaFromMedian)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
