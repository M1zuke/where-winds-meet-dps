import { useI18n } from "../../../../i18n/i18nContext"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { Select } from "../../../components/select/Select"
import type { RotationOption } from "../../rotation/rotationOptions"
import type { SimulationStatus } from "../../../hooks/useParseSimulation"
import { SimulationProgressBar } from "../simulation-progress-bar/SimulationProgressBar"
import { MAX_RUN_COUNT, MIN_RUN_COUNT, RUN_COUNT_STEP } from "../simulationRunSettings"
import styles from "./SimulationControlsPanel.module.scss"

const GROUP_KEYS: Record<RotationOption["group"], string> = {
  builtin: "common.builtInRotations",
  custom: "common.customRotation",
}

export function SimulationControlsPanel({
  options,
  selectedOptionId,
  onSelectOption,
  runCount,
  onRunCountChange,
  status,
  progress,
  isStale,
  onRun,
  onCancel,
}: {
  options: RotationOption[]
  selectedOptionId: string
  onSelectOption: (optionId: string) => void
  runCount: number
  onRunCountChange: (next: number) => void
  status: SimulationStatus
  progress: { done: number; total: number }
  isStale: boolean
  onRun: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const isRunning = status === "running"

  return (
    <div className="panel">
      <div className="toolbar">
        <span className="toolbar-label">{t("common.rotation")}</span>
        <div className={styles.rotationField}>
          <Select
            ariaLabel={t("common.rotation")}
            value={selectedOptionId}
            disabled={isRunning || options.length === 0}
            onChange={onSelectOption}
            options={options.map((option) => ({
              value: option.id,
              label: option.name,
              group: t(GROUP_KEYS[option.group]),
              meta: option.isClassDefault ? t("common.default") : undefined,
            }))}
          />
        </div>
        <span className="toolbar-label">{t("simulation.controls.runs")}</span>
        <div className={styles.runCountField}>
          <NumInput
            value={runCount}
            onChange={onRunCountChange}
            min={MIN_RUN_COUNT}
            max={MAX_RUN_COUNT}
            step={RUN_COUNT_STEP}
            aria-label={t("simulation.controls.runs")}
            disabled={isRunning}
          />
        </div>
        <span className="spacer" />
        <button
          type="button"
          className="btn primary"
          onClick={onRun}
          disabled={isRunning || options.length === 0}
        >
          {t("simulation.controls.run")}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={!isRunning}>
          {t("common.cancel")}
        </button>
      </div>
      <SimulationProgressBar done={progress.done} total={progress.total} status={status} />
      {isStale && !isRunning && (
        <p className="hint">{t("simulation.controls.yourBuildChangedSinceThis")}</p>
      )}
    </div>
  )
}
