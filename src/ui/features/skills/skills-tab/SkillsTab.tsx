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
import { catalogBuffDefs } from "../../../../engine/buffs/data"
import type { BuffModule } from "../../../../engine/buffs/buffModule"
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
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { FPS } from "../../../../engine/timeline"
import { dotTicksPerWindow, tickSourceSkillId } from "../../../../engine/dot"
import { formatConditions } from "../statusText"
import { TextInput } from "../../../components/text-input/TextInput"
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
  "umbFrequentProjectile",
  "umbLightHeavyVariedCombo",
  "umbQ",
  "umbrellaQ",
]

type HitNumericField = "physMultiplier" | "physFixed" | "attributeMultiplier" | "attributeFixed"

const HIT_NUMERIC_COLUMNS: { field: HitNumericField; isPercent: boolean; label: string }[] = [
  { field: "physMultiplier", isPercent: true, label: "Phys %" },
  { field: "physFixed", isPercent: false, label: "Flat Phys" },
  { field: "attributeMultiplier", isPercent: true, label: "Attr %" },
  { field: "attributeFixed", isPercent: false, label: "Flat Attr" },
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

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(
          Object.keys(val as Record<string, unknown>)
            .sort()
            .map((key) => [key, (val as Record<string, unknown>)[key]]),
        )
      : val,
  )
}

