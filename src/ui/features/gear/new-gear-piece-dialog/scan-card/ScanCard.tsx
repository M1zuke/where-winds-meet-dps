import { useState } from "react"
import { useI18n } from "../../../../../i18n/i18nContext"
import type {
  GearScreenshotLineRole,
  GearScreenshotRowSlot,
} from "../../screenshot-ocr/ocrGearPiece"
import type { ScreenshotImportErrorKind, ScreenshotImportState } from "../useScreenshotImport"
import styles from "./ScanCard.module.scss"

const ERROR_KEYS: Record<ScreenshotImportErrorKind, string> = {
  empty: "gear.screenshotImport.noTextFound",
  unreadable: "gear.screenshotImport.unreadableImage",
  recognitionFailed: "gear.screenshotImport.recognitionFailed",
}

const ERROR_FIX_KEYS: Record<ScreenshotImportErrorKind, string> = {
  empty: "gear.screenshotImport.unreadableFix",
  unreadable: "gear.screenshotImport.unreadableFix",
  recognitionFailed: "gear.screenshotImport.recognitionFailedFix",
}

const LINE_ROLE_KEYS: Record<GearScreenshotLineRole, string> = {
  title: "gear.screenshotImport.lineRoleTitle",
  header: "gear.screenshotImport.lineRoleHeader",
  row: "gear.screenshotImport.lineRoleRow",
  dropped: "gear.screenshotImport.lineRoleDropped",
}

interface Props {
  screenshot: ScreenshotImportState & {
    importImage(source: File | Blob): Promise<void>
    cancel(): void
    reset(): void
    copyNotice: string
    copyDiagnostics(): Promise<void>
  }
  flaggedCount: number
  exampleImageUrl: string
  onPickImage(file: File): void
}

function imageFileFrom(fileList: FileList | null): File | null {
  if (!fileList) return null
  return [...fileList].find((file) => file.type.startsWith("image/")) ?? null
}

