import { useI18n } from "../../../../i18n/i18nContext"
import type { SimulationStatus } from "../../../hooks/useParseSimulation"
import { fullNumber } from "../damageFormat"
import styles from "./SimulationProgressBar.module.scss"

export function SimulationProgressBar({
  done,
  total,
  status,
}: {
  done: number
  total: number
  status: SimulationStatus
}) {
  const { t } = useI18n()
  if (status === "idle") return null

  const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0
  const statusText =
    status === "running"
      ? `${t("Simulating")} ${fullNumber(total)} ${t("runs")}…`
      : status === "cancelled"
        ? `${t("Simulation cancelled at")} ${fullNumber(done)} ${t("runs")}`
        : `${t("Simulation complete")} — ${fullNumber(done)} ${t("runs")}`

  return (
    <>
      <div className={styles.progressRow}>
        <div
          className="skill-bar-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${fullNumber(done)} ${t("of")} ${fullNumber(total)} ${t("runs")}`}
        >
          <div className="skill-bar-fill" style={{ width: percent.toFixed(2) + "%" }} />
        </div>
        <span className={styles.progressCount}>
          {fullNumber(done)} / {fullNumber(total)}
        </span>
      </div>
      <p className={styles.progressStatus} role="status">
        {statusText}
      </p>
    </>
  )
}
