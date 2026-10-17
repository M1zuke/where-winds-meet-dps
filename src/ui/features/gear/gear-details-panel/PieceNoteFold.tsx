import { useI18n } from "../../../../i18n/i18nContext"
import { NOTE_MAX_LENGTH } from "./pieceHeaderParts"
import styles from "./PieceNoteFold.module.scss"

interface Props {
  note: string | undefined
  onNoteChange(raw: string): void
}

export function PieceNoteFold({ note, onNoteChange }: Props) {
  const { t } = useI18n()
  return (
    <details className={styles.fold}>
      <summary className={styles.summary}>
        <span className={styles.title}>{t("gear.details.pieceNote")}</span>
        <span className={styles.preview}>
          {note || <span className={styles.empty}>{t("gear.noneShort")}</span>}
        </span>
      </summary>
      <div className={styles.body}>
        <textarea
          className={styles.noteInput}
          value={note ?? ""}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t("gear.details.pieceNotePlaceholder")}
          aria-label={t("gear.details.pieceNote")}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </div>
    </details>
  )
}
