import type { WorkerRequest } from "../../../engine/dpsWorker"
import { useI18n } from "../../../i18n/i18nContext"
import { useDpsWorkerActivity } from "../../hooks/useDpsWorkerActivity"
import styles from "./DpsActivityToast.module.scss"

const SWEEP_KEYS: Partial<Record<WorkerRequest["kind"], string>> = {
  equippedDeltas: "layout.dpsActivityToast.sweep.equippedDeltas",
  dpsDeltas: "common.inventory",
  gearAnalysis: "layout.dpsActivityToast.sweep.gearAnalysis",
  retunement: "common.retunement",
  reattunement: "common.reattunement",
  wordMax: "layout.dpsActivityToast.sweep.wordMax",
  ranking: "layout.dpsActivityToast.sweep.ranking",
  setTiles: "layout.dpsActivityToast.sweep.setTiles",
  rotationDps: "common.rotations",
  graduation: "layout.dpsActivityToast.sweep.graduation",
}

export function DpsActivityToast({ hidden }: { hidden: boolean }) {
  const { t } = useI18n()
  const { kinds, done, total } = useDpsWorkerActivity()

  if (hidden || total === 0) return null

  const percent = Math.min(100, (done / total) * 100)
  const sweeps = kinds.map((kind) => t(SWEEP_KEYS[kind] ?? kind)).join(", ")

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.title}>{t("layout.dpsActivityToast.calculatingDps")}</span>
      <div className={styles.progress}>
        <div
          className="skill-bar-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} ${t("common.of")} ${total} ${t("layout.dpsActivityToast.sweeps")}`}
        >
          <div className="skill-bar-fill" style={{ width: percent.toFixed(2) + "%" }} />
        </div>
      </div>
      <span
        className={styles.counts}
      >{`${total - done} ${t("layout.dpsActivityToast.left")}`}</span>
      <span className={styles.sweeps}>{sweeps}</span>
    </div>
  )
}
