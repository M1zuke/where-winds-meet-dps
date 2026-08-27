import { useEffect, useId, useRef } from "react"
import type { GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { TextInput } from "../../../components/text-input/TextInput"
import { sanitizeGearPieceText } from "../../../../storage"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import dialogChrome from "../shared/gearDialog.module.scss"
import { terminateOcrWorker } from "./ocrEngine"
import { useScreenshotGearDraft, type ScreenshotGearCard } from "./useScreenshotGearDraft"
import styles from "./screenshotGearDialog.module.scss"

function imageFilesFromClipboard(items: DataTransferItemList | null): File[] {
  if (!items) return []
  const files: File[] = []
  for (const item of items) {
    const file = item.getAsFile()
    if (file && file.type.startsWith("image/")) files.push(file)
  }
  return files
}

function imageFilesFromFileList(fileList: FileList | null): File[] {
  if (!fileList) return []
  return [...fileList].filter((file) => file.type.startsWith("image/"))
}

interface Props {
  inputs: Inputs
  fallbackSlot: GearSlot
  onCancel(): void
  onImport(pieces: GearPiece[]): void
}

export function ScreenshotGearDialog({ inputs, fallbackSlot, onCancel, onImport }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const draft = useScreenshotGearDraft(inputs, fallbackSlot)
  const addImageRef = useRef(draft.addImage)
  useEffect(() => {
    addImageRef.current = draft.addImage
  })

  useEffect(() => {
    function handlePaste(event: ClipboardEvent): void {
      for (const file of imageFilesFromClipboard(event.clipboardData?.items ?? null)) {
        void addImageRef.current(file)
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [])

  useEffect(() => {
    return () => void terminateOcrWorker()
  }, [])

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    for (const file of imageFilesFromFileList(event.dataTransfer.files)) void draft.addImage(file)
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>): void {
    for (const file of imageFilesFromFileList(event.target.files)) void draft.addImage(file)
    event.target.value = ""
  }

  return (
    <Dialog labelledBy={titleId} onClose={onCancel} surfaceClassName={dialogChrome.wide}>
      <DialogHeader>
        <h2 id={titleId}>{t("gear.screenshotImport.title")}</h2>
      </DialogHeader>

      <DialogBody>
        <div
          className={styles.dropZone}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <p>{t("gear.screenshotImport.instructions")}</p>
          <label className="btn">
            {t("gear.screenshotImport.chooseFiles")}
            <input
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenFileInput}
              onChange={handleFilePick}
            />
          </label>
        </div>

        {draft.cards.length === 0 && (
          <div className="empty-tab">{t("gear.screenshotImport.emptyState")}</div>
        )}

        <div className={styles.cardGrid}>
          {draft.cards.map((card) => (
            <ScreenshotCard
              key={card.id}
              card={card}
              inputs={inputs}
              onChange={(piece) => draft.updatePiece(card.id, piece)}
              onRemove={() => draft.removeCard(card.id)}
            />
          ))}
        </div>
      </DialogBody>

      <DialogFooter>
        <span className="spacer" />
        <span className="hint">{t("gear.importGearDialog.nothingIsWrittenUntilYou")}</span>
        <button type="button" className="btn" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!draft.pieces.length}
          onClick={() => onImport(draft.pieces)}
        >
          {t("common.import")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}

function ScreenshotCard({
  card,
  inputs,
  onChange,
  onRemove,
}: {
  card: ScreenshotGearCard
  inputs: Inputs
  onChange(piece: GearPiece): void
  onRemove(): void
}) {
  const { t } = useI18n()

  function patchLabel(raw: string): void {
    if (!card.piece) return
    const label = sanitizeGearPieceText(raw, 40)
    const next = { ...card.piece }
    if (label) next.label = label
    else delete next.label
    onChange(next)
  }

  const unresolvedWords = card.fields
    ? card.fields.words.filter((word) => word.confidence === "unresolved" && word.rawText)
    : []

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <img className={styles.thumbnail} src={card.thumbnailUrl} alt="" />
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          title={t("common.delete")}
          aria-label={t("common.delete")}
        >
          ×
        </button>
      </div>

      {card.status === "recognizing" && (
        <div className={styles.progressRow}>
          <div
            className="skill-bar-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(card.progress * 100)}
          >
            <div
              className="skill-bar-fill"
              style={{ width: `${(card.progress * 100).toFixed(0)}%` }}
            />
          </div>
          <span className="hint">{t("gear.screenshotImport.recognizing")}</span>
        </div>
      )}

      {card.status === "error" && (
        <div className="warnings">
          ⚠ {t(card.errorKey ?? "gear.screenshotImport.recognitionFailed")}
        </div>
      )}

      {card.status === "parsed" && card.piece && (
        <>
          <label className={styles.nameField}>
            <span className={styles.nameFieldLabel}>{t("common.name")}</span>
            <TextInput
              value={card.piece.label ?? ""}
              maxLength={40}
              placeholder={t("gear.details.pieceNamePlaceholder")}
              onChange={(event) => patchLabel(event.target.value)}
            />
          </label>

          {card.fields?.slot === "guessed" && (
            <div className="hint">{t("gear.screenshotImport.slotGuessed")}</div>
          )}
          {card.fields?.level === "guessed" && (
            <div className="hint">{t("gear.screenshotImport.levelGuessed")}</div>
          )}
          {unresolvedWords.length > 0 && (
            <div className="warnings">
              ⚠ {t("gear.screenshotImport.statsUnresolved")}:{" "}
              {unresolvedWords.map((word) => word.rawText).join(", ")}
            </div>
          )}

          <GearPieceForm
            piece={card.piece}
            inputs={inputs}
            onChange={onChange}
            wordMaxRows={[]}
            wordMaxPending={false}
            showWordMax={false}
          />
        </>
      )}
    </div>
  )
}
