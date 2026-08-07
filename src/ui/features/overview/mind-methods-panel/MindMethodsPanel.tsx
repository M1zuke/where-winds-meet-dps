import type { Inputs, MindMethodSlot } from "../../../../engine/types"
import { allowedInnerWaysForClass } from "../../../../engine/panel"
import { BITTER_SEASON_INNER_WAY } from "../../../../engine/buffs/bitterSeason"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./MindMethodsPanel.module.scss"

const TIER_OPTIONS = ["tier 6", "tier 5"] as const
// Bitter Season's ladder has a distinct node at every tier (`buffs/bitterSeason.ts`).
const BITTER_SEASON_TIER_OPTIONS = [
  "tier 6",
  "tier 5",
  "tier 4",
  "tier 3",
  "tier 2",
  "tier 1",
] as const

function tierOptionsFor(name: string): readonly string[] {
  return name === BITTER_SEASON_INNER_WAY ? BITTER_SEASON_TIER_OPTIONS : TIER_OPTIONS
}

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

export function MindMethodsPanel({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const updateSlot = (slotIndex: number, patch: Partial<MindMethodSlot>) => {
    const next = inputs.mindMethods.map((slot, idx) =>
      idx === slotIndex ? { ...slot, ...patch } : slot,
    ) as Inputs["mindMethods"]
    onChange({ ...inputs, mindMethods: next })
  }

  const options = ["", ...allowedInnerWaysForClass(inputs.classId)]
  const slotConfigs: { idx: number; label: string }[] = [
    { idx: 0, label: "Inner Way 1" },
    { idx: 1, label: "Inner Way 2" },
    { idx: 2, label: "Inner Way 3" },
    { idx: 3, label: "Inner Way 4" },
  ]

  return (
    <>
      {slotConfigs.map(({ idx, label }) => {
        const slot = inputs.mindMethods[idx]
        const currentName = slot.name
        const fallbackNames = slot.name && !options.includes(slot.name) ? [slot.name] : []
        const takenElsewhere = new Set(
          inputs.mindMethods
            .filter((otherSlot, otherIdx) => otherIdx !== idx && otherSlot.name)
            .map((otherSlot) => otherSlot.name),
        )
        const isTaken = (name: string) =>
          name !== "" && name !== currentName && takenElsewhere.has(name)
        const tierOptions = tierOptionsFor(currentName)
        const fallbackTier = slot.stacks && !tierOptions.includes(slot.stacks) ? [slot.stacks] : []
        return (
          <div key={idx} className={styles.mindSlot}>
            <label>{label}</label>
            <select
              value={currentName}
              onChange={(e) => {
                const name = e.target.value
                const patch: Partial<MindMethodSlot> = { name }
                if (!name) {
                  patch.stacks = ""
                } else if (!slot.stacks || !tierOptionsFor(name).includes(slot.stacks)) {
                  patch.stacks = "tier 6"
                }
                updateSlot(idx, patch)
              }}
            >
              {options.map((name) => (
                <option key={name || "-"} value={name} disabled={isTaken(name)}>
                  {name ? t(name) : t("(unselected)")}
                </option>
              ))}
              {fallbackNames.length > 0 && (
                <optgroup label={t("No longer available")}>
                  {fallbackNames.map((name) => (
                    <option key={name} value={name} disabled={isTaken(name)}>
                      {t(name)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <select
              value={slot.stacks || "tier 6"}
              disabled={!currentName}
              onChange={(e) => updateSlot(idx, { stacks: e.target.value })}
            >
              {tierOptions.map((tier) => (
                <option key={tier} value={tier}>
                  {t(tier)}
                </option>
              ))}
              {fallbackTier.length > 0 && (
                <option key={fallbackTier[0]} value={fallbackTier[0]} disabled>
                  {t(fallbackTier[0])}
                </option>
              )}
            </select>
          </div>
        )
      })}
    </>
  )
}
