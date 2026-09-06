import type {
  DisabledTalentPoints,
  EnhancementSlot,
  Inputs,
  OddityNode,
  OddityRegions,
  StoredProfile,
  TalentStat,
} from "./engine/types"
import { EMPTY_EQUIPPED, defaultCombatSettings } from "./engine/types"
import { isGearWordId } from "./data/stats/statLines"
import { defaultInputs } from "./engine/defaults"
import { allowedInnerWaysForClass, defaultArsenalForClass } from "./engine/panel"
import { CLASS_IDS } from "./definitions/classes/registry"
import { SET_BY_ID } from "./definitions/sets/registry"
import {
  innerWayIdForName,
  innerWayName,
  resolveInnerWayId,
} from "./definitions/innerWays/registry"
import { withoutDerivedStats, withZeroedDerivedStats } from "./engine/derivedInputs"
import {
  clampEnhancementValue,
  getDefaultTalentsForClass,
  DEFAULT_ENHANCEMENTS,
  DEFAULT_ODDITIES,
} from "./definitions/baseStats"
import {
  defaultBreakthrough,
  newestBreakthroughRelease,
  releasedBreakthroughs,
} from "./definitions/baseStats/breakthroughs"
import type { Rotation, RotationStep } from "./engine/rotation"
import { newRotationId, newStepId, isRotation } from "./engine/rotation"
import type { Skill, SkillHit, HitTrigger, TriggerCondition, HitVariant } from "./engine/skill"
import {
  newSkillId,
  newHitId,
  newVariantId,
  isSkill,
  isHitVariant,
  isQiPhase,
  isTriggerCondition,
} from "./engine/skill"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./engine/builtinLibrary"
import { belongsToClass, seedSkillFromBuiltin } from "./engine/skill"
import { castTagOf } from "./engine/buffs/tags"
import type { Buff, BuffScope, BuffStatEffect } from "./engine/buff"
import type { StatKey } from "./engine/statRegistry"
import { isBuff, makeBuff, newBuffId } from "./engine/buff"
import type { Debuff, DebuffDotSpec, DotDetonationSpec, DotStackShape } from "./engine/debuff"
import { isDebuff, makeDebuff } from "./engine/debuff"
import { kvStore } from "./kvStore"
import {
  LATEST_CUSTOM_SKILLS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
  runCustomSkillMigrations,
  migrateNeverAbradesSkill,
  type RawCustomSkillsBlob,
} from "./migrations/customSkills"
import {
  LATEST_CUSTOM_DEBUFFS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "./migrations/customDebuffs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  migrateClassId,
  migrateEntityId,
  migrateMysticId,
  migrateRotationMysticIds,
  migrateGearWordId,
  migrateCurrentGearWordLabel,
  migrateFormlessWordId,
  migrateSetId,
  migrateAttunementId,
  migrateAttuneTag,
  migrateCleftpeakBuffId,
  migrateRiverFlowBuffId,
  migrateCleftpeakSetId,
  migrateCleftpeakTag,
  dropRetiredRotationId,
  qiBreakOverrideFrom,
  rotationWindowOf,
  readQiBreakWindow,
} from "./migrations"

export { migrateClassId, migrateEntityId } from "./migrations"

const migrateBuffId = (buffId: string): string =>
  migrateRiverFlowBuffId(migrateCleftpeakBuffId(buffId))

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

export function sanitizeGearPieceText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed || undefined
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
    next.permanentBuffIds = r.permanentBuffIds.map((buffId) =>
      migrateBuffId(migrateEntityId(buffId)),
    )
  }
  if (r.openingStacks !== undefined) next.openingStacks = sanitizeOpeningStacks(r.openingStacks)
  if (r.qiBreak !== undefined) {
    const window = readQiBreakWindow(r.qiBreak)
    if (window) next.qiBreak = window
    else delete next.qiBreak
  }
  delete (next as unknown as Record<string, unknown>).prePullHitsCount
  return migrateRotationMysticIds(next) as unknown as T
}

// additive — see CLAUDE.md → "localStorage migrations"
function sanitizeOpeningStacks(stored: unknown): Record<string, number> {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {}
  const healed: Record<string, number> = {}
  for (const [buffId, stacks] of Object.entries(stored as Record<string, unknown>)) {
    if (typeof stacks !== "number" || !Number.isFinite(stacks) || stacks < 0) continue
    const whole = Math.floor(stacks)
    if (whole > 0) healed[migrateBuffId(migrateEntityId(buffId))] = whole
  }
  return healed
}

// A word this build cannot resolve is kept exactly as stored, roll included. It
// scores nothing — every consumer skips a word with no spec — and clearing it
// would destroy a roll the build that wrote it understood, which is what a
// profile saved by a newer build and opened by an older one looks like.
function repairGearWord(entry: unknown): unknown {
  if (!entry || typeof entry !== "object") return entry
  const stored = (entry as { word?: unknown }).word
  if (typeof stored !== "string") return entry
  const renamed = migrateFormlessWordId(migrateCurrentGearWordLabel(migrateGearWordId(stored)))
  return isGearWordId(renamed) ? { ...entry, word: renamed } : { ...entry, word: stored }
}

