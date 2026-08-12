import type { Result, SkillTickResult } from "../../../engine/types"
import { useI18n } from "../../../i18n/i18nContext"
import styles from "./OutputPanel.module.scss"

function groupKey(name: string): string {
  return name.replace(/\s*\(\d+ stack\)$/, "")
}

interface GroupedSkill {
  name: string
  count: number
  expectedDamage: number
  percentOfTotal: number
}

function groupAndSort(rows: SkillTickResult[]): GroupedSkill[] {
  const map = new Map<string, GroupedSkill>()
  for (const row of rows) {
    const key = groupKey(row.name)
    const existing = map.get(key)
    if (existing) {
      existing.count += row.count
      existing.expectedDamage += row.expectedDamage
      existing.percentOfTotal += row.percentOfTotal
    } else {
      map.set(key, {
        name: key,
        count: row.count,
        expectedDamage: row.expectedDamage,
        percentOfTotal: row.percentOfTotal,
      })
    }
  }
  return Array.from(map.values()).sort((rowA, rowB) => rowB.expectedDamage - rowA.expectedDamage)
}

const fmt = (n: number, digits = 2) =>
  Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—"

interface MetricsCardProps {
  result: Result
  className?: string
  graduationPending?: boolean
  theoreticalDps?: number | null
  onGraduationClick?: () => void
}

export function MetricsCard({
  result,
  className,
  graduationPending = false,
  theoreticalDps = null,
  onGraduationClick,
}: MetricsCardProps) {
  const { t } = useI18n()
  const graduationText =
    result.graduationRate === null
      ? graduationPending
        ? "…"
        : "—"
      : fmt(result.graduationRate * 100, 1) + "%"
  const graduationTitle =
    theoreticalDps === null
      ? t("Current DPS divided by the theoretical class maximum")
      : `${t("Current DPS divided by the theoretical class maximum")}: ${fmt(theoreticalDps, 2)} DPS`
  return (
    <div className={styles.metricsCard + (className ? ` ${className}` : "")}>
      <div className={styles.dps}>
        <span className={styles.label}>{t("DPS")}</span>
        <div className={styles.dpsValueRow}>
          <span className={styles.value}>{fmt(result.dps, 2)}</span>
          <button
            type="button"
            className={`${styles.graduation}${graduationPending ? ` ${styles.pending}` : ""}`}
            title={graduationTitle}
            aria-label={`${t("Graduation")}: ${graduationText}`}
            aria-live="polite"
            onClick={onGraduationClick}
          >
            <span className={styles.graduationValue}>{graduationText}</span>
            <span className={styles.graduationLabel}>{t("Graduation")}</span>
          </button>
        </div>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>{t("Total Damage")}</span>
        <span className={styles.value}>{fmt(result.totalDamage, 0)}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>{t("Duration")}</span>
        <span className={styles.value}>{fmt(result.rotationDuration, 0)}s</span>
      </div>
    </div>
  )
}

export function WarningsList({ result }: { result: Result }) {
  if (!result.warnings.length) return null
  return (
    <div className="warnings">
      {result.warnings.map((warning, index) => (
        <div key={index}>⚠ {warning}</div>
      ))}
    </div>
  )
}

export function PerSkillTable({ result }: { result: Result }) {
  const { t } = useI18n()
  if (!result.perSkill.length) {
    return <div className="empty-tab">{t("(none)")}</div>
  }
  const rows = groupAndSort(result.perSkill)
  const maxDmg = rows[0]?.expectedDamage || 1
  return (
    <table className="ranking-table skill-table">
      <thead>
        <tr>
          <th>{t("Skill")}</th>
          <th>{t("Count")}</th>
          <th>{t("Damage")}</th>
          <th>{t("Share")}</th>
          <th className="bar-col" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const ratio = row.expectedDamage / maxDmg
          return (
            <tr key={row.name}>
              <td>{t(row.name)}</td>
              <td>{row.count}</td>
              <td>{fmt(row.expectedDamage, 0)}</td>
              <td>{(row.percentOfTotal * 100).toFixed(1)} %</td>
              <td className="bar-col">
                <div className="skill-bar-track">
                  <div
                    className="skill-bar-fill"
                    style={{ width: (ratio * 100).toFixed(2) + "%" }}
                  />
                  <span className="skill-bar-label">{(ratio * 100).toFixed(0)} %</span>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
