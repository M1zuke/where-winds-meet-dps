import { useMemo, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import type { Rotation } from "../../../../engine/rotation"
import { loadCustomRotations } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { useRotationDps } from "../../../hooks/useRotationDps"
import { OptionTile } from "../../../components/option-tile/OptionTile"
import { deltaTone } from "../../../components/option-tile/optionTileTone"
import { Select } from "../../../components/select/Select"
import {
  inputsWithRotationOption,
  rotationOptions,
  selectedRotationOptionId,
  type RotationOption,
} from "../rotationOptions"
import styles from "./RotationOptionsPanel.module.scss"

const GROUP_LABELS: Record<RotationOption["group"], string> = {
  builtin: "Built-in rotations",
  custom: "Custom Rotation",
}

function signedDps(deltaDps: number): string {
  const rounded = Math.round(deltaDps)
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±"
  return `${sign}${Math.abs(rounded).toLocaleString("en-US")}`
}

export function RotationOptionsPanel({
  inputs,
  engineInputs,
  onChange,
  currentDps,
}: {
  inputs: Inputs
  engineInputs: Inputs
  onChange: (next: Inputs) => void
  currentDps: number
}) {
  const { t } = useI18n()
  const [saved] = useState<Rotation[]>(() => loadCustomRotations())
  const options = useMemo(() => rotationOptions(inputs.classId, saved), [inputs.classId, saved])
  const { dpsByOptionId, isPending } = useRotationDps(engineInputs, options)
  const selectedId = selectedRotationOptionId(inputs)

  function select(optionId: string) {
    const option = options.find((candidate) => candidate.id === optionId)
    if (option) onChange(inputsWithRotationOption(inputs, option))
  }

  if (options.length === 0) {
    return <div className="empty-tab">{t("(none)")}</div>
  }

  return (
    <>
      <div className={styles.optionSelect}>
        <Select
          ariaLabel={t("Rotation")}
          value={selectedId}
          onChange={select}
          options={options.map((option) => ({
            value: option.id,
            label:
              (t(option.name) || t("(unnamed)")) + (option.isClassDefault ? t(" (default)") : ""),
            group: t(GROUP_LABELS[option.group]),
          }))}
        />
      </div>

      <ul className={styles.optionList} style={{ opacity: isPending ? 0.6 : 1 }}>
        {options.map((option, index) => {
          const optionDps = dpsByOptionId[option.id]
          const isSelected = option.id === selectedId
          const delta = optionDps - currentDps
          return (
            <li key={option.id}>
              {options[index - 1]?.group !== option.group && (
                <div className="section-label">{t(GROUP_LABELS[option.group])}</div>
              )}
              <OptionTile
                label={t(option.name) || t("(unnamed)")}
                headMeta={option.isClassDefault ? t("default") : undefined}
                detail={
                  optionDps === undefined
                    ? "—"
                    : isSelected
                      ? `${Math.round(optionDps).toLocaleString("en-US")} ${t("DPS")}`
                      : `${signedDps(delta)} ${t("DPS")}`
                }
                tone={isSelected ? "current" : deltaTone(delta)}
                selected={isSelected}
                title={option.description}
                onClick={() => select(option.id)}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
