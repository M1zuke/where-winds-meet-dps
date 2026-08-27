import { attunementLabel, attunementLabelKey, getAttunement } from "../../../../engine/attunements"
import type { GearPiece } from "../../../../engine/types"
import { isWeaponSlot } from "../../../../engine/types"
import { statLineLabel } from "../../../../data/stats/statLines"
import { rarityKey, statLineKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import previewStyles from "../shared/gearPreview.module.scss"
import styles from "./BuildPieceCard.module.scss"

function formatGearValue(value: number): string {
  if (Math.abs(value) < 1 && value !== 0) return `${(value * 100).toFixed(2)}%`
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function baseStatsLabel(piece: GearPiece, t: (key: string, fallback?: string) => string): string {
  return isWeaponSlot(piece.slot)
    ? `${t("common.minPhys")} ${piece.minPhys} · ${t("common.maxPhys")} ${piece.maxPhys}`
    : `${t("content.statLine.hp")} ${piece.hp.toLocaleString()} · ${t("content.statLine.physDef")} ${piece.physDef}`
}

export function BuildPieceCard({ piece }: { piece: GearPiece }) {
  const { t } = useI18n()
  const attunement = getAttunement(piece.attunement)

  return (
    <article className={previewStyles.piece} aria-label={t(GEAR_SLOT_KEYS[piece.slot])}>
      <div className={previewStyles.pieceHead}>
        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_KEYS[piece.slot])}</span>
        <span className="hint">{baseStatsLabel(piece, t)}</span>
      </div>
      <div className={previewStyles.identityRow}>
        <span className={styles.identityBadge}>
          {t("gear.buildPieceCard.level")} {piece.level}
        </span>
        <span className={styles.identityBadge}>{t(rarityKey(piece.rarity), piece.rarity)}</span>
      </div>
      <div className={previewStyles.affixList}>
        {piece.words.map((word, index) => (
          <div className={previewStyles.affix} key={`${word.word}-${index}`}>
            <span className={previewStyles.affixName}>
              {t(statLineKey(word.word), statLineLabel(word.word))}
            </span>
            <span className={previewStyles.affixValue}>{formatGearValue(word.value)}</span>
            <span />
          </div>
        ))}
        <div className={`${previewStyles.affix} ${styles.attunement}`}>
          <span className={previewStyles.affixName}>
            {attunement
              ? t(attunementLabelKey(attunement, null), attunementLabel(attunement, null))
              : piece.attunement}
          </span>
          <span className={previewStyles.affixValue}>{formatGearValue(piece.attunementValue)}</span>
          <span className={styles.attunementLabel}>{t("common.attunement")}</span>
        </div>
      </div>
    </article>
  )
}
