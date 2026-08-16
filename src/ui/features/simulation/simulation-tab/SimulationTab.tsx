import { useMemo, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import type { Rotation } from "../../../../engine/rotation"
import { loadCustomRotations } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { useParseSimulation } from "../../../hooks/useParseSimulation"
import { rotationOptions, selectedRotationOptionId } from "../../rotation/rotationOptions"
import { fullNumber } from "../damageFormat"
import { clampRunCount, DEFAULT_RUN_COUNT } from "../simulationRunSettings"
import { SimulationControlsPanel } from "../simulation-controls-panel/SimulationControlsPanel"
import { SimulationSummaryBar } from "../simulation-summary-bar/SimulationSummaryBar"
import { parseSummary, sortedParses } from "../simulation-summary-bar/summaryStats"
import { SimulationDistributionPanel } from "../simulation-distribution-panel/SimulationDistributionPanel"
import { SimulationParseLadderPanel } from "../simulation-parse-ladder-panel/SimulationParseLadderPanel"
import { SimulationOutcomeMixPanel } from "../simulation-outcome-mix-panel/SimulationOutcomeMixPanel"
import styles from "./SimulationTab.module.scss"

export function SimulationTab({
  inputs,
  engineInputs,
  expectedDps,
}: {
  inputs: Inputs
  engineInputs: Inputs
  expectedDps: number
}) {
  const { t } = useI18n()
  const [saved] = useState<Rotation[]>(() => loadCustomRotations())
  const options = useMemo(() => rotationOptions(inputs.classId, saved), [inputs.classId, saved])
  const [optionId, setOptionId] = useState(() => selectedRotationOptionId(inputs))
  const [runCount, setRunCount] = useState(DEFAULT_RUN_COUNT)
  const [ranSignature, setRanSignature] = useState<string | null>(null)

  const simulation = useParseSimulation()

  const signature = useMemo(
    () => JSON.stringify({ engineInputs, optionId }),
    [engineInputs, optionId],
  )
  const isStale = ranSignature !== null && ranSignature !== signature

  const summary = useMemo(() => parseSummary(simulation.runs), [simulation.runs])
  const sorted = useMemo(() => sortedParses(simulation.runs), [simulation.runs])

  function run() {
    const option = options.find((candidate) => candidate.id === optionId)
    const clamped = clampRunCount(runCount)
    setRunCount(clamped)
    setRanSignature(signature)
    simulation.start({
      inputs: engineInputs,
      rotation: option?.rotation ?? null,
      runCount: clamped,
    })
  }

  const rotationName = options.find((candidate) => candidate.id === optionId)?.name ?? ""
  const contextLabel = !summary
    ? t("not run yet")
    : simulation.cancelled
      ? `${fullNumber(simulation.completedRuns)} ${t("of")} ${fullNumber(simulation.requestedRuns)} ${t("runs")} · ${t("cancelled")}`
      : `${fullNumber(summary.runCount)} ${t("runs")} · ${rotationName}`

  return (
    <>
      <SimulationControlsPanel
        options={options}
        selectedOptionId={optionId}
        onSelectOption={setOptionId}
        runCount={runCount}
        onRunCountChange={setRunCount}
        status={simulation.status}
        progress={simulation.progress}
        isStale={isStale}
        onRun={run}
        onCancel={simulation.cancel}
      />
      <SimulationSummaryBar
        summary={summary}
        contextLabel={contextLabel}
        isPending={simulation.status === "running"}
        isStale={isStale}
      />
      {summary ? (
        <div
          className={
            styles.resultsGrid +
            (simulation.status === "running" ? ` ${styles.pending}` : "") +
            (isStale ? ` ${styles.stale}` : "")
          }
        >
          <div className={`panel ${styles.spanColumns}`}>
            <h2>{t("DPS Distribution")}</h2>
            <SimulationDistributionPanel
              sorted={sorted}
              meanDps={summary.meanDps}
              expectedDps={expectedDps}
              rotationDuration={simulation.rotationDuration}
            />
          </div>
          <div className="panel">
            <h2>{t("Parse Ladder")}</h2>
            <SimulationParseLadderPanel sorted={sorted} />
          </div>
          <div className="panel">
            <h2>{t("Outcome Mix")}</h2>
            <SimulationOutcomeMixPanel summary={summary} expectedRates={simulation.expectedRates} />
          </div>
        </div>
      ) : (
        <div className="empty-tab">
          {t("Pick a rotation and a run count, then Run to simulate parses.")}
        </div>
      )}
    </>
  )
}
