import { useId, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog } from "../../../components/dialog/Dialog"
import { syncClassPermanent } from "../../../utils/classSetup"
import { ClassPicker } from "../class-picker/ClassPicker"
import { GearImportInstructions } from "../../gear/import-gear-dialog/GearImportInstructions"
import { GearImportPreview } from "../../gear/import-gear-dialog/GearImportPreview"
import { useGearImportDraft } from "../../gear/import-gear-dialog/useGearImportDraft"
import { equippedFromImported } from "../../gear/import-gear-dialog/importedGearPieces"
import { TextInput } from "../../../components/text-input/TextInput"
import styles from "./SetupWizard.module.scss"

export type SetupMode = "first-run" | "new-profile"

interface Props {
  initialName: string
  initialInputs: Inputs
  mode: SetupMode
  onFinish(name: string, inputs: Inputs): void
  onCancel?: () => void
}

export function SetupWizard({ initialName, initialInputs, mode, onFinish, onCancel }: Props) {
  const { t } = useI18n()
  const headingId = useId()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [manual, setManual] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState<Inputs>(() =>
    syncClassPermanent(initialInputs, initialInputs.classId),
  )
  const importDraft = useGearImportDraft(draft)

  const totalSteps = manual ? 3 : 2
  const trimmedName = name.trim()
  const finishLabel = mode === "first-run" ? t("Finish setup") : t("Create profile")

  function goToImportStep(): void {
    setStep(2)
  }
  function backToClassStep(): void {
    setStep(1)
  }
  function goManual(): void {
    setManual(true)
    setStep(3)
  }
  function backToImportStep(): void {
    setManual(false)
    setStep(2)
  }

  function finishImportPath(): void {
    if (!importDraft.result || !importDraft.pieces.length) return
    const finishedInputs: Inputs = {
      ...draft,
      inventory: importDraft.pieces,
      equipped: equippedFromImported(importDraft.pieces),
      mindMethods: importDraft.mindMethods ?? draft.mindMethods,
    }
    const capturedName = importDraft.result.roleName?.trim()
    const finalName = capturedName || initialName.trim() || t("New profile")
    onFinish(finalName, finishedInputs)
  }

  function finishManualPath(): void {
    if (!trimmedName) return
    onFinish(trimmedName, draft)
  }

  const heading =
    step === 1
      ? t("Choose your class")
      : step === 2
        ? t("Import your gear")
        : t("Name your profile")

  const instruction =
    step === 1
      ? t("Pick the class you play — everything after this is filtered to it.")
      : step === 2
        ? t(
            "Paste a capture from the official dashboard, or tell us you'd rather set your gear up yourself.",
          )
        : t("Give this profile a name — your character name works well.")

  const canGoBack = step > 1 || !!onCancel
  const backLabel = step === 1 && onCancel ? t("Cancel") : t("Back")

  function back(): void {
    if (step === 3) backToImportStep()
    else if (step === 2) backToClassStep()
    else onCancel?.()
  }

  const primaryDisabled =
    step === 2 ? !importDraft.pieces.length : step === 3 ? !trimmedName : false

  function primaryAction(): void {
    if (step === 1) goToImportStep()
    else if (step === 2) finishImportPath()
    else finishManualPath()
  }

  return (
    <Dialog
      labelledBy={headingId}
      layer="wizard"
      surfaceClassName={styles.wizardSurface + (step === 2 ? ` ${styles.surfaceImport}` : "")}
    >
      <div className={styles.wizardHeader}>
        <div className={styles.wizardStepIndicator}>
          {t("Step {n}").replace("{n}", `${step} / ${totalSteps}`)}
        </div>
        <h2 id={headingId}>{heading}</h2>
        <p className={styles.wizardInstruction}>{instruction}</p>
      </div>

      <div className={styles.wizardBody}>
        {step === 1 && (
          <ClassPicker
            value={draft.classId}
            onChange={(classId) => setDraft(syncClassPermanent(draft, classId))}
          />
        )}

        {step === 2 && (
          <div className={styles.wizardImportSplit}>
            <div>
              {!importDraft.result ? (
                <GearImportInstructions
                  pasted={importDraft.pasted}
                  onPasteChange={importDraft.setPasted}
                  parseError={importDraft.parseError}
                  notice={importDraft.copyNotice}
                />
              ) : (
                <GearImportPreview
                  draft={importDraft}
                  mindMethods={draft.mindMethods}
                  onClearPaste={importDraft.clearPaste}
                  warnAboutDisplacedSlots={false}
                />
              )}
            </div>
            <div className={styles.wizardManualDivider}>
              <span className={styles.wizardManualDividerLabel}>{t("OR")}</span>
            </div>
            <div className={styles.wizardManualArea}>
              <button
                type="button"
                className={`btn ${styles.wizardManualButton}`}
                onClick={goManual}
              >
                {t("I'd rather do it manually")}
              </button>
              <p className={styles.wizardManualNote}>
                {t(
                  "Enter your gear yourself later — you can import from the Gear tab at any time.",
                )}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`row ${styles.wizardNameRow}`}>
            <label htmlFor="wizard-name">{t("Profile name")}</label>
            <TextInput
              id="wizard-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") finishManualPath()
              }}
              placeholder={t("e.g. my character name")}
            />
          </div>
        )}
      </div>

      <div className={styles.wizardFooter}>
        <button type="button" className="btn" onClick={back} disabled={!canGoBack}>
          {backLabel}
        </button>
        <div className={styles.wizardProgress} aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={
                styles.wizardDot +
                (index + 1 === step
                  ? ` ${styles.isActive}`
                  : index + 1 < step
                    ? ` ${styles.isDone}`
                    : "")
              }
            />
          ))}
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={primaryAction}
          disabled={primaryDisabled}
        >
          {step === 1 ? t("Next") : finishLabel}
        </button>
      </div>
    </Dialog>
  )
}