// The live registry is the allowlist, never `migrateSetId`'s table: that table
// is frozen at the display names V11 knew, so it recognises neither a set
// retired since nor one added since, and run alone it clears a legitimate
// selection on every load. It survives here only as the pre-V11 display-name
// hop for the two paths that never walk the chain — a bare imported profile
// and the legacy `wwm.inputs` blob.
//
// A set id neither table nor registry knows is one this build has no option
// for, and is handed back as stored rather than cleared.
function selectableSetId(stored: string | null): string | null {
  const renamed = migrateCleftpeakSetId(stored)
  if (typeof renamed === "string" && SET_BY_ID[renamed] !== undefined) return renamed
  const migrated = migrateCleftpeakSetId(migrateSetId(stored))
  if (typeof migrated === "string" && SET_BY_ID[migrated] !== undefined) return migrated
  return typeof stored === "string" && stored !== "" ? stored : null
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
  // A class id naming a class that no longer exists degrades to the default
  // build's class rather than reaching `getSchool()`, which throws on an
  // unknown id — see CLAUDE.md → "localStorage migrations".
  if (!CLASS_IDS().includes(next.classId)) next.classId = defaultInputs.classId
  next.selectedBuiltinRotationId = dropRetiredRotationId(
    migrateEntityId(next.selectedBuiltinRotationId),
  )
  next.set = selectableSetId(next.set)
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
    next.breakthrough = LEGACY_TARGET_TO_BREAKTHROUGH[trial] ?? defaultBreakthrough()
  }
  delete (next as unknown as Record<string, unknown>).targetId
  delete (next as unknown as Record<string, unknown>).shareDebuff5JingShen
  if (typeof next.dummyMode !== "boolean") next.dummyMode = false
  if (typeof next.allDamageBoost !== "number") next.allDamageBoost = 0
  if (typeof next.gauntletsBoost !== "number") next.gauntletsBoost = 0
  delete (next as unknown as Record<string, unknown>).singleBurstBoost
  delete (next as unknown as Record<string, unknown>).singleControlBoost
  delete (next as unknown as Record<string, unknown>).groupAnomalyBoost
  delete (next as unknown as Record<string, unknown>).groupDamageBoost
  if ("customSkills" in next) next.customSkills = undefined
  if ("customBuffs" in next) next.customBuffs = undefined
  if ("customDebuffs" in next) next.customDebuffs = undefined
  if (next.activeCustomRotation != null && !isRotation(next.activeCustomRotation)) {
    next.activeCustomRotation = null
  }
  if (typeof next.selectedBuiltinRotationId !== "string") next.selectedBuiltinRotationId = null
  delete (next as unknown as Record<string, unknown>).calcMode
  // A selection this build has no option for is another build's, kept as
  // stored: it matches no bonus here, and the panel that offers the choices
  // shows none of them selected. Only a missing or non-string value falls back.
  const storedBowSet = (next as unknown as Record<string, unknown>).bowSet
  if (typeof storedBowSet !== "string" || storedBowSet === "") next.bowSet = null
  const storedArsenal = (next as unknown as Record<string, unknown>).arsenal
  if (typeof storedArsenal !== "string" || storedArsenal === "") {
    next.arsenal = defaultArsenalForClass(next.classId)
  }
  if (!Array.isArray(next.inventory)) next.inventory = []
  next.inventory = next.inventory.map((piece) => {
    const p = piece as Partial<typeof piece> & Record<string, unknown>
    const { name: _legacyName, isNew: _rawIsNew, label: _rawLabel, note: _rawNote, ...rest } = p
    void _legacyName
    void _rawIsNew
    void _rawLabel
    void _rawNote
    const isNew = p.isNew === true
    const label = sanitizeGearPieceText(p.label, 40)
    const note = sanitizeGearPieceText(p.note, 500)
    const rawWords = (rest as unknown as { words?: unknown }).words
    const words = Array.isArray(rawWords) ? rawWords.map(repairGearWord) : rawWords
    return {
      ...(rest as unknown as typeof piece),
      ...(words !== undefined ? { words: words as typeof piece.words } : {}),
      relayed: typeof p.relayed === "boolean" ? p.relayed : false,
      attunement: typeof p.attunement === "string" ? migrateAttunementId(p.attunement) : "",
      attunementValue: typeof p.attunementValue === "number" ? p.attunementValue : 0,
      ...(isNew ? { isNew: true } : {}),
      ...(label ? { label } : {}),
      ...(note ? { note } : {}),
    }
  })
  if (!next.equipped || typeof next.equipped !== "object") {
    next.equipped = { ...EMPTY_EQUIPPED }
  } else {
    next.equipped = { ...EMPTY_EQUIPPED, ...next.equipped }
  }
  // additive value-level repair — see CLAUDE.md → "localStorage migrations"
  //
  // A slot used to be identified by its display name. It now carries a stable
  // `id`, healed here from whatever the profile stored.
  //
  // A slot naming an inner way this build has no definition for is kept as
  // stored — it resolves to no definition, so it reaches no panel stat and no
  // mechanic. A slot naming one this build knows but the class may not hold is
  // cleared instead: that one would be scored, and scoring a build the class
  // cannot have is the invisible wrong number the allowlist exists to stop.
  if (Array.isArray(next.mindMethods)) {
    const allowed = new Set(allowedInnerWaysForClass(next.classId))
    const seen = new Set<string>()
    next.mindMethods = next.mindMethods.map((slot) => {
      if (!slot) return slot
      const innerWayId = slot.name || slot.id ? resolveInnerWayId(slot.id ?? slot.name) : ""
      const known = !!innerWayId && !!innerWayIdForName(innerWayName(innerWayId))
      const disallowed = !!innerWayId && allowed.size > 0 && !allowed.has(innerWayId)
      const duplicate = !!innerWayId && seen.has(innerWayId)
      if (!innerWayId) return { ...slot, id: undefined, name: "", stacks: "" }
      if (!known) return { ...slot, id: innerWayId, stacks: slot.stacks || "tier 6" }
      if (disallowed || duplicate) return { id: undefined, name: "", stacks: "" }
      seen.add(innerWayId)
      return {
        ...slot,
        id: innerWayId,
        name: innerWayName(innerWayId),
        stacks: slot.stacks || "tier 6",
      }
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
    const stored = next.disabledTalentPoints as unknown
    const healed: DisabledTalentPoints = {}
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      for (const [tier, ids] of Object.entries(stored as Record<string, unknown>)) {
        if (!Array.isArray(ids)) continue
        const numeric = [...new Set(ids.filter((id): id is number => typeof id === "number"))].sort(
          (left, right) => left - right,
        )
        if (numeric.length > 0) healed[tier] = numeric
      }
    }
    next.disabledTalentPoints = healed
  }
  {
    const stored = Array.isArray(next.enhancements) ? (next.enhancements as unknown[]) : []
    const healed = stored
      .filter((node): node is Record<string, unknown> => !!node && typeof node === "object")
      .map((node, index) => {
        const id = typeof node.id === "number" ? node.id : index + 1
        const fallback = DEFAULT_ENHANCEMENTS.find((entry) => entry.id === id)
        return {
          id,
          slot:
            typeof node.slot === "string"
              ? (node.slot as EnhancementSlot)
              : (fallback?.slot ?? "disc"),
          stat:
            typeof node.stat === "string"
              ? (node.stat as TalentStat)
              : (fallback?.stat ?? "maxPhys"),
          value: clampEnhancementValue(
            id,
            typeof node.value === "number" ? node.value : (fallback?.value ?? 0),
          ),
        }
      })
    const storedIds = new Set(healed.map((node) => node.id))
    next.enhancements = [
      ...healed,
      ...DEFAULT_ENHANCEMENTS.filter((entry) => !storedIds.has(entry.id)).map((entry) => ({
        ...entry,
      })),
    ]
  }
  {
    const def = defaultCombatSettings()
    const raw = (next as unknown as { combatSettings?: unknown }).combatSettings
    const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
    if (r.fireOil === true && next.tianGongElement == null) next.tianGongElement = "fire"
    if (r.vulnerability === true) next.shareEasyHurt = true
    next.combatSettings = {
      qiBreakOverride: qiBreakOverrideFrom(r, rotationWindowOf(next)),
      dragonsBreath: typeof r.dragonsBreath === "boolean" ? r.dragonsBreath : def.dragonsBreath,
      healerBuff: typeof r.healerBuff === "boolean" ? r.healerBuff : def.healerBuff,
      breakExtension: typeof r.breakExtension === "boolean" ? r.breakExtension : def.breakExtension,
      revelryScript: typeof r.revelryScript === "boolean" ? r.revelryScript : def.revelryScript,
      dragonHeadFullStacks:
        typeof r.dragonHeadFullStacks === "boolean"
          ? r.dragonHeadFullStacks
          : def.dragonHeadFullStacks,
      dragonHeadLowHpMaxBonus:
        typeof r.dragonHeadLowHpMaxBonus === "boolean"
          ? r.dragonHeadLowHpMaxBonus
          : def.dragonHeadLowHpMaxBonus,
      lowEndurance: typeof r.lowEndurance === "boolean" ? r.lowEndurance : def.lowEndurance,
    }
  }
  return withZeroedDerivedStats(next)
}

