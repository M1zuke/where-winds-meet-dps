import { useMemo, useRef, useState } from "react"
import { gearWordPoolForLine } from "../../../../data/stats/gearWordPools"
import { statLineLabel } from "../../../../data/stats/statLines"
import { classDefinition } from "../../../../definitions/classes/registry"
import type { GraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { attunementLabel, attunementLabelKey, attunementsFor } from "../../../../engine/attunements"
import type { CustomGraduationBuild } from "../../../../engine/customGraduationBuild"
import { newCustomGraduationBuildId } from "../../../../engine/customGraduationBuild"
import { ARMOR_SET_OPTIONS } from "../../../../engine/panel"
import type { Arsenal, BowSet, GearLevel, GearSlot, GearWordId } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import {
  deleteCustomGraduationBuild,
  exportCustomGraduationBuild,
  importCustomGraduationBuild,
  loadCustomGraduationBuilds,
  saveCustomGraduationBuild,
} from "../../../../storage"
import { rotationKey, setKey, statLineKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { TextInput } from "../../../components/text-input/TextInput"
import { ARSENAL_KEYS, BOW_SET_KEYS } from "../shared/buildSetKeys"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import styles from "./CustomGraduationBuildEditor.module.scss"

interface Props {
  classId: string
  level: GearLevel
  saved: CustomGraduationBuild | null
  copyFrom: readonly GraduationBuild[]
  onChanged(builds: CustomGraduationBuild[]): void
  onFollow(buildId: string): void
}

const NAME_MAX_LENGTH = 40

function draftFrom(classId: string, source: GraduationBuild | null): CustomGraduationBuild {
  const now = new Date().toISOString()
  return {
    id: newCustomGraduationBuildId(),
    name: source ? `${source.name} (copy)` : "My build",
    classId,
    slots: GEAR_SLOTS.map((slot) => {
      const piece = source?.gear.find((gear) => gear.slot === slot)
      const words = (piece?.words.map((word) => word.word) ?? ["", "", "", "", ""]) as string[]
      return {
        slot,
        words: words as unknown as CustomGraduationBuild["slots"][number]["words"],
        attunement: piece?.attunement ?? "",
      }
    }),
    set: source?.set ?? null,
    bowSet: source?.bowSet ?? null,
    arsenal: source?.arsenal ?? "general",
    rotationId: source?.rotationId ?? "",
    createdAt: now,
    updatedAt: now,
  }
}

export function CustomGraduationBuildEditor({
  classId,
  level,
  saved,
  copyFrom,
  onChanged,
  onFollow,
}: Props) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<CustomGraduationBuild | null>(saved)
  const fileRef = useRef<HTMLInputElement>(null)

  const rotationOptions: ComboboxOption[] = useMemo(() => {
    const rotations = classDefinition(classId)?.rotations ?? []
    return rotations.map((rotation) => ({
      value: rotation.id,
      label: t(rotationKey(rotation.id), rotation.name),
    }))
  }, [classId, t])

  const setOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "", label: t("common.unselected") },
      ...ARMOR_SET_OPTIONS.map((option) => ({
        value: option.setKey,
        label: t(setKey(option.setKey), option.name),
      })),
    ],
    [t],
  )

  const bowSetOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "", label: t("common.unselected") },
      ...Object.entries(BOW_SET_KEYS).map(([value, key]) => ({ value, label: t(key) })),
    ],
    [t],
  )

  const arsenalOptions: ComboboxOption[] = useMemo(
    () => Object.entries(ARSENAL_KEYS).map(([value, key]) => ({ value, label: t(key) })),
    [t],
  )

  function wordOptions(slot: GearSlot, lineIndex: number): ComboboxOption[] {
    const pool = gearWordPoolForLine(level, slot, lineIndex)
    return [
      { value: "", label: t("common.none") },
      ...pool.map((word) => ({ value: word, label: t(statLineKey(word), statLineLabel(word)) })),
    ]
  }

  function attunementOptions(slot: GearSlot): ComboboxOption[] {
    return [
      { value: "", label: t("common.none") },
      ...attunementsFor(slot, classId).map((option) => ({
        value: option.id,
        label: t(attunementLabelKey(option, classId), attunementLabel(option, classId)),
      })),
    ]
  }

  function patch(next: Partial<CustomGraduationBuild>): void {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }

  function patchSlot(slot: GearSlot, next: Partial<CustomGraduationBuild["slots"][number]>): void {
    setDraft((current) =>
      current
        ? {
            ...current,
            slots: current.slots.map((entry) =>
              entry.slot === slot ? { ...entry, ...next } : entry,
            ),
          }
        : current,
    )
  }

  function patchWord(slot: GearSlot, lineIndex: number, word: string): void {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        slots: current.slots.map((entry) => {
          if (entry.slot !== slot) return entry
          const words = [...entry.words] as string[]
          words[lineIndex] = word
          return { ...entry, words: words as unknown as typeof entry.words }
        }),
      }
    })
  }

  function handleSave(): void {
    if (!draft) return
    const persisted = saveCustomGraduationBuild(draft)
    setDraft(persisted)
    onChanged(loadCustomGraduationBuilds())
    onFollow(persisted.id)
  }

  function handleDelete(): void {
    deleteCustomGraduationBuild(classId)
    setDraft(null)
    onChanged(loadCustomGraduationBuilds())
  }

  function handleExport(): void {
    if (!draft) return
    const text = exportCustomGraduationBuild(draft)
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${draft.name.replace(/[^\w\-.]+/g, "_")}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const imported = importCustomGraduationBuild(await file.text(), classId)
      const persisted = saveCustomGraduationBuild(imported)
      setDraft(persisted)
      onChanged(loadCustomGraduationBuilds())
      onFollow(persisted.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      alert(`${t("common.importFailed")}: ${message}`)
    }
  }

  if (!draft) {
    return (
      <div className={styles.start}>
        <p className={styles.startHint}>{t("gear.customGraduationBuild.startFromScratchOr")}</p>
        <div className={styles.startRow}>
          <button type="button" className="btn" onClick={() => setDraft(draftFrom(classId, null))}>
            {t("gear.customGraduationBuild.startEmpty")}
          </button>
          {copyFrom.map((build) => (
            <button
              key={build.id}
              type="button"
              className="btn"
              onClick={() => setDraft(draftFrom(classId, build))}
            >
              {t("app.copy")} {build.name}
            </button>
          ))}
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            {t("common.import")}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImportFile}
        />
      </div>
    )
  }

  return (
    <div className={styles.editor}>
      <div className={styles.head}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("common.name")}</span>
          <TextInput
            value={draft.name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("common.rotation")}</span>
          <Combobox
            value={draft.rotationId}
            options={rotationOptions}
            onChange={(value) => patch({ rotationId: value })}
            placeholder={t("common.none")}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("common.armorSet")}</span>
          <Combobox
            value={draft.set ?? ""}
            options={setOptions}
            onChange={(value) => patch({ set: value === "" ? null : value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("common.bowSet")}</span>
          <Combobox
            value={draft.bowSet ?? ""}
            options={bowSetOptions}
            onChange={(value) => patch({ bowSet: (value === "" ? null : value) as BowSet })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("common.arsenal")}</span>
          <Combobox
            value={draft.arsenal}
            options={arsenalOptions}
            onChange={(value) => patch({ arsenal: value as Arsenal })}
          />
        </label>
      </div>

      <p className="hint">{t("gear.customGraduationBuild.everyLineRollsAt")}</p>

      <div className={styles.slots}>
        {draft.slots.map((entry) => (
          <div key={entry.slot} className={styles.slot}>
            <span className={styles.slotName}>{t(GEAR_SLOT_KEYS[entry.slot])}</span>
            <div className={styles.lines}>
              {entry.words.map((word, lineIndex) => (
                <Combobox
                  key={lineIndex}
                  value={word}
                  options={wordOptions(entry.slot, lineIndex)}
                  onChange={(value) => patchWord(entry.slot, lineIndex, value as GearWordId)}
                  aria-label={`${t(GEAR_SLOT_KEYS[entry.slot])} ${lineIndex + 1}`}
                />
              ))}
              <div className={styles.attunementLine}>
                <Combobox
                  value={entry.attunement}
                  options={attunementOptions(entry.slot)}
                  onChange={(value) => patchSlot(entry.slot, { attunement: value })}
                  aria-label={`${t(GEAR_SLOT_KEYS[entry.slot])} ${t("common.attunement")}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn primary" onClick={handleSave}>
          {t("gear.customGraduationBuild.saveAndFollow")}
        </button>
        <button type="button" className="btn" onClick={handleExport}>
          {t("common.export")}
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          {t("common.import")}
        </button>
        <div className="spacer" />
        {saved && (
          <button type="button" className="btn danger" onClick={handleDelete}>
            {t("common.delete")}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}
