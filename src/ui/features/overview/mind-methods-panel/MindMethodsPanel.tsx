import type { Inputs, MindMethodSlot } from "../../../../engine/types"
import {
  innerWayDefinition,
  innerWayName,
  slotInnerWayId,
} from "../../../../definitions/innerWays/registry"
import { allowedInnerWaysForClass } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import { Select, type SelectOption } from "../../../components/select/Select"
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

  const allowedIds = ["", ...allowedInnerWaysForClass(inputs.classId)]

  return (
    <>
      {inputs.mindMethods.map((slot, idx) => {
        const currentId = slotInnerWayId(slot)
        const takenElsewhere = new Set(
          inputs.mindMethods
            .filter((otherSlot, otherIdx) => otherIdx !== idx && slotInnerWayId(otherSlot))
            .map((otherSlot) => slotInnerWayId(otherSlot)),
        )
        const isTaken = (id: string) => id !== "" && id !== currentId && takenElsewhere.has(id)
        const innerWayOptions: SelectOption<string>[] = allowedIds.map((id) => ({
          value: id,
          label: id ? t(innerWayName(id)) : t("(unselected)"),
          disabled: isTaken(id),
        }))
        if (currentId && !allowedIds.includes(currentId)) {
          innerWayOptions.push({
            value: currentId,
            label: t(innerWayName(currentId)),
            group: t("No longer available"),
          })
        }

        const tierOptions = tierOptionsFor(currentId)
        const tierSelectOptions: SelectOption<string>[] = tierOptions.map((tier) => ({
          value: tier,
          label: t(tier),
        }))
        if (slot.stacks && !tierOptions.includes(slot.stacks)) {
          tierSelectOptions.push({ value: slot.stacks, label: t(slot.stacks), disabled: true })
        }

        return (
          <div key={idx} className={styles.mindSlot}>
            <Select
              ariaLabel={`${t("Inner Way")} ${idx + 1}`}
              value={currentId}
              onChange={(innerWayId) => {
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
              options={innerWayOptions}
              placeholder={t("(unselected)")}
            />
            <Select
              compact
              ariaLabel={`${t("Inner Way")} ${idx + 1} ${t("tier")}`}
              value={slot.stacks || "tier 6"}
              disabled={!currentId}
              onChange={(stacks) => updateSlot(idx, { stacks })}
              options={tierSelectOptions}
            />
          </div>
        )
      })}
    </>
  )
}
