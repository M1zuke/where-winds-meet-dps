import type { GearWordId } from "../data/stats/statLines"
import type { CustomGraduationBuild } from "./customGraduationBuild"
import type { Rotation } from "./rotation"
import type { QiTargetId } from "../definitions/baseStats/qiTargetDef"

export type { GearWordId } from "../data/stats/statLines"
import type { HitOutcome } from "./formula"
import type { Skill } from "./skill"
import type { Buff, BuffStatEffect } from "./buff"
import type { Debuff } from "./debuff"
import type { Effect } from "./effects/effect"

export const ATTRIBUTE_KEYS = ["Bellstrike", "Stonesplit", "Silkbind", "Bamboocut"] as const

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number]

export const WEAPON_NAMES = [
  "Sword",
  "Spear",
  "Fan",
  "Umbrella",
  "Modao",
  "Twin Blades",
  "Rope Dart",
  "Hengdao",
  "Gauntlets",
] as const

export type WeaponName = (typeof WEAPON_NAMES)[number]

export function isWeaponName(value: string): value is WeaponName {
  return (WEAPON_NAMES as readonly string[]).includes(value)
}

export type BowSet = "affinity" | "crit" | "precision" | null

export type ScriptId = "wraithstrikeScript" | "voidrotScript"

export type Arsenal = "general" | "bellstrike" | "stonesplit" | "silkbind" | "bamboocut"

// Keyed by store number (1-10).
export type ArsenalScores = Record<number, number>

export interface AttackBlock {
  min: number
  max: number
  penetration: number
}

export interface QiBreakWindow {
  startSec: number
  /** A window of zero length leaves the pull with no exhausted phase at all. */
  durationSec: number
  lowQiLeadSec: number
}

// Deliberately NOT settings here, because each already has exactly one home and
// a second would double-count it: Fire Oil is the Divinecraft fire choice
// (`Inputs.divinecraft`), Vulnerability is the tank spear debuff
// (`Inputs.shareEasyHurt`), and Formbend has no modeled effect at all.
export interface CombatSettings {
  dragonsBreath: boolean
  healerBuff: boolean
  healerPanaceaFan: boolean
  breakExtension: boolean
  script: ScriptId | null
  dragonHeadFullStacks: boolean
  dragonHeadLowHpMaxBonus: boolean
  // The player's own ground distance to the target between casts — matters
  // only for a distance-reading effect (docs/TIMELINE.md § "Target
  // distance"), which pulls the player closer up to each skill's own reach.
  preferredDistanceMeters: number
  fragrantOrchidBathBean: boolean
}

export function defaultCombatSettings(): CombatSettings {
  return {
    dragonsBreath: false,
    healerBuff: false,
    healerPanaceaFan: false,
    breakExtension: false,
    script: null,
    dragonHeadFullStacks: false,
    dragonHeadLowHpMaxBonus: false,
    preferredDistanceMeters: 3,
    fragrantOrchidBathBean: false,
  }
}

// Numbers are stored as fractions where the panel shows percentages
// (29.2 % → 0.292).
export interface Inputs {
  resourceSettings?: Record<string, import("../definitions/resources/resourceDef").ResourceSettings>
  classId: string
  breakthrough: number
  followedBreakthroughRelease?: number
  // The Qi bar's own stake choice — absent means the default Sword Trial
  // stake (docs/TIMELINE.md § "Qi bar").
  qiTarget?: QiTargetId

  phys: AttackBlock
  bellstrike: AttackBlock
  stonesplit: AttackBlock
  silkbind: AttackBlock
  bamboocut: AttackBlock

  precision: number
  critRate: number
  affinityRate: number
  directCritRate: number
  directAffinityRate: number
  physBoost: number
  critDamageBoost: number
  affinityDamageBoost: number
  attributeDamageBoost: number
  sustainDamageBoost: number
  // Injected at the engine boundary, not persisted.
  allDamageBoost?: number
  independentDamageBoost?: number
  // Qi-only stat keys — read by the Qi formula, not by the HP-damage kernel
  // (docs/CALCULATION.md § "Qi damage"). Injected at the engine boundary, not
  // persisted.
  qiDamageBoost?: number
  qiRateAdd?: number
  qiDamageIndexMultiplier?: number

  allMartialBoost: number
  swordBoost: number
  spearBoost: number
  fanBoost: number
  umbrellaBoost: number
  modaoBoost: number
  dualKnivesBoost: number
  ropeDartBoost: number
  hengDaoBoost: number
  gauntletsBoost: number

  bossBoost: number
  singleMysticBoost: number
  areaMysticBoost: number

  classSpecificAttunement: Record<string, number>

  mindMethods: [MindMethodSlot, MindMethodSlot, MindMethodSlot, MindMethodSlot]

  food: boolean
  divinecraft: "fire" | "poison" | null
  // A `SET_ID` value, never the display name.
  set: string | null
  shareDebuff5HenZhi: boolean
  shareEasyHurt: boolean