function skillsEqual(a: Skill, b: Skill): boolean {
  return stableStringify(a) === stableStringify(b)
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

function declaresOwnReach(module: BuffModule): boolean {
  return !module.affectsAll
}

function buffAddOptions(
  picked: readonly string[] | undefined,
  modules: readonly BuffModule[],
): ComboboxOption[] {
  const pickedIds = new Set(picked ?? [])
  return modules
    .filter((module) => !pickedIds.has(module.id))
    .map((module) => ({ value: module.id, label: module.name }))
    .sort((optionA, optionB) => optionA.label.localeCompare(optionB.label))
}

const INNER_WAY_DOT_TAG = "source:innerWayDot"

function typeBadge(skill: Skill, t: (text: string) => string): string {
  if (skill.tags?.includes(INNER_WAY_DOT_TAG)) return t("Inner Way - DoT")
  if (skill.skillType === "mystic") return t("Mystic Skill")
  if (skill.attributeAttack) return t(skill.attributeAttack)
  if (skill.skillType) return t(skill.skillType)
  return `${skill.hits.length} ${t("hits")}`
}

function typePillText(skill: Skill, t: (text: string) => string): string {
  return [skill.skillType, skill.weaponOrAttribute, skill.attributeAttack]
    .filter(Boolean)
    .map((value) => t(value))
    .join(" · ")
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
  const [loadedSnapshot, setLoadedSnapshot] = useState<Skill | null>(null)
  const [activeHitTab, setActiveHitTab] = useState<string>("normal")
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
    setLoadedSnapshot(cloned)
    setActiveHitTab("normal")
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

  if (!draft) {
    const firstListedSkill = filteredClassSkills[0] ?? filteredBuiltins[0]
    if (firstListedSkill) {
      if (filteredClassSkills[0]) selectSkill(firstListedSkill)
      else seedFromBuiltin(firstListedSkill)
    }
  }

  function patchDraft(patch: Partial<Skill>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function addReceivesBuff(buffId: string) {
    if (!buffId) return
    setDraft((prev) => {
      if (!prev || prev.receives?.includes(buffId)) return prev
      return { ...prev, receives: [...(prev.receives ?? []), buffId] }
    })
  }
  function removeReceivesBuff(buffId: string) {
    setDraft((prev) =>
      prev ? { ...prev, receives: (prev.receives ?? []).filter((id) => id !== buffId) } : prev,
    )
  }
  function addTriggersBuff(buffId: string) {
    if (!buffId) return
    setDraft((prev) => {
      if (!prev || prev.triggersBuffs?.includes(buffId)) return prev
      return { ...prev, triggersBuffs: [...(prev.triggersBuffs ?? []), buffId] }
    })
  }
  function removeTriggersBuff(buffId: string) {
    setDraft((prev) =>
      prev
        ? { ...prev, triggersBuffs: (prev.triggersBuffs ?? []).filter((id) => id !== buffId) }
        : prev,
    )
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
  function patchHitField(idx: number, field: HitNumericField, value: number) {
    patchHit(idx, { [field]: value } as Partial<SkillHit>)
  }
  function patchVariantField(
    idx: number,
    variantId: string,
    field: HitNumericField,
    value: number,
  ) {
    patchHitVariant(idx, variantId, { [field]: value } as Partial<HitVariant>)
  }
  function addHit() {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = [
        ...prev.hits,
        makeHit({ frame: prev.hits.length > 0 ? prev.hits[prev.hits.length - 1].frame + 15 : 0 }),
      ]
      return { ...prev, hits }
    })
  }
  function removeHit(idx: number) {
    setDraft((prev) => {
      if (!prev) return prev
      const hits = prev.hits.filter((_, hitIdx) => hitIdx !== idx)
      return { ...prev, hits: hits.length > 0 ? hits : [makeHit()] }
    })
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

  // A tick source authors ONE hit: the shape. How often it lands and how many
  // times belong to the debuff that ticks from it, so the count is read back
  // from there rather than restated as extra hits nothing fires.
  const tickSourceNote = useMemo(() => {
    if (!draft) return null
    const ticksFrom = (debuff: Debuff) =>
      debuff.dot != null && tickSourceSkillId(debuff) === draft.id
    // A user copy shadows the built-in it was seeded from, so it is asked first.
    const owner = classDebuffs.find(ticksFrom) ?? builtinDebuffs.find(ticksFrom)
    if (!owner?.dot) return null
    const ticks = dotTicksPerWindow(owner)
    if (ticks <= 1) return null
    return { ticks, everySec: owner.dot.tickIntervalFrames / FPS, debuffName: owner.name }
  }, [draft, classDebuffs, builtinDebuffs])

  const isDirty = draft != null && loadedSnapshot != null && !skillsEqual(draft, loadedSnapshot)

  const preview = useMemo(() => {
    if (!draft || !draft.name.trim()) return null
    const name = draft.name.trim()
    const mysticFlag =
      (draft.tags ?? []).find((tag) => tag.startsWith("mystic:"))?.slice("mystic:".length) ?? ""
    const basePatch: ArtPatch = {}
    if (draft.skillType) basePatch.skillType = draft.skillType
    if (draft.weaponOrAttribute) basePatch.weaponOrAttribute = draft.weaponOrAttribute
    if (draft.attributeAttack) basePatch.attributeAttack = draft.attributeAttack
    if (mysticFlag) basePatch.mysticCategory = mysticFlag

    let abrasion = 0
    let normalMin = 0
    let normalMax = 0
    let critMin = 0
    let critMax = 0
    let affinity = 0
    for (const hit of draft.hits) {
      const computed = computeSkillPreview(name, engineInputs, {
        ...basePatch,
        physMultiplier: hit.physMultiplier,
        physFixed: hit.physFixed,
        attributeMultiplier: hit.attributeMultiplier,
        attributeFixed: hit.attributeFixed,
        extraCritDamage: hit.extraCritDamage,
      })
      if (!computed) return null
      abrasion += computed.abrasion
      normalMin += computed.normal.min
      normalMax += computed.normal.max
      critMin += computed.crit.min
      critMax += computed.crit.max
      affinity += computed.affinity
    }
    const summed = {
      abrasion,
      normal: { min: normalMin, max: normalMax },
      crit: { min: critMin, max: critMax },
      affinity,
    }
    if (draft.guaranteedNormal)
      return { ...summed, abrasion: 0, crit: { min: 0, max: 0 }, affinity: 0 }
    if (draft.guaranteedPrecision) return { ...summed, abrasion: 0 }
    return summed
  }, [draft, engineInputs])

  const opts = (vals: string[], labelFn?: (value: string) => string): ComboboxOption[] =>
    vals.map((value) => ({
      value,
      label: value === "" ? t("None") : labelFn ? labelFn(value) : t(value),
    }))

  const adoptedBuiltinIds = useMemo(
    () => new Set(classSkills.map((skill) => skill.id)),
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

  const reachableBuffModules = useMemo(() => catalogBuffDefs(classId), [classId])
  const receivableBuffModules = useMemo(
    () => reachableBuffModules.filter(declaresOwnReach),
    [reachableBuffModules],
  )
  const receivesAddOptions = useMemo(
    () => buffAddOptions(draft?.receives, receivableBuffModules),
    [draft?.receives, receivableBuffModules],
  )
  const triggersAddOptions = useMemo(
    () => buffAddOptions(draft?.triggersBuffs, reachableBuffModules),
    [draft?.triggersBuffs, reachableBuffModules],
  )

  const appliesRows = useMemo<AppliesRow[]>(
    () => (draft ? appliesForSkill(draft, classId) : []),
    [draft, classId],
  )

  const receivesRows = useMemo<ReceivesRow[]>(
    () => (draft ? receivesForSkill(draft, classId, engineInputs) : []),
    [draft, classId, engineInputs],
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

  const readonlyTagHints = (draft?.tags ?? []).filter(
    (tag) => tag.startsWith("weapon:") || tag.startsWith("prop:") || tag.startsWith("attack:"),
  )

  const currentAttuneFlag =
    (draft?.tags ?? []).find((tag) => tag.startsWith("attune:"))?.slice("attune:".length) ?? ""
  const currentMysticFlag =
    (draft?.tags ?? []).find((tag) => tag.startsWith("mystic:"))?.slice("mystic:".length) ?? ""

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

  const variantLabels = useMemo(() => {
    if (!draft) return []
    const labels: string[] = []
    for (const hit of draft.hits) {
      for (const variant of hit.variants ?? []) {
        if (!labels.includes(variant.label)) labels.push(variant.label)
      }
    }
    return labels
  }, [draft])

  const effectiveHitTab =
    draft && (activeHitTab === "normal" || variantLabels.includes(activeHitTab))
      ? activeHitTab
      : "normal"
  const isNormalTab = effectiveHitTab === "normal"

  interface HitRowData {
    hit: SkillHit
    variant?: HitVariant
    dimmed: boolean
  }
  const hitRows: HitRowData[] = (draft?.hits ?? []).map((hit) => {
    if (isNormalTab) return { hit, dimmed: false }
    const variant = (hit.variants ?? []).find((candidate) => candidate.label === effectiveHitTab)
    return { hit, variant, dimmed: !variant }
  })

  function variantConditionTexts(label: string): string[] {
    if (!draft) return []
    const texts = new Set<string>()
    for (const hit of draft.hits) {
      const variant = (hit.variants ?? []).find((candidate) => candidate.label === label)
      if (variant) texts.add(formatConditions(variant.conditions, (id) => resolveStatus(id)?.name))
    }
    return Array.from(texts)
  }

  function renderHitFieldCell(
    row: HitRowData,
    idx: number,
    field: HitNumericField,
    isPercent: boolean,
  ) {
    const InputComponent = isPercent ? PercentInput : NumInput
    if (isNormalTab) {
      return (
        <InputComponent
          className={styles.cellInput}
          value={row.hit[field]}
          onChange={(value) => patchHitField(idx, field, value)}
        />
      )
    }
    if (row.variant) {
      const variant = row.variant
      const changed = variant[field] !== row.hit[field]
      return (
        <InputComponent
          className={styles.cellInput + (changed ? ` ${styles.changedValue}` : "")}
          value={variant[field]}
          onChange={(value) => patchVariantField(idx, variant.id, field, value)}
        />
      )
    }
    const value = row.hit[field]
    const formatted = isPercent ? `${+(value * 100).toFixed(2)}%` : `${+value.toFixed(2)}`
    return <span className={styles.cellReadonly}>{formatted}</span>
  }

  return (
    <div className={styles.skillsLayout}>
      <div className={styles.listPanel}>
        <div className={styles.listTop}>
          <div className={styles.listHead}>
            <h3>
              {t("Skill")} ({t(getSchool(classId).displayName)})
            </h3>
            <button type="button" className="save-btn" onClick={createNew}>
              {t("New Skill")}
            </button>
          </div>
          <TextInput
            placeholder={t("Search skills…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.listScroll}>
          <ul className={styles.listCard}>
            {filteredClassSkills.length > 0 && (
              <li className={styles.listGroup}>{t("My Skills")}</li>
            )}
            {filteredClassSkills.map((skill) => (
              <li
                key={`user:${skill.id}`}
                className={
                  styles.listItem + (selectedKey === `user:${skill.id}` ? ` ${styles.active}` : "")
                }
                onClick={() => selectSkill(skill)}
              >
                <span className={styles.listItemName}>{skill.name || t("Unnamed")}</span>
                <span className={`${styles.tag} ${styles.tagAccent}`}>{typeBadge(skill, t)}</span>
              </li>
            ))}
            {filteredBuiltins.length > 0 && <li className={styles.listGroup}>{t("Built-in")}</li>}
            {filteredBuiltins.map((skill) => (
              <li
                key={`builtin:${skill.id}`}
                className={
                  styles.listItem +
                  (selectedKey === `builtin:${skill.id}` ? ` ${styles.active}` : "")
                }
                onClick={() => seedFromBuiltin(skill)}
              >
                <span className={styles.listItemName}>{t(skill.name)}</span>
                {adoptedBuiltinIds.has(skill.id) ? (
                  <span className={`${styles.tag} ${styles.tagPositive}`}>{t("Adopted")}</span>
                ) : (
                  <span className={styles.tag}>{typeBadge(skill, t)}</span>
                )}
              </li>
            ))}
            {filteredClassSkills.length === 0 && filteredBuiltins.length === 0 && (
              <li className={styles.empty}>
                {searchLower
                  ? t("No skills match your search")
                  : t("No skills yet — click New Skill")}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={styles.detailPanel}>
        {!draft ? (
          <div className={styles.empty}>{t("Select a skill on the left, or create one")}</div>
        ) : (
          <>
            <div className={styles.detailHeadWrap}>
              <div className={styles.detailHead}>
                <TextInput
                  className={styles.nameInput}
                  value={draft.name}
                  onChange={(e) => patchDraft({ name: e.target.value })}
                />
                <span className={styles.typeBadge}>{typePillText(draft, t)}</span>
                <span className={styles.grow} />
                {isDirty && <span className={styles.dirtyDot}>● {t("unsaved")}</span>}
                <button
                  type="button"
                  className={"save-btn" + (isDirty ? " dirty" : "")}
                  disabled={!isDirty}
                  onClick={handleSave}
                >
                  {t("Save")}
                </button>
                <button type="button" className="reset-btn" onClick={handleReset}>
                  {t("Reset")}
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
                <button type="button" className="reset-btn" onClick={handleDelete}>
                  {t("Delete")}
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
            </div>

            <div className={styles.detail}>
              <div className={styles.previewStrip}>
                <div className={`${styles.previewCell} ${styles.previewCellCtx}`}>
                  <span className={styles.previewLabel}>{t("Damage Preview")}</span>
                  <span className={styles.previewValue}>{t("per cast")}</span>
                </div>
                <div className={styles.previewCell}>
                  <span className={styles.previewLabel}>{t("Abrasion")}</span>
                  <span className={`${styles.previewValue} ${styles.dimmedValue}`}>
                    {preview ? fmtDmg(preview.abrasion) : "—"}
                  </span>
                </div>
                <div className={styles.previewCell}>
                  <span className={styles.previewLabel}>{t("Normal")}</span>
                  <span className={styles.previewValue}>
                    {preview
                      ? `${fmtDmg(preview.normal.min)} – ${fmtDmg(preview.normal.max)}`
                      : "—"}
                  </span>
                </div>
                <div className={styles.previewCell}>
                  <span className={styles.previewLabel}>{t("Crit")}</span>
                  <span className={`${styles.previewValue} ${styles.critValue}`}>
                    {preview ? `${fmtDmg(preview.crit.min)} – ${fmtDmg(preview.crit.max)}` : "—"}
                  </span>
                </div>
                <div className={styles.previewCell}>
                  <span className={styles.previewLabel}>{t("Affinity")}</span>
                  <span className={`${styles.previewValue} ${styles.affinityValue}`}>
                    {preview ? fmtDmg(preview.affinity) : "—"}
                  </span>
                </div>
                <div className={styles.previewCell}>
                  <span className={styles.previewLabel}>{t("Hits")}</span>
                  <span className={styles.previewValue}>
                    × {tickSourceNote ? tickSourceNote.ticks : draft.hits.length}
                  </span>
                </div>
              </div>

              <div className={styles.bodyCols}>
                <div className={styles.card}>
                  <h4 className={styles.cardHead}>{t("Skill")}</h4>
                  <PropRow
                    label={t("Breakdown Name")}
                    help={t(
                      "The in-game skill name this reports under in the DPS breakdown. Every skill sharing one breakdown name is summed into a single row. Leave empty to use the skill name.",
                    )}
                  >
                    <TextInput
                      value={draft.breakdownName ?? ""}
                      placeholder={draft.name}
                      onChange={(e) => patchDraft({ breakdownName: e.target.value })}
                    />
                  </PropRow>
                  <PropRow
                    label={t("Type")}
                    help={
                      draft.skillType === "sustain"
                        ? t(
                            "Type 'sustain' only tags sustain-damage scaling; it does not generate ticks. For a DoT, use a debuff with a DoT.",
                          )
                        : undefined
                    }
                  >
                    <Combobox
                      className={styles.fieldCombobox}
                      value={draft.skillType}
                      options={opts(SKILL_TYPES)}
                      onChange={(value) => patchDraft({ skillType: value })}
                    />
                  </PropRow>
                  <PropRow label={t("Weapon")}>
                    <Combobox
                      className={styles.fieldCombobox}
                      value={draft.weaponOrAttribute}
                      options={opts(["", ...WEAPONS])}
                      onChange={(value) => patchDraft({ weaponOrAttribute: value })}
                    />
                  </PropRow>
                  <PropRow label={t("Stat")}>
                    <Combobox
                      className={styles.fieldCombobox}
                      value={draft.attributeAttack}
                      options={opts(ATTRIBUTES)}
                      onChange={(value) => patchDraft({ attributeAttack: value })}
                    />
                  </PropRow>
                  <PropRow
                    label={t("Attunement")}
                    help={t(
                      "Feeds gear-boost matching — which attunement affixes reach this skill",
                    )}
                  >
                    <Combobox
                      className={styles.fieldCombobox}
                      value={currentAttuneFlag}
                      options={attuneFlagOptions}
                      onChange={setAttuneFlag}
                    />
                  </PropRow>
                  <PropRow
                    label={t("Cast Time")}
                    unit={`${t("frames")} · ${(draft.castFrames / FPS).toFixed(2)}s`}
                  >
                    <NumInput
                      className={styles.castField}
                      value={draft.castFrames}
                      onChange={(value) => patchDraft({ castFrames: value })}
                    />
                  </PropRow>
                  {draft.skillType === "mystic" && (
                    <PropRow label={t("Mystic Category")}>
                      <Combobox
                        className={styles.fieldCombobox}
                        value={currentMysticFlag}
                        options={mysticFlagOptions}
                        onChange={setMysticFlag}
                      />
                    </PropRow>
                  )}
                  <div className={styles.pills}>
                    <button
                      type="button"
                      className={styles.pill + (draft.triggerable ? ` ${styles.on}` : "")}
                      title={t("Can be the target of a cast-skill trigger (e.g. an auto-proc)")}
                      onClick={() => patchDraft({ triggerable: !draft.triggerable })}
                    >
                      {t("Triggerable")}
                    </button>
                    <button
                      type="button"
                      className={styles.pill + (draft.prePull ? ` ${styles.on}` : "")}
                      title={t(
                        'A pre-pull skill is cast before the pull — it lands at negative frames and is excluded from the rotation duration. Leave unchecked to auto-detect from a name containing "Prepull".',
                      )}
                      onClick={() => patchDraft({ prePull: !(draft.prePull ?? false) })}
                    >
                      {t("Pre-pull")}
                    </button>
                    <button
                      type="button"
                      className={styles.pill + (draft.guaranteedPrecision ? ` ${styles.on}` : "")}
                      title={t(
                        "Never abrades — precision counts as 100% for this skill (e.g. Dragon Head - Plus)",
                      )}
                      onClick={() =>
                        patchDraft({ guaranteedPrecision: !(draft.guaranteedPrecision ?? false) })
                      }
                    >
                      {t("Guaranteed Precision")}
                    </button>
                    <button
                      type="button"
                      className={styles.pill + (draft.guaranteedNormal ? ` ${styles.on}` : "")}
                      title={t(
                        "Always deals the normal row — cannot trigger crit, affinity, or abrasion (e.g. Dragon Head)",
                      )}
                      onClick={() =>
                        patchDraft({ guaranteedNormal: !(draft.guaranteedNormal ?? false) })
                      }
                    >
                      {t("Fixed Damage")}
                    </button>
                  </div>
                  {readonlyTagHints.length > 0 && (
                    <div className={styles.tagHint}>
                      {t("Tags")}: {readonlyTagHints.join(", ")}
                    </div>
                  )}
                </div>

                <div className={styles.card}>
                  <h4 className={styles.cardHead}>{t("Hit Table")}</h4>
                  {variantLabels.length > 0 && (
                    <SubTabs
                      tabs={[
                        { key: "normal", label: t("Normal") },
                        ...variantLabels.map((label) => ({ key: label, label })),
                      ]}
                      active={effectiveHitTab}
                      onSelect={setActiveHitTab}
                    />
                  )}
                  {!isNormalTab &&
                    variantConditionTexts(effectiveHitTab).map((text) => (
                      <div key={text} className={styles.variantBanner}>
                        {t("Active when")} <b>{text}</b> —{" "}
                        {t("these rows replace the Normal rows while the condition holds")}
                      </div>
                    ))}
                  <div className={styles.hitTableWrap}>
                    <table className={styles.hitTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t("Frame")}</th>
                          {HIT_NUMERIC_COLUMNS.map(({ field, label }) => (
                            <th key={field}>{t(label)}</th>
                          ))}
                          <th>{t("Crit +%")}</th>
                          {isNormalTab && draft.hits.length > 1 && <th></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {hitRows.map((row, idx) => (
                          <tr
                            key={row.hit.id}
                            className={row.dimmed ? styles.dimmedRow : undefined}
                          >
                            <td className={styles.hitNo}>{idx + 1}</td>
                            <td>
                              {isNormalTab ? (
                                <>
                                  <NumInput
                                    className={styles.cellInput}
                                    value={row.hit.frame}
                                    onChange={(value) => patchHit(idx, { frame: value })}
                                  />
                                  <span className={styles.cellSub}>
                                    {(row.hit.frame / FPS).toFixed(2)}s
                                  </span>
                                </>
                              ) : (
                                <span className={styles.cellReadonly}>
                                  {row.hit.frame}{" "}
                                  <span className={styles.cellSub}>
                                    {(row.hit.frame / FPS).toFixed(2)}s
                                  </span>
                                </span>
                              )}
                            </td>
                            {HIT_NUMERIC_COLUMNS.map(({ field, isPercent }) => (
                              <td key={field}>{renderHitFieldCell(row, idx, field, isPercent)}</td>
                            ))}
                            <td>
                              {isNormalTab ? (
                                <PercentInput
                                  className={styles.cellInput}
                                  value={row.hit.extraCritDamage}
                                  onChange={(value) => patchHit(idx, { extraCritDamage: value })}
                                />
                              ) : (
                                <span className={styles.cellReadonly}>
                                  {+(row.hit.extraCritDamage * 100).toFixed(2)}%
                                </span>
                              )}
                            </td>
                            {isNormalTab && draft.hits.length > 1 && (
                              <td>
                                <button
                                  type="button"
                                  className={styles.rowDelete}
                                  title={t("Delete hit")}
                                  onClick={() => removeHit(idx)}
                                >
                                  ×
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!isNormalTab && hitRows.some((row) => row.dimmed) && (
                    <div className={styles.variantNote}>
                      {t("Dimmed hits have no")} {effectiveHitTab}{" "}
                      {t("variant — they keep their Normal row.")}
                    </div>
                  )}
                  {isNormalTab && (
                    <button type="button" className={styles.addHitBtn} onClick={addHit}>
                      + {t("Add Hit")}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.card}>
                <h4 className={styles.cardHead}>{t("Effects")}</h4>
                <div className={styles.effectsCols}>
                  <div className={styles.effectsCol}>
                    <div className={styles.effectsColHead}>
                      {t("Triggers (this skill applies)")}
                    </div>
                    {triggerRows.length === 0 && appliesRows.length === 0 ? (
                      <div className={styles.effectsEmpty}>—</div>
                    ) : (
                      <>
                        {triggerRows.map((trigger, triggerIndex) => {
                          const effKind = effectiveTriggerKind(trigger)
                          const summary = summarizeTriggerDraft(trigger)
                          const scopeNote =
                            typeof trigger.hitScope === "number" && draft.hits.length > 1
                              ? ` · ${t("hit")} #${trigger.hitScope + 1}`
                              : ""
                          return (
                            <div
                              className={`${styles.effectsRow} ${kindClass(effKind)}`}
                              key={triggerIndex}
                            >
                              <span className={styles.effectsRowName}>{summary.label}</span>
                              {(summary.effect || scopeNote) && (
                                <span className={styles.effectsRowDetail}>
                                  {summary.effect}
                                  {scopeNote}
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {appliesRows.map((row) => (
                          <div
                            className={`${styles.effectsRow} ${styles.isSite}`}
                            key={`site:${row.id}`}
                          >
                            {draft.triggersBuffs?.includes(row.id) && (
                              <button
                                type="button"
                                className={styles.effectsRemove}
                                aria-label={t("Remove")}
                                onClick={() => removeTriggersBuff(row.id)}
                              >
                                ×
                              </button>
                            )}
                            <span className={styles.effectsRowName}>{row.name}</span>
                            {row.effect && (
                              <span className={styles.effectsRowDetail}>{row.effect}</span>
                            )}
                            {row.requires && (
                              <span className={styles.effectsRowRequires}>
                                ({t("requires")} {row.requires})
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    <Combobox
                      className={`${styles.fieldCombobox} ${styles.effectsAddCombobox}`}
                      value=""
                      options={triggersAddOptions}
                      placeholder={t("Add triggered buff…")}
                      aria-label={t("Add triggered buff")}
                      onChange={addTriggersBuff}
                    />
                  </div>

                  <div className={styles.effectsCol}>
                    <div className={styles.effectsColHead}>
                      {t("Receives (buffs affecting this skill)")}
                    </div>
                    {activeReceiveRows.length === 0 && inactiveReceiveRows.length === 0 ? (
                      <div className={styles.effectsEmpty}>—</div>
                    ) : (
                      <>
                        {activeReceiveRows.map((row) => (
                          <div className={`${styles.effectsRow} ${styles.isSite}`} key={row.id}>
                            {draft.receives?.includes(row.id) && (
                              <button
                                type="button"
                                className={styles.effectsRemove}
                                aria-label={t("Remove")}
                                onClick={() => removeReceivesBuff(row.id)}
                              >
                                ×
                              </button>
                            )}
                            <span className={styles.effectsRowName}>{row.name}</span>
                            {row.effect && (
                              <span className={styles.effectsRowDetail}>{row.effect}</span>
                            )}
                          </div>
                        ))}
                        {inactiveReceiveRows.length > 0 && (
                          <>
                            <button
                              type="button"
                              className={styles.effectsMore}
                              onClick={() => setShowInactiveReceives((prev) => !prev)}
                            >
                              {t("Not in your current build")} ({inactiveReceiveRows.length})
                            </button>
                            {showInactiveReceives &&
                              inactiveReceiveRows.map((row) => (
                                <div
                                  className={`${styles.effectsRow} ${styles.isSite} ${styles.isOff}`}
                                  key={row.id}
                                >
                                  {draft.receives?.includes(row.id) && (
                                    <button
                                      type="button"
                                      className={styles.effectsRemove}
                                      aria-label={t("Remove")}
                                      onClick={() => removeReceivesBuff(row.id)}
                                    >
                                      ×
                                    </button>
                                  )}
                                  <span className={styles.effectsRowName}>{row.name}</span>
                                  {row.effect && (
                                    <span className={styles.effectsRowDetail}>{row.effect}</span>
                                  )}
                                  {row.requires && (
                                    <span className={styles.effectsRowRequires}>
                                      ({t("requires")} {row.requires})
                                    </span>
                                  )}
                                </div>
                              ))}
                          </>
                        )}
                      </>
                    )}
                    <Combobox
                      className={`${styles.fieldCombobox} ${styles.effectsAddCombobox}`}
                      value=""
                      options={receivesAddOptions}
                      placeholder={t("Add received buff…")}
                      aria-label={t("Add received buff")}
                      onChange={addReceivesBuff}
                    />
                  </div>

                  <div className={styles.effectsCol}>
                    <div className={styles.effectsColHead}>{t("Spec Mechanics")}</div>
                    {specMechanicRows.length === 0 ? (
                      <div className={styles.effectsEmpty}>—</div>
                    ) : (
                      specMechanicRows.map((row) => (
                        <div className={`${styles.effectsRow} ${styles.isSpec}`} key={row.id}>
                          <span className={styles.effectsRowName}>{row.name}</span>
                          {row.effect && (
                            <span className={styles.effectsRowDetail}>{row.effect}</span>
                          )}
                          {!row.active && row.requires && (
                            <span className={styles.effectsRowRequires}>
                              ({t("requires")} {row.requires})
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PropRow({
  label,
  help,
  unit,
  children,
}: {
  label: string
  help?: string
  unit?: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.propRow}>
      <span className={styles.propLabel}>
        {label}
        {help && <HelpHint text={help} />}
      </span>
      <span className={styles.propControl}>
        {children}
        {unit && <span className={styles.propUnit}>{unit}</span>}
      </span>
    </div>
  )
}