function makeDefaultProfile(name: string, inputs: Inputs): StoredProfile {
  return { id: newProfileId(), name, inputs: hydrateInputs(inputs) }
}

function followBreakthroughReleases(inputs: Inputs, now: number): Inputs {
  const newestRelease = newestBreakthroughRelease(now)
  const followedRelease =
    typeof inputs.followedBreakthroughRelease === "number" ? inputs.followedBreakthroughRelease : 0
  if (followedRelease === newestRelease) return inputs
  let breakthrough = inputs.breakthrough
  for (const release of releasedBreakthroughs(now)) {
    if (release.breakthrough <= followedRelease) continue
    const supersededDefault = defaultBreakthrough(release.at - 1)
    if (breakthrough === supersededDefault) breakthrough = release.breakthrough
  }
  return { ...inputs, breakthrough, followedBreakthroughRelease: newestRelease }
}

export function loadProfiles(): ProfilesState & { firstRun: boolean } {
  const now = Date.now()
  try {
    const raw = kvStore.get(PROFILES_KEY)
    if (raw) {
      const result = runProfileMigrations(JSON.parse(raw))
      const migrated = result?.blob as ProfilesBlob | undefined
      if (migrated && Array.isArray(migrated.profiles)) {
        const hydrated = migrated.profiles
          .filter(isStoredProfile)
          .map((stored) => ({ ...stored, inputs: hydrateInputs(stored.inputs) }))
        const profiles = hydrated.map((profile) => ({
          ...profile,
          inputs: followBreakthroughReleases(profile.inputs, now),
        }))
        const releaseFollowed = profiles.some(
          (profile, index) => profile.inputs !== hydrated[index].inputs,
        )
        if (profiles.length > 0) {
          const activeId = profiles.some((p) => p.id === migrated.activeId)
            ? migrated.activeId
            : profiles[0].id
          // Persist the upgraded blob so the chain is walked once, not per load.
          // Never for a blob a newer build wrote: the walk left it alone, and
          // writing it back would stamp it at this build's version and hand it
          // whatever this build made of the fields it does not know.
          const storedByNewerBuild = typeof migrated.v === "number" && migrated.v > PROFILES_VERSION
          if (
            !storedByNewerBuild &&
            (releaseFollowed ||
              (result && (result.applied.length > 0 || migrated.v !== PROFILES_VERSION)))
          ) {
            saveProfiles({ profiles, activeId })
          }
          return { profiles, activeId, firstRun: false }
        }
      }
    }
  } catch {}

  const legacy = loadInputs()
  if (legacy) {
    const legacyProfile = makeDefaultProfile("Default", legacy)
    const profile = {
      ...legacyProfile,
      inputs: followBreakthroughReleases(legacyProfile.inputs, now),
    }
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
    openingStacks: sanitizeOpeningStacks(candidate.openingStacks),
    createdAt: now,
    updatedAt: now,
  }
  const importedQiBreak = readQiBreakWindow(candidate.qiBreak)
  if (importedQiBreak) fresh.qiBreak = importedQiBreak
  if (!isRotation(fresh)) {
    throw new Error("Imported rotation failed validation (missing or invalid fields)")
  }
  return fresh
}

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

