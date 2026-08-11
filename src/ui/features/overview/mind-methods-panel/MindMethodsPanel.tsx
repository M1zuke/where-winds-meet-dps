import type { Inputs, MindMethodSlot } from "../../../../engine/types"
import {
  innerWayDefinition,
  innerWayName,
  slotInnerWayId,
} from "../../../../data/innerWays/registry"
import { allowedInnerWaysForClass } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./MindMethodsPanel.module.scss"

const DEFAULT_TIER_OPTIONS = ["tier 6", "tier 5"] as const

function tierOptionsFor(innerWayId: string): readonly string[] {
  const selectableTiers = innerWayDefinition(innerWayId)?.selectableTiers
  return selectableTiers ? selectableTiers.map((tier) => `tier ${tier}`) : DEFAULT_TIER_OPTIONS
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
        const currentId = slotInnerWayId(slot)
        const fallbackIds = currentId && !options.includes(currentId) ? [currentId] : []
        const takenElsewhere = new Set(
          inputs.mindMethods
            .filter((otherSlot, otherIdx) => otherIdx !== idx && slotInnerWayId(otherSlot))
            .map((otherSlot) => slotInnerWayId(otherSlot)),
        )
        const isTaken = (id: string) => id !== "" && id !== currentId && takenElsewhere.has(id)
        const tierOptions = tierOptionsFor(currentId)
        const fallbackTier = slot.stacks && !tierOptions.includes(slot.stacks) ? [slot.stacks] : []
        return (
          <div key={idx} className={styles.mindSlot}>
            <label>{label}</label>
            <select
              value={currentId}
              onChange={(e) => {
                const innerWayId = e.target.value
                // Both are stored: the id is the identity, the name keeps an
                // exported profile readable and older readers working.
                const patch: Partial<MindMethodSlot> = {
                  id: innerWayId || undefined,
                  name: innerWayId ? innerWayName(innerWayId) : "",
                }
                if (!innerWayId) {
                  patch.stacks = ""
                } else if (!slot.stacks || !tierOptionsFor(innerWayId).includes(slot.stacks)) {
                  patch.stacks = "tier 6"
                }
                updateSlot(idx, patch)
              }}
            >
              {options.map((id) => (
                <option key={id || "-"} value={id} disabled={isTaken(id)}>
                  {id ? t(innerWayName(id)) : t("(unselected)")}
                </option>
              ))}
              {fallbackIds.length > 0 && (
                <optgroup label={t("No longer available")}>
                  {fallbackIds.map((id) => (
                    <option key={id} value={id} disabled={isTaken(id)}>
                      {t(innerWayName(id))}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <select
              value={slot.stacks || "tier 6"}
              disabled={!currentId}
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
