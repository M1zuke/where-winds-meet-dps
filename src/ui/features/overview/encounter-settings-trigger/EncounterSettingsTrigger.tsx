import {
  activeEncounterOptionCount,
  ENCOUNTER_CATEGORIES,
} from "../../../../engine/encounterOptions"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { EncounterIcon } from "../encounter-icon/EncounterIcon"
import { CATEGORY_LABEL_KEYS } from "../encounter-settings-dialog/encounterOptionText"
import styles from "./EncounterSettingsTrigger.module.scss"

interface Props {
  inputs: Inputs
  onOpen: () => void
  disabled?: boolean
}

export function EncounterSettingsTrigger({ inputs, onOpen, disabled = false }: Props) {
  const { t } = useI18n()

  return (
    <button
      type="button"
      className={styles.card}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={onOpen}
    >
      <span className={styles.iconTile}>
        <EncounterIcon name="sliders" />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>
          {inputs.dummyMode
            ? t("overview.encounterSettings.titleDummyOn")
            : t("overview.encounterSettings.titleDummyOff")}
        </span>
        <span className={styles.subtitle}>
          {ENCOUNTER_CATEGORIES.map((category) => t(CATEGORY_LABEL_KEYS[category])).join(" · ")}
        </span>
      </span>
      <span className={styles.pill}>
        {t("overview.encounterSettings.activeCount").replace(
          "{n}",
          String(activeEncounterOptionCount(inputs)),
        )}
      </span>
      <span className={styles.open}>{t("overview.encounterSettings.open")} ›</span>
    </button>
  )
}