export function ScanCard({ screenshot, flaggedCount, exampleImageUrl, onPickImage }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<"scan" | "howTo">("scan")

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = imageFileFrom(event.target.files)
    if (file) onPickImage(file)
    event.target.value = ""
  }

  function handleDrop(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault()
    const file = imageFileFrom(event.dataTransfer.files)
    if (file) onPickImage(file)
  }

  function stateLabel(): { text: string; tone: string } {
    if (screenshot.status === "recognizing")
      return { text: t("gear.screenshotImport.stateReading"), tone: styles.busy }
    if (screenshot.status === "error")
      return { text: t("gear.screenshotImport.stateFailed"), tone: styles.bad }
    if (screenshot.status === "parsed")
      return flaggedCount > 0
        ? {
            text: `${flaggedCount} ${t("gear.screenshotImport.stateToCheck")}`,
            tone: styles.check,
          }
        : { text: t("gear.screenshotImport.stateAllRead"), tone: styles.ok }
    return { text: t("gear.screenshotImport.stateWaiting"), tone: "" }
  }

  function renderDropzone(armed: boolean): React.ReactNode {
    return (
      <label
        className={styles.dropzone + (armed ? ` ${styles.armed}` : "")}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <svg
          width="34"
          height="26"
          viewBox="0 0 34 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M1 8V1h7M26 1h7v7M33 18v7h-7M8 25H1v-7" />
          <path d="M9 17l4.5-5 3.5 4 3-2.5 5 6z" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="1.6" />
        </svg>
        <span className={styles.dropPrimary}>{t("gear.screenshotImport.dropPaste")}</span>
        <span className={styles.dropSecondary}>{t("gear.screenshotImport.dropOrBrowse")}</span>
        <input
          type="file"
          accept="image/*"
          aria-label={t("gear.screenshotImport.chooseFile")}
          className={styles.hiddenFileInput}
          onChange={handleFilePick}
        />
      </label>
    )
  }

  function renderSteps(): React.ReactNode {
    return (
      <ol className={styles.steps}>
        <li>{t("gear.screenshotImport.stepOpenPiece")}</li>
        <li>{t("gear.screenshotImport.stepPressTuneOrDevelop")}</li>
        <li>{t("gear.screenshotImport.stepCroppedScreenshot")}</li>
        <li>{t("gear.screenshotImport.stepPasteHere")}</li>
      </ol>
    )
  }

  function renderPreview(): React.ReactNode {
    if (!screenshot.imageUrl) return null
    return (
      <div className={styles.shot}>
        <img src={screenshot.imageUrl} alt={t("gear.screenshotImport.pastedImageAlt")} />
        {screenshot.status === "recognizing" && (
          <div className={styles.scrim}>
            <span>{`${t("gear.screenshotImport.recognizing")} ${Math.round(screenshot.progress * 100)}%`}</span>
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
          </div>
        )}
      </div>
    )
  }

  function renderLegend(): React.ReactNode {
    if (flaggedCount === 0) return null
    return (
      <div className={styles.legend}>
        <span className={styles.legendTitle}>{t("gear.screenshotImport.legendTitle")}</span>
        <span className={styles.legendRow}>
          <span className={`${styles.legendChip} ${styles.legendGuessed}`} aria-hidden="true" />
          {t("gear.screenshotImport.legendGuessed")}
        </span>
        <span className={styles.legendRow}>
          <span className={`${styles.legendChip} ${styles.legendUnresolved}`} aria-hidden="true" />
          {t("gear.screenshotImport.legendUnresolved")}
        </span>
      </div>
    )
  }

  function renderScanBody(): React.ReactNode {
    if (screenshot.status === "recognizing")
      return (
        <>
          {renderPreview()}
          <div className={styles.actions}>
            <button type="button" className="btn" onClick={screenshot.cancel}>
              {t("gear.screenshotImport.cancelScan")}
            </button>
          </div>
        </>
      )

    if (screenshot.status === "error")
      return (
        <>
          <div className={styles.failure}>
            <span className={styles.failureWhat}>
              {t(ERROR_KEYS[screenshot.errorKind ?? "recognitionFailed"])}
            </span>
            <span className={styles.failureFix}>
              {t(ERROR_FIX_KEYS[screenshot.errorKind ?? "recognitionFailed"])}
            </span>
          </div>
          {renderDropzone(true)}
        </>
      )

    if (screenshot.status === "parsed")
      return (
        <>
          {renderPreview()}
          {renderLegend()}
          <div className={styles.actions}>
            <label className="btn">
              {t("gear.screenshotImport.scanAnother")}
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenFileInput}
                onChange={handleFilePick}
              />
            </label>
            <button type="button" className="btn" onClick={screenshot.reset}>
              {t("gear.screenshotImport.clearScan")}
            </button>
          </div>
        </>
      )

    return (
      <>
        {renderDropzone(false)}
        {renderSteps()}
      </>
    )
  }

  const pill = stateLabel()

  return (
    <section
      className={`panel ${styles.card}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="panel-head">
        <h2>{t("gear.screenshotImport.panelTitle")}</h2>
        <span className={`${styles.pill} ${pill.tone}`}>{pill.text}</span>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "scan"}
          className={styles.tab + (tab === "scan" ? ` ${styles.tabOn}` : "")}
          onClick={() => setTab("scan")}
        >
          {t("gear.screenshotImport.tabYourScan")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "howTo"}
          className={styles.tab + (tab === "howTo" ? ` ${styles.tabOn}` : "")}
          onClick={() => setTab("howTo")}
        >
          {t("gear.screenshotImport.tabHowTo")}
        </button>
      </div>

      <div className={styles.body}>
        {tab === "scan" ? (
          renderScanBody()
        ) : (
          <>
            {renderSteps()}
            <img
              className={styles.example}
              src={exampleImageUrl}
              alt={t("gear.screenshotImport.exampleImageAlt")}
            />
          </>
        )}
      </div>

      {screenshot.diagnostics && (
        <details className={styles.diagnostics}>
          <summary>
            {t("gear.screenshotImport.diagnosticsSummary")}
            <span className={styles.diagnosticsCount}>{screenshot.diagnostics.lines.length}</span>
          </summary>
          <div className={styles.diagnosticsBody}>
            {screenshot.diagnostics.lines.map((line, index) => (
              <div key={index} className={styles.diagnosticsLine}>
                [{t(LINE_ROLE_KEYS[line.role])}] {line.text}
              </div>
            ))}
            {screenshot.diagnostics.rows.map((row) => (
              <div key={row.slot}>
                {rowSlotLabel(row.slot, t)}: "{row.rawText}" → {row.nameAfterNoiseStrip || "—"} →{" "}
                {row.resolvedTo ?? t("common.none")} → {row.rawNumber || "—"} →{" "}
                {row.convertedValue ?? t("common.none")} ({t("gear.pieceForm.max")}:{" "}
                {row.cap ?? t("common.none")}){row.exceededCap ? " ⚠" : ""}
                {row.legalForClass === false
                  ? ` (${t("gear.screenshotImport.reasonWrongClass")})`
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
    </section>
  )
}

function rowSlotLabel(slot: GearScreenshotRowSlot, t: (key: string) => string): string {
  if (slot === "attunement") return t("common.attunement")
  return `${t("gear.screenshotImport.wordSlot")} ${Number(slot.slice(4)) + 1}`
}