interface CustomSkillsBlob {
  v: number
  skills: Skill[]
}

// A Skill Editor copy saved before the tag existed still scores Dragon Head -
// Plus without its qi-break doubling, and nothing in the UI would show that.
const QI_BREAK_DOUBLE_TAG = "prop:hasQiBreakDoubleDamage"

// additive value-level repair — see CLAUDE.md → "localStorage migrations"
//
// A skill seeded from a built-in copies that built-in's tags at the moment it
// was seeded, so `role:` / `cast:` tags added to a built-in afterwards are
// missing from stored copies — and without them a seeded copy silently stops
// receiving the buffs its original receives. Unioning is safe because no editor
// surface can remove one of these tags.
let builtinTagsById: Map<string, string[]> | null = null
function builtinTagsFor(id: string): string[] {
  if (!builtinTagsById) {
    builtinTagsById = new Map()
    for (const classId of CLASS_IDS())
      for (const skill of builtinSkillsForClass(classId))
        if (skill.tags?.length) builtinTagsById.set(skill.id, skill.tags)
  }
  return builtinTagsById.get(id) ?? []
}

function healSkillTags(id: string, tags: string[]): string[] {
  const renamed = tags.map((tag) => migrateCleftpeakTag(migrateAttuneTag(tag)))
  const healed = new Set(renamed)
  for (const tag of builtinTagsFor(id)) healed.add(tag)
  if (id.endsWith("-dragon-head-plus")) healed.add(QI_BREAK_DOUBLE_TAG)
  const unchanged =
    healed.size === tags.length && renamed.every((tag, index) => tag === tags[index])
  return unchanged ? tags : [...healed]
}

