import { useId } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import { EncounterIcon, type EncounterIconName } from "../encounter-icon/EncounterIcon"
import { signedPercent } from "../../simulation/damageFormat"
import styles from "./EncounterOptionCard.module.scss"

export type EncounterOptionDiff =
  | { kind: "current" }
  | { kind: "calculating" }
  | { kind: "change"; fraction: number }
  | { kind: "none" }

interface Props {
  kind: "toggle" | "choice"
  label: string
  hint: string | null
  icon?: EncounterIconName
  selected: boolean
  diff?: EncounterOptionDiff
  onSelect: () => void
}

const TENTH_PERCENTS_PER_FRACTION = 1000

function changeClass(fraction: number): string {
  const rounded = Math.round(fraction * TENTH_PERCENTS_PER_FRACTION)
  if (rounded > 0) return styles.positive
  if (rounded < 0) return styles.negative
  return styles.neutral
}

function changeText(fraction: number): string {
  return Math.round(fraction * TENTH_PERCENTS_PER_FRACTION) === 0
    ? "±0.0 %"
    : signedPercent(fraction)
}

export function EncounterOptionCard({ kind, label, hint, icon, selected, diff, onSelect }: Props) {
  const { t } = useI18n()
  const labelId = useId()
  const hintId = useId()
  const diffId = useId()
  const describedBy =
    [hint ? hintId : null, diff?.kind === "current" || diff?.kind === "change" ? diffId : null]
      .filter(Boolean)
      .join(" ") || undefined
  return (
    <button
      type="button"
      role={kind === "toggle" ? "switch" : "radio"}
      aria-checked={selected}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className={styles.card + (selected ? ` ${styles.selected}` : "")}
      onClick={onSelect}
    >
      {icon && <EncounterIcon name={icon} className={styles.icon} />}
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
      {diff && (
        <span className={styles.diff}>
          {diff.kind === "current" && (
            <span id={diffId} className={styles.neutral}>
              {t("overview.encounterSettings.current")}
            </span>
          )}
          {diff.kind === "calculating" && <span className={styles.skeleton} aria-hidden="true" />}
          {diff.kind === "change" && (
            <span id={diffId} className={changeClass(diff.fraction)}>
              {changeText(diff.fraction)}
            </span>
          )}
        </span>
      )}
      {kind === "toggle" ? (
        <span className={styles.switchTrack} aria-hidden="true">
          <span className={styles.switchKnob} />
        </span>
      ) : (
        <span className={styles.radioDot} aria-hidden="true" />
      )}
    </button>
  )
}
