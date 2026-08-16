import type { GearPiece, GearSlot } from "../../../../engine/types"
import type { Inputs } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import styles from "./GearDetailsPanel.module.scss"

const SLOT_LABEL_KEYS: Record<GearSlot, string> = {
  leftWeapon: "Left Weapon",
  rightWeapon: "Right Weapon",
  disc: "Disc",
  pendant: "Pendant",
  helm: "Helm",
  armor: "Armor",
  greaves: "Greaves",
  bracer: "Bracer",
}

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
          <span className="toolbar-label">{t("Gear details")}</span>
        </div>
        <div className="empty-tab">{t("Select a gear piece to view details")}</div>
      </div>
    )
  }

  return (
    <div className={`panel ${styles.gearDetails}`}>
      <div className="toolbar">
        <span className="toolbar-label">{t("Gear details")}</span>
        <div className="spacer" />
        {isEquipped ? (
          <button type="button" className="btn" onClick={onUnequip}>
            {t("Unequip")}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onEquip}>
            {t("Equip")}
          </button>
        )}
        <button type="button" className="btn danger" onClick={onDelete}>
          {t("Delete")}
        </button>
      </div>

      <div className={`${styles.identity} ${RARITY[piece.rarity]}`}>
        <span className={styles.identitySlot}>{t(SLOT_LABEL_KEYS[piece.slot])}</span>
        <span className={styles.identityMeta}>
          lv{piece.level} · {t(piece.rarity === "legendary" ? "Legendary" : "Epic")}
          {piece.relayed ? ` · ${t("Relayed")}` : ""}
        </span>
        {isEquipped && <span className={styles.identityBadge}>{t("Equipped")}</span>}
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