// Additive, no version bump — see CLAUDE.md → "localStorage migrations". Before
// `Skill.receives` / `Skill.triggersBuffs` / `Debuff.receives` existed, a buff
// def named who it reached (`affects`) and what cast set it off (`triggeredBy`)
// itself; a skill or debuff saved under that scheme carries neither field, and
// its old reach is recoverable purely from the `role:` / `type:` / `cast:` tags
// it already carries. These are the exact `affects` / `triggeredBy` values every
// def declared before the inversion, frozen here rather than read from the
// (now-inverted) defs — storage is specified by the shape it was written in.
const LEGACY_AFFECTS: Record<string, readonly string[]> = {
  "role:bleedTick": ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"],
  "role:bleedDetonation": [
    "bellstrikeUmbraBleedPen",
    "bellstrikeUmbraBleedingDamage",
    "buff-bellstrikeUmbra-zenith-bar",
  ],
  "role:combustion": ["bellstrikeUmbraBleedingDamage"],
  "role:fireOil": ["bellstrikeUmbraBleedingDamage"],
  "role:fivefoldBleed": ["bellstrikeUmbraBleedingDamage"],
  "role:phalanxCharged": ["mountainSplitter"],
  "role:anxiSoldierMoDown": ["mountainSplitter"],
  "role:anxiSoldierMoJump": ["mountainSplitter"],
  "role:snowpartingVC": [
    "frostCladSnowbreak",
    "frostCladSnowbreakIPConsume",
    "frostCladSnowbreakT6",
  ],
  "role:dragonHeadPlus": ["dragonHeadLowHp"],
  "role:dragonHead": ["surgingWaves"],
  "type:sustain": ["soulShaken"],
  "prop:shatteredRidgeBoost": ["shatteredRidgeDeflect"],
}
const LEGACY_TRIGGERED_BY: Record<string, readonly string[]> = {
  "cast:anxiSoldierMoDown": ["mountainSplitter", "throatPierced"],
  "cast:anxiSoldierMoJump": ["mountainSplitter", "throatPierced"],
  "cast:anxiSoldierMoSweep": ["mountainSplitter", "throatPierced"],
  "cast:phalanxSpecial": ["ironGuards"],
  "cast:phalanxSpecialPrepull": ["ironGuards"],
  "cast:phalanxChargedS3": ["throatPierced", "chargeEnhancement"],
  "cast:phalanxChargedS3InnerPassion": ["throatPierced", "chargeEnhancement"],
  "cast:anxiSoldierHeng": ["throatPierced"],
  "cast:snowpartingQStab": ["throatPierced"],
  "cast:snowpartingVC": ["throatPierced", "forgetfulness"],
  "cast:snowpartingVCPrepull": ["throatPierced", "forgetfulness"],
  "cast:phalanxQ": ["throatPierced"],
  "cast:snowpartingCharged": ["forgetfulness"],
  "cast:snowpartingChargedForgetfulness": ["forgetfulness"],
  "cast:snowpartingDual": ["forgetfulness"],
  "cast:snowpartingDualPrepull": ["forgetfulness"],
  "cast:deflect": ["forgetfulness"],
  "cast:snowpartingSpecial": ["innerPassion", "jadeware"],
  "cast:spearQ": ["potentRiverFlow", "wineGu", "soulShaken", "jadeware"],
  "cast:spearQ0HitCancel": ["potentRiverFlow", "wineGu", "soulShaken", "jadeware"],
  "cast:spearQ5HitCancel": ["potentRiverFlow", "wineGu", "soulShaken", "jadeware"],
  "cast:spearQPrepull": ["potentRiverFlow", "wineGu", "soulShaken", "jadeware"],
  "cast:spearHeavy": ["soulShaken"],
  "cast:spearHeavy1Hit": ["soulShaken"],
  "cast:spearHeavy1HitPrepull": ["soulShaken"],
  "cast:perfectDodge": ["mirageBonus"],
  "cast:perfectDodgeFull": ["mirageBonus"],
  "cast:ghostlySteps": ["mirage"],
  "cast:healerBuff": ["healerBuff"],
  "cast:dragonHeadPlus": ["surgingWaves"],
  "cast:goldenBodyCancel": ["rainwhisperShield"],
  "cast:goldenBodyDeflectCancel": ["rainwhisperShield"],
  "cast:moBladeQ": ["rainwhisperShield", "jadeware"],
  "cast:moBladeQPrepull": ["rainwhisperShield", "jadeware"],
  "cast:fanQ": ["jadeware"],
  "cast:fanQCancel": ["jadeware"],
  "cast:fanQPrepull": ["jadeware"],
  "cast:ropeQ": ["jadeware"],
  "cast:ropeQ1Hit": ["jadeware"],
  "cast:swordMartialQ": ["jadeware"],
  "cast:swordMartialQQ": ["jadeware"],
  "cast:swordMartialQQ1HitCancel": ["jadeware"],
  "cast:swordMartialQQ2HitCancel": ["jadeware"],
  "cast:swordMartialQQQ": ["jadeware"],
  "cast:swordQ": ["jadeware"],
  "cast:swordQ2nd": ["jadeware"],
  "cast:umbQ": ["jadeware"],
  "cast:umbQPrepull": ["jadeware"],
  "cast:umbrellaQ": ["jadeware"],
  "cast:umbrellaQEmpoweredPerfectCatch": ["jadeware"],
  "cast:umbrellaQPerfectCatch": ["jadeware"],
}

