import type { ParseRun } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import type { ParseRunDetail } from "../../../hooks/useParseRunDetail"
import { groupByBreakdownName } from "../../../utils/skillBreakdown"
import { decimalNumber, fixed, fullNumber, signedPercent } from "../damageFormat"
import styles from "./SimulationRunDetailPanel.module.scss"

const SKELETON_ROWS = [88, 64, 71, 45]

const OUTCOMES = [
  {
    category: "critical",
    labelKey: "simulation.outcomeMix.category.critical",
    hitsOf: (run: ParseRun) => run.criticalHits,
    damageOf: (detail: ParseRunDetail) => detail.outcomeDamage.crit,
  },
  {
    category: "normal",
    labelKey: "common.normal",
    hitsOf: (run: ParseRun) => run.normalHits,
    damageOf: (detail: ParseRunDetail) => detail.outcomeDamage.normal,
  },
  {
    category: "affinity",
    labelKey: "common.affinity",
    hitsOf: (run: ParseRun) => run.affinityHits,
    damageOf: (detail: ParseRunDetail) => detail.outcomeDamage.affinity,
  },
  {
    category: "abrasion",
    labelKey: "common.abrasion",
    hitsOf: (run: ParseRun) => run.abrasionHits,
    damageOf: (detail: ParseRunDetail) => detail.outcomeDamage.abrasion,
  },
] as const

function relativeTo(dps: number, reference: number): number {
  return reference > 0 ? dps / reference - 1 : 0
}

function signClassOf(delta: number): string {
  if (delta > 0.00005) return "is-positive"
  if (delta < -0.00005) return "is-negative"
  return "is-zero"
}

function Stat({
  label,
  value,
  valueClassName,
  sub,
  lead,
}: {
  label: string
  value: string
  valueClassName?: string
  sub?: string
  lead?: boolean
}) {
  return (
    <div className={styles.stat + (lead ? ` ${styles.lead}` : "")}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value + (valueClassName ? ` ${valueClassName}` : "")}>{value}</span>
      {sub !== undefined && <span className={styles.sub}>{sub}</span>}
    </div>
  )
}

export function SimulationRunDetailPanel({
  run,
  rank,
  runCount,
  topPercent,
  medianDps,
  meanDps,
  rotationDuration,
  detail,
  onClose,
}: {
  run: ParseRun
  rank: number
  runCount: number
  topPercent: number
  medianDps: number
  meanDps: number
  rotationDuration: number
  detail: ParseRunDetail | null
  onClose: () => void
}) {
  const { t } = useI18n()
  const rows = detail ? groupByBreakdownName(detail.perSkill) : []
  const maxDamage = rows[0]?.expectedDamage || 1
  const hits = run.abrasionHits + run.normalHits + run.criticalHits + run.affinityHits
  const vsMedian = relativeTo(run.dps, medianDps)
  const vsMean = relativeTo(run.dps, meanDps)
  const shareOf = (count: number) => (hits > 0 ? (count / hits) * 100 : 0)
  const damageShareOf = (damage: number) =>
    run.totalDamage > 0 ? (damage / run.totalDamage) * 100 : 0

  return (
    <div className={styles.detail}>
      <div className={styles.head}>
        <span className={styles.title}>
          {t("simulation.runDetail.run")} #{fullNumber(run.index + 1)}
        </span>
        <span className={styles.context}>
          {t("common.rank")} {fullNumber(rank)} {t("common.of")} {fullNumber(runCount)} ·{" "}
          {t("simulation.runDetail.top")} {fixed(topPercent, 2)} %
          {detail === null ? ` · ${t("simulation.runDetail.replaying")}` : ""}
        </span>
        <button type="button" className={styles.close} onClick={onClose}>
          <span className={styles.closeWide}>✕</span>
          <span className={styles.closeNarrow}>‹ {t("simulation.runs.allRuns")}</span>
        </button>
      </div>

      <div className={styles.statStrip}>
        <Stat
          label={t("common.dps")}
          value={decimalNumber(run.dps, 2)}
          sub={`${fullNumber(run.totalDamage)} ${t("simulation.summaryBar.dmg")} · ${fixed(rotationDuration, 1)}s`}
          lead
        />
        <Stat
          label={t("simulation.runs.vsMedian")}
          value={signedPercent(vsMedian)}
          valueClassName={signClassOf(vsMedian)}
          sub={decimalNumber(medianDps, 2)}
        />
        <Stat
          label={t("simulation.runDetail.vsAverage")}
          value={signedPercent(vsMean)}
          valueClassName={signClassOf(vsMean)}
          sub={decimalNumber(meanDps, 2)}
        />
        <Stat
          label={t("common.hits2")}
          value={fullNumber(hits)}
          sub={detail ? `${rows.length} ${t("simulation.runDetail.skills")}` : "—"}
        />
      </div>

      <div className={styles.outcomes}>
        {OUTCOMES.map(({ category, labelKey, hitsOf, damageOf }) => (
          <span key={category} className={`${styles.chip} ${styles[category]}`}>
            {t(labelKey)} <b>{fullNumber(hitsOf(run))}</b>
            <span className={styles.chipShare}>{fixed(shareOf(hitsOf(run)), 1)} %</span>
            <span className={styles.chipDamage}>
              {detail ? `${fixed(damageShareOf(damageOf(detail)), 1)} %` : "—"}{" "}
              {t("simulation.summaryBar.dmg")}
            </span>
          </span>
        ))}
      </div>

      <h3 className={styles.breakdownTitle}>{t("simulation.runDetail.damageBySkill")}</h3>

      {detail === null ? (
        <div className={styles.skeletons} aria-hidden="true">
          {SKELETON_ROWS.map((width) => (
            <div key={width} className={styles.skeleton} style={{ width: width + "%" }} />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.tableScroller}>
            <table className={`ranking-table skill-table ${styles.breakdown}`}>
              <thead>
                <tr>
                  <th>{t("common.skill")}</th>
                  <th>{t("common.count")}</th>
                  <th>{t("common.damage")}</th>
                  <th>{t("common.share")}</th>
                  <th className="bar-col" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <td>{t(row.nameKey, row.name)}</td>
                    <td className={styles.numeric}>{fullNumber(row.count)}</td>
                    <td className={styles.numeric}>{fullNumber(row.expectedDamage)}</td>
                    <td className={styles.numeric}>{fixed(row.percentOfTotal * 100, 1)} %</td>
                    <td className="bar-col">
                      <div className="skill-bar-track">
                        <div
                          className="skill-bar-fill"
                          style={{
                            width: ((row.expectedDamage / maxDamage) * 100).toFixed(2) + "%",
                          }}
                        />
                        <span className="skill-bar-label">
                          {fixed((row.expectedDamage / maxDamage) * 100, 0)} %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">{t("simulation.runDetail.sumsToThisRun")}</p>
        </>
      )}
    </div>
  )
}
