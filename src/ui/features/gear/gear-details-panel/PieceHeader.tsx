import type { ReactNode } from "react"
import type { GearRarity } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { LABEL_MAX_LENGTH } from "./pieceHeaderParts"
import styles from "./PieceHeader.module.scss"

const RARITY: Record<GearRarity, string> = {
  legendary: styles.rarityLegendary,
  epic: styles.rarityEpic,
}

interface Props {
  label: string | undefined
  rarity: GearRarity
  onLabelChange(raw: string): void
  children: ReactNode
}

export function PieceHeader({ label, rarity, onLabelChange, children }: Props) {
  const { t } = useI18n()
  return (
    <div className={`${styles.header} ${RARITY[rarity]}`}>
      <input
        type="text"
        className={styles.titleInput}
        value={label ?? ""}
        maxLength={LABEL_MAX_LENGTH}
        placeholder={t("gear.details.pieceNamePlaceholder")}
        aria-label={t("common.name")}
        onChange={(event) => onLabelChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
      />
      <div className={styles.chips}>{children}</div>
    </div>
  )
}

interface SetChipProps {
  ariaLabel: string
  text: string
  onOpen(): void
}

export function SetChip({ ariaLabel, text, onOpen }: SetChipProps) {
  return (
    <button
      type="button"
      className={styles.setButton}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      title={text}
      onClick={onOpen}
    >
      <span>{text}</span>
      <span className={styles.setButtonChevron} aria-hidden="true" />
    </button>
  )
}