const MIGRATED_LEGACY_AFFECTS = new Map(
  Object.entries(LEGACY_AFFECTS).map(([tag, buffIds]) => [
    migrateCleftpeakTag(tag),
    buffIds.map(migrateBuffId),
  ]),
)

function legacyReceives(tags: readonly string[]): string[] {
  return [
    ...new Set(tags.flatMap((tag) => MIGRATED_LEGACY_AFFECTS.get(migrateCleftpeakTag(tag)) ?? [])),
  ]
}

// additive value-level repair — see CLAUDE.md → "localStorage migrations"
//
// The list each of these built-ins carried while it was still missing the set
// buff its Martial Art tag entitles it to. A copy seeded then never activates
// the set, and no editor surface shows the gap. Only a list still identical to
// what was seeded is rewritten, same reason as the coefficient repair below.
const TRIGGERS_BUFFS_BEFORE_JADEWARE: Record<string, readonly string[]> = {
  "bellstrikeSplendor-swordq-2nd": ["mountainsMightQiImbalance"],
  "bellstrikeSplendor-spearq-0-hit-cancel": ["endlessGale", "mountainsMight", "qiImbalance"],
  "bellstrikeSplendor-spearq-prepull": ["endlessGale", "mountainsMight", "qiImbalance"],
}

function healJadewareTrigger(id: string, triggersBuffs: string[]): string[] {
  const seeded = TRIGGERS_BUFFS_BEFORE_JADEWARE[id]
  if (!seeded) return triggersBuffs
  const untouched =
    triggersBuffs.length === seeded.length &&
    seeded.every((buffId, index) => triggersBuffs[index] === buffId)
  return untouched ? ["jadeware", ...triggersBuffs] : triggersBuffs
}

// A skill's `type:<skillType>` tag is derived, never stored, so it is added
// back in before the lookup — matching `skillTagsOf` (`engine/buffs/tags.ts`).
function healSkillReach(
  id: string,
  skill: Pick<Skill, "receives" | "triggersBuffs" | "tags" | "skillType" | "castTag" | "name">,
  tags: readonly string[],
): Pick<Skill, "receives" | "triggersBuffs"> {
  const legacyTags = skill.skillType ? [...tags, `type:${skill.skillType}`] : tags
  const receives = Array.isArray(skill.receives) ? skill.receives : legacyReceives(legacyTags)
  const triggersBuffs = Array.isArray(skill.triggersBuffs)
    ? skill.triggersBuffs
    : [...(LEGACY_TRIGGERED_BY[castTagOf(skill)] ?? [])]
  return {
    receives: receives.map(migrateBuffId),
    triggersBuffs: healJadewareTrigger(id, triggersBuffs).map(migrateBuffId),
  }
}

function healDebuffReceives(debuff: Pick<Debuff, "receives" | "tags" | "dot">): string[] {
  if (Array.isArray(debuff.receives)) return debuff.receives.map(migrateBuffId)
  const tags = debuff.tags ?? []
  const legacyTags = debuff.dot ? [...tags, `type:${debuff.dot.skillType || "sustain"}`] : tags
  return legacyReceives(legacyTags)
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateSkill(s: Skill): Skill {
  if (!s || typeof s !== "object") return s
  const { abilityTag: _legacyAbilityTag, ...rest } = s as Skill & { abilityTag?: string }
  void _legacyAbilityTag
  const id = migrateEntityId(s.id)
  const tags = Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === "string") : []
  const healedTags = healSkillTags(id, tags)
  const reachTags = [...new Set([...tags, ...healedTags])]
  return {
    ...rest,
    id,
    classId: migrateClassId(s.classId),
    triggerable: typeof s.triggerable === "boolean" ? s.triggerable : true,
    tags: healedTags,
    hits: Array.isArray(s.hits) ? s.hits.map((h) => hydrateSkillHit(h)) : s.hits,
    ...healSkillReach(id, s, reachTags),
  }
}

function hydrateSkillHit(h: SkillHit): SkillHit {
  if (!h || typeof h !== "object") return h
  const hit: SkillHit = { ...h }
  if (Array.isArray(h.variants)) {
    hit.variants = h.variants.filter(isHitVariant).map((v) => ({
      ...v,
      conditions: v.conditions.filter(isTriggerCondition).map(migrateTriggerCondition),
    }))
  } else {
    delete hit.variants
  }
  if (Array.isArray(h.triggers)) {
    hit.triggers = h.triggers.map((tr) => hydrateHitTrigger(tr))
  }
  if (Array.isArray(h.conditions)) {
    hit.conditions = h.conditions.filter(isTriggerCondition).map(migrateTriggerCondition)
  } else {
    delete hit.conditions
  }
  return hit
}

