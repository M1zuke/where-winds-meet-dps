import { useI18n } from "../../../../i18n/i18nContext"
import { decimalNumber, fixed, fullNumber } from "../damageFormat"
import type { ParseSummary } from "./summaryStats"
import styles from "./SimulationSummaryBar.module.scss"

const PLACEHOLDER = "—"

function Stat({ label, value, lead }: { label: string; value: string; lead?: boolean }) {
  return (
    <div className={styles.stat + (lead ? ` ${styles.lead}` : "")}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}

export function SimulationSummaryBar({
  summary,
  contextLabel,
  isPending,
  isStale,
}: {
  summary: ParseSummary | null
  contextLabel: string
  isPending: boolean
  isStale: boolean
}) {
  const { t } = useI18n()
  const damage = (value: number | undefined) => (summary ? fullNumber(value ?? 0) : PLACEHOLDER)
  const hits = (value: number | undefined) => (summary ? fixed(value ?? 0, 2) : PLACEHOLDER)

  return (
    <div className={`panel ${styles.summaryPanel}${isStale ? ` ${styles.stale}` : ""}`}>
      <div className="panel-head">
        <h2>{t("Simulation Summary")}</h2>
        <span className="panel-head-meta">
          <span className="panel-head-meta-value">{contextLabel}</span>
        </span>
      </div>
      <div className={styles.statStrip} style={{ opacity: isPending ? 0.6 : 1 }}>
        <Stat label={t("Avg Total Damage")} value={damage(summary?.meanTotalDamage)} lead />
        <Stat
          label={t("Avg DPS")}
          value={summary ? decimalNumber(summary.meanDps, 2) : PLACEHOLDER}
        />
        <Stat label={t("Best Parse")} value={damage(summary?.bestTotalDamage)} />
        <Stat label={t("Worst Parse")} value={damage(summary?.worstTotalDamage)} />
        <Stat
          label={t("DPS Range")}
          value={summary ? `${fixed(summary.rangeFraction * 100, 1)} %` : PLACEHOLDER}
        />
        <div className={styles.groupStart}>
          <Stat label={t("Abrasion Hits")} value={hits(summary?.meanAbrasionHits)} />
        </div>
        <Stat label={t("Normal Hits")} value={hits(summary?.meanNormalHits)} />
        <Stat label={t("Critical Hits")} value={hits(summary?.meanCriticalHits)} />
        <Stat label={t("Affinity Hits")} value={hits(summary?.meanAffinityHits)} />
      </div>
    </div>
  )
}
