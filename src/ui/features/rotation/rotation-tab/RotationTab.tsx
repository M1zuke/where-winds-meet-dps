import { useI18n } from "../../../../i18n/i18nContext"
import type { Inputs, Result } from "../../../../engine/types"
import { RotationOptionsPanel } from "../rotation-options-panel/RotationOptionsPanel"
import { RotationBreakdownPanel } from "../rotation-breakdown-panel/RotationBreakdownPanel"
import { RotationDpsGraphPanel } from "../rotation-dps-graph-panel/RotationDpsGraphPanel"
import { RotationTimelinePanel } from "../rotation-timeline-panel/RotationTimelinePanel"
import styles from "./RotationTab.module.scss"

export function RotationTab({
  inputs,
  engineInputs,
  onChange,
  result,
}: {
  inputs: Inputs
  engineInputs: Inputs
  onChange: (next: Inputs) => void
  result: Result
}) {
  const { t } = useI18n()
  return (
    <div className={styles.rotationLayout}>
      <div className={`panel ${styles.optionsPanel}`}>
        <h2>{t("common.rotations")}</h2>
        <RotationOptionsPanel
          inputs={inputs}
          engineInputs={engineInputs}
          onChange={onChange}
          currentDps={result.dps}
        />
      </div>
      <div className={styles.outputGrid}>
        <div className="panel">
          <h2>{t("rotation.dpsBreakdown")}</h2>
          <RotationBreakdownPanel result={result} />
        </div>
        <div className="panel">
          <h2>{t("rotation.dpsGraph")}</h2>
          <RotationDpsGraphPanel result={result} />
        </div>
        <div className={`panel ${styles.spanColumns}`}>
          <h2>{t("rotation.castTimeline")}</h2>
          <RotationTimelinePanel result={result} />
        </div>
      </div>
    </div>
  )
}
