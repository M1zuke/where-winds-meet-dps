import { useI18n } from "../../../../i18n/i18nContext"
import type { ExpectedOutcomeRates } from "../../../../engine/dpsWorker"
import { compactDamage, fixed } from "../damageFormat"
import type { ParseSummary } from "../simulation-summary-bar/summaryStats"
import {
  outcomeMix,
  totalMeanDamage,
  totalMeanHits,
  type OutcomeCategory,
  type OutcomeRow,
} from "./outcomeMix"
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
  const damageTotal = totalMeanDamage(summary)
  if (total <= 0) return <div className="empty-tab">{t("common.none")}</div>

  const mixLabel = (share: (row: OutcomeRow) => number) =>
    rows
      .map((row) => `${t(CATEGORY_KEYS[row.category])} ${fixed(share(row) * 100, 1)} %`)
      .join(", ")

  const mixBar = (label: string, share: (row: OutcomeRow) => number, ariaLabel: string) => (
    <div className={styles.mixRow}>
      <span className={styles.mixLabel}>{label}</span>
      <div className={styles.mixBar} role="img" aria-label={ariaLabel}>
        {rows.map((row) => (
          <div
            key={row.category}
            className={`${styles.segment} ${styles[row.category]}`}
            style={{ flexBasis: (share(row) * 100).toFixed(2) + "%" }}
          />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {damageTotal > 0 &&
        mixBar(
          t("common.damage"),
          (row) => row.damageShare,
          `${t("simulation.outcomeMix.damageComposition")} — ${mixLabel((row) => row.damageShare)}`,
        )}
      {mixBar(
        t("common.hits2"),
        (row) => row.observedShare,
        `${t("simulation.outcomeMix.outcomeMix")} — ${mixLabel((row) => row.observedShare)}`,
      )}
      <table className={`ranking-table ranking-table-spaced ${styles.mixTable}`}>
        <thead>
          <tr>
            <th>{t("simulation.outcomeMix.outcome")}</th>
            <th className={styles.centered}>{t("common.hits2")}</th>
            <th className={styles.centered}>{t("common.share")}</th>
            <th className={styles.centered}>{t("common.damage")}</th>
            <th className={styles.centered}>{t("simulation.outcomeMix.damageShare")}</th>
            <th className={`${styles.centered} ${styles.expectedCell}`}>
              {t("simulation.outcomeMix.expected")}
            </th>
            <th className={`${styles.centered} ${styles.expectedCell}`}>
              {t("simulation.outcomeMix.gapPp")}
            </th>
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
                {compactDamage(row.meanDamage)}
              </td>
              <td className={`${styles.numeric} ${styles.centered} ${styles.damageShareCell}`}>
                {fixed(row.damageShare * 100, 1)} %
              </td>
              <td className={`${styles.numeric} ${styles.centered} ${styles.expectedCell}`}>
                {row.expectedShare === null ? "—" : `${fixed(row.expectedShare * 100, 1)} %`}
              </td>
              <td className={`${styles.numeric} ${styles.centered} ${styles.expectedCell}`}>
                {row.deltaPoints === null ? "—" : fixed(row.deltaPoints, 2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{t("simulation.outcomeMix.damageShareTracksHint")}</p>
      <p className="hint">{t("simulation.outcomeMix.observedShareShouldHint")}</p>
    </>
  )
}
