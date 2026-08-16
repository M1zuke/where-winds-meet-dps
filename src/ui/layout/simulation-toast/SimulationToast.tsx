import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useI18n } from "../../../i18n/i18nContext"
import type { SimulationStatus } from "../../hooks/useParseSimulation"
import { fullNumber } from "../../features/simulation/damageFormat"
import styles from "./SimulationToast.module.scss"

export const SIMULATION_PATH = "/simulation"

export function SimulationToast({
  status,
  done,
  total,
  hasUnacknowledgedRun,
  onCancel,
  onAcknowledge,
}: {
  status: SimulationStatus
  done: number
  total: number
  hasUnacknowledgedRun: boolean
  onCancel: () => void
  onAcknowledge: () => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const isOnSimulationTab = useLocation().pathname === SIMULATION_PATH
  const isRunning = status === "running"

  useEffect(() => {
    if (isOnSimulationTab && !isRunning) onAcknowledge()
  }, [isOnSimulationTab, isRunning, onAcknowledge])

  if (isOnSimulationTab) return null

  if (isRunning) {
    const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0
    return (
      <div className={styles.toast} role="status" aria-live="polite">
        <span className={styles.title}>{t("Simulating…")}</span>
        <div className={styles.progress}>
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
        </div>
        <span className={styles.counts}>
          {`${fullNumber(done)} / ${fullNumber(total)} ${t("runs")}`}
        </span>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => {
            onCancel()
            onAcknowledge()
          }}
        >
          {t("Cancel")}
        </button>
      </div>
    )
  }

  if (!hasUnacknowledgedRun) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.title}>{t("Simulation complete")}</span>
      <span className={styles.counts}>{`${fullNumber(done)} ${t("runs")}`}</span>
      <button
        type="button"
        className={styles.checkoutButton}
        onClick={() => {
          onAcknowledge()
          navigate(SIMULATION_PATH)
        }}
      >
        {t("Checkout results")}
      </button>
    </div>
  )
}
