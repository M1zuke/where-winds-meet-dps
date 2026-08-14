import { useState } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import type { Inputs, Result } from "../../../../engine/types"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { RotationEditorPanel } from "../rotation-editor-panel/RotationEditorPanel"
import { RotationBreakdownPanel } from "../rotation-breakdown-panel/RotationBreakdownPanel"
import { RotationDpsGraphPanel } from "../rotation-dps-graph-panel/RotationDpsGraphPanel"
import { RotationTimelinePanel } from "../rotation-timeline-panel/RotationTimelinePanel"
import styles from "./RotationTab.module.scss"

export function RotationTab({
  inputs,
  onChange,
  result,
}: {
  inputs: Inputs
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
      {sub === "overview" && (
        <div className={styles.overviewGrid}>
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
      )}
      {sub === "editor" && (
        <div className="panel">
          <RotationEditorPanel inputs={inputs} onChange={onChange} result={result} />
        </div>
      )}
    </>
  )
}
