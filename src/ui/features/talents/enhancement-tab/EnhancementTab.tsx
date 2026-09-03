import { useMemo } from "react"
import type { EnhancementNode, EnhancementSlot, Inputs } from "../../../../engine/types"
import { ENHANCEMENT_SLOTS } from "../../../../engine/types"
import {
  clampEnhancementValue,
  DEFAULT_ENHANCEMENTS,
  enhancementCap,
} from "../../../../definitions/baseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { TALENT_STAT_KEYS } from "../shared/talentStatKeys"
import styles from "./EnhancementTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const SLOT_KEYS: Readonly<Record<EnhancementSlot, string>> = {
  disc: "gear.slot.disc",
  pendant: "gear.slot.pendant",
  leftWeapon: "gear.slot.leftWeapon",
  rightWeapon: "gear.slot.rightWeapon",
}

function minimumStatFirst(left: EnhancementNode, right: EnhancementNode): number {
  return Number(right.stat.startsWith("min")) - Number(left.stat.startsWith("min"))
}

export function EnhancementTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const enhancements = inputs.enhancements

  const nodesBySlot = useMemo(() => {
    const out = new Map<EnhancementSlot, EnhancementNode[]>(
      ENHANCEMENT_SLOTS.map((slot) => [slot, []]),
    )
    for (const node of enhancements) out.get(node.slot)?.push(node)
    for (const nodes of out.values()) nodes.sort(minimumStatFirst)
    return out
  }, [enhancements])

  function setValue(id: number, value: number) {
    onChange({
      ...inputs,
      enhancements: enhancements.map((node) =>
        node.id === id ? { ...node, value: clampEnhancementValue(id, value) } : node,
      ),
    })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.enhancement.resetAllEnhancementsToDefault")))) return
    onChange({ ...inputs, enhancements: DEFAULT_ENHANCEMENTS.map((node) => ({ ...node })) })
  }

  return (
    <div>
      <div className="toolbar">
        <span className="toolbar-label">{t("talents.enhancement.enhancement")}</span>
        <button type="button" className="btn danger" onClick={resetAll}>
          {t("common.resetToDefault")}
        </button>
      </div>

      <div className={styles.slotGrid}>
        {ENHANCEMENT_SLOTS.map((slot) => (
          <div className={`panel ${styles.slotCard}`} key={slot}>
            <h2>{t(SLOT_KEYS[slot])}</h2>
            {(nodesBySlot.get(slot) ?? []).map((node) => (
              <label className={styles.statRow} key={node.id}>
                <span>{t(TALENT_STAT_KEYS[node.stat], node.stat)}</span>
                <NumInput
                  min={0}
                  max={enhancementCap(node.id)}
                  value={node.value}
                  onChange={(value) => setValue(node.id, value)}
                />
                <span className={styles.cap}>/ {enhancementCap(node.id)}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