  bowSet: BowSet
  arsenal: Arsenal
  arsenalScores: ArsenalScores
  dummyMode: boolean

  rotation: string | null

  selectedBuiltinRotationId?: string | null

  // A per-profile ping/FPS edit for a built-in rotation, keyed by that
  // rotation's id — a built-in's own file is never edited, so the user's
  // change lives here instead (docs/TIMELINE.md § "Coefficients").
  builtinRotationPingFpsOverrides?: Record<string, { pingMs: number; averageFps: number }>

  graduationBuildId?: string | null

  // Injected at the engine boundary, not persisted on the profile blob — the
  // engine never reads storage, so locked fixtures stay byte-exact.
  activeCustomRotation?: Rotation | null
  customGraduationBuild?: CustomGraduationBuild | null
  customSkills?: Skill[] | null
  customBuffs?: Buff[] | null
  customDebuffs?: Debuff[] | null

  buffParams?: Record<string, unknown> | null

  combatSettings?: CombatSettings

  inventory: GearPiece[]
  equipped: EquippedSlots

  martialArtsTalents: MartialArtsTalent[]

  unclaimedOddityNodes: UnclaimedOddityNodes

  disabledTalentNodes: DisabledTalentNodes

  enhancements: EnhancementLevels
}

export type TalentStat =
  | "minPhys"
  | "maxPhys"
  | "physPenetration"
  | "minBellstrike"
  | "maxBellstrike"
  | "bellstrikePenetration"
  | "minStonesplit"
  | "maxStonesplit"
  | "stonesplitPenetration"
  | "minSilkbind"
  | "maxSilkbind"
  | "silkbindPenetration"
  | "minBamboocut"
  | "maxBamboocut"
  | "bamboocutPenetration"
  | "precisionRate"
  | "critRate"
  | "affinityRate"
  | "critDamage"
  | "affinityDamage"
  | "attributeDamage"
  | "maxHp"
  | "physDef"

export type AttributeName = "power" | "agility" | "momentum"

export type ScalingSource =
  | AttributeName
  | "phys.min"
  | "phys.max"
  | "phys.penetration"
  | "bellstrike.min"
  | "bellstrike.max"
  | "bellstrike.penetration"
  | "stonesplit.min"
  | "stonesplit.max"
  | "stonesplit.penetration"
  | "silkbind.min"
  | "silkbind.max"
  | "silkbind.penetration"
  | "bamboocut.min"
  | "bamboocut.max"
  | "bamboocut.penetration"

export interface MartialArtsTalent {
  id: string
  name: string
  enabled: boolean
  stat: TalentStat
  maxBonus: number
  scalesWith: ScalingSource
  scaleMax: number
}

export type UnclaimedOddityNodes = Record<string, readonly number[]>

export type DisabledTalentNodes = readonly number[]

export type GearSlot =
  "leftWeapon" | "rightWeapon" | "disc" | "pendant" | "helm" | "armor" | "greaves" | "bracer"

export const GEAR_SLOTS: readonly GearSlot[] = [
  "leftWeapon",
  "rightWeapon",
  "disc",
  "pendant",
  "helm",
  "armor",
  "greaves",
  "bracer",
]

export const WEAPON_SLOTS: readonly GearSlot[] = ["leftWeapon", "rightWeapon", "disc", "pendant"]

export function isWeaponSlot(slot: GearSlot): boolean {
  return WEAPON_SLOTS.includes(slot)
}

export type EnhancementStat = "minPhys" | "maxPhys" | "maxHp" | "physDef"

export type EnhancementLevels = Record<GearSlot, number>

export const GEAR_LEVELS = [86, 91, 96, 100, 105] as const
export type GearLevel = (typeof GEAR_LEVELS)[number]

export type GearLevelValues = Partial<Record<GearLevel, number>>

export const GEAR_RARITIES = ["legendary", "epic"] as const
export type GearRarity = (typeof GEAR_RARITIES)[number]

export interface GearWordEntry {
  word: GearWordId | ""
  value: number
  retuned: boolean
}

export interface GearPiece {
  id: string
  slot: GearSlot
  level: GearLevel
  rarity: GearRarity
  minPhys: number
  maxPhys: number
  hp: number
  physDef: number
  words: [GearWordEntry, GearWordEntry, GearWordEntry, GearWordEntry, GearWordEntry]
  attunement: string
  attunementValue: number
  relayed: boolean
  isNew?: boolean
  label?: string
  note?: string
  // The retune direction is locked for the life of the item, so this history
  // belongs to the piece rather than to any one word slot.
  retunedOutWords?: readonly GearWordId[]
}

export type EquippedSlots = Record<GearSlot, string | null>

export const EMPTY_EQUIPPED: EquippedSlots = {
  leftWeapon: null,
  rightWeapon: null,
  disc: null,
  pendant: null,
  helm: null,
  armor: null,
  greaves: null,
  bracer: null,
}

