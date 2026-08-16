import { useI18n } from "../../../../i18n/i18nContext"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { Select } from "../../../components/select/Select"
import type { RotationOption } from "../../rotation/rotationOptions"
import type { SimulationStatus } from "../../../hooks/useParseSimulation"
import { SimulationProgressBar } from "../simulation-progress-bar/SimulationProgressBar"
import { MAX_RUN_COUNT, MIN_RUN_COUNT, RUN_COUNT_STEP } from "../simulationRunSettings"
import styles from "./SimulationControlsPanel.module.scss"

const GROUP_LABELS: Record<RotationOption["group"], string> = {
  builtin: "Built-in rotations",
  custom: "Custom Rotation",
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
        <span className="toolbar-label">{t("Rotation")}</span>
        <div className={styles.rotationField}>
          <Select
            ariaLabel={t("Rotation")}
            value={selectedOptionId}
            disabled={isRunning || options.length === 0}
            onChange={onSelectOption}
            options={options.map((option) => ({
              value: option.id,
              label: option.name,
              group: t(GROUP_LABELS[option.group]),
              meta: option.isClassDefault ? t("default") : undefined,
            }))}
          />
        </div>
        <span className="toolbar-label">{t("Runs")}</span>
        <div className={styles.runCountField}>
          <NumInput
            value={runCount}
            onChange={onRunCountChange}
            min={MIN_RUN_COUNT}
            max={MAX_RUN_COUNT}
            step={RUN_COUNT_STEP}
            aria-label={t("Runs")}
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
          {t("Run")}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={!isRunning}>
          {t("Cancel")}
        </button>
      </div>
      <SimulationProgressBar done={progress.done} total={progress.total} status={status} />
      {isStale && !isRunning && (
        <p className="hint">{t("Your build changed since this simulation — run it again")}</p>
      )}
    </div>
  )
}
