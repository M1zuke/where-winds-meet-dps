import type { GearPiece } from "../../../../engine/types"
import type { Inputs } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { rarityKey } from "../../../../i18n/contentKeys"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import styles from "./GearDetailsPanel.module.scss"

const RARITY: Record<GearPiece["rarity"], string> = {
  legendary: styles.rarityLegendary,
  epic: styles.rarityEpic,
}

interface Props {
  piece: GearPiece | null
  isEquipped: boolean
  inputs: Inputs
  onChange(piece: GearPiece): void
  onEquip(): void
  onUnequip(): void
  onDelete(): void
  wordMaxRows: WordMaxRow[]
  wordMaxPending: boolean
}

export function GearDetailsPanel({
  piece,
  isEquipped,
  inputs,
  onChange,
  onEquip,
  onUnequip,
  onDelete,
  wordMaxRows,
  wordMaxPending,
}: Props) {
  const { t } = useI18n()

  if (!piece) {
    return (
      <div className="panel">
        <div className="toolbar">
          <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        </div>
        <div className="empty-tab">{t("gear.details.selectAGearPieceTo")}</div>
      </div>
    )
  }

  return (
    <div className={`panel ${styles.gearDetails}`}>
      <div className="toolbar">
        <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        <div className="spacer" />
        {isEquipped ? (
          <button type="button" className="btn" onClick={onUnequip}>
            {t("gear.details.unequip")}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onEquip}>
            {t("gear.details.equip")}
          </button>
        )}
        <button type="button" className="btn danger" onClick={onDelete}>
          {t("common.delete")}
        </button>
      </div>

      <div className={`${styles.identity} ${RARITY[piece.rarity]}`}>
        <span className={styles.identitySlot}>{t(GEAR_SLOT_KEYS[piece.slot])}</span>
        <span className={styles.identityMeta}>
          lv{piece.level} · {t(rarityKey(piece.rarity), piece.rarity)}
          {piece.relayed ? ` · ${t("gear.details.relayed")}` : ""}
        </span>
        {isEquipped && <span className={styles.identityBadge}>{t("gear.details.equipped")}</span>}
      </div>

      <GearPieceForm
        piece={piece}
        inputs={inputs}
        onChange={onChange}
        wordMaxRows={wordMaxRows}
        wordMaxPending={wordMaxPending}
      />
    </div>
  )
}