export function emptyGearWord(): GearWordEntry {
  return { word: "", value: 0, retuned: false }
}

export function emptyGearWords(): GearPiece["words"] {
  return [emptyGearWord(), emptyGearWord(), emptyGearWord(), emptyGearWord(), emptyGearWord()]
}

export interface MindMethodSlot {
  // The stable identity. `name` is the display string and is kept only so an
  // older saved profile still resolves; `hydrateInputs` fills `id` from it.
  id?: string
  name: string
  stacks: string
}

export interface StoredProfile {
  id: string
  name: string
  inputs: Inputs
}

export type OutcomeCounts = Record<HitOutcome, number>

export interface EngineRunOptions {
  seed?: number
  collect?: "full" | "totals"
  // A prior run's own converged Qi breaks (docs/UI.md § "The rules",
  // "warm-start") — seeds the first pass of the fixed-point iteration instead
  // of the rotation's authored window.
  qiScheduleSeedBreaks?: readonly {
    startFrame: number
    endFrame: number
    immuneUntilFrame: number
  }[]
  // Test-harness only: pins the Qi schedule to exactly these windows for a
  // single pass, no fixed-point iteration. Never read from `Inputs`, storage
  // or the UI.
  fixedQiBreaks?: readonly QiBreakWindow[]
}

export interface Result {
  resources?: import("./resources").ResourceResult[]
  dps: number
  totalDamage: number
  rotationDuration: number
  // The frame of the first damaging hit, in seconds — docs/TIMELINE.md §
  // "Fight window". May be negative when a pre-pull hit itself starts the
  // fight. Every other second below stays on this same absolute clock; a
  // display converts to fight-clock seconds (0 here) through
  // `fightClockSec` — docs/UI.md § "Fight clock".
  fightStartSec: number
  castDuration: number
  graduationRate: number | null
  perSkill: SkillTickResult[]
  ranking: ItemRankingRow[]
  warnings: string[]
  invalidStepIds?: string[]
  invalidStepReasons?: Record<string, import("./skill").ConditionFailureReason[]>
  timeline?: TimelineEvent[]
  buffWindows?: BuffWindow[]
  qiBreakWindow?: { startSec: number; endSec: number } | null
  lowQiWindow?: { startSec: number; endSec: number } | null
  // Every break the Qi bar's own trace recorded this run — docs/TIMELINE.md
  // § "Qi bar". `qiBreakWindow` stays the first one, for the existing lane.
  qiBreaks?: readonly { startSec: number; endSec: number }[]
  // A coarse, sampled Qi fraction over time, for a future chart — never
  // persisted.
  qiTrace?: readonly { timeSec: number; fraction: number }[]
  // How many fixed-point passes the simulated schedule took to converge.
  qiIterations?: number
  casts?: RotationCast[]
  // Optional so `JSON.stringify` drops the keys on an unseeded run and the
  // locked baseline digest stays byte-identical.
  outcomeCounts?: OutcomeCounts
  outcomeDamage?: OutcomeCounts
  expectedOutcomeShare?: OutcomeCounts
}

export interface CastBuffTag {
  id: string
  name: string
  stacks: number
  maxStacks: number
  effects: BuffStatEffect[]
  extras?: Effect[]
  dotIntervalSec?: number
  requires?: string
  description?: string
  remainingSec?: number
}

export interface CastMeterLevel {
  id: string
  name: string
  amount: number
  capacity: number
}

export interface RotationCast {
  index: number
  stepId: string
  stepIndex: number
  skillName: string
  timeSec: number
  inWindow: boolean
  prePull: boolean
  buffs: CastBuffTag[]
  meterLevels?: CastMeterLevel[]
  // The simulated ground distance to the target as of this cast's own start
  // — docs/TIMELINE.md § "Target distance".
  distanceMeters: number
  // Set on an automatic Deflect Cancel: the `stepId` of the cancel-form cast
  // it is attached to — docs/TIMELINE.md § "Identity and tags".
  attachedToStepId?: string
}

export interface SkillTickResult {
  name: string
  breakdownName: string
  breakdownKey: string
  type: "weapon" | "mindMethod" | "mystic" | "sustain" | "settlement" | "weaponMystic" | string
  count: number
  expectedDamage: number
  percentOfTotal: number
  castCount?: number
}

export interface TimelineEvent {
  frame: number
  timeSec: number
  skillName: string
  type: string
  kind: "hit" | "dot"
  damage: number
  inWindow: boolean
}

export interface BuffWindow {
  id: string
  name: string
  startSec: number
  endSec: number
}

export interface ItemRankingRow {
  statLineId: string
  label: string
  labelKey: string
  source: "tunement" | "attunement"
  amount: number
  unit: "raw" | "percent"
  expectedDps: number
  dpsDelta: number
  liftPercent: number
  leadVsMin: number | string
}
