import { useState } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import type { Inputs, Result } from "../../../../engine/types"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { RotationEditorPanel } from "../rotation-editor-panel/RotationEditorPanel"
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
  const [sub, setSub] = useState<"overview" | "editor">("overview")
  return (
    <>
      <SubTabs
        active={sub}
        onSelect={setSub}
        tabs={[
          { key: "overview", label: t("Overview") },
          { key: "editor", label: t("Rotation Editor") },
        ]}
      />
      <SubTabPanel>
        {sub === "overview" && (
          <div className={styles.overviewLayout}>
            <div className={`panel ${styles.optionsPanel}`}>
              <h2>{t("Rotations")}</h2>
              <RotationOptionsPanel
                inputs={inputs}
                engineInputs={engineInputs}
                onChange={onChange}
                currentDps={result.dps}
              />
            </div>
            <div className={styles.outputGrid}>
              <div className="panel">
                <h2>{t("DPS Breakdown")}</h2>
                <RotationBreakdownPanel result={result} />
              </div>
              <div className="panel">
                <h2>{t("DPS Graph")}</h2>
                <RotationDpsGraphPanel result={result} />
              </div>
              <div className={`panel ${styles.spanColumns}`}>
                <h2>{t("Cast Timeline")}</h2>
                <RotationTimelinePanel result={result} />
              </div>
            </div>
          </div>
        )}
        {sub === "editor" && (
          <RotationEditorPanel inputs={inputs} onChange={onChange} result={result} />
        )}
      </SubTabPanel>
    </>
  )
}
