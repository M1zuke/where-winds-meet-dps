import type { GearPiece } from "../../../../engine/types"
import type { Inputs } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { rarityKey } from "../../../../i18n/contentKeys"
import { sanitizeGearPieceText } from "../../../../storage"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import { TextInput } from "../../../components/text-input/TextInput"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import styles from "./GearDetailsPanel.module.scss"

const LABEL_MAX_LENGTH = 40
const NOTE_MAX_LENGTH = 500

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

  function patchText(field: "label" | "note", raw: string, maxLength: number): void {
    if (!piece) return
    const value = sanitizeGearPieceText(raw, maxLength)
    const next = { ...piece }
    if (value) next[field] = value
    else delete next[field]
    onChange(next)
  }

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
        {piece.label && <div className={styles.identityLabel}>{piece.label}</div>}
        <div className={styles.identityRow}>
          <span className={styles.identitySlot}>{t(GEAR_SLOT_KEYS[piece.slot])}</span>
          <span className={styles.identityMeta}>
            lv{piece.level} · {t(rarityKey(piece.rarity), piece.rarity)}
            {piece.relayed ? ` · ${t("gear.details.relayed")}` : ""}
          </span>
          {isEquipped && <span className={styles.identityBadge}>{t("gear.details.equipped")}</span>}
        </div>
      </div>

      <div className={styles.pieceTextFields}>
        <label className={styles.pieceTextField}>
          <span className={styles.pieceTextFieldLabel}>{t("common.name")}</span>
          <TextInput
            value={piece.label ?? ""}
            maxLength={LABEL_MAX_LENGTH}
            placeholder={t("gear.details.pieceNamePlaceholder")}
            onChange={(event) => patchText("label", event.target.value, LABEL_MAX_LENGTH)}
          />
        </label>
        <label className={styles.pieceTextField}>
          <span className={styles.pieceTextFieldLabel}>{t("gear.details.pieceNote")}</span>
          <textarea
            className={styles.pieceNoteInput}
            value={piece.note ?? ""}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={t("gear.details.pieceNotePlaceholder")}
            onChange={(event) => patchText("note", event.target.value, NOTE_MAX_LENGTH)}
          />
        </label>
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