function migrateTriggerCondition(condition: TriggerCondition): TriggerCondition {
  return { ...condition, buffId: migrateMysticId(migrateBuffId(condition.buffId)) }
}

function hydrateHitTrigger(tr: HitTrigger): HitTrigger {
  if (!tr || typeof tr !== "object") return tr
  const trigger: HitTrigger = {
    ...tr,
    targetId: migrateMysticId(migrateBuffId(migrateEntityId(tr.targetId))),
    condition: tr.condition ? migrateTriggerCondition(tr.condition) : null,
  }
  if (Array.isArray(tr.conditions)) {
    trigger.conditions = tr.conditions.filter(isTriggerCondition).map(migrateTriggerCondition)
  } else {
    delete trigger.conditions
  }
  return trigger
}

export function loadCustomSkills(): Skill[] {
  try {
    const raw = kvStore.get(CUSTOM_SKILLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RawCustomSkillsBlob
    if (typeof parsed.v !== "number" || parsed.v < OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION)
      return []
    const result = runCustomSkillMigrations(parsed)
    if (!result || !Array.isArray(result.blob.skills)) return []
    const skills = result.blob.skills.map((skill) => hydrateSkill(skill as Skill)).filter(isSkill)
    const storedByNewerBuild = result.blob.v > LATEST_CUSTOM_SKILLS_VERSION
    if (!storedByNewerBuild && (result.applied.length > 0 || parsed.v !== result.blob.v)) {
      writeCustomSkills(skills)
    }
    return skills
  } catch {
    return []
  }
}

export function loadCustomSkillsForClass(classId: string): Skill[] {
  return loadCustomSkills().filter((s) => belongsToClass(s, classId))
}

function writeCustomSkills(skills: Skill[]): void {
  try {
    const blob: CustomSkillsBlob = { v: LATEST_CUSTOM_SKILLS_VERSION, skills }
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
  return loadCustomSkills()
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
    kind: c.kind === "castSkill" ? "castSkill" : "applyBuff",
    targetId: typeof c.targetId === "string" ? c.targetId : "",
    stacks: typeof c.stacks === "number" ? c.stacks : 1,
    condition,
  }
  if (Array.isArray(c.conditions)) {
    trigger.conditions = c.conditions.filter(isTriggerCondition)
  }
  if (typeof c.transferFrom === "string" && c.transferFrom) trigger.transferFrom = c.transferFrom
  if (isQiPhase(c.phase)) trigger.phase = c.phase
  if (
    typeof c.cooldownFrames === "number" &&
    Number.isFinite(c.cooldownFrames) &&
    c.cooldownFrames >= 0
  )
    trigger.cooldownFrames = c.cooldownFrames
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
  if (Array.isArray(c.conditions)) {
    const conditions = c.conditions.filter(isTriggerCondition)
    if (conditions.length > 0) hit.conditions = conditions
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
    neverAbrades:
      (migrateNeverAbradesSkill(c) as Partial<Skill>).neverAbrades === true ? true : undefined,
    guaranteedNormal: c.guaranteedNormal === true ? true : undefined,
    tags: Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === "string") : [],
    receives: Array.isArray(c.receives)
      ? c.receives.filter((id): id is string => typeof id === "string")
      : undefined,
    triggersBuffs: Array.isArray(c.triggersBuffs)
      ? c.triggersBuffs.filter((id): id is string => typeof id === "string")
      : undefined,
    createdAt: now,
    updatedAt: now,
  }
  const healed = hydrateSkill(fresh)
  if (!isSkill(healed)) {
    throw new Error("Imported skill failed validation (missing or invalid fields)")
  }
  return healed
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
  groupAnomalyBoost: "areaMysticBoost",
  groupDamageBoost: "areaMysticBoost",
}

function withRenamedStatKeys(effects: BuffStatEffect[]): BuffStatEffect[] {
  if (!Array.isArray(effects)) return effects
  return effects.map((effect) =>
    effect && typeof effect.statKey === "string" && LEGACY_STAT_KEY_RENAMES[effect.statKey]
      ? { ...effect, statKey: LEGACY_STAT_KEY_RENAMES[effect.statKey] as StatKey }
      : effect,
  )
}

