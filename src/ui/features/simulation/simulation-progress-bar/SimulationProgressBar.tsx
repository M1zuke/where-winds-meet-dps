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
      ? `${t("simulation.progressBar.simulating")} ${fullNumber(total)} ${t("common.runs")}…`
      : status === "cancelled"
        ? `${t("simulation.progressBar.simulationCancelledAt")} ${fullNumber(done)} ${t("common.runs")}`
        : `${t("common.simulationComplete")} — ${fullNumber(done)} ${t("common.runs")}`

  return (
    <>
      <div className={styles.progressRow}>
        <div
          className="skill-bar-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${fullNumber(done)} ${t("common.of")} ${fullNumber(total)} ${t("common.runs")}`}
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
