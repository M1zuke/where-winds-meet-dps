import type { WorkerRequest } from "../../../engine/dpsWorker"
import { useI18n } from "../../../i18n/i18nContext"
import { useDpsWorkerActivity } from "../../hooks/useDpsWorkerActivity"
import styles from "./DpsActivityToast.module.scss"

const SWEEP_LABELS: Partial<Record<WorkerRequest["kind"], string>> = {
  equippedDeltas: "Equipped slots",
  dpsDeltas: "Inventory",
  gearAnalysis: "Gear analysis",
  retunement: "Retunement",
  reattunement: "Reattunement",
  wordMax: "Word maxing",
  ranking: "Item ranking",
  setTiles: "Set tiles",
  rotationDps: "Rotations",
  graduation: "Graduation",
}

export function DpsActivityToast({ hidden }: { hidden: boolean }) {
  const { t } = useI18n()
  const { kinds, done, total } = useDpsWorkerActivity()

  if (hidden || total === 0) return null

  const percent = Math.min(100, (done / total) * 100)
  const sweeps = kinds.map((kind) => t(SWEEP_LABELS[kind] ?? kind)).join(", ")

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.title}>{t("Calculating DPS…")}</span>
      <div className={styles.progress}>
        <div
          className="skill-bar-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} ${t("of")} ${total} ${t("sweeps")}`}
        >
          <div className="skill-bar-fill" style={{ width: percent.toFixed(2) + "%" }} />
        </div>
      </div>
      <span className={styles.counts}>{`${total - done} ${t("left")}`}</span>
      <span className={styles.sweeps}>{sweeps}</span>
    </div>
  )
}
