import type { Inputs, OddityNode, OddityRegions, StoredProfile } from "./engine/types"
import { EMPTY_EQUIPPED, defaultCombatSettings } from "./engine/types"
import { defaultInputs } from "./engine/defaults"
import { allowedInnerWaysForClass, defaultArsenalForClass } from "./engine/panel"
import { withoutDerivedStats, withZeroedDerivedStats } from "./engine/derivedInputs"
import { getDefaultTalentsForClass, DEFAULT_ODDITIES } from "./data/baseStats"
import type { Rotation, RotationStep } from "./engine/rotation"
import { newRotationId, newStepId, isRotation } from "./engine/rotation"
import type { Skill, SkillHit, HitTrigger, TriggerCondition, HitVariant } from "./engine/skill"
import {
  newSkillId,
  newHitId,
  newTriggerId,
  newVariantId,
  isSkill,
  isHitVariant,
  isTriggerCondition,
} from "./engine/skill"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./engine/builtinLibrary"
import { seedSkillFromBuiltin } from "./engine/skill"
import type { Buff, BuffScope, BuffStatEffect } from "./engine/buff"
import type { StatKey } from "./engine/statRegistry"
import { isBuff, makeBuff, newBuffId } from "./engine/buff"
import type { Debuff, DebuffDotSpec, DotDetonationSpec, DotStackShape } from "./engine/debuff"
import { isDebuff, makeDebuff } from "./engine/debuff"
import { kvStore } from "./kvStore"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  migrateClassId,
  migrateEntityId,
} from "./migrations"

export { migrateClassId, migrateEntityId } from "./migrations"

const KEY = "wwm.inputs"
const VERSION = 5

interface SavedBlob {
  v: number
  inputs: Inputs
}

export function saveInputs(inputs: Inputs): void {
  try {
    const blob: SavedBlob = { v: VERSION, inputs }
    kvStore.set(KEY, JSON.stringify(blob))
  } catch {}
}

