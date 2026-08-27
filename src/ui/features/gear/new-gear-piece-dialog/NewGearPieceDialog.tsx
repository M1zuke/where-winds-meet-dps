import { useEffect, useId, useRef, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { attunementLabel, getAttunement } from "../../../../engine/attunements"
import { emptyGearWords } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { newGearPieceId } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import type { I18nValue } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import dialogChrome from "../shared/gearDialog.module.scss"
import { terminateOcrWorker } from "../screenshot-ocr/ocrEngine"
import type { GearScreenshotLineRole, GearScreenshotRowSlot } from "../screenshot-ocr/ocrGearPiece"
import { useScreenshotImport, type ScreenshotImportErrorKind } from "./useScreenshotImport"
import exampleImageUrl from "./screenshotExample.png"
import styles from "./NewGearPieceDialog.module.scss"

interface Props {
  initialSlot: GearSlot
  inputs: Inputs
  onCancel(): void
  onSave(piece: GearPiece, mode: "store" | "equip"): void
}

const SCREENSHOT_ERROR_KEYS: Record<ScreenshotImportErrorKind, string> = {
  empty: "gear.screenshotImport.noTextFound",
  unreadable: "gear.screenshotImport.unreadableImage",
  recognitionFailed: "gear.screenshotImport.recognitionFailed",
}

const LINE_ROLE_KEYS: Record<GearScreenshotLineRole, string> = {
  title: "gear.screenshotImport.lineRoleTitle",
  header: "gear.screenshotImport.lineRoleHeader",
  row: "gear.screenshotImport.lineRoleRow",
  dropped: "gear.screenshotImport.lineRoleDropped",
}

function rowSlotLabel(slot: GearScreenshotRowSlot, t: I18nValue["t"]): string {
  if (slot === "attunement") return t("common.attunement")
  return `${t("gear.screenshotImport.wordSlot")} ${Number(slot.slice(4)) + 1}`
}

function makeDraft(slot: GearSlot): GearPiece {
  const level: GearLevel = 96
  const rarity: GearRarity = "legendary"
  const base = gearBaseStatsFor({ slot, level, rarity })
  return {
    id: newGearPieceId(),
    slot,
    level,
    rarity,
    minPhys: base.minPhys,
    maxPhys: base.maxPhys,
    hp: base.hp,
    physDef: base.physDef,
    words: emptyGearWords(),
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

function imageFileFrom(fileList: FileList | null): File | null {
  if (!fileList) return null
  return [...fileList].find((file) => file.type.startsWith("image/")) ?? null
}

function imageFileFromClipboard(items: DataTransferItemList | null): File | null {
  if (!items) return null
  for (const item of items) {
    const file = item.getAsFile()
    if (file && file.type.startsWith("image/")) return file
  }
  return null
}

export function NewGearPieceDialog({ initialSlot, inputs, onCancel, onSave }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const [draft, setDraft] = useState<GearPiece>(() => makeDraft(initialSlot))
  const [showExample, setShowExample] = useState(true)
  const equipButtonRef = useRef<HTMLButtonElement | null>(null)

  const screenshot = useScreenshotImport(inputs, draft.slot, (piece) => {
    setDraft(piece)
    setShowExample(false)
  })
  const importImageRef = useRef(screenshot.importImage)
  useEffect(() => {
    importImageRef.current = screenshot.importImage
  })

  useEffect(() => {
    function handlePaste(event: ClipboardEvent): void {
      const file = imageFileFromClipboard(event.clipboardData?.items ?? null)
      if (file) void importImageRef.current(file)
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [])

  useEffect(() => {
    return () => void terminateOcrWorker()
  }, [])

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    const file = imageFileFrom(event.dataTransfer.files)
    if (file) void screenshot.importImage(file)
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = imageFileFrom(event.target.files)
    if (file) void screenshot.importImage(file)
    event.target.value = ""
  }

  const reviewWords = screenshot.fields
    ? screenshot.fields.words.filter((word) => word.confidence !== "read" && word.rawText)
    : []

  const attunementDiagnostic = screenshot.diagnostics?.rows.find((row) => row.slot === "attunement")
  const attunementWrongClassOption =
    attunementDiagnostic?.legalForClass === false && attunementDiagnostic.resolvedTo
      ? getAttunement(attunementDiagnostic.resolvedTo)
      : null

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onCancel}
      initialFocusRef={equipButtonRef}
      surfaceClassName={dialogChrome.wide}
    >
      <DialogHeader>
        <h2 id={titleId}>{t("gear.newGearPieceDialog.newGearPiece")}</h2>
      </DialogHeader>
      <DialogBody>
        <div className={styles.split}>
          <div
            className={styles.formColumn}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <label className="btn">
              {t("gear.screenshotImport.chooseFiles")}
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenFileInput}
                onChange={handleFilePick}
              />
            </label>

            {screenshot.status === "recognizing" && (
              <div className={styles.progressRow}>
                <div
                  className="skill-bar-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(screenshot.progress * 100)}
                >
                  <div
                    className="skill-bar-fill"
                    style={{ width: `${(screenshot.progress * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="hint">{t("gear.screenshotImport.recognizing")}</span>
              </div>
            )}

            {screenshot.status === "error" && screenshot.errorKind && (
              <div className="warnings">⚠ {t(SCREENSHOT_ERROR_KEYS[screenshot.errorKind])}</div>
            )}

            {screenshot.fields?.slot === "guessed" && (
              <div className="hint">{t("gear.screenshotImport.slotGuessed")}</div>
            )}

            {reviewWords.length > 0 && (
              <div className="warnings">
                ⚠ {t("gear.screenshotImport.statsUnresolved")}:{" "}
                {reviewWords.map((word) => word.rawText).join(", ")}
              </div>
            )}

            {attunementWrongClassOption && (
              <div className="warnings">
                ⚠ {t("gear.screenshotImport.attunementWrongClass")}:{" "}
                {attunementLabel(attunementWrongClassOption, inputs.classId)}
              </div>
            )}

            <GearPieceForm
              piece={draft}
              inputs={inputs}
              onChange={setDraft}
              wordMaxRows={[]}
              wordMaxPending={false}
              showWordMax={false}
              unreadFields={
                screenshot.fields
                  ? {
                      level: screenshot.fields.level !== "read",
                      relayed: screenshot.fields.relayed !== "read",
                    }
                  : undefined
              }
            />

            {screenshot.diagnostics && (
              <details className={styles.diagnostics}>
                <summary>{t("gear.screenshotImport.diagnosticsSummary")}</summary>
                <div className={styles.diagnosticsBody}>
                  {screenshot.diagnostics.lines.map((line, index) => (
                    <div key={index} className={styles.diagnosticsLine}>
                      [{t(LINE_ROLE_KEYS[line.role])}] {line.text}
                    </div>
                  ))}
                  {screenshot.diagnostics.rows.map((row) => (
                    <div key={row.slot} className={styles.diagnosticsRow}>
                      {rowSlotLabel(row.slot, t)}: "{row.rawText}" →{" "}
                      {row.nameAfterNoiseStrip || "—"} → {row.resolvedTo ?? t("common.none")} →{" "}
                      {row.rawNumber || "—"} → {row.convertedValue ?? t("common.none")} (
                      {t("gear.pieceForm.max")}: {row.cap ?? t("common.none")})
                      {row.exceededCap ? " ⚠" : ""}
                      {row.legalForClass === false
                        ? ` (${t("gear.screenshotImport.attunementWrongClass")})`
                        : ""}
                    </div>
                  ))}
                </div>
                <button type="button" className="btn" onClick={screenshot.copyDiagnostics}>
                  {t("gear.importGearDialog.copyDiagnostics")}
                </button>
                {screenshot.copyNotice && <div className="hint">{screenshot.copyNotice}</div>}
              </details>
            )}
          </div>

          <div className={styles.helpColumn}>
            {screenshot.imageUrl && !showExample ? (
              <>
                <img
                  className={styles.exampleImage}
                  src={screenshot.imageUrl}
                  alt={t("gear.screenshotImport.pastedImageAlt")}
                />
                <button type="button" className="btn" onClick={() => setShowExample(true)}>
                  {t("gear.screenshotImport.backToInstructions")}
                </button>
              </>
            ) : (
              <>
                <ol className={styles.steps}>
                  <li>{t("gear.screenshotImport.stepOpenPiece")}</li>
                  <li>{t("gear.screenshotImport.stepPressTuneOrDevelop")}</li>
                  <li>{t("gear.screenshotImport.stepCroppedScreenshot")}</li>
                  <li>{t("gear.screenshotImport.stepPasteHere")}</li>
                </ol>
                <img
                  className={styles.exampleImage}
                  src={exampleImageUrl}
                  alt={t("gear.screenshotImport.exampleImageAlt")}
                />
                {screenshot.imageUrl && (
                  <button type="button" className="btn" onClick={() => setShowExample(false)}>
                    {t("gear.screenshotImport.viewYourScreenshot")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <button type="button" className="btn" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="button" className="btn" onClick={() => onSave(draft, "store")}>
          {t("gear.newGearPieceDialog.saveStore")}
        </button>
        <button
          type="button"
          ref={equipButtonRef}
          className="btn primary"
          onClick={() => onSave(draft, "equip")}
        >
          {t("gear.newGearPieceDialog.saveEquip")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
