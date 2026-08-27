import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { emptyGearWords } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { newGearPieceId } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { GearPieceForm, type ScanMarkField, type ScanMarks } from "../gear-piece-form/GearPieceForm"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import dialogChrome from "../shared/gearDialog.module.scss"
import { terminateOcrWorker } from "../screenshot-ocr/ocrEngine"
import { ScanCard } from "./scan-card/ScanCard"
import { buildScanSummary } from "./scanMarks"
import { useScreenshotImport } from "./useScreenshotImport"
import exampleImageUrl from "./screenshotExample.png"
import styles from "./NewGearPieceDialog.module.scss"

interface Props {
  initialSlot: GearSlot
  inputs: Inputs
  onCancel(): void
  onSave(piece: GearPiece, mode: "store" | "equip"): void
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
  const [clearedMarks, setClearedMarks] = useState<ScanMarkField[]>([])
  const equipButtonRef = useRef<HTMLButtonElement | null>(null)

  const screenshot = useScreenshotImport(inputs, draft.slot, (piece) => {
    setDraft(piece)
    setClearedMarks([])
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

  const summary = useMemo(
    () => buildScanSummary(screenshot.fields, screenshot.diagnostics),
    [screenshot.fields, screenshot.diagnostics],
  )

  const marks: ScanMarks = Object.fromEntries(
    Object.entries(summary.marks).filter(
      ([field]) => !clearedMarks.includes(field as ScanMarkField),
    ),
  )

  const flaggedCount = Object.keys(marks).length

  function handleMarkCleared(field: ScanMarkField): void {
    setClearedMarks((previous) => (previous.includes(field) ? previous : [...previous, field]))
  }

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
          <section className={`panel ${styles.gearCard}`}>
            <div className="panel-head">
              <h2>{t("gear.newGearPieceDialog.gearPiece")}</h2>
              <span className="panel-head-meta">{t(GEAR_SLOT_KEYS[draft.slot])}</span>
            </div>
            <GearPieceForm
              piece={draft}
              inputs={inputs}
              onChange={setDraft}
              wordMaxRows={[]}
              wordMaxPending={false}
              showWordMax={false}
              scanMarks={marks}
              onScanMarkCleared={handleMarkCleared}
            />
          </section>

          <ScanCard
            screenshot={screenshot}
            flaggedCount={flaggedCount}
            exampleImageUrl={exampleImageUrl}
            onPickImage={(file) => void screenshot.importImage(file)}
          />
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
