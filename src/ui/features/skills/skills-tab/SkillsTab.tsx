import { useMemo, useRef, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import type { Skill, SkillHit, HitTrigger, HitVariant, TriggerKind } from "../../../../engine/skill"
import {
  makeSkill,
  makeHit,
  seedSkillFromBuiltin,
  triggerConditions,
} from "../../../../engine/skill"
import type { Buff, BuffStatEffect } from "../../../../engine/buff"
import type { Debuff } from "../../../../engine/debuff"
import { computeSkillPreview, type ArtPatch } from "../../../../engine/perSkillDamage"
import {
  builtinSkillsForClass,
  builtinDebuffsForClass,
  builtinBuffsForClass,
} from "../../../../engine/builtinLibrary"
import { getSchool } from "../../../../engine/panel"
import { innerWayName } from "../../../../definitions/innerWays/registry"
import {
  appliesForSkill,
  receivesForSkill,
  type AppliesRow,
  type ReceivesRow,
} from "../../../../engine/buffs/catalog"
import { STAT_DEF_BY_KEY } from "../../../../engine/statRegistry"
import {
  saveCustomSkill,
  deleteCustomSkill,
  exportCustomSkill,
  importCustomSkill,
} from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { NumInput, PercentInput } from "../../../components/number-inputs/NumberInputs"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { FPS } from "../../../../engine/timeline"
import { formatConditions, statusTooltip } from "../statusText"
import styles from "./SkillsTab.module.scss"

const WEAPONS = [
  "Sword",
  "Spear",
  "Fan",
  "Umbrella",
  "Modao",
  "Twin Blades",
  "Rope Dart",
  "Hengdao",
]
const SKILL_TYPES = ["weapon", "mindMethod", "mystic", "sustain", "Heavenwork"]
const MYSTIC_CATEGORIES = ["control", "burst", "area-debuff", "area-damage", "area"]
const ATTRIBUTES = ["", "Bellstrike", "Stonesplit", "Silkbind", "Bamboocut"]
const ATTUNEMENTS = [
  "bleed",
  "fanCharged",
  "fanQ",
  "fanSpecial",
  "moBladeCharge",
  "phalanxbaneCharged",
  "phalanxbaneQ",
  "ropeDartCharged",
  "ropeDartQ",
  "ropeDartSpecial",
  "snowpartingCharged",
  "snowpartingQ",
  "snowpartingVariedCombo",
  "spearCharged",
  "spearMartial",
  "spearQ",
  "spearSpecial",
  "swordCharged",
  "swordQ",
  "swordSpecial",
  "umbCharged",
  "umbQ",
  "umbrellaQ",
]

interface Props {
  inputs: Inputs
  engineInputs: Inputs
  customSkills: Skill[]
  onCustomSkillsChange(next: Skill[]): void
  customBuffs: Buff[]
  customDebuffs: Debuff[]
}

function fmtDmg(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return value >= 1000 ? Math.round(value).toLocaleString() : value.toFixed(2)
}

function effectsSummary(effects: BuffStatEffect[], t: (text: string) => string): string {
  return effects
    .filter((effect) => effect.amount !== 0)
    .map((effect) => {
      const def = STAT_DEF_BY_KEY[effect.statKey]
      const label = def ? t(def.label) : effect.statKey
      const sign = effect.amount >= 0 ? "+" : ""
      const value =
        def?.unit === "fraction"
          ? `${sign}${(effect.amount * 100).toFixed(0)}%`
          : `${sign}${effect.amount}`
      return `${label} ${value}`
    })
    .join(", ")
}

type TriggerDraft = HitTrigger & { hitScope: "all" | number }

function triggerSignature(tr: HitTrigger): string {
  return JSON.stringify({
    kind: tr.kind,
    targetId: tr.targetId,
    stacks: tr.stacks,
    condition: tr.condition,
    conditions: tr.conditions ?? [],
    extendFrames: tr.extendFrames,
    extendOnly: tr.extendOnly,
  })
}

function deriveTriggerDrafts(skill: Skill): TriggerDraft[] {
  if (skill.hits.length <= 1) {
    return (skill.hits[0]?.triggers ?? []).map((tr) => ({ ...tr, hitScope: "all" as const }))
  }
  const groups = new Map<string, { trig: HitTrigger; hitIdx: number }[]>()
  skill.hits.forEach((hit, hitIdx) => {
    for (const trig of hit.triggers) {
      const sig = triggerSignature(trig)
      const list = groups.get(sig)
      if (list) list.push({ trig, hitIdx })
      else groups.set(sig, [{ trig, hitIdx }])
    }
  })
  const drafts: TriggerDraft[] = []
  for (const occurrences of groups.values()) {
    if (occurrences.length === skill.hits.length) {
      drafts.push({ ...occurrences[0].trig, hitScope: "all" })
    } else {
      for (const occ of occurrences) drafts.push({ ...occ.trig, hitScope: occ.hitIdx })
    }
  }
  return drafts
}

function kindClass(kind: TriggerKind): string {
  if (kind === "applyBuff") return styles.isBuff
  if (kind === "applyDebuff" || kind === "applyDot") return styles.isDebuff
  return styles.isCast
}

function dotDisplayName(debuff: Debuff): string {
  return debuff.name.replace(/\s*Tick$/, "")
}

const INNER_WAY_DOT_TAG = "source:innerWayDot"

function typeBadge(skill: Skill, t: (text: string) => string): string {
  if (skill.tags?.includes(INNER_WAY_DOT_TAG)) return t("Inner Way - DoT")
  if (skill.skillType === "mystic") return t("Mystic Skill")
  if (skill.attributeAttack) return t(skill.attributeAttack)
  if (skill.skillType) return t(skill.skillType)
  return `${skill.hits.length} ${t("hits")}`
}

export function SkillsTab({
  inputs,
  engineInputs,
  customSkills,
  onCustomSkillsChange,
  customBuffs,
  customDebuffs,
}: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const classId = inputs.classId
  const fileRef = useRef<HTMLInputElement>(null)

  const classSkills = useMemo(
    () => customSkills.filter((skill) => skill.classId === classId),
    [customSkills, classId],
  )
  const classBuffs = useMemo(
    () => customBuffs.filter((buff) => buff.classId === classId),
    [customBuffs, classId],
  )
  const classDebuffs = useMemo(
    () => customDebuffs.filter((debuff) => debuff.classId === classId),
    [customDebuffs, classId],
  )

  const builtinSkills = useMemo(() => builtinSkillsForClass(classId), [classId])
  const builtinDebuffs = useMemo(() => builtinDebuffsForClass(classId), [classId])
  const builtinBuffs = useMemo(() => builtinBuffsForClass(classId), [classId])

  function effectiveTriggerKind(trig: HitTrigger): TriggerKind {
    const isBuffId = (id: string) =>
      classBuffs.some((buff) => buff.id === id) || builtinBuffs.some((buff) => buff.id === id)
    const isDebuffId = (id: string) =>
      classDebuffs.some((debuff) => debuff.id === id) ||
      builtinDebuffs.some((debuff) => debuff.id === id)
    if (trig.kind === "applyBuff" && !isBuffId(trig.targetId) && isDebuffId(trig.targetId)) {
      return "applyDebuff"
    }
    if (trig.kind === "applyDebuff" && !isDebuffId(trig.targetId) && isBuffId(trig.targetId)) {
      return "applyBuff"
    }
    return trig.kind
  }

  const [search, setSearch] = useState("")
  const searchLower = search.trim().toLowerCase()
  const filteredClassSkills = useMemo(
    () =>
      classSkills
        .filter((skill) => (skill.name || "").toLowerCase().includes(searchLower))
        .sort((skillA, skillB) => (skillA.name || "").localeCompare(skillB.name || "")),
    [classSkills, searchLower],
  )
  const filteredBuiltins = useMemo(
    () =>
      builtinSkills
        .filter((skill) => t(skill.name).toLowerCase().includes(searchLower))
        .sort((skillA, skillB) => t(skillA.name).localeCompare(t(skillB.name))),
    [builtinSkills, searchLower, t],
  )

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<Skill | null>(null)
  const [activeHitIndex, setActiveHitIndex] = useState(0)
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
  const [effectsOpen, setEffectsOpen] = useState(true)
  const [showInactiveReceives, setShowInactiveReceives] = useState(false)

  function loadDraft(skill: Skill) {
    const cloned: Skill = {
      ...skill,
      hits: skill.hits.map((hit) => ({
        ...hit,
        triggers: hit.triggers.map((trigger) => ({
          ...trigger,
          conditions: trigger.conditions
            ? trigger.conditions.map((condition) => ({ ...condition }))
            : undefined,
        })),
        variants: hit.variants?.map((variant) => ({
          ...variant,
          conditions: variant.conditions.map((condition) => ({ ...condition })),
        })),
      })),
    }
    setDraft(cloned)
    setActiveHitIndex(0)
    setActiveVariantId(null)
  }

  function selectSkill(skill: Skill) {
    setSelectedKey(`user:${skill.id}`)
    loadDraft(skill)
  }

  function createNew() {
    const newSkill = makeSkill(classId, { name: "" })
    setSelectedKey(`user:${newSkill.id}`)
    loadDraft(newSkill)
  }

  function seedFromBuiltin(skill: Skill) {
    const existing = classSkills.find((candidate) => candidate.id === skill.id)
    if (existing) {
      selectSkill(existing)
      return
    }
    const seeded = seedSkillFromBuiltin(classId, skill)
    setSelectedKey(`builtin:${skill.id}`)
    loadDraft(seeded)
  }

  function patchDraft(patch: Partial<Skill>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function patchHit(idx: number, patch: Partial<SkillHit>) {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = prev.hits.map((hit, hitIdx) => (hitIdx === idx ? { ...hit, ...patch } : hit))
      return { ...prev, hits }
    })
  }
  function patchHitVariant(hitIdx: number, variantId: string, patch: Partial<HitVariant>) {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = prev.hits.map((hit, idx) =>
        idx === hitIdx
          ? {
              ...hit,
              variants: (hit.variants ?? []).map((variant) =>
                variant.id === variantId ? { ...variant, ...patch } : variant,
              ),
            }
          : hit,
      )
      return { ...prev, hits }
    })
  }
  function addHit() {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = [
        ...prev.hits,
        makeHit({ frame: prev.hits.length > 0 ? prev.hits[prev.hits.length - 1].frame + 15 : 0 }),
      ]
      setActiveHitIndex(hits.length - 1)
      return { ...prev, hits }
    })
  }
  function removeHit(idx: number) {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = prev.hits.filter((_, hitIdx) => hitIdx !== idx)
      return { ...prev, hits: hits.length > 0 ? hits : [makeHit()] }
    })
    setActiveHitIndex((prev) => Math.max(0, prev > idx ? prev - 1 : prev === idx ? 0 : prev))
  }

  async function handleSave() {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      await confirm(t("Please enter a skill name first"))
      return
    }
    const normalized: Skill = { ...draft, name }
    const list = saveCustomSkill(normalized)
    onCustomSkillsChange(list)
    const saved = list.find((candidate) => candidate.id === draft.id)
    if (saved) {
      setSelectedKey(`user:${saved.id}`)
      loadDraft(saved)
    }
  }

  async function handleDelete() {
    if (!draft) return
    if (!classSkills.some((candidate) => candidate.id === draft.id)) {
      setDraft(null)
      setSelectedKey(null)
      return
    }
    if (!(await confirm(t("Delete this skill?")))) return
    const list = deleteCustomSkill(draft.id)
    onCustomSkillsChange(list)
    setDraft(null)
    setSelectedKey(null)
  }

  function handleReset() {
    if (!draft) return
    const existing = classSkills.find((candidate) => candidate.id === draft.id)
    if (existing) selectSkill(existing)
  }

  function handleExport() {
    if (!draft) return
    const blob = new Blob([exportCustomSkill(draft)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `skill-${draft.name || "custom"}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      const fresh = importCustomSkill(text, classId)
      const list = saveCustomSkill(fresh)
      onCustomSkillsChange(list)
      setSelectedKey(`user:${fresh.id}`)
      loadDraft(fresh)
    } catch (err) {
      await confirm(`${t("Import failed")}: ${(err as Error).message}`)
    }
  }

  const effectiveHitIndex = draft && activeHitIndex < draft.hits.length ? activeHitIndex : 0
  const effectiveHit = draft?.hits[effectiveHitIndex]
  const effectiveVariantId =
    activeVariantId && effectiveHit?.variants?.some((variant) => variant.id === activeVariantId)
      ? activeVariantId
      : null

  const preview = useMemo(() => {
    if (!draft || !draft.name.trim()) return null

    const hit = draft.hits[effectiveHitIndex]
    if (!hit) return null
    const variant = effectiveVariantId
      ? hit.variants?.find((candidate) => candidate.id === effectiveVariantId)
      : undefined
    const livePatch: ArtPatch = {
      name: draft.name.trim(),
      physMultiplier: variant ? variant.physMultiplier : hit.physMultiplier,
      physFixed: variant ? variant.physFixed : hit.physFixed,
      attributeMultiplier: variant ? variant.attributeMultiplier : hit.attributeMultiplier,
      attributeFixed: variant ? variant.attributeFixed : hit.attributeFixed,
      extraCritDamage: hit.extraCritDamage,
    }
    if (draft.skillType) livePatch.skillType = draft.skillType
    if (draft.weaponOrAttribute) livePatch.weaponOrAttribute = draft.weaponOrAttribute
    if (draft.attributeAttack) livePatch.attributeAttack = draft.attributeAttack
    const mysticFlag =
      (draft.tags ?? []).find((tag) => tag.startsWith("mystic:"))?.slice("mystic:".length) ?? ""
    if (mysticFlag) livePatch.mysticCategory = mysticFlag
    const computed = computeSkillPreview(draft.name.trim(), engineInputs, livePatch)
    if (!computed) return null
    if (draft.guaranteedNormal)
      return { ...computed, abrasion: 0, crit: { min: 0, max: 0 }, affinity: 0 }
    if (draft.guaranteedPrecision) return { ...computed, abrasion: 0 }
    return computed
  }, [draft, effectiveHitIndex, effectiveVariantId, engineInputs])

  const opts = (vals: string[], labelFn?: (value: string) => string): ComboboxOption[] =>
    vals.map((value) => ({
      value,
      label: value === "" ? t("None") : labelFn ? labelFn(value) : t(value),
    }))

  const adoptedBuiltinNames = useMemo(
    () => new Set(classSkills.map((skill) => skill.name)),
    [classSkills],
  )

  function resolveStatus(targetId: string): Buff | Debuff | undefined {
    return (
      classBuffs.find((buff) => buff.id === targetId) ??
      classDebuffs.find((debuff) => debuff.id === targetId) ??
      builtinBuffs.find((buff) => buff.id === targetId) ??
      builtinDebuffs.find((debuff) => debuff.id === targetId)
    )
  }
  function resolveSkillTarget(targetId: string): Skill | undefined {
    return (
      classSkills.find((skill) => skill.id === targetId) ??
      builtinSkills.find((skill) => skill.id === targetId)
    )
  }

  function conditionsClause(trigger: TriggerDraft): string {
    const conds = triggerConditions(trigger)
    if (conds.length === 0) return ""
    return `${t("when")} ${formatConditions(conds, (id) => resolveStatus(id)?.name)}`
  }

  function summarizeTriggerDraft(trigger: TriggerDraft): { label: string; effect: string } {
    const kind = effectiveTriggerKind(trigger)
    const gate = conditionsClause(trigger)
    if (kind === "applyDot") {
      const status = resolveStatus(trigger.targetId)
      if (!status || !("dot" in status) || !status.dot)
        return { label: t("Select a target…"), effect: "" }
      const name = dotDisplayName(status)
      const durationSec = (status.durationFrames / FPS).toFixed(1)
      let effect = `+1 ${t("stack")} (${t("max")} ${status.maxStacks}) · ${t("refreshes")} ${durationSec}s ${t("duration")}`
      const ladder = status.dot.perStackMultipliers
      if (ladder && ladder.length > 0) {
        effect += ` · ${t("per-tick damage")} ×${ladder.join(" / ×")} ${t("at")} ${ladder.map((_, index) => index + 1).join("/")} ${t("stacks")}`
      }
      if (gate) effect += ` · ${gate}`
      return { label: `${t("Applies")} ${name}`, effect }
    }
    if (kind === "detonateDot") {
      const status = resolveStatus(trigger.targetId)
      if (!status || !("dot" in status) || !status.detonation)
        return { label: t("Select a target…"), effect: "" }
      const det = status.detonation
      const name = dotDisplayName(status)
      const detonateSkill = resolveSkillTarget(det.skillId)
      const label = `${t("Causes")} ${detonateSkill?.name ?? name}`
      let effect = `${t("on reaching")} ${status.maxStacks} ${t("stacks: consumes them and auto-casts")} ${detonateSkill?.name ?? det.skillId}`
      if (det.retainParam) {
        const paramName = innerWayName(det.retainParam)
        const retained = det.retainParamStacks ?? det.retainStacks ?? 0
        effect += ` · ${t("retains")} ${retained} ${t("at")} ${paramName} ${t("tier")} ${det.retainMinTier ?? 6}`
      }
      if (gate) effect += ` · ${gate}`
      return { label, effect }
    }
    if (kind === "applyDebuff" || kind === "applyBuff") {
      const status = resolveStatus(trigger.targetId)
      if (!status) return { label: t("Select a target…"), effect: "" }
      const parts: string[] = []
      if ("dot" in status && status.dot) {
        parts.push(
          `${t("DoT")} · ${t("every")} ${(status.dot.tickIntervalFrames / FPS).toFixed(1)}s`,
        )
      }
      const eff = effectsSummary(status.effects, t)
      if (eff) parts.push(eff)
      parts.push(
        trigger.hitScope === "all" && (draft?.hits.length ?? 1) > 1
          ? `+${trigger.stacks} ${t("stacks/hit")}`
          : `+${trigger.stacks} ${t("stacks")}`,
      )
      if (gate) parts.push(gate)
      return { label: status.name || t("Unnamed"), effect: parts.join(" · ") }
    }
    const target = resolveSkillTarget(trigger.targetId)
    const label = target ? `${t("Casts")} ${target.name || t("Unnamed")}` : t("Select a target…")
    return { label, effect: gate }
  }

  const triggerRows = useMemo<TriggerDraft[]>(
    () => (draft ? deriveTriggerDrafts(draft) : []),
    [draft],
  )

  const appliesRows = useMemo<AppliesRow[]>(
    () => (draft ? appliesForSkill(draft, classId) : []),
    [draft, classId],
  )

  const receivesRows = useMemo<ReceivesRow[]>(
    () => (draft ? receivesForSkill(draft, classId, inputs) : []),
    [draft, classId, inputs],
  )
  const specMechanicRows = useMemo(
    () => receivesRows.filter((row) => row.isSpecMechanic),
    [receivesRows],
  )
  const buffReceiveRows = useMemo(
    () => receivesRows.filter((row) => !row.isSpecMechanic),
    [receivesRows],
  )
  const activeReceiveRows = useMemo(
    () => buffReceiveRows.filter((row) => row.active),
    [buffReceiveRows],
  )
  const inactiveReceiveRows = useMemo(
    () => buffReceiveRows.filter((row) => !row.active),
    [buffReceiveRows],
  )

  const flagsSummary = useMemo(() => {
    if (!draft) return ""
    const tags = draft.tags ?? []
    const parts: string[] = []
    const weaponTags = tags.filter((tag) => tag.startsWith("weapon:"))
    if (weaponTags.length > 0) {
      for (const tag of weaponTags) parts.push(`${tag.slice(7)} (${t("Weapon Type")})`)
    } else if (draft.weaponOrAttribute) {
      parts.push(`${draft.weaponOrAttribute} (${t("Weapon Type")})`)
    }
    for (const tag of tags) {
      if (tag.startsWith("weapon:")) continue
      if (tag.startsWith("attune:")) parts.push(`${t("Attunement")}: ${tag.slice(7)}`)
      else if (tag.startsWith("prop:") || tag.startsWith("mystic:") || tag.startsWith("attack:"))
        parts.push(tag)
    }
    return parts.join(" · ")
  }, [draft, t])

  const currentWeaponFlag =
    (draft?.tags ?? []).find((tag) => tag.startsWith("weapon:"))?.slice("weapon:".length) ?? ""
  const currentAttuneFlag =
    (draft?.tags ?? []).find((tag) => tag.startsWith("attune:"))?.slice("attune:".length) ?? ""
  const currentMysticFlag =
    (draft?.tags ?? []).find((tag) => tag.startsWith("mystic:"))?.slice("mystic:".length) ?? ""
  const otherTags = (draft?.tags ?? []).filter(
    (tag) => !tag.startsWith("weapon:") && !tag.startsWith("attune:") && !tag.startsWith("mystic:"),
  )

  function setWeaponFlag(weapon: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const rest = (prev.tags ?? []).filter((tag) => !tag.startsWith("weapon:"))
      return { ...prev, tags: weapon ? [...rest, `weapon:${weapon}`] : rest }
    })
  }
  function setAttuneFlag(attune: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const rest = (prev.tags ?? []).filter((tag) => !tag.startsWith("attune:"))
      return { ...prev, tags: attune ? [...rest, `attune:${attune}`] : rest }
    })
  }
  function setMysticFlag(category: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const rest = (prev.tags ?? []).filter((tag) => !tag.startsWith("mystic:"))
      return { ...prev, tags: category ? [...rest, `mystic:${category}`] : rest }
    })
  }

  const weaponFlagOptions = opts(
    currentWeaponFlag && !WEAPONS.includes(currentWeaponFlag)
      ? ["", ...WEAPONS, currentWeaponFlag]
      : ["", ...WEAPONS],
  )
  const attuneFlagOptions = opts(
    currentAttuneFlag && !ATTUNEMENTS.includes(currentAttuneFlag)
      ? ["", ...ATTUNEMENTS, currentAttuneFlag]
      : ["", ...ATTUNEMENTS],
  )
  const mysticFlagOptions = opts(
    currentMysticFlag && !MYSTIC_CATEGORIES.includes(currentMysticFlag)
      ? ["", ...MYSTIC_CATEGORIES, currentMysticFlag]
      : ["", ...MYSTIC_CATEGORIES],
  )

  return (
    <div className="panel">
      <div className={styles.skillsLayout}>
        <div className={styles.skillsListPanel}>
          <div className={styles.skillsListHead}>
            <h3>
              {t("Skill")} ({t(getSchool(classId).displayName)})
            </h3>
            <button type="button" className="save-btn" onClick={createNew}>
              {t("New Skill")}
            </button>
          </div>
          <input
            type="text"
            className={styles.skillsSearch}
            placeholder={t("Search skills…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className={styles.skillsList}>
            {filteredClassSkills.length > 0 && (
              <li className={styles.skillsListGroup}>{t("My Skills")}</li>
            )}
            {filteredClassSkills.map((skill) => (
              <li
                key={`user:${skill.id}`}
                className={
                  styles.skillsListItem +
                  (selectedKey === `user:${skill.id}` ? ` ${styles.active}` : "")
                }
                onClick={() => selectSkill(skill)}
              >
                <span className={styles.skillsListName}>{skill.name || t("Unnamed")}</span>
                <span className={`${styles.skillsTag} ${styles.isNew}`}>{typeBadge(skill, t)}</span>
              </li>
            ))}
            {filteredBuiltins.length > 0 && (
              <li className={styles.skillsListGroup}>{t("Built-in")}</li>
            )}
            {filteredBuiltins.map((skill) => (
              <li
                key={`builtin:${skill.id}`}
                className={
                  styles.skillsListItem +
                  (selectedKey === `builtin:${skill.id}` ? ` ${styles.active}` : "")
                }
                onClick={() => seedFromBuiltin(skill)}
              >
                <span className={styles.skillsListName}>{t(skill.name)}</span>
                {adoptedBuiltinNames.has(skill.name) ? (
                  <span className={`${styles.skillsTag} ${styles.isEdit}`}>{t("Adopted")}</span>
                ) : (
                  <span className={styles.skillsTag}>{typeBadge(skill, t)}</span>
                )}
              </li>
            ))}
            {filteredClassSkills.length === 0 && filteredBuiltins.length === 0 && (
              <li className={styles.skillsEmpty}>
                {searchLower
                  ? t("No skills match your search")
                  : t("No skills yet — click New Skill")}
              </li>
            )}
          </ul>
        </div>

        <div className={styles.skillsDetailPanel}>
          {!draft ? (
            <div className={styles.skillsEmpty}>
              {t("Select a skill on the left, or create one")}
            </div>
          ) : (
            <>
              <div className={styles.skillsPreview}>
                <div className={styles.skillsPreviewHead}>
                  {t("Damage Preview (per hit)")} — {t("Slot ")} {effectiveHitIndex + 1} {t("hits")}
                </div>
                <div className={styles.skillsPreviewGrid}>
                  <PreviewCard
                    label={t("Abrasion")}
                    valueClassName={styles.isZero}
                    value={preview ? fmtDmg(preview.abrasion) : "—"}
                  />
                  <PreviewCard
                    label={t("Normal")}
                    valueClassName=""
                    value={
                      preview
                        ? `${fmtDmg(preview.normal.min)} – ${fmtDmg(preview.normal.max)}`
                        : "—"
                    }
                  />
                  <PreviewCard
                    label={t("Crit")}
                    valueClassName={styles.isPositive}
                    value={
                      preview ? `${fmtDmg(preview.crit.min)} – ${fmtDmg(preview.crit.max)}` : "—"
                    }
                  />
                  <PreviewCard
                    label={t("Affinity")}
                    valueClassName={styles.isAffinity}
                    value={preview ? fmtDmg(preview.affinity) : "—"}
                  />
                </div>
              </div>

              <Section title={t("Skill")}>
                <Field label={t("Skill Name")}>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => patchDraft({ name: e.target.value })}
                  />
                </Field>
                <Field label={t("Breakdown Name")}>
                  <input
                    type="text"
                    value={draft.breakdownName ?? ""}
                    placeholder={draft.name}
                    onChange={(e) => patchDraft({ breakdownName: e.target.value })}
                  />
                </Field>
                <div className={styles.skillsHint}>
                  {t(
                    "The in-game skill name this reports under in the DPS breakdown. Every skill sharing one breakdown name is summed into a single row. Leave empty to use the skill name.",
                  )}
                </div>
                <Field label={t("Type")}>
                  <Combobox
                    className={styles.fieldCombobox}
                    value={draft.skillType}
                    options={opts(SKILL_TYPES)}
                    onChange={(value) => patchDraft({ skillType: value })}
                  />
                </Field>
                {draft.skillType === "sustain" && (
                  <div className={styles.skillsHint}>
                    {t(
                      "Type 'sustain' only tags sustain-damage scaling; it does not generate ticks. For a DoT, use a debuff with a DoT.",
                    )}
                  </div>
                )}
                <Field label={t("weapon")}>
                  <Combobox
                    className={styles.fieldCombobox}
                    value={draft.weaponOrAttribute}
                    options={opts(["", ...WEAPONS])}
                    onChange={(value) => patchDraft({ weaponOrAttribute: value })}
                  />
                </Field>
                <Field label={t("Stat")}>
                  <Combobox
                    className={styles.fieldCombobox}
                    value={draft.attributeAttack}
                    options={opts(ATTRIBUTES)}
                    onChange={(value) => patchDraft({ attributeAttack: value })}
                  />
                </Field>
                <Field
                  label={t("Cast Time")}
                  unit={`${t("frames")} (${(draft.castFrames / FPS).toFixed(2)}s)`}
                >
                  <NumInput
                    value={draft.castFrames}
                    onChange={(value) => patchDraft({ castFrames: value })}
                  />
                </Field>
                <label className={styles.skillsCheck}>
                  <input
                    type="checkbox"
                    checked={draft.triggerable}
                    onChange={(e) => patchDraft({ triggerable: e.target.checked })}
                  />
                  <span>{t("Triggerable")}</span>
                </label>
                <div className={styles.skillsHint}>
                  {t("Can be the target of a cast-skill trigger (e.g. an auto-proc)")}
                </div>
                <label className={styles.skillsCheck}>
                  <input
                    type="checkbox"
                    checked={draft.prePull ?? false}
                    onChange={(e) => patchDraft({ prePull: e.target.checked })}
                  />
                  <span>{t("Pre-pull Skill")}</span>
                </label>
                <div className={styles.skillsHint}>
                  {t(
                    'A pre-pull skill is cast before the pull — it lands at negative frames and is excluded from the rotation duration. Leave unchecked to auto-detect from a name containing "Prepull".',
                  )}
                </div>
                <label className={styles.skillsCheck}>
                  <input
                    type="checkbox"
                    checked={draft.guaranteedPrecision ?? false}
                    onChange={(e) => patchDraft({ guaranteedPrecision: e.target.checked })}
                  />
                  <span>{t("Guaranteed Precision")}</span>
                </label>
                <div className={styles.skillsHint}>
                  {t(
                    "Never abrades — precision counts as 100% for this skill (e.g. Dragon Head - Plus)",
                  )}
                </div>
                <label className={styles.skillsCheck}>
                  <input
                    type="checkbox"
                    checked={draft.guaranteedNormal ?? false}
                    onChange={(e) => patchDraft({ guaranteedNormal: e.target.checked })}
                  />
                  <span>{t("Fixed Damage")}</span>
                </label>
                <div className={styles.skillsHint}>
                  {t(
                    "Always deals the normal row — cannot trigger crit, affinity, or abrasion (e.g. Dragon Head)",
                  )}
                </div>
              </Section>

              <Section title={t("Hit Table")}>
                {draft.hits.map((hit, idx) => (
                  <div
                    key={hit.id}
                    className={
                      styles.skillsHit + (idx === effectiveHitIndex ? ` ${styles.active}` : "")
                    }
                    onClick={() => {
                      setActiveHitIndex(idx)
                      setActiveVariantId(null)
                    }}
                  >
                    <div className={styles.skillsHitHead}>
                      <span className={styles.skillsHitIndex}>#{idx + 1}</span>
                      <label className={styles.skillsHitFrame} title={t("Frame Offset")}>
                        <NumInput
                          value={hit.frame}
                          onChange={(value) => patchHit(idx, { frame: value })}
                        />
                        <span className={styles.skillsFieldUnit}>
                          {t("frames")} ({(hit.frame / FPS).toFixed(2)}s)
                        </span>
                      </label>
                      {draft.hits.length > 1 && (
                        <button
                          type="button"
                          className={`reset-btn ${styles.skillsHitDel}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeHit(idx)
                          }}
                        >
                          {t("Delete")}
                        </button>
                      )}
                    </div>
                    <div className={styles.skillsHitFields}>
                      <Field label={t("Phys Coeff")} unit="%">
                        <PercentInput
                          value={hit.physMultiplier}
                          onChange={(value) => patchHit(idx, { physMultiplier: value })}
                        />
                      </Field>
                      <Field label={t("Flat Phys")}>
                        <NumInput
                          value={hit.physFixed}
                          onChange={(value) => patchHit(idx, { physFixed: value })}
                        />
                      </Field>
                      <Field label={t("Attr Coeff")} unit="%">
                        <PercentInput
                          value={hit.attributeMultiplier}
                          onChange={(value) => patchHit(idx, { attributeMultiplier: value })}
                        />
                      </Field>
                      <Field label={t("Flat Attr")}>
                        <NumInput
                          value={hit.attributeFixed}
                          onChange={(value) => patchHit(idx, { attributeFixed: value })}
                        />
                      </Field>
                      <Field label={t("Crit Boost")} unit="%">
                        <PercentInput
                          value={hit.extraCritDamage}
                          onChange={(value) => patchHit(idx, { extraCritDamage: value })}
                        />
                      </Field>
                    </div>
                    {(hit.variants ?? []).map((variant) => {
                      const gateStatus = variant.conditions[0]
                        ? resolveStatus(variant.conditions[0].buffId)
                        : undefined
                      const isActive =
                        idx === effectiveHitIndex && effectiveVariantId === variant.id
                      return (
                        <div
                          key={variant.id}
                          className={
                            styles.skillsHitVariant + (isActive ? ` ${styles.active}` : "")
                          }
                          title={
                            `${gateStatus ? statusTooltip(gateStatus.name, gateStatus.durationFrames) : variant.label}` +
                            ` — ${t("replaces the base row above while active")}`
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveHitIndex(idx)
                            setActiveVariantId(variant.id)
                          }}
                        >
                          <div className={styles.skillsHitVariantHead}>
                            <span className={styles.skillsHitVariantName}>
                              {t("Variant")}: {variant.label}
                            </span>
                            <span className={styles.skillsHitVariantCond}>
                              {t("when")}{" "}
                              {formatConditions(
                                variant.conditions,
                                (id) => resolveStatus(id)?.name,
                              )}
                            </span>
                          </div>
                          <div className={styles.skillsHitFields}>
                            <Field label={t("Phys Coeff")} unit="%">
                              <PercentInput
                                value={variant.physMultiplier}
                                onChange={(value) =>
                                  patchHitVariant(idx, variant.id, { physMultiplier: value })
                                }
                              />
                            </Field>
                            <Field label={t("Flat Phys")}>
                              <NumInput
                                value={variant.physFixed}
                                onChange={(value) =>
                                  patchHitVariant(idx, variant.id, { physFixed: value })
                                }
                              />
                            </Field>
                            <Field label={t("Attr Coeff")} unit="%">
                              <PercentInput
                                value={variant.attributeMultiplier}
                                onChange={(value) =>
                                  patchHitVariant(idx, variant.id, { attributeMultiplier: value })
                                }
                              />
                            </Field>
                            <Field label={t("Flat Attr")}>
                              <NumInput
                                value={variant.attributeFixed}
                                onChange={(value) =>
                                  patchHitVariant(idx, variant.id, { attributeFixed: value })
                                }
                              />
                            </Field>
                          </div>
                          <div className={styles.skillsHint}>
                            {t("The base row above applies while no variant's condition holds")}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <button type="button" className={styles.skillsAddHit} onClick={addHit}>
                  + {t("Add Hit")}
                </button>
              </Section>

              <div className={`${styles.skillsSection} ${styles.skillsEffectsSection}`}>
                <button
                  type="button"
                  className={styles.skillsEffectsToggle}
                  onClick={() => setEffectsOpen((prev) => !prev)}
                >
                  <span className={styles.skillsSectionTitle}>{t("Effects")}</span>
                  <span className={styles.skillsEffectsCaret}>{effectsOpen ? "▾" : "▸"}</span>
                </button>
                <div className={styles.skillsHint}>
                  {t("Which buffs/debuffs/mechanics apply to this skill")}
                </div>
                {effectsOpen && (
                  <>
                    <div className={`${styles.skillsFields} ${styles.skillsEffectsTags}`}>
                      <Field label={t("Weapon Type")}>
                        <Combobox
                          className={styles.fieldCombobox}
                          value={currentWeaponFlag}
                          options={weaponFlagOptions}
                          onChange={setWeaponFlag}
                        />
                      </Field>
                      <Field label={t("Attunement")}>
                        <Combobox
                          className={styles.fieldCombobox}
                          value={currentAttuneFlag}
                          options={attuneFlagOptions}
                          onChange={setAttuneFlag}
                        />
                      </Field>
                      <Field label={t("Mystic Category")}>
                        <Combobox
                          className={styles.fieldCombobox}
                          value={currentMysticFlag}
                          options={mysticFlagOptions}
                          onChange={setMysticFlag}
                        />
                      </Field>
                      <div className={styles.skillsHint}>
                        {t("Optional flags used by site buff matching. All fields are optional.")}
                      </div>
                      {otherTags.length > 0 && (
                        <Field label={t("Other Tags")}>
                          <div className={styles.skillsChips}>
                            {otherTags.map((tag) => (
                              <span
                                className={`${styles.skillsChip} ${styles.isReadonly}`}
                                key={tag}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </Field>
                      )}
                      <div className={`${styles.skillsHint} ${styles.skillsEffectsFlags}`}>
                        <strong>{t("Skill Flags")}:</strong>
                        {flagsSummary || "—"}
                      </div>
                    </div>

                    <div className={styles.skillsEffects}>
                      <div className={styles.skillsEffectsCol}>
                        <div className={styles.skillsEffectsColHead}>
                          {t("Triggers (this skill applies)")}
                        </div>
                        {triggerRows.length === 0 ? (
                          <div className={styles.skillsEffectsEmpty}>—</div>
                        ) : (
                          triggerRows.map((trigger) => {
                            const effKind = effectiveTriggerKind(trigger)
                            const summary = summarizeTriggerDraft(trigger)
                            const scopeNote =
                              typeof trigger.hitScope === "number" && draft.hits.length > 1
                                ? ` · ${t("hit")} #${trigger.hitScope + 1}`
                                : ""
                            const targetStatus =
                              effKind === "castSkill" ? undefined : resolveStatus(trigger.targetId)
                            const tooltip =
                              effKind === "castSkill"
                                ? resolveSkillTarget(trigger.targetId)
                                  ? statusTooltip(resolveSkillTarget(trigger.targetId)!.name)
                                  : undefined
                                : targetStatus
                                  ? statusTooltip(targetStatus.name, targetStatus.durationFrames)
                                  : undefined
                            return (
                              <div
                                className={`${styles.skillsEffectsRow} ${kindClass(effKind)}`}
                                key={trigger.id}
                                title={tooltip}
                              >
                                <span className={styles.skillsEffectsRowName}>{summary.label}</span>
                                {(summary.effect || scopeNote) && (
                                  <span className={styles.skillsEffectsRowDetail}>
                                    {summary.effect}
                                    {scopeNote}
                                  </span>
                                )}
                              </div>
                            )
                          })
                        )}
                        {appliesRows.length > 0 && (
                          <>
                            <div className={styles.skillsEffectsSubhead}>
                              {t("Site buffs this skill applies")}
                            </div>
                            {appliesRows.map((row) => (
                              <div
                                className={`${styles.skillsEffectsRow} ${styles.isSite}`}
                                key={`site:${row.id}`}
                              >
                                <span className={styles.skillsEffectsRowName}>{row.name}</span>
                                {row.effect && (
                                  <span className={styles.skillsEffectsRowDetail}>
                                    {row.effect}
                                  </span>
                                )}
                                {row.requires && (
                                  <span className={styles.skillsEffectsRowRequires}>
                                    ({t("requires")} {row.requires})
                                  </span>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className={styles.skillsEffectsCol}>
                        <div className={styles.skillsEffectsColHead}>
                          {t("Receives (buffs affecting this skill)")}
                        </div>
                        {activeReceiveRows.length === 0 && inactiveReceiveRows.length === 0 ? (
                          <div className={styles.skillsEffectsEmpty}>—</div>
                        ) : (
                          <>
                            {activeReceiveRows.map((row) => (
                              <div
                                className={`${styles.skillsEffectsRow} ${styles.isSite}`}
                                key={row.id}
                              >
                                <span className={styles.skillsEffectsRowName}>{row.name}</span>
                                {row.effect && (
                                  <span className={styles.skillsEffectsRowDetail}>
                                    {row.effect}
                                  </span>
                                )}
                                {row.triggeredBy && (
                                  <span className={styles.skillsEffectsRowTriggered}>
                                    ({row.triggeredBy})
                                  </span>
                                )}
                              </div>
                            ))}
                            {inactiveReceiveRows.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  className={styles.skillsEffectsMore}
                                  onClick={() => setShowInactiveReceives((prev) => !prev)}
                                >
                                  {t("Not in your current build")} ({inactiveReceiveRows.length})
                                </button>
                                {showInactiveReceives &&
                                  inactiveReceiveRows.map((row) => (
                                    <div
                                      className={`${styles.skillsEffectsRow} ${styles.isSite} ${styles.isOff}`}
                                      key={row.id}
                                    >
                                      <span className={styles.skillsEffectsRowName}>
                                        {row.name}
                                      </span>
                                      {row.effect && (
                                        <span className={styles.skillsEffectsRowDetail}>
                                          {row.effect}
                                        </span>
                                      )}
                                      {row.requires && (
                                        <span className={styles.skillsEffectsRowRequires}>
                                          ({t("requires")} {row.requires})
                                        </span>
                                      )}
                                      {row.triggeredBy && (
                                        <span className={styles.skillsEffectsRowTriggered}>
                                          ({row.triggeredBy})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <div className={styles.skillsEffectsCol}>
                        <div className={styles.skillsEffectsColHead}>{t("Spec Mechanics")}</div>
                        {specMechanicRows.length === 0 ? (
                          <div className={styles.skillsEffectsEmpty}>—</div>
                        ) : (
                          specMechanicRows.map((row) => (
                            <div
                              className={`${styles.skillsEffectsRow} ${styles.isSpec}`}
                              key={row.id}
                            >
                              <span className={styles.skillsEffectsRowName}>{row.name}</span>
                              {row.effect && (
                                <span className={styles.skillsEffectsRowDetail}>{row.effect}</span>
                              )}
                              {!row.active && row.requires && (
                                <span className={styles.skillsEffectsRowRequires}>
                                  ({t("requires")} {row.requires})
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.skillsActions}>
                <button type="button" className="save-btn" onClick={handleSave}>
                  {t("Save")}
                </button>
                <button type="button" className="reset-btn" onClick={handleReset}>
                  {t("Reset")}
                </button>
                <button type="button" className="reset-btn" onClick={handleDelete}>
                  {t("Delete")}
                </button>
                <button type="button" className="reset-btn" onClick={handleExport}>
                  {t("Export")}
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  {t("Import")}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleImportFile(file)
                    e.target.value = ""
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName: string
}) {
  return (
    <div className={styles.skillsPreviewCard}>
      <div className={styles.skillsPreviewLabel}>{label}</div>
      <div className={`${styles.skillsPreviewValue} ${valueClassName}`}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.skillsSection}>
      <div className={styles.skillsSectionTitle}>{title}</div>
      <div className={styles.skillsFields}>{children}</div>
    </div>
  )
}

function Field({
  label,
  unit,
  children,
}: {
  label: string
  unit?: string
  children: React.ReactNode
}) {
  return (
    <label className={styles.skillsField}>
      <span className={styles.skillsFieldLabel}>{label}</span>
      <span className={styles.skillsFieldInput}>
        {children}
        {unit && <span className={styles.skillsFieldUnit}>{unit}</span>}
      </span>
    </label>
  )
}
