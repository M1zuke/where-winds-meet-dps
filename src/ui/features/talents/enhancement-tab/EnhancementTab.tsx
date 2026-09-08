import { useMemo } from "react"
import type { EnhancementStat, GearSlot, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import {
  averageEnhancementBonus,
  averageEnhancementLevel,
  defaultEnhancementLevels,
  enhancementCap,
  enhancementStatsAtLevel,
} from "../../../../definitions/baseStats"
import { gearLevelForBreakthrough } from "../../../../definitions/baseStats/breakthroughs"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { fmt } from "../../../utils/statFormatting"
import { GEAR_SLOT_KEYS } from "../../gear/shared/gearSlotKeys"
import { ENHANCEMENT_STAT_KEYS } from "../shared/enhancementStatKeys"
import styles from "./EnhancementTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const STAT_ORDER: readonly EnhancementStat[] = ["minPhys", "maxPhys", "maxHp", "physDef"]

// Display order only — a 4-column, 2-row grid pairing each weapon row with
// the armour slot beside it. Nothing that sums or stores enhancement levels
// may depend on this order.
const SLOT_DISPLAY_ORDER: readonly GearSlot[] = [
  "leftWeapon",
  "rightWeapon",
  "helm",
  "armor",
  "disc",
  "pendant",
  "greaves",
  "bracer",
]

export function EnhancementTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const levels = inputs.enhancements

  const capBySlot = useMemo(() => {
    const byId = new Map(inputs.inventory.map((piece) => [piece.id, piece]))
    const fallbackGearLevel = gearLevelForBreakthrough(inputs.breakthrough)
    const out = {} as Record<GearSlot, number>
    for (const slot of GEAR_SLOTS) {
      const equippedId = inputs.equipped[slot]
      const piece = equippedId ? byId.get(equippedId) : undefined
      out[slot] = enhancementCap(piece?.level ?? fallbackGearLevel, inputs.breakthrough)
    }
    return out
  }, [inputs.inventory, inputs.equipped, inputs.breakthrough])

  function step(slot: GearSlot, delta: number) {
    const current = levels[slot] ?? 0
    if (delta > 0 && current >= capBySlot[slot]) return
    onChange({
      ...inputs,
      enhancements: { ...levels, [slot]: Math.max(0, current + delta) },
    })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.enhancement.resetAllEnhancementsToDefault")))) return
    onChange({ ...inputs, enhancements: defaultEnhancementLevels() })
  }

  const average = averageEnhancementLevel(levels)
  const bonus = averageEnhancementBonus(levels)

  return (
    <div>
      <div className="toolbar">
        <span className="toolbar-label">{t("talents.enhancement.enhancement")}</span>
        <button type="button" className="btn danger" onClick={resetAll}>
          {t("common.resetToDefault")}
        </button>
      </div>

      <div className={`panel ${styles.averagePanel}`}>
        <span>
          {t("talents.enhancement.averageLevel")} <b>{average}</b>
        </span>
        <span>
          {t("talents.enhancement.averageBonusHp")} <b>+{bonus.maxHp.toLocaleString()}</b>
        </span>
        <span>
          {t("talents.enhancement.averageBonusPercent")} <b>+{fmt(bonus.percent, true)}</b>
        </span>
      </div>

      <div className={styles.slotGrid}>
        {SLOT_DISPLAY_ORDER.map((slot) => {
          const level = levels[slot] ?? 0
          const cap = capBySlot[slot]
          const stats = enhancementStatsAtLevel(slot, level)
          return (
            <div className={`panel ${styles.slotCard}`} key={slot}>
              <h2>{t(GEAR_SLOT_KEYS[slot])}</h2>
              <div className={styles.levelControl}>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label={t("talents.enhancement.decreaseLevel")}
                  disabled={level <= 0}
                  onClick={() => step(slot, -1)}
                >
                  −
                </button>
                <span className={styles.level}>
                  <b>{level}</b> / {cap}
                </span>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label={t("talents.enhancement.increaseLevel")}
                  disabled={level >= cap}
                  onClick={() => step(slot, 1)}
                >
                  +
                </button>
              </div>
              {STAT_ORDER.filter((stat) => stats[stat] !== undefined).map((stat) => (
                <div className={styles.statRow} key={stat}>
                  <span>{t(ENHANCEMENT_STAT_KEYS[stat])}</span>
                  <span>{stats[stat]?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
