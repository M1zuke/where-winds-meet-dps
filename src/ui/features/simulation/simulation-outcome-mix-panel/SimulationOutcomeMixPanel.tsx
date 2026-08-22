import { useI18n } from "../../../../i18n/i18nContext"
import type { ExpectedOutcomeRates } from "../../../../engine/dpsWorker"
import { fixed } from "../damageFormat"
import type { ParseSummary } from "../simulation-summary-bar/summaryStats"
import { outcomeMix, totalMeanHits, type OutcomeCategory } from "./outcomeMix"
import styles from "./SimulationOutcomeMixPanel.module.scss"

const CATEGORY_KEYS: Record<OutcomeCategory, string> = {
  critical: "simulation.outcomeMix.category.critical",
  normal: "common.normal",
  affinity: "common.affinity",
  abrasion: "common.abrasion",
}

export function SimulationOutcomeMixPanel({
  summary,
  expectedRates,
}: {
  summary: ParseSummary
  expectedRates: ExpectedOutcomeRates | null
}) {
  const { t } = useI18n()
  const rows = outcomeMix(summary, expectedRates)
  const total = totalMeanHits(summary)
  if (total <= 0) return <div className="empty-tab">{t("common.none")}</div>

  const mixLabel = rows
    .map((row) => `${t(CATEGORY_KEYS[row.category])} ${fixed(row.observedShare * 100, 1)} %`)
    .join(", ")

  return (
    <>
      <div
        className={styles.mixBar}
        role="img"
        aria-label={`${t("simulation.outcomeMix.outcomeMix")} — ${mixLabel}`}
      >
        {rows.map((row) => (
          <div
            key={row.category}
            className={`${styles.segment} ${styles[row.category]}`}
            style={{ flexBasis: (row.observedShare * 100).toFixed(2) + "%" }}
          />
        ))}
      </div>
      <table className={`ranking-table ranking-table-spaced ${styles.mixTable}`}>
        <thead>
          <tr>
            <th>{t("simulation.outcomeMix.outcome")}</th>
            <th className={styles.centered}>{t("common.hits2")}</th>
            <th className={styles.centered}>{t("common.share")}</th>
            <th className={styles.centered}>{t("simulation.outcomeMix.expected")}</th>
            <th className={styles.centered}>{t("simulation.outcomeMix.gapPp")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <th scope="row" className={styles.categoryCell}>
                <span className={`${styles.swatch} ${styles[row.category]}`} />
                {t(CATEGORY_KEYS[row.category])}
              </th>
              <td className={`${styles.numeric} ${styles.centered}`}>{fixed(row.meanHits, 2)}</td>
              <td className={`${styles.numeric} ${styles.centered}`}>
                {fixed(row.observedShare * 100, 1)} %
              </td>
              <td className={`${styles.numeric} ${styles.centered}`}>
                {row.expectedShare === null ? "—" : `${fixed(row.expectedShare * 100, 1)} %`}
              </td>
              <td className={`${styles.numeric} ${styles.centered}`}>
                {row.deltaPoints === null ? "—" : fixed(row.deltaPoints, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{t("simulation.outcomeMix.observedShareShouldHint")}</p>
    </>
  )
}
