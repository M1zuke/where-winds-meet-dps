import { useEffect, useMemo, useRef, useState } from "react"
import type { Inputs, Result, CastBuffTag, RotationCast } from "../../../../engine/types"
import type { Buff, BuffStatEffect } from "../../../../engine/buff"
import type { Debuff } from "../../../../engine/debuff"
import {
  makeRotation,
  newRotationId,
  newStepId,
  resolveRotation,
  type Rotation,
  type RotationStep,
} from "../../../../engine/rotation"
import { activeRotationForInputs } from "../../../../engine/dps"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { FPS } from "../../../../engine/timeline"
import { isPrePullSkill, type Skill } from "../../../../engine/skill"
import { builtinSkillsForClass, builtinRotationsForClass } from "../../../../engine/builtinLibrary"
import { hiddenTimelineBuffIds } from "../../../../engine/buffs/catalog"
import { STAT_DEF_BY_KEY } from "../../../../engine/statRegistry"
import { buffChipHue, castBuffDisplayOrder, visibleCastBuffs } from "../buffChips"
import {
  inputsWithRotationOption,
  rotationOptions,
  selectedRotationOptionId,
  usesCustomRotation,
} from "../rotationOptions"
import {
  loadCustomRotations,
  saveCustomRotation,
  deleteCustomRotation,
  exportCustomRotation,
  importCustomRotation,
  loadCustomSkillsForClass,
  loadCustomBuffsForClass,
  loadCustomDebuffsForClass,
} from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { buffKey, rotationKey, skillKey } from "../../../../i18n/contentKeys"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { Select } from "../../../components/select/Select"
import { TextInput } from "../../../components/text-input/TextInput"
import styles from "./RotationEditorPanel.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
  result: Result
}

function stepCastFrames(step: RotationStep, skill: Skill | undefined): number {
  if (!skill) return 0
  const hitCount = Math.max(0, Math.min(step.hitCount, skill.hits.length))
  const performed = skill.hits.slice(0, hitCount)
  const maxFrame = performed.length > 0 ? Math.max(...performed.map((hit) => hit.frame)) : -1
  return skill.castFrames || maxFrame + 1
}

function effectsSummary(
  effects: BuffStatEffect[],
  t: (key: string, fallback?: string) => string,
): string {
  return effects
    .filter((effect) => effect.amount !== 0)
    .map((effect) => {
      const def = STAT_DEF_BY_KEY[effect.statKey]
      const label = def ? t(def.labelKey, def.label) : effect.statKey
      const sign = effect.amount >= 0 ? "+" : ""
      const value =
        def?.unit === "fraction"
          ? `${sign}${(effect.amount * 100).toFixed(0)}%`
          : `${sign}${effect.amount}`
      return `${label} ${value}`
    })
    .join(", ")
}

function CastBuffTagChip({ tag }: { tag: CastBuffTag }) {
  const { t } = useI18n()
  const name = t(buffKey(tag.id), tag.name)
  const label = tag.maxStacks > 1 ? `${name} ${tag.stacks}/${tag.maxStacks}` : name
  const eff = effectsSummary(tag.effects, t)
  const style = { "--buff-hue": buffChipHue(tag.name, tag.id) } as React.CSSProperties
  return (
    <span className={styles.castBuffTag} style={style}>
      {label}
      <span className={styles.castBuffTooltip}>
        <div>{name}</div>
        {tag.maxStacks > 1 && (
          <div>
            {t("rotation.editor.stacks")}: {tag.stacks} / {tag.maxStacks}
          </div>
        )}
        {tag.remainingSec != null && (
          <div>
            {t("rotation.editor.remaining")}: {tag.remainingSec.toFixed(1)}s
          </div>
        )}
        {tag.dotIntervalSec != null && (
          <div>
            {t("common.dot")} · {t("common.every")} {tag.dotIntervalSec.toFixed(1)}s
          </div>
        )}
        {eff && <div>{eff}</div>}
        {tag.requires && (
          <div>
            {t("common.requires")} {tag.requires}
          </div>
        )}
        {tag.description && <div>{tag.description}</div>}
      </span>
    </span>
  )
}

