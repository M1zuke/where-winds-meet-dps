import { useId, useState } from "react"
import type { GearPiece, Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import dialogChrome from "../shared/gearDialog.module.scss"
import { loadKeepDisplaced, saveKeepDisplaced } from "./importPreferences"
import { GearImportInstructions } from "./GearImportInstructions"
import { GearImportPreview } from "./GearImportPreview"
import { useGearImportDraft } from "./useGearImportDraft"
import styles from "./gearImport.module.scss"

interface Props {
  inputs: Inputs
  onCancel(): void
  onImport(
    pieces: GearPiece[],
    mindMethods: Inputs["mindMethods"] | null,
    keepDisplaced: boolean,
  ): void
}

export function ImportGearDialog({ inputs, onCancel, onImport }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const draft = useGearImportDraft(inputs)
  const [keepDisplaced, setKeepDisplaced] = useState(loadKeepDisplaced)

  function chooseKeepDisplaced(keep: boolean): void {
    setKeepDisplaced(keep)
    saveKeepDisplaced(keep)
  }

  return (
    <Dialog labelledBy={titleId} onClose={onCancel} surfaceClassName={dialogChrome.wide}>
      <DialogHeader>
        <h2 id={titleId}>{t("gear.importGearDialog.importGear")}</h2>
      </DialogHeader>

      <DialogBody>
        {!draft.result && (
          <GearImportInstructions
            pasted={draft.pasted}
            onPasteChange={draft.setPasted}
            parseError={draft.parseError}
            notice={draft.copyNotice}
          />
        )}

        {draft.result && (
          <GearImportPreview
            draft={draft}
            mindMethods={inputs.mindMethods}
            warnAboutDisplacedSlots
          />
        )}
      </DialogBody>

      <DialogFooter>
        {draft.result && (
          <div className={styles.modeChoice}>
            <span className="section-label">{t("gear.importGearDialog.gearYouHaveNow")}</span>
            <label>
              <input
                type="radio"
                checked={!keepDisplaced}
                onChange={() => chooseKeepDisplaced(false)}
              />
              {t("gear.importGearDialog.removeReplaced")}
            </label>
            <label>
              <input
                type="radio"
                checked={keepDisplaced}
                onChange={() => chooseKeepDisplaced(true)}
              />
              {t("gear.importGearDialog.keepInInventory")}
            </label>
          </div>
        )}
        <span className="spacer" />
        <span className="hint">{t("gear.importGearDialog.nothingIsWrittenUntilYou")}</span>
        {draft.result && (
          <button type="button" className="btn" onClick={draft.clearPaste}>
            {t("common.back")}
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!draft.pieces.length}
          onClick={() => onImport(draft.pieces, draft.mindMethods, keepDisplaced)}
        >
          {t("gear.importGearDialog.importGear")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
