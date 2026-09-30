import { useId, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import { graduationBuildsFor } from "../../../../definitions/graduationBuilds/registry"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog } from "../../../components/dialog/Dialog"
import { syncClassPermanent } from "../../../utils/classSetup"
import { ClassPicker } from "../class-picker/ClassPicker"
import { GraduationBuildPicker } from "../../gear/graduation-build-picker/GraduationBuildPicker"
import { GearImportInstructions } from "../../gear/import-gear-dialog/GearImportInstructions"
import { GearImportPreview } from "../../gear/import-gear-dialog/GearImportPreview"
import { useGearImportDraft } from "../../gear/import-gear-dialog/useGearImportDraft"
import { equippedFromImported } from "../../gear/import-gear-dialog/importedGearPieces"
import { TextInput } from "../../../components/text-input/TextInput"
import { wizardSteps, type WizardStep } from "./wizardSteps"
import styles from "./SetupWizard.module.scss"

export type SetupMode = "first-run" | "new-profile"

const STEP_HEADING_KEYS: Record<WizardStep, string> = {
  class: "setup.wizard.chooseYourClass",
  graduation: "setup.wizard.chooseYourGraduationBuild",
  import: "setup.wizard.importYourGear",
  name: "setup.wizard.nameYourProfile",
}

const STEP_INSTRUCTION_KEYS: Record<WizardStep, string> = {
  class: "setup.wizard.pickTheClassHint",
  graduation: "setup.wizard.yourGraduationRateComparesHint",
  import: "setup.wizard.pasteACaptureHint",
  name: "setup.wizard.giveThisProfileAName",
}

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
  const [step, setStep] = useState<WizardStep>("class")
  const [manual, setManual] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState<Inputs>(() =>
    syncClassPermanent(initialInputs, initialInputs.classId),
  )
  const importDraft = useGearImportDraft(draft)

  const graduationBuilds = graduationBuildsFor(draft.classId)
  const steps = wizardSteps(graduationBuilds.length, manual)
  const stepIndex = steps.indexOf(step)
  const hasChosenGraduationBuild = graduationBuilds.some(
    (build) => build.id === draft.graduationBuildId,
  )
  const trimmedName = name.trim()
  const finishLabel =
    mode === "first-run" ? t("setup.wizard.finishSetup") : t("setup.wizard.createProfile")

  function goForward(): void {
    const next = steps[stepIndex + 1]
    if (next) setStep(next)
  }
  function goManual(): void {
    setManual(true)
    setStep("name")
  }
  function back(): void {
    if (step === "name") setManual(false)
    const previous = steps[stepIndex - 1]
    if (previous) setStep(previous)
    else onCancel?.()
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
    const finalName = capturedName || initialName.trim() || t("common.newProfile")
    onFinish(finalName, finishedInputs)
  }

  function finishManualPath(): void {
    if (!trimmedName) return
    onFinish(trimmedName, draft)
  }

  const canGoBack = step !== "class" || !!onCancel
  const backLabel = step === "class" && onCancel ? t("common.cancel") : t("common.back")
  const isLastStep = stepIndex === steps.length - 1

  const primaryDisabled =
    step === "graduation"
      ? !hasChosenGraduationBuild
      : step === "import"
        ? !importDraft.pieces.length
        : step === "name"
          ? !trimmedName
          : false

  function primaryAction(): void {
    if (!isLastStep) goForward()
    else if (manual) finishManualPath()
    else finishImportPath()
  }

  return (
    <Dialog
      labelledBy={headingId}
      layer="wizard"
      surfaceClassName={
        styles.wizardSurface + (step === "import" ? ` ${styles.surfaceImport}` : "")
      }
    >
      <div className={styles.wizardHeader}>
        <div className={styles.wizardStepIndicator}>
          {t("setup.wizard.stepN").replace("{n}", `${stepIndex + 1} / ${steps.length}`)}
        </div>
        <h2 id={headingId}>{t(STEP_HEADING_KEYS[step])}</h2>
        <p className={styles.wizardInstruction}>{t(STEP_INSTRUCTION_KEYS[step])}</p>
      </div>

      <div className={styles.wizardBody}>
        {step === "class" && (
          <ClassPicker
            value={draft.classId}
            onChange={(classId) => setDraft(syncClassPermanent(draft, classId))}
          />
        )}

        {step === "graduation" && (
          <GraduationBuildPicker
            builds={graduationBuilds}
            followedBuildId={hasChosenGraduationBuild ? (draft.graduationBuildId ?? null) : null}
            onFollow={(graduationBuildId) => setDraft({ ...draft, graduationBuildId })}
          />
        )}

        {step === "import" && (
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
              <span className={styles.wizardManualDividerLabel}>{t("setup.wizard.or")}</span>
            </div>
            <div className={styles.wizardManualArea}>
              <button
                type="button"
                className={`btn ${styles.wizardManualButton}`}
                onClick={goManual}
              >
                {t("setup.wizard.iDRatherDoIt")}
              </button>
              <p className={styles.wizardManualNote}>{t("setup.wizard.enterYourGearHint")}</p>
            </div>
          </div>
        )}

        {step === "name" && (
          <div className={`row ${styles.wizardNameRow}`}>
            <label htmlFor="wizard-name">{t("setup.wizard.profileName")}</label>
            <TextInput
              id="wizard-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") finishManualPath()
              }}
              placeholder={t("setup.wizard.eGMyCharacterName")}
            />
          </div>
        )}
      </div>

      <div className={styles.wizardFooter}>
        <button type="button" className="btn" onClick={back} disabled={!canGoBack}>
          {backLabel}
        </button>
        <div className={styles.wizardProgress} aria-hidden="true">
          {steps.map((wizardStep, index) => (
            <span
              key={wizardStep}
              className={
                styles.wizardDot +
                (index === stepIndex
                  ? ` ${styles.isActive}`
                  : index < stepIndex
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
          {isLastStep ? finishLabel : t("setup.wizard.next")}
        </button>
      </div>
    </Dialog>
  )
}