export function RotationEditorPanel({ inputs, onChange, result }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()

  const [saved, setSaved] = useState<Rotation[]>(() => loadCustomRotations())
  const [nameDraft, setNameDraft] = useState<{ rotationId: string | null; value: string } | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const classSkills = useMemo<Skill[]>(() => {
    const byId = new Map<string, Skill>()
    for (const skill of builtinSkillsForClass(inputs.classId)) byId.set(skill.id, skill)
    for (const skill of loadCustomSkillsForClass(inputs.classId)) byId.set(skill.id, skill)
    return [...byId.values()]
  }, [inputs.classId])
  const classBuffs = useMemo<Buff[]>(
    () => loadCustomBuffsForClass(inputs.classId),
    [inputs.classId],
  )
  const classDebuffs = useMemo<Debuff[]>(
    () => loadCustomDebuffsForClass(inputs.classId),
    [inputs.classId],
  )
  const skillsById = useMemo(
    () => new Map(classSkills.map((skill) => [skill.id, skill] as const)),
    [classSkills],
  )
  const skillOpts: ComboboxOption[] = useMemo(
    () =>
      classSkills.map((skill) => ({ value: skill.id, label: skill.name || t("common.unnamed2") })),
    [classSkills, t],
  )

  const builtinRotations = useMemo(() => builtinRotationsForClass(inputs.classId), [inputs.classId])
  const options = useMemo(() => rotationOptions(inputs.classId, saved), [inputs.classId, saved])

  const activeRotation = useMemo(() => activeRotationForInputs(inputs), [inputs])
  const activeRotationId = activeRotation?.id ?? null
  const effectiveName =
    nameDraft && nameDraft.rotationId === activeRotationId
      ? nameDraft.value
      : (activeRotation?.name ?? "")
  const isCustom = usesCustomRotation(inputs)
  const isPersisted =
    isCustom && !!activeRotation && saved.some((rotation) => rotation.id === activeRotation.id)
  const selectedRotationValue = selectedRotationOptionId(inputs)
  const selectedBuiltin = !isCustom
    ? builtinRotations.find((rotation) => rotation.id === inputs.selectedBuiltinRotationId)
    : undefined

  useEffect(() => {
    if (!isCustom || !activeRotation) return
    let changed = false
    const steps = activeRotation.steps.map((step) => {
      const skill = skillsById.get(step.skillId)
      if (skill && step.hitCount !== skill.hits.length) {
        changed = true
        return { ...step, hitCount: skill.hits.length }
      }
      return step
    })
    if (changed) onChange({ ...inputs, activeCustomRotation: { ...activeRotation, steps } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRotation?.id, skillsById])

  const computedDurationSec = useMemo(() => {
    if (!activeRotation) return 0
    const frames = activeRotation.steps
      .filter((step) => {
        const skill = skillsById.get(step.skillId)
        return !skill || !isPrePullSkill(skill)
      })
      .reduce((sum, step) => sum + stepCastFrames(step, skillsById.get(step.skillId)), 0)
    return frames / FPS
  }, [activeRotation, skillsById])

  const diagnostics = useMemo(() => {
    if (!isCustom || !activeRotation) return []
    return resolveRotation(activeRotation, classSkills, [...classBuffs, ...classDebuffs]).warnings
  }, [isCustom, activeRotation, classSkills, classBuffs, classDebuffs])

  const castsByStepId = useMemo(() => {
    const map = new Map<string, RotationCast>()
    for (const cast of result.casts ?? []) map.set(cast.stepId, cast)
    return map
  }, [result.casts])
  const castsByStepIndex = useMemo(() => {
    const map = new Map<number, RotationCast>()
    for (const cast of result.casts ?? []) map.set(cast.stepIndex, cast)
    return map
  }, [result.casts])

  const hiddenBuffIds = useMemo(() => hiddenTimelineBuffIds(inputs.classId), [inputs.classId])
  const buffOrder = useMemo(
    () => castBuffDisplayOrder(result.casts, hiddenBuffIds),
    [result.casts, hiddenBuffIds],
  )

  function selectRotation(id: string) {
    const option = options.find((candidate) => candidate.id === id)
    if (option) onChange(inputsWithRotationOption(inputs, option))
  }

  function commitRotation(updater: (rotation: Rotation) => Rotation) {
    if (!isCustom || !activeRotation) return
    onChange({ ...inputs, activeCustomRotation: updater(activeRotation) })
  }

  function updateStep(idx: number, patch: Partial<RotationStep>) {
    commitRotation((rotation) => ({
      ...rotation,
      steps: rotation.steps.map((step, stepIdx) =>
        stepIdx === idx ? { ...step, ...patch } : step,
      ),
    }))
  }
  function removeStep(idx: number) {
    commitRotation((rotation) => ({
      ...rotation,
      steps: rotation.steps.filter((_, stepIdx) => stepIdx !== idx),
    }))
  }
  function addStep() {
    const first = classSkills[0]
    commitRotation((rotation) => ({
      ...rotation,
      steps: [
        ...rotation.steps,
        {
          id: newStepId(),
          skillId: first?.id ?? "",
          hitCount: first?.hits.length ?? 1,
          prePull: false,
        },
      ],
    }))
  }
  function addStepAfter(idx: number) {
    commitRotation((rotation) => {
      const sourceStep = rotation.steps[idx]
      const skill = sourceStep ? skillsById.get(sourceStep.skillId) : undefined
      const nextSteps = rotation.steps.slice()
      nextSteps.splice(idx + 1, 0, {
        id: newStepId(),
        skillId: sourceStep?.skillId ?? "",
        hitCount: skill?.hits.length ?? sourceStep?.hitCount ?? 1,
        prePull: false,
      })
      return { ...rotation, steps: nextSteps }
    })
  }
  function moveStep(idx: number, delta: -1 | 1) {
    commitRotation((rotation) => {
      const nextIdx = idx + delta
      if (nextIdx < 0 || nextIdx >= rotation.steps.length) return rotation
      const nextSteps = rotation.steps.slice()
      ;[nextSteps[idx], nextSteps[nextIdx]] = [nextSteps[nextIdx], nextSteps[idx]]
      return { ...rotation, steps: nextSteps }
    })
  }
  function setPermanentBuffIds(ids: string[]) {
    commitRotation((rotation) => ({ ...rotation, permanentBuffIds: ids }))
  }
  function handleNew() {
    const empty = makeRotation(inputs.classId)
    onChange({ ...inputs, activeCustomRotation: empty, selectedBuiltinRotationId: null })
  }

  function forkToCustom() {
    if (!activeRotation) return
    const copy = makeRotation(inputs.classId, {
      name: activeRotation.name,
      steps: activeRotation.steps.map((step) => {
        const skill = skillsById.get(step.skillId)
        return { ...step, id: newStepId(), hitCount: skill ? skill.hits.length : step.hitCount }
      }),
      permanentBuffIds: [...activeRotation.permanentBuffIds],
    })
    onChange({ ...inputs, activeCustomRotation: copy, selectedBuiltinRotationId: null })
  }

  function handleSave() {
    if (!activeRotation || !isCustom) return
    if (!effectiveName.trim()) {
      alert(t("rotation.editor.pleaseEnterAName"))
      return
    }
    const persisted = saveCustomRotation({ ...activeRotation, name: effectiveName })
    setSaved(loadCustomRotations())
    onChange({ ...inputs, activeCustomRotation: persisted })
  }

  function handleSaveAs() {
    if (!activeRotation || !isCustom) return
    if (!effectiveName.trim()) {
      alert(t("rotation.editor.pleaseEnterAName"))
      return
    }
    const id = newRotationId()
    const persisted = saveCustomRotation({ ...activeRotation, id, name: effectiveName })
    setSaved(loadCustomRotations())
    onChange({ ...inputs, activeCustomRotation: persisted, selectedBuiltinRotationId: null })
  }

  async function handleDelete() {
    if (!activeRotation || !isCustom || !isPersisted) return
    if (!(await confirm(t("rotation.editor.deleteThisCustomRotation")))) return
    deleteCustomRotation(activeRotation.id)
    setSaved(loadCustomRotations())
    onChange({ ...inputs, activeCustomRotation: null })
  }

  function handleExport() {
    if (!activeRotation) return
    const text = exportCustomRotation(
      isCustom ? { ...activeRotation, name: effectiveName } : activeRotation,
    )
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const safeName = ((isCustom ? effectiveName : activeRotation.name) || "rotation").replace(
      /[^\w\-.]+/g,
      "_",
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${safeName}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const imported = importCustomRotation(text)
      const persisted = saveCustomRotation(imported)
      setSaved(loadCustomRotations())
      onChange({ ...inputs, activeCustomRotation: persisted, selectedBuiltinRotationId: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`${t("common.importFailed")}: ${msg}`)
    }
  }

  const steps = activeRotation?.steps ?? []

  return (
    <div className={styles.customRotationPanel}>
      <div className="toolbar">
        <span className="toolbar-label">{t("rotation.editor.rotationEditor")}</span>
        <Select
          className={styles.activeSelect + (isCustom ? ` ${styles.isActive}` : "")}
          ariaLabel={t("common.rotation")}
          value={selectedRotationValue}
          onChange={selectRotation}
          options={[
            ...options
              .filter((option) => option.group === "builtin")
              .map((option) => ({
                value: option.id,
                label:
                  (option.name ? t(rotationKey(option.id), option.name) : t("common.unnamed")) +
                  (option.isClassDefault ? t("rotation.editor.default") : ""),
                group: t("common.builtInRotations"),
              })),
            ...options
              .filter((option) => option.group === "custom")
              .map((option) => ({
                value: option.id,
                label: option.name ? t(rotationKey(option.id), option.name) : t("common.unnamed"),
                group: t("common.customRotation"),
              })),
          ]}
        />
        {selectedBuiltin?.description && (
          <span className={styles.builtinHint}>{selectedBuiltin.description}</span>
        )}
        <div className="spacer" />
        <button type="button" className="btn" onClick={handleNew}>
          + {t("common.new")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
      </div>

      {activeRotation && (
        <div className={styles.editor}>
          <div className={styles.meta}>
            <label className={styles.field}>
              <span>{t("rotation.editor.name")}</span>
              <TextInput
                value={isCustom ? effectiveName : activeRotation.name}
                placeholder={t("common.unnamed")}
                disabled={!isCustom}
                onChange={(e) =>
                  setNameDraft({ rotationId: activeRotationId, value: e.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>{t("rotation.editor.durationComputed")}</span>
              <span className={styles.durationDisplay}>{computedDurationSec.toFixed(2)} s</span>
            </label>
            <div className={styles.actions}>
              {isCustom ? (
                <>
                  <button type="button" className="btn primary" onClick={handleSave}>
                    {t("common.save")}
                  </button>
                  <button type="button" className="btn" onClick={handleSaveAs}>
                    {t("rotation.editor.saveAs")}
                  </button>
                  <button type="button" className="btn" onClick={handleExport}>
                    {t("common.export")}
                  </button>
                  <button type="button" className="btn" onClick={handleImportClick}>
                    {t("common.import")}
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={handleDelete}
                    disabled={!isPersisted}
                  >
                    {t("common.delete")}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn primary" onClick={forkToCustom}>
                    {t("rotation.editor.forkToCustom")}
                  </button>
                  <button type="button" className="btn" onClick={handleExport}>
                    {t("common.export")}
                  </button>
                  <button type="button" className="btn" onClick={handleImportClick}>
                    {t("common.import")}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.entries}>
            {steps.map((step, idx) => {
              const skill = skillsById.get(step.skillId)
              const maxHits = Math.max(1, skill?.hits.length ?? 1)
              const cast = castsByStepId.get(step.id) ?? castsByStepIndex.get(idx)
              const shownBuffs = cast ? visibleCastBuffs(cast.buffs, hiddenBuffIds, buffOrder) : []
              return (
                <div
                  key={step.id}
                  className={styles.entry + (isCustom ? "" : ` ${styles.entryReadonly}`)}
                >
                  <div className={styles.idx}>{idx + 1}</div>
                  <span className={styles.time}>
                    {cast ? `${Math.max(0, cast.timeSec).toFixed(2)}s` : "—"}
                  </span>
                  {isCustom ? (
                    <Combobox
                      value={step.skillId}
                      options={skillOpts}
                      onChange={(skillId) => {
                        const nextSkill = skillsById.get(skillId)
                        updateStep(idx, { skillId, hitCount: nextSkill?.hits.length ?? 1 })
                      }}
                      placeholder={t("rotation.editor.selectSkill")}
                    />
                  ) : (
                    <span className={styles.skillStatic}>
                      {skill ? t(skillKey(skill), skill.name) : step.skillId}
                    </span>
                  )}
                  <span className={styles.castReadonly}>
                    {maxHits} {t("common.hits")}
                  </span>
                  <span
                    className={styles.prepull}
                    title={t("rotation.editor.prePullExcludedFromDuration")}
                  >
                    {skill && isPrePullSkill(skill) ? t("common.prePull") : ""}
                  </span>
                  <div className={styles.buffsCell}>
                    {shownBuffs.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      shownBuffs.map((tag) => <CastBuffTagChip key={tag.id} tag={tag} />)
                    )}
                  </div>
                  {isCustom && (
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className="btn icon"
                        onClick={() => addStepAfter(idx)}
                        title={t("rotation.editor.addSkillAfterThisLine")}
                        aria-label="add after"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn icon"
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        aria-label="move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn icon"
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        aria-label="move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn icon danger"
                        onClick={() => removeStep(idx)}
                        aria-label="remove"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {steps.length === 0 && <div className={styles.entriesEmpty}>{t("common.none")}</div>}
          </div>

          {isCustom && (
            <button
              type="button"
              className={styles.add}
              onClick={addStep}
              disabled={classSkills.length === 0}
            >
              + {t("rotation.editor.addSkill")}
            </button>
          )}

          {isCustom ? (
            <div className={styles.permanentBuffs}>
              <span className={styles.permanentLabel}>
                {t("rotation.editor.permanentBuffsDebuffs")}
              </span>
              <BuffMultiSelect
                label={t("rotation.editor.permanentBuffs")}
                buffs={classBuffs}
                selected={activeRotation.permanentBuffIds}
                onChange={setPermanentBuffIds}
              />
              <BuffMultiSelect
                label={t("rotation.editor.permanentDebuffs")}
                buffs={classDebuffs}
                selected={activeRotation.permanentBuffIds}
                onChange={setPermanentBuffIds}
              />
            </div>
          ) : (
            activeRotation.permanentBuffIds.length > 0 && (
              <div className={styles.permanentBuffs}>
                <span className={styles.permanentLabel}>
                  {t("rotation.editor.permanentBuffsDebuffs")}
                </span>
                <span>
                  {activeRotation.permanentBuffIds
                    .map((id) =>
                      t(
                        [...classBuffs, ...classDebuffs].find((buff) => buff.id === id)?.name ?? id,
                      ),
                    )
                    .join(", ")}
                </span>
              </div>
            )
          )}

          {diagnostics.length > 0 && (
            <div className="warnings">
              {diagnostics.map((warning, index) => (
                <div key={index}>⚠ {warning}</div>
              ))}
            </div>
          )}
          <div className="hint">{t("rotation.editor.eachStepPicksHint")}</div>
        </div>
      )}
    </div>
  )
}

function BuffMultiSelect({
  label,
  buffs,
  selected,
  onChange,
}: {
  label: string
  buffs: readonly { id: string; name: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedSet = new Set(selected)
  const count = selected.length
  const toggle = (id: string) => {
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }
  return (
    <div className={styles.buffSelect}>
      <button type="button" className="btn" onClick={() => setOpen((prev) => !prev)}>
        {label}
        {count > 0 ? ` (${count})` : ""} ▾
      </button>
      {open && (
        <div className={styles.buffDropdown}>
          {buffs.length === 0 && <div className={styles.buffEmpty}>—</div>}
          {buffs.map((buff) => (
            <label key={buff.id} className={styles.buffOption}>
              <input
                type="checkbox"
                checked={selectedSet.has(buff.id)}
                onChange={() => toggle(buff.id)}
              />
              <span>{buff.name || "(unnamed)"}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
