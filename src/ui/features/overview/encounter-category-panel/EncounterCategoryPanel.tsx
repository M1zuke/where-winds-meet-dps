import { useState } from "react"
import {
  encounterOptionVariants,
  sortEncounterOptionsByDps,
  encounterOptionsOf,
  isEncounterOptionAvailable,
  type EncounterCategory,
  type EncounterGroup,
  type EncounterOption,
} from "../../../../engine/encounterOptions"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { useEncounterOptionDps } from "../../../hooks/useEncounterOptionDps"
import { EncounterIcon } from "../encounter-icon/EncounterIcon"
import {
  EncounterOptionCard,
  type EncounterOptionDiff,
} from "../encounter-option-card/EncounterOptionCard"
import {
  CATEGORY_HINT_KEYS,
  CATEGORY_LABEL_KEYS,
  GROUP_LABEL_KEYS,
  OPTION_LABEL_KEYS,
  optionHintText,
} from "../encounter-settings-dialog/encounterOptionText"
import styles from "./EncounterCategoryPanel.module.scss"

interface Props {
  id: string
  labelledBy: string
  category: EncounterCategory
  inputs: Inputs
  engineInputs: Inputs
  onChange: (next: Inputs) => void
}

interface OptionGroup {
  group: EncounterGroup | null
  options: EncounterOption[]
  lockedOptions: EncounterOption[]
}

function groupOptions(
  options: EncounterOption[],
  isAvailable: (option: EncounterOption) => boolean,
): OptionGroup[] {
  const groups: OptionGroup[] = []
  for (const option of options) {
    let entry = groups.find((candidate) => candidate.group === option.group)
    if (!entry) {
      entry = { group: option.group, options: [], lockedOptions: [] }
      groups.push(entry)
    }
    if (isAvailable(option)) entry.options.push(option)
    else entry.lockedOptions.push(option)
  }
  return groups
}

export function EncounterCategoryPanel({
  id,
  labelledBy,
  category,
  inputs,
  engineInputs,
  onChange,
}: Props) {
  const { t } = useI18n()
  const { data, isPending } = useEncounterOptionDps(engineInputs, category)
  const [settledOrder, setSettledOrder] = useState<Partial<Record<EncounterCategory, string[]>>>({})
  const allOptions = encounterOptionsOf(category)
  const settledDps = data && !isPending ? data : null
  const groups = groupOptions(allOptions, (option) =>
    isEncounterOptionAvailable(option, inputs),
  ).map((entry) => ({
    ...entry,
    options: sortEncounterOptionsByDps(
      entry.options,
      inputs,
      settledDps,
      settledOrder[category] ?? [],
    ),
  }))
  const renderedOrder = groups.flatMap((entry) => entry.options.map((option) => option.id))
  if (settledDps && renderedOrder.join() !== (settledOrder[category] ?? []).join()) {
    setSettledOrder({ ...settledOrder, [category]: renderedOrder })
  }
  const savedLockedOption = allOptions.find(
    (option) =>
      option.countsAsActive &&
      !isEncounterOptionAvailable(option, inputs) &&
      option.isSelected(inputs),
  )
  const variantCount = encounterOptionVariants(inputs, category).length

  function diffOf(option: EncounterOption): EncounterOptionDiff {
    if (option.kind === "choice" && option.isSelected(inputs)) return { kind: "current" }
    if (!data) return { kind: "calculating" }
    const optionDps = data.dpsByOption[option.id]
    if (optionDps === undefined) return isPending ? { kind: "calculating" } : { kind: "none" }
    if (data.baselineDps <= 0) return { kind: "none" }
    return { kind: "change", fraction: optionDps / data.baselineDps - 1 }
  }

  function unlockText(lockedOptions: EncounterOption[]): string {
    const lowestGate = Math.min(...lockedOptions.map((option) => option.minBreakthrough))
    const template =
      lockedOptions.length === 1
        ? t("overview.encounterSettings.unlocksOne")
        : t("overview.encounterSettings.unlocksMany")
    return template.replace("{n}", String(lockedOptions.length)).replace("{bt}", String(lowestGate))
  }

  return (
    <div id={id} role="tabpanel" aria-labelledby={labelledBy} className={styles.panel}>
      <h3 className={styles.title}>{t(CATEGORY_LABEL_KEYS[category])}</h3>
      <p className={styles.hint}>{t(CATEGORY_HINT_KEYS[category])}</p>
      <p className={styles.status} aria-live="polite">
        {isPending ? (
          <>
            <EncounterIcon name="spinner" className={styles.spinner} />
            {t("overview.encounterSettings.calculating").replace("{n}", String(variantCount))}
          </>
        ) : (
          t("overview.encounterSettings.dpsHint")
        )}
      </p>

      {savedLockedOption && (
        <p className={styles.note}>
          {t("overview.encounterSettings.savedLocked")
            .replace("{option}", t(OPTION_LABEL_KEYS[savedLockedOption.id]))
            .replace("{bt}", String(inputs.breakthrough))}
        </p>
      )}

      {groups.map((entry) => (
        <section key={entry.group ?? "ungrouped"} className={styles.group}>
          {entry.group && <div className="section-label">{t(GROUP_LABEL_KEYS[entry.group])}</div>}
          <div
            className={styles.grid}
            role={entry.options[0]?.kind === "choice" ? "radiogroup" : "group"}
            aria-label={t(
              entry.group ? GROUP_LABEL_KEYS[entry.group] : CATEGORY_LABEL_KEYS[category],
            )}
          >
            {entry.options.map((option) => (
              <EncounterOptionCard
                key={option.id}
                kind={option.kind}
                label={t(OPTION_LABEL_KEYS[option.id])}
                hint={optionHintText(option.id, t)}
                selected={option.isSelected(inputs)}
                diff={diffOf(option)}
                onSelect={() => onChange(option.select(inputs))}
              />
            ))}
          </div>
          {entry.lockedOptions.length > 0 && (
            <p className={styles.locked}>
              <EncounterIcon name="lock" />
              {unlockText(entry.lockedOptions)}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