export function loadInputs(): Inputs | null {
  try {
    const raw = kvStore.get(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedBlob
    if (parsed.v !== VERSION) return null
    return parsed.inputs
  } catch {
    return null
  }
}

export function clearSavedInputs(): void {
  try {
    kvStore.remove(KEY)
  } catch {}
}

export function initialInputs(): Inputs {
  return loadInputs() ?? defaultInputs
}

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = LATEST_PROFILES_VERSION

interface ProfilesBlob {
  v: number
  profiles: StoredProfile[]
  activeId: string
}

export interface ProfilesState {
  profiles: StoredProfile[]
  activeId: string
}

let profileCounter = 0
export function newProfileId(): string {
  profileCounter = (profileCounter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `pr-${t}-${r}-${profileCounter.toString(36)}`
}

let gearCounter = 0
export function newGearPieceId(): string {
  gearCounter = (gearCounter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `gp-${t}-${r}-${gearCounter.toString(36)}`
}

function isStoredProfile(x: unknown): x is StoredProfile {
  if (!x || typeof x !== "object") return false
  const p = x as Record<string, unknown>
  if (typeof p.id !== "string" || !p.id) return false
  if (typeof p.name !== "string") return false
  if (!p.inputs || typeof p.inputs !== "object") return false
  return true
}

const VALID_BREAKTHROUGHS = new Set([12, 13, 14, 15, 16, 17, 18, 19, 20, 21])

const LEGACY_TARGET_TO_BREAKTHROUGH: Record<string, number> = {
  "81": 12,
  "86": 13,
  "91": 14,
  "96": 16,
}

// For the standalone `wwm.customRotations` store; rotations inside a profile
// go through the version chain instead.
function migrateRotationIds<T>(rotation: T): T {
  if (!rotation || typeof rotation !== "object") return rotation
  const r = rotation as unknown as Rotation
  const next: Rotation = { ...r, id: migrateEntityId(r.id), classId: migrateClassId(r.classId) }
  if (Array.isArray(r.steps)) {
    next.steps = r.steps.map((s) =>
      s && typeof s === "object" ? { ...s, skillId: migrateEntityId(s.skillId) } : s,
    )
  }
  if (Array.isArray(r.permanentBuffIds)) {
    next.permanentBuffIds = r.permanentBuffIds.map((b) => migrateEntityId(b))
  }
  return next as unknown as T
}

const LEGACY_GEAR_WORD_RENAMES: Record<string, string> = {
  "Single Burst": "Single-Target Mystic Skill DMG Boost",
  "Single Control": "Single-Target Mystic Skill DMG Boost",
  "AoE Anomaly": "Area Debuff Mystic Skill DMG Boost",
  "AoE Damage": "Area DMG Mystic Skill DMG Boost",
  "Min Formless": "Min Void Attack",
  "Max Formless": "Max Void Attack",
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateInputs(inputs: Inputs): Inputs {
  const { resistance: _legacyResistance, ...rest } = inputs as Inputs & { resistance?: number }
  void _legacyResistance
  const next: Inputs = { ...(rest as Inputs) }
  // Also the entry point for the legacy `wwm.inputs` blob and imported
  // profiles, neither of which is version-walked. Must run before anything
  // that reads `classId` (arsenal / inner-way allowlist / talent defaults).
  next.classId = migrateClassId(next.classId)
  next.selectedBuiltinRotationId = migrateEntityId(next.selectedBuiltinRotationId)
  if (next.activeCustomRotation != null) {
    next.activeCustomRotation = migrateRotationIds(next.activeCustomRotation)
  }
  {
    const legacyParams = (next as unknown as Record<string, unknown>).siteBuffParams
    if (legacyParams !== undefined && next.buffParams == null) {
      next.buffParams = legacyParams as Inputs["buffParams"]
    }
    delete (next as unknown as Record<string, unknown>).siteBuffParams
  }
  const legacyTargetId = (inputs as Inputs & { targetId?: string }).targetId
  if (typeof next.breakthrough !== "number" || !VALID_BREAKTHROUGHS.has(next.breakthrough)) {
    const trial =
      typeof legacyTargetId === "string" ? (legacyTargetId.match(/^(\d+)/)?.[1] ?? "") : ""
    next.breakthrough = LEGACY_TARGET_TO_BREAKTHROUGH[trial] ?? 16
  }
  delete (next as unknown as Record<string, unknown>).targetId
  delete (next as unknown as Record<string, unknown>).shareDebuff5JingShen
  if (typeof next.dummyMode !== "boolean") next.dummyMode = false
  if (typeof next.allDamageBoost !== "number") next.allDamageBoost = 0
  delete (next as unknown as Record<string, unknown>).singleBurstBoost
  delete (next as unknown as Record<string, unknown>).singleControlBoost
  if ("customSkills" in next) next.customSkills = undefined
  if ("customBuffs" in next) next.customBuffs = undefined
  if ("customDebuffs" in next) next.customDebuffs = undefined
  if (next.activeCustomRotation != null && !isRotation(next.activeCustomRotation)) {
    next.activeCustomRotation = null
  }
  if (typeof next.selectedBuiltinRotationId !== "string") next.selectedBuiltinRotationId = null
  delete (next as unknown as Record<string, unknown>).calcMode
  if (next.bowSet !== "affinity" && next.bowSet !== "crit" && next.bowSet !== "precision") {
    next.bowSet = null
  }
  if (
    next.arsenal !== "general" &&
    next.arsenal !== "bellstrike" &&
    next.arsenal !== "stonesplit" &&
    next.arsenal !== "silkbind" &&
    next.arsenal !== "bamboocut"
  ) {
    next.arsenal = defaultArsenalForClass(next.classId)
  }
  if (!Array.isArray(next.inventory)) next.inventory = []
  next.inventory = next.inventory.map((piece) => {
    const p = piece as Partial<typeof piece> & Record<string, unknown>
    const { name: _legacyName, isNew: _rawIsNew, ...rest } = p
    void _legacyName
    void _rawIsNew
    const isNew = p.isNew === true
    const rawWords = (rest as unknown as { words?: unknown }).words
    const words = Array.isArray(rawWords)
      ? rawWords.map((w) =>
          w && typeof w === "object" && typeof (w as { word?: unknown }).word === "string"
            ? {
                ...w,
                word:
                  LEGACY_GEAR_WORD_RENAMES[(w as { word: string }).word] ??
                  (w as { word: string }).word,
              }
            : w,
        )
      : rawWords
    return {
      ...(rest as unknown as typeof piece),
      ...(words !== undefined ? { words: words as typeof piece.words } : {}),
      relayed: typeof p.relayed === "boolean" ? p.relayed : false,
      attunement: typeof p.attunement === "string" ? p.attunement : "",
      attunementValue: typeof p.attunementValue === "number" ? p.attunementValue : 0,
      ...(isNew ? { isNew: true } : {}),
    }
  })
  if (!next.equipped || typeof next.equipped !== "object") {
    next.equipped = { ...EMPTY_EQUIPPED }
  } else {
    next.equipped = { ...EMPTY_EQUIPPED, ...next.equipped }
  }
  if (Array.isArray(next.mindMethods)) {
    const allowed = new Set(allowedInnerWaysForClass(next.classId))
    const seen = new Set<string>()
    next.mindMethods = next.mindMethods.map((slot) => {
      if (!slot) return slot
      const disallowed = !!slot.name && allowed.size > 0 && !allowed.has(slot.name)
      const duplicate = !!slot.name && seen.has(slot.name)
      if (disallowed || duplicate) return { ...slot, name: "", stacks: "" }
      if (slot.name) seen.add(slot.name)
      return slot.name && !slot.stacks ? { ...slot, stacks: "tier 6" } : slot
    }) as Inputs["mindMethods"]
  }
  {
    const stored = Array.isArray(next.martialArtsTalents)
      ? (next.martialArtsTalents as unknown[])
      : []
    const healed = stored
      .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
      .map((r) => {
        return {
          id:
            typeof r.id === "string" && r.id
              ? r.id
              : `t-${Math.random().toString(36).slice(2, 10)}`,
          name: typeof r.name === "string" ? r.name : "",
          enabled: typeof r.enabled === "boolean" ? r.enabled : true,
          stat: typeof r.stat === "string" ? r.stat : "affinityRate",
          maxBonus: typeof r.maxBonus === "number" ? r.maxBonus : 0,
          scalesWith: typeof r.scalesWith === "string" ? r.scalesWith : "power",
          scaleMax: typeof r.scaleMax === "number" ? r.scaleMax : 225,
        } as Inputs["martialArtsTalents"][number]
      })
      .filter((r) => !r.id.startsWith("default-"))
    next.martialArtsTalents = [...healed, ...getDefaultTalentsForClass(next.classId)]
  }
  if (!next.oddities || typeof next.oddities !== "object" || Array.isArray(next.oddities)) {
    next.oddities = JSON.parse(JSON.stringify(DEFAULT_ODDITIES)) as OddityRegions
  } else {
    const healed: OddityRegions = {}
    for (const [region, nodes] of Object.entries(next.oddities as Record<string, unknown>)) {
      if (!Array.isArray(nodes)) continue
      healed[region] = (nodes as unknown[])
        .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
        .map((n, i) => ({
          id: typeof n.id === "number" ? n.id : i + 1,
          stat: typeof n.stat === "string" ? (n.stat as OddityNode["stat"]) : "maxPhys",
          value: typeof n.value === "number" ? n.value : 0,
          enabled: typeof n.enabled === "boolean" ? n.enabled : true,
          icon: typeof n.icon === "string" ? n.icon : undefined,
        }))
    }
    for (const [region, defNodes] of Object.entries(DEFAULT_ODDITIES)) {
      if (!healed[region]) healed[region] = defNodes.map((n) => ({ ...n }))
    }
    next.oddities = healed
  }
  {
    const def = defaultCombatSettings()
    const raw = (next as unknown as { combatSettings?: unknown }).combatSettings
    const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
    const qbRaw =
      r.qiBreak && typeof r.qiBreak === "object" ? (r.qiBreak as Record<string, unknown>) : {}
    if (r.fireOil === true && next.tianGongElement == null) next.tianGongElement = "fire"
    if (r.vulnerability === true) next.shareEasyHurt = true
    next.combatSettings = {
      qiBreak: {
        enabled: typeof qbRaw.enabled === "boolean" ? qbRaw.enabled : def.qiBreak.enabled,
        startSec: typeof qbRaw.startSec === "number" ? qbRaw.startSec : def.qiBreak.startSec,
        durationSec:
          typeof qbRaw.durationSec === "number" ? qbRaw.durationSec : def.qiBreak.durationSec,
      },
      dragonsBreath: typeof r.dragonsBreath === "boolean" ? r.dragonsBreath : def.dragonsBreath,
      healerBuff: typeof r.healerBuff === "boolean" ? r.healerBuff : def.healerBuff,
      breakExtension: typeof r.breakExtension === "boolean" ? r.breakExtension : def.breakExtension,
      revelryScript: typeof r.revelryScript === "boolean" ? r.revelryScript : def.revelryScript,
    }
  }
  return withZeroedDerivedStats(next)
}

function makeDefaultProfile(name: string, inputs: Inputs): StoredProfile {
  return { id: newProfileId(), name, inputs: hydrateInputs(inputs) }
}

export function loadProfiles(): ProfilesState & { firstRun: boolean } {
  try {
    const raw = kvStore.get(PROFILES_KEY)
    if (raw) {
      const result = runProfileMigrations(JSON.parse(raw))
      const migrated = result?.blob as ProfilesBlob | undefined
      if (migrated && Array.isArray(migrated.profiles)) {
        const profiles = migrated.profiles
          .filter(isStoredProfile)
          .map((p) => ({ ...p, inputs: hydrateInputs(p.inputs) }))
        if (profiles.length > 0) {
          const activeId = profiles.some((p) => p.id === migrated.activeId)
            ? migrated.activeId
            : profiles[0].id
          // Persist the upgraded blob so the chain is walked once, not per load.
          if (result && (result.applied.length > 0 || migrated.v !== PROFILES_VERSION)) {
            saveProfiles({ profiles, activeId })
          }
          return { profiles, activeId, firstRun: false }
        }
      }
    }
  } catch {}

  const legacy = loadInputs()
  if (legacy) {
    const profile = makeDefaultProfile("Default", legacy)
    const state: ProfilesState = { profiles: [profile], activeId: profile.id }
    saveProfiles(state)
    try {
      kvStore.remove(KEY)
    } catch {}
    return { ...state, firstRun: false }
  }

  const profile = makeDefaultProfile("Default", defaultInputs)
  return { profiles: [profile], activeId: profile.id, firstRun: true }
}

export function saveProfiles(state: ProfilesState): void {
  try {
    const blob: ProfilesBlob = {
      v: PROFILES_VERSION,
      profiles: state.profiles.map((profile) => ({
        ...profile,
        inputs: withoutDerivedStats(profile.inputs),
      })),
      activeId: state.activeId,
    }
    kvStore.set(PROFILES_KEY, JSON.stringify(blob))
  } catch {}
}

export function exportProfile(profile: StoredProfile): string {
  const blob = {
    v: PROFILES_VERSION,
    profile: { ...profile, inputs: withoutDerivedStats(profile.inputs) },
  }
  return JSON.stringify(blob, null, 2)
}

export function importProfile(text: string): StoredProfile {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Imported value is not an object")
  }
  let candidate: unknown = parsed
  const maybeWrapper = parsed as { v?: unknown; profile?: unknown }
  if (
    typeof maybeWrapper.v === "number" &&
    maybeWrapper.profile &&
    typeof maybeWrapper.profile === "object"
  ) {
    if (maybeWrapper.v > PROFILES_VERSION) {
      throw new Error(
        `Profile version ${maybeWrapper.v} is incompatible with this build (expected ${PROFILES_VERSION})`,
      )
    }
    const wrapperProfile = maybeWrapper.profile as { id?: unknown }
    const activeId = typeof wrapperProfile.id === "string" ? wrapperProfile.id : ""
    const result = runProfileMigrations({
      v: maybeWrapper.v,
      profiles: [maybeWrapper.profile],
      activeId,
    })
    candidate = result?.blob.profiles[0] ?? maybeWrapper.profile
  }
  if (!isStoredProfile(candidate)) {
    throw new Error("Imported profile failed validation (missing or invalid fields)")
  }
  const hydrated = hydrateInputs(candidate.inputs)
  const idMap = new Map<string, string>()
  const inventory = hydrated.inventory.map((piece) => {
    const nextId = newGearPieceId()
    idMap.set(piece.id, nextId)
    return { ...piece, id: nextId }
  })
  const equipped = { ...EMPTY_EQUIPPED, ...hydrated.equipped }
  for (const slot of Object.keys(equipped) as (keyof typeof equipped)[]) {
    const oldId = equipped[slot]
    equipped[slot] = oldId ? (idMap.get(oldId) ?? null) : null
  }
  return {
    id: newProfileId(),
    name: candidate.name || "Imported profile",
    inputs: { ...hydrated, inventory, equipped },
  }
}

const CUSTOM_KEY = "wwm.customRotations"
const CUSTOM_VERSION = 3

interface CustomBlob {
  v: number
  rotations: Rotation[]
}

export function loadCustomRotations(): Rotation[] {
  try {
    const raw = kvStore.get(CUSTOM_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomBlob
    if (parsed.v !== CUSTOM_VERSION) return []
    if (!Array.isArray(parsed.rotations)) return []
    return parsed.rotations.map((r) => migrateRotationIds(r)).filter(isRotation)
  } catch {
    return []
  }
}

function writeCustomRotations(rotations: Rotation[]): void {
  try {
    const blob: CustomBlob = { v: CUSTOM_VERSION, rotations }
    kvStore.set(CUSTOM_KEY, JSON.stringify(blob))
  } catch {}
}

export function saveCustomRotation(r: Rotation): Rotation {
  const next: Rotation = { ...r, updatedAt: new Date().toISOString() }
  const all = loadCustomRotations()
  const idx = all.findIndex((x) => x.id === next.id)
  if (idx >= 0) all[idx] = next
  else all.push(next)
  writeCustomRotations(all)
  return next
}

export function deleteCustomRotation(id: string): void {
  const all = loadCustomRotations().filter((r) => r.id !== id)
  writeCustomRotations(all)
}

export function exportCustomRotation(r: Rotation): string {
  return JSON.stringify(r, null, 2)
}

export function importCustomRotation(text: string): Rotation {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Imported value is not an object")
  }
  const candidate = parsed as Partial<Rotation>
  const now = new Date().toISOString()
  const steps: RotationStep[] = Array.isArray(candidate.steps)
    ? candidate.steps
        .filter(
          (s): s is RotationStep =>
            !!s &&
            typeof s === "object" &&
            typeof (s as { skillId?: unknown }).skillId === "string",
        )
        .map((s) => ({
          id: newStepId(),
          skillId: s.skillId,
          hitCount: typeof s.hitCount === "number" ? s.hitCount : 1,
          prePull: typeof s.prePull === "boolean" ? s.prePull : false,
        }))
    : []
  const fresh: Rotation = {
    id: newRotationId(),
    name: typeof candidate.name === "string" ? candidate.name : "Imported rotation",
    classId: typeof candidate.classId === "string" ? candidate.classId : "",
    steps,
    permanentBuffIds: Array.isArray(candidate.permanentBuffIds)
      ? candidate.permanentBuffIds.filter((x): x is string => typeof x === "string")
      : [],
    prePullHitsCount:
      typeof candidate.prePullHitsCount === "boolean" ? candidate.prePullHitsCount : false,
    createdAt: now,
    updatedAt: now,
  }
  if (!isRotation(fresh)) {
    throw new Error("Imported rotation failed validation (missing or invalid fields)")
  }
  return fresh
}

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const CUSTOM_SKILLS_VERSION = 3

interface CustomSkillsBlob {
  v: number
  skills: Skill[]
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateSkill(s: Skill): Skill {
  if (!s || typeof s !== "object") return s
  const { abilityTag: _legacyAbilityTag, ...rest } = s as Skill & { abilityTag?: string }
  void _legacyAbilityTag
  return {
    ...rest,
    id: migrateEntityId(s.id),
    classId: migrateClassId(s.classId),
    triggerable: typeof s.triggerable === "boolean" ? s.triggerable : true,
    tags: Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === "string") : [],
    hits: Array.isArray(s.hits) ? s.hits.map((h) => hydrateSkillHit(h)) : s.hits,
  }
}

function hydrateSkillHit(h: SkillHit): SkillHit {
  if (!h || typeof h !== "object") return h
  const hit: SkillHit = { ...h }
  if (Array.isArray(h.variants)) {
    hit.variants = h.variants
      .filter(isHitVariant)
      .map((v) => ({ ...v, conditions: v.conditions.filter(isTriggerCondition) }))
  } else {
    delete hit.variants
  }
  if (Array.isArray(h.triggers)) {
    hit.triggers = h.triggers.map((tr) => hydrateHitTrigger(tr))
  }
  return hit
}

function hydrateHitTrigger(tr: HitTrigger): HitTrigger {
  if (!tr || typeof tr !== "object") return tr
  const trigger: HitTrigger = { ...tr, targetId: migrateEntityId(tr.targetId) }
  if (Array.isArray(tr.conditions)) {
    trigger.conditions = tr.conditions.filter(isTriggerCondition)
  } else {
    delete trigger.conditions
  }
  return trigger
}

export function loadCustomSkills(): Skill[] {
  try {
    const raw = kvStore.get(CUSTOM_SKILLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomSkillsBlob
    if (parsed.v !== CUSTOM_SKILLS_VERSION) return []
    if (!Array.isArray(parsed.skills)) return []
    return parsed.skills.map(hydrateSkill).filter(isSkill)
  } catch {
    return []
  }
}

export function loadCustomSkillsForClass(classId: string): Skill[] {
  return loadCustomSkills().filter((s) => s.classId === classId)
}

function writeCustomSkills(skills: Skill[]): void {
  try {
    const blob: CustomSkillsBlob = { v: CUSTOM_SKILLS_VERSION, skills }
    kvStore.set(CUSTOM_SKILLS_KEY, JSON.stringify(blob))
  } catch {}
}

export function saveCustomSkill(s: Skill): Skill[] {
  const next: Skill = { ...s, updatedAt: new Date().toISOString() }
  const all = loadCustomSkills()
  const idx = all.findIndex((x) => x.id === next.id)
  if (idx >= 0) all[idx] = next
  else all.push(next)
  writeCustomSkills(all)
  return all
}

export function deleteCustomSkill(id: string): Skill[] {
  const all = loadCustomSkills().filter((s) => s.id !== id)
  writeCustomSkills(all)
  return all
}

export function exportCustomSkill(s: Skill): string {
  return JSON.stringify(s, null, 2)
}

// additive value-level repair — see CLAUDE.md → "localStorage migrations"
export function migrateSeededSkillIds(): void {
  try {
    const skills = loadCustomSkills()
    if (skills.length === 0) return

    const remap = new Map<string, string>()
    const nextSkills = skills.map((s) => {
      const builtins = builtinSkillsForClass(s.classId)
      if (builtins.some((b) => b.id === s.id)) return s
      const nameMatches = builtins.filter((b) => b.name === s.name)
      if (nameMatches.length !== 1) return s
      const target = nameMatches[0]
      if (skills.some((other) => other !== s && other.id === target.id)) return s
      remap.set(s.id, target.id)
      return { ...s, id: target.id }
    })

    if (remap.size === 0) return
    writeCustomSkills(nextSkills)

    const rotations = loadCustomRotations()
    let rotationsChanged = false
    const nextRotations = rotations.map((r) => {
      let stepsChanged = false
      const steps = r.steps.map((step) => {
        const mapped = remap.get(step.skillId)
        if (mapped == null) return step
        stepsChanged = true
        return { ...step, skillId: mapped }
      })
      if (!stepsChanged) return r
      rotationsChanged = true
      return { ...r, steps }
    })
    if (rotationsChanged) writeCustomRotations(nextRotations)
  } catch {}
}

function tickSkillIdForDebuff(debuffId: string): string | null {
  return debuffId.startsWith("debuff-") ? "" + debuffId.slice("debuff-".length) : null
}

function allHitsZero(skill: Skill): boolean {
  return skill.hits.every(
    (h) =>
      h.physMultiplier === 0 &&
      h.attributeMultiplier === 0 &&
      h.physFixed === 0 &&
      h.attributeFixed === 0,
  )
}

// additive value-level repair — see CLAUDE.md → "localStorage migrations"
export function migrateDotStandinOverrides(): void {
  try {
    const debuffs = loadCustomDebuffs()
    let skills = loadCustomSkills()
    let skillsChanged = false

    const keptDebuffs: Debuff[] = []
    for (const d of debuffs) {
      const skillId = tickSkillIdForDebuff(d.id)
      const builtinSk = skillId
        ? builtinSkillsForClass(d.classId).find((s) => s.id === skillId)
        : undefined
      if (d.dot && builtinSk) {
        const existing = skills.find((s) => s.id === skillId)
        const base = existing ?? seedSkillFromBuiltin(d.classId, builtinSk)
        const merged: Skill = {
          ...base,
          hits: base.hits.map((h) => ({
            ...h,
            physMultiplier: d.dot!.physMultiplier,
            physFixed: d.dot!.physFixed,
            attributeMultiplier: d.dot!.attributeMultiplier,
            attributeFixed: d.dot!.attributeFixed,
          })),
          attributeAttack: d.dot!.attributeAttack || base.attributeAttack,
        }
        skills = existing
          ? skills.map((s) => (s.id === merged.id ? merged : s))
          : [...skills, merged]
        skillsChanged = true
      } else {
        keptDebuffs.push(d)
      }
    }

    skills = skills.map((s) => {
      if (!allHitsZero(s)) return s
      const hasDotDebuff = builtinDebuffsForClass(s.classId).some(
        (d) => d.dot && tickSkillIdForDebuff(d.id) === s.id,
      )
      if (!hasDotDebuff) return s
      const builtinSk = builtinSkillsForClass(s.classId).find((b) => b.id === s.id)
      if (!builtinSk) return s
      skillsChanged = true
      return { ...s, hits: seedSkillFromBuiltin(s.classId, builtinSk).hits }
    })

    if (keptDebuffs.length !== debuffs.length) writeCustomDebuffs(keptDebuffs)
    if (skillsChanged) writeCustomSkills(skills)
  } catch {}
}

function importedTrigger(t: unknown): HitTrigger {
  const c = (t && typeof t === "object" ? t : {}) as Partial<HitTrigger>
  const rawCondition = c.condition as Partial<TriggerCondition> | null | undefined
  const condition: TriggerCondition | null =
    rawCondition && typeof rawCondition === "object" && typeof rawCondition.buffId === "string"
      ? {
          buffId: rawCondition.buffId,
          op: rawCondition.op === "gt" || rawCondition.op === "eq" ? rawCondition.op : "gte",
          stacks: typeof rawCondition.stacks === "number" ? rawCondition.stacks : 1,
        }
      : null
  const trigger: HitTrigger = {
    id: newTriggerId(),
    kind: c.kind === "castSkill" ? "castSkill" : "applyBuff",
    targetId: typeof c.targetId === "string" ? c.targetId : "",
    stacks: typeof c.stacks === "number" ? c.stacks : 1,
    condition,
  }
  if (Array.isArray(c.conditions)) {
    trigger.conditions = c.conditions.filter(isTriggerCondition)
  }
  return trigger
}

function importedVariant(v: unknown): HitVariant | null {
  if (!isHitVariant(v)) return null
  return { ...v, id: newVariantId(), conditions: v.conditions.filter(isTriggerCondition) }
}

function importedHit(h: unknown): SkillHit {
  const c = (h && typeof h === "object" ? h : {}) as Partial<SkillHit>
  const hit: SkillHit = {
    id: newHitId(),
    frame: typeof c.frame === "number" ? c.frame : 0,
    physMultiplier: typeof c.physMultiplier === "number" ? c.physMultiplier : 0,
    attributeMultiplier: typeof c.attributeMultiplier === "number" ? c.attributeMultiplier : 0,
    physFixed: typeof c.physFixed === "number" ? c.physFixed : 0,
    attributeFixed: typeof c.attributeFixed === "number" ? c.attributeFixed : 0,
    extraCritDamage: typeof c.extraCritDamage === "number" ? c.extraCritDamage : 0,
    triggers: Array.isArray(c.triggers) ? c.triggers.map(importedTrigger) : [],
  }
  if (Array.isArray(c.variants)) {
    const variants = c.variants.map(importedVariant).filter((v): v is HitVariant => v !== null)
    if (variants.length > 0) hit.variants = variants
  }
  return hit
}

export function importCustomSkill(text: string, targetClassId: string): Skill {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Imported value is not an object")
  }
  const c = parsed as Partial<Skill>
  const now = new Date().toISOString()
  const fresh: Skill = {
    id: newSkillId(),
    classId: targetClassId,
    name: typeof c.name === "string" ? c.name : "",
    skillType: typeof c.skillType === "string" ? c.skillType : "weapon",
    weaponOrAttribute: typeof c.weaponOrAttribute === "string" ? c.weaponOrAttribute : "",
    attributeAttack: typeof c.attributeAttack === "string" ? c.attributeAttack : "",
    hits:
      Array.isArray(c.hits) && c.hits.length > 0
        ? c.hits.map(importedHit)
        : [importedHit(undefined)],
    castFrames: typeof c.castFrames === "number" ? c.castFrames : 0,
    triggerable: typeof c.triggerable === "boolean" ? c.triggerable : true,
    elevatedAttributeMultiplier: c.elevatedAttributeMultiplier === false ? false : undefined,
    guaranteedPrecision: c.guaranteedPrecision === true ? true : undefined,
    guaranteedNormal: c.guaranteedNormal === true ? true : undefined,
    tags: Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === "string") : [],
    createdAt: now,
    updatedAt: now,
  }
  if (!isSkill(fresh)) {
    throw new Error("Imported skill failed validation (missing or invalid fields)")
  }
  return fresh
}

const CUSTOM_BUFFS_KEY = "wwm.customBuffs"
const CUSTOM_BUFFS_VERSION = 3

interface CustomBuffsBlob {
  v: number
  buffs: Buff[]
}

function sanitizePerStackShapes(x: unknown): DotStackShape[] | null {
  if (!Array.isArray(x) || x.length === 0) return null
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)
  return x.map((row) => {
    const r = (row && typeof row === "object" ? row : {}) as Partial<DotStackShape>
    return {
      physMultiplier: num(r.physMultiplier),
      physFixed: num(r.physFixed),
      attributeMultiplier: num(r.attributeMultiplier),
      attributeFixed: num(r.attributeFixed),
    }
  })
}

// additive — see CLAUDE.md → "localStorage migrations"
function sanitizePerStackMultipliers(x: unknown): number[] | null {
  if (!Array.isArray(x) || x.length === 0) return null
  return x.map((v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 1))
}

function isRawStatEffect(e: unknown): e is BuffStatEffect {
  return (
    !!e &&
    typeof e === "object" &&
    typeof (e as Record<string, unknown>).statKey === "string" &&
    typeof (e as Record<string, unknown>).amount === "number"
  )
}

const LEGACY_STAT_KEY_RENAMES: Record<string, string> = {
  singleBurstBoost: "singleMysticBoost",
  singleControlBoost: "singleMysticBoost",
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateBuff(b: Buff): Buff {
  const { dot: _drop, ...rest0 } = b as Buff & { dot?: unknown }
  void _drop
  const rest = { ...rest0, id: migrateEntityId(b.id), classId: migrateClassId(b.classId) }
  const effects = Array.isArray(b.effects)
    ? b.effects.map((e) =>
        e && typeof e.statKey === "string" && LEGACY_STAT_KEY_RENAMES[e.statKey]
          ? { ...e, statKey: LEGACY_STAT_KEY_RENAMES[e.statKey] as StatKey }
          : e,
      )
    : b.effects
  return {
    ...(rest as Buff),
    scope: b.scope === "team" ? "team" : "player",
    stackScaling: b.stackScaling === "perStack" ? "perStack" : "flat",
    maxStacks: typeof b.maxStacks === "number" && b.maxStacks > 0 ? b.maxStacks : 1,
    effects,
  }
}

// additive value-level repair — see CLAUDE.md → "localStorage migrations"
function migrateStatusStoresIfNeeded(): void {
  try {
    const raw = kvStore.get(CUSTOM_BUFFS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { v?: number; buffs?: unknown[] }
    if (parsed.v !== 1) return
    const legacyList = Array.isArray(parsed.buffs) ? parsed.buffs : []

    const buffs: Buff[] = []
    const debuffs: Debuff[] = []
    for (const raw of legacyList) {
      if (!raw || typeof raw !== "object") continue
      const b = raw as Record<string, unknown>
      const id = typeof b.id === "string" && b.id ? b.id : newBuffId()
      const classId = typeof b.classId === "string" ? b.classId : ""
      const name = typeof b.name === "string" ? b.name : ""
      const activation = b.activation === "permanent" ? "permanent" : "triggered"
      const durationFrames = typeof b.durationFrames === "number" ? b.durationFrames : 600
      const maxStacks = typeof b.maxStacks === "number" && b.maxStacks > 0 ? b.maxStacks : 1
      const stackScaling = b.stackScaling === "perStack" ? "perStack" : "flat"
      const createdAt = typeof b.createdAt === "string" ? b.createdAt : new Date().toISOString()
      const updatedAt = typeof b.updatedAt === "string" ? b.updatedAt : createdAt
      const rawEffects = Array.isArray(b.effects) ? b.effects.filter(isRawStatEffect) : []

      const isDebuffLike = b.scope === "target" || b.dot != null
      if (isDebuffLike) {
        const rawDot =
          b.dot && typeof b.dot === "object" ? (b.dot as Record<string, unknown>) : null
        const dot: DebuffDotSpec | null = rawDot
          ? {
              tickIntervalFrames:
                typeof rawDot.tickIntervalFrames === "number" ? rawDot.tickIntervalFrames : 60,
              physMultiplier: typeof rawDot.physMultiplier === "number" ? rawDot.physMultiplier : 0,
              physFixed: typeof rawDot.physFixed === "number" ? rawDot.physFixed : 0,
              attributeMultiplier:
                typeof rawDot.attributeMultiplier === "number" ? rawDot.attributeMultiplier : 0,
              attributeFixed: typeof rawDot.attributeFixed === "number" ? rawDot.attributeFixed : 0,
              attributeAttack: (rawDot.attributeAttack ?? "") as DebuffDotSpec["attributeAttack"],
              skillType: typeof rawDot.skillType === "string" ? rawDot.skillType : "sustain",
              count: typeof rawDot.count === "number" ? rawDot.count : 1,
              perStackShapes: sanitizePerStackShapes(rawDot.perStackShapes),
              perStackMultipliers: sanitizePerStackMultipliers(rawDot.perStackMultipliers),
            }
          : null
        debuffs.push({
          id,
          classId,
          name,
          activation,
          durationFrames,
          effects: rawEffects.filter((e) => e.statKey.startsWith("target.")),
          dot,
          maxStacks,
          stackScaling,
          createdAt,
          updatedAt,
        })
      } else {
        const scope: BuffScope = b.scope === "team" ? "team" : "player"
        buffs.push({
          id,
          classId,
          name,
          scope,
          activation,
          durationFrames,
          effects: rawEffects.filter((e) => !e.statKey.startsWith("target.")),
          maxStacks,
          stackScaling,
          createdAt,
          updatedAt,
        })
      }
    }

    writeCustomBuffs(buffs)

    let existingDebuffs: Debuff[] = []
    try {
      const existingRaw = kvStore.get(CUSTOM_DEBUFFS_KEY)
      if (existingRaw) {
        const parsedD = JSON.parse(existingRaw) as { v?: number; debuffs?: unknown[] }
        if (parsedD.v === CUSTOM_DEBUFFS_VERSION && Array.isArray(parsedD.debuffs)) {
          existingDebuffs = parsedD.debuffs.filter(isDebuff)
        }
      }
    } catch {}
    writeCustomDebuffs([...existingDebuffs, ...debuffs])
  } catch {}
}

export function loadCustomBuffs(): Buff[] {
  migrateStatusStoresIfNeeded()
  try {
    const raw = kvStore.get(CUSTOM_BUFFS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomBuffsBlob
    if (parsed.v !== CUSTOM_BUFFS_VERSION) return []
    if (!Array.isArray(parsed.buffs)) return []
    return parsed.buffs.filter(isBuff).map(hydrateBuff)
  } catch {
    return []
  }
}

export function loadCustomBuffsForClass(classId: string): Buff[] {
  return loadCustomBuffs().filter((b) => b.classId === classId)
}

function writeCustomBuffs(buffs: Buff[]): void {
  try {
    const blob: CustomBuffsBlob = { v: CUSTOM_BUFFS_VERSION, buffs }
    kvStore.set(CUSTOM_BUFFS_KEY, JSON.stringify(blob))
  } catch {}
}

export function saveCustomBuff(b: Buff): Buff[] {
  const next: Buff = { ...b, updatedAt: new Date().toISOString() }
  const all = loadCustomBuffs()
  const idx = all.findIndex((x) => x.id === next.id)
  if (idx >= 0) all[idx] = next
  else all.push(next)
  writeCustomBuffs(all)
  return all
}

export function deleteCustomBuff(id: string): Buff[] {
  const all = loadCustomBuffs().filter((b) => b.id !== id)
  writeCustomBuffs(all)
  return all
}

export function exportCustomBuff(b: Buff): string {
  return JSON.stringify(b, null, 2)
}

export function importCustomBuff(text: string, targetClassId: string): Buff {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Imported value is not an object")
  }
  const c = parsed as Partial<Buff> & { scope?: unknown }
  const effects = (Array.isArray(c.effects) ? c.effects : [])
    .filter(isRawStatEffect)
    .filter((e) => !e.statKey.startsWith("target."))
    .map((e) => ({ statKey: e.statKey, amount: e.amount }))
  const fresh = makeBuff(targetClassId, {
    name: typeof c.name === "string" ? c.name : "",
    scope: c.scope === "team" ? "team" : "player",
    activation: c.activation === "permanent" ? "permanent" : "triggered",
    durationFrames: typeof c.durationFrames === "number" ? c.durationFrames : 600,
    effects,
    maxStacks: typeof c.maxStacks === "number" && c.maxStacks > 0 ? c.maxStacks : 1,
    stackScaling: c.stackScaling === "perStack" ? "perStack" : "flat",
  })
  if (!isBuff(fresh)) {
    throw new Error("Imported buff failed validation (missing or invalid fields)")
  }
  return fresh
}

const CUSTOM_DEBUFFS_KEY = "wwm.customDebuffs"
const CUSTOM_DEBUFFS_VERSION = 2

interface CustomDebuffsBlob {
  v: number
  debuffs: Debuff[]
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateDebuff(d: Debuff): Debuff {
  const dot: DebuffDotSpec | null = d.dot
    ? {
        ...d.dot,
        perStackShapes: sanitizePerStackShapes(d.dot.perStackShapes),
        perStackMultipliers: sanitizePerStackMultipliers(d.dot.perStackMultipliers),
      }
    : null
  const rawDetonation = d.detonation as unknown
  const detonation: DotDetonationSpec | null =
    rawDetonation &&
    typeof rawDetonation === "object" &&
    typeof (rawDetonation as DotDetonationSpec).skillId === "string"
      ? {
          ...(rawDetonation as DotDetonationSpec),
          skillId: migrateEntityId((rawDetonation as DotDetonationSpec).skillId),
        }
      : null
  return {
    ...d,
    id: migrateEntityId(d.id),
    classId: migrateClassId(d.classId),
    dot,
    stackScaling: d.stackScaling === "perStack" ? "perStack" : "flat",
    maxStacks: typeof d.maxStacks === "number" && d.maxStacks > 0 ? d.maxStacks : 1,
    detonation,
  }
}

export function loadCustomDebuffs(): Debuff[] {
  migrateStatusStoresIfNeeded()
  try {
    const raw = kvStore.get(CUSTOM_DEBUFFS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomDebuffsBlob
    if (parsed.v !== CUSTOM_DEBUFFS_VERSION) return []
    if (!Array.isArray(parsed.debuffs)) return []
    return parsed.debuffs.filter(isDebuff).map(hydrateDebuff)
  } catch {
    return []
  }
}

export function loadCustomDebuffsForClass(classId: string): Debuff[] {
  return loadCustomDebuffs().filter((d) => d.classId === classId)
}

function writeCustomDebuffs(debuffs: Debuff[]): void {
  try {
    const blob: CustomDebuffsBlob = { v: CUSTOM_DEBUFFS_VERSION, debuffs }
    kvStore.set(CUSTOM_DEBUFFS_KEY, JSON.stringify(blob))
  } catch {}
}

export function saveCustomDebuff(d: Debuff): Debuff[] {
  const next: Debuff = { ...d, updatedAt: new Date().toISOString() }
  const all = loadCustomDebuffs()
  const idx = all.findIndex((x) => x.id === next.id)
  if (idx >= 0) all[idx] = next
  else all.push(next)
  writeCustomDebuffs(all)
  return all
}

export function deleteCustomDebuff(id: string): Debuff[] {
  const all = loadCustomDebuffs().filter((d) => d.id !== id)
  writeCustomDebuffs(all)
  return all
}

export function exportCustomDebuff(d: Debuff): string {
  return JSON.stringify(d, null, 2)
}

export function importCustomDebuff(text: string, targetClassId: string): Debuff {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Imported value is not an object")
  }
  const c = parsed as Partial<Debuff>
  const effects = (Array.isArray(c.effects) ? c.effects : [])
    .filter(isRawStatEffect)
    .filter((e) => e.statKey.startsWith("target."))
    .map((e) => ({ statKey: e.statKey, amount: e.amount }))
  const rawDot = c.dot && typeof c.dot === "object" ? (c.dot as Partial<DebuffDotSpec>) : null
  const dot: DebuffDotSpec | null = rawDot
    ? {
        tickIntervalFrames:
          typeof rawDot.tickIntervalFrames === "number" ? rawDot.tickIntervalFrames : 60,
        physMultiplier: typeof rawDot.physMultiplier === "number" ? rawDot.physMultiplier : 0,
        physFixed: typeof rawDot.physFixed === "number" ? rawDot.physFixed : 0,
        attributeMultiplier:
          typeof rawDot.attributeMultiplier === "number" ? rawDot.attributeMultiplier : 0,
        attributeFixed: typeof rawDot.attributeFixed === "number" ? rawDot.attributeFixed : 0,
        attributeAttack: (rawDot.attributeAttack ?? "") as DebuffDotSpec["attributeAttack"],
        skillType: typeof rawDot.skillType === "string" ? rawDot.skillType : "sustain",
        mysticCategory: typeof rawDot.mysticCategory === "string" ? rawDot.mysticCategory : null,
        count: typeof rawDot.count === "number" ? rawDot.count : 1,
        perStackShapes: sanitizePerStackShapes(rawDot.perStackShapes),
        perStackMultipliers: sanitizePerStackMultipliers(rawDot.perStackMultipliers),
      }
    : null
  const fresh = makeDebuff(targetClassId, {
    name: typeof c.name === "string" ? c.name : "",
    activation: c.activation === "permanent" ? "permanent" : "triggered",
    durationFrames: typeof c.durationFrames === "number" ? c.durationFrames : 600,
    effects,
    dot,
    maxStacks: typeof c.maxStacks === "number" && c.maxStacks > 0 ? c.maxStacks : 1,
    stackScaling: c.stackScaling === "perStack" ? "perStack" : "flat",
  })
  if (!isDebuff(fresh)) {
    throw new Error("Imported debuff failed validation (missing or invalid fields)")
  }
  return fresh
}