// additive — see CLAUDE.md → "localStorage migrations"
function hydrateBuff(b: Buff): Buff {
  const { dot: _drop, ...rest0 } = b as Buff & { dot?: unknown }
  void _drop
  const rest = { ...rest0, id: migrateEntityId(b.id), classId: migrateClassId(b.classId) }
  const hydrated: Buff = {
    ...(rest as Buff),
    scope: b.scope === "team" ? "team" : "player",
    stackScaling: b.stackScaling === "perStack" ? "perStack" : "flat",
    maxStacks: typeof b.maxStacks === "number" && b.maxStacks > 0 ? b.maxStacks : 1,
    effects: withRenamedStatKeys(b.effects),
  }
  if (b.onExpire)
    hydrated.onExpire = { ...b.onExpire, targetId: migrateMysticId(b.onExpire.targetId) }
  if (Array.isArray(b.onMaxStacks)) hydrated.onMaxStacks = b.onMaxStacks.map(hydrateHitTrigger)
  return hydrated
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
              weaponOrAttribute:
                typeof rawDot.weaponOrAttribute === "string" ? rawDot.weaponOrAttribute : null,
              mysticCategory:
                typeof rawDot.mysticCategory === "string" ? rawDot.mysticCategory : null,
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
      existingDebuffs = readStoredDebuffs().debuffs
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

interface CustomDebuffsBlob {
  v: number
  debuffs: Debuff[]
}

// additive — see CLAUDE.md → "localStorage migrations"
// additive value-level repair — see CLAUDE.md → "localStorage migrations"
//
// The reach each Umbrella Drone debuff carried while its ticks neither extended
// the Lingering Bone mark nor doubled under it. A copy seeded then keeps
// scoring unenhanced projectiles and lets the mark lapse mid-window, with no
// editor surface showing the gap. Only a list still identical to what was
// seeded is rewritten: `receives` is user-editable, so a copy that differs may
// differ on purpose.
const DRONE_DEBUFF_RECEIVES_BEFORE_LINGERING_BONE = ["soulShaken"]
const DRONE_DEBUFF_ID = /^debuff-silkbindJade-umbdrone-\d+hit$/

function healDroneDebuffReach(d: Debuff): Pick<Debuff, "receives" | "triggersBuffs"> {
  const receives = healDebuffReceives(d)
  const triggersBuffs = d.triggersBuffs?.map(migrateBuffId)
  if (!DRONE_DEBUFF_ID.test(d.id)) return { receives, triggersBuffs }
  const seeded =
    receives.length === DRONE_DEBUFF_RECEIVES_BEFORE_LINGERING_BONE.length &&
    DRONE_DEBUFF_RECEIVES_BEFORE_LINGERING_BONE.every((id, index) => receives[index] === id)
  if (!seeded) return { receives, triggersBuffs }
  return {
    receives: [...receives, "lingeringBone"],
    triggersBuffs: triggersBuffs?.length ? triggersBuffs : ["lingeringBone"],
  }
}

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
    effects: withRenamedStatKeys(d.effects),
    stackScaling: d.stackScaling === "perStack" ? "perStack" : "flat",
    maxStacks: typeof d.maxStacks === "number" && d.maxStacks > 0 ? d.maxStacks : 1,
    detonation,
    ...healDroneDebuffReach(d),
  }
}

function readStoredDebuffs(): { debuffs: Debuff[]; persist: boolean } {
  const raw = kvStore.get(CUSTOM_DEBUFFS_KEY)
  if (!raw) return { debuffs: [], persist: false }
  const parsed = JSON.parse(raw) as RawCustomDebuffsBlob
  if (typeof parsed.v !== "number" || parsed.v < OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION) {
    return { debuffs: [], persist: false }
  }
  const result = runCustomDebuffMigrations(parsed)
  if (!result || !Array.isArray(result.blob.debuffs)) return { debuffs: [], persist: false }
  const storedByNewerBuild = result.blob.v > LATEST_CUSTOM_DEBUFFS_VERSION
  return {
    debuffs: result.blob.debuffs.filter(isDebuff).map(hydrateDebuff),
    persist: !storedByNewerBuild && (result.applied.length > 0 || parsed.v !== result.blob.v),
  }
}

export function loadCustomDebuffs(): Debuff[] {
  migrateStatusStoresIfNeeded()
  try {
    const { debuffs, persist } = readStoredDebuffs()
    if (persist) writeCustomDebuffs(debuffs)
    return debuffs
  } catch {
    return []
  }
}

export function loadCustomDebuffsForClass(classId: string): Debuff[] {
  return loadCustomDebuffs().filter((d) => belongsToClass(d, classId))
}

function writeCustomDebuffs(debuffs: Debuff[]): void {
  try {
    const blob: CustomDebuffsBlob = { v: LATEST_CUSTOM_DEBUFFS_VERSION, debuffs }
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
  return loadCustomDebuffs()
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
        weaponOrAttribute:
          typeof rawDot.weaponOrAttribute === "string" ? rawDot.weaponOrAttribute : null,
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
    receives: Array.isArray(c.receives)
      ? c.receives.filter((id): id is string => typeof id === "string")
      : undefined,
    triggersBuffs: Array.isArray(c.triggersBuffs)
      ? c.triggersBuffs.filter((id): id is string => typeof id === "string")
      : undefined,
  })
  const healed = hydrateDebuff(fresh)
  if (!isDebuff(healed)) {
    throw new Error("Imported debuff failed validation (missing or invalid fields)")
  }
  return healed
}
