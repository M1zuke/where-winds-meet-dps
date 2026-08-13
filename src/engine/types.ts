import type { Rotation } from "./rotation"
import type { Skill } from "./skill"
import type { Buff, BuffStatEffect } from "./buff"
import type { Debuff } from "./debuff"

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
] as const

export type WeaponName = (typeof WEAPON_NAMES)[number]

export function isWeaponName(value: string): value is WeaponName {
  return (WEAPON_NAMES as readonly string[]).includes(value)
}

export type BowSet = "affinity" | "crit" | "precision" | null

export type Arsenal = "general" | "bellstrike" | "stonesplit" | "silkbind" | "bamboocut"

export interface AttackBlock {
  min: number
  max: number
  penetration: number
}

export interface QiBreakSettings {
  enabled: boolean
  startSec: number
  durationSec: number
}

// Deliberately NOT settings here, because each already has exactly one home and
// a second would double-count it: Fire Oil is the Divinecraft fire choice
// (`Inputs.tianGongElement`), Vulnerability is the tank spear debuff
// (`Inputs.shareEasyHurt`), and Formbend has no modeled effect at all.
export interface CombatSettings {
  qiBreak: QiBreakSettings
  dragonsBreath: boolean
  healerBuff: boolean
  breakExtension: boolean
  revelryScript: boolean
  dragonHeadFullStacks: boolean
  dragonHeadLowHpMaxBonus: boolean
}

export function defaultCombatSettings(): CombatSettings {
  return {
    qiBreak: { enabled: true, startSec: 25, durationSec: 10 },
    dragonsBreath: false,
    healerBuff: false,
    breakExtension: false,
    revelryScript: false,
    dragonHeadFullStacks: false,
    dragonHeadLowHpMaxBonus: false,
  }
}

// Numbers are stored as fractions where the panel shows percentages
// (29.2 % → 0.292).
export interface Inputs {
  classId: string
  breakthrough: number

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

  allMartialBoost: number
  swordBoost: number
  spearBoost: number
  fanBoost: number
  umbrellaBoost: number
  modaoBoost: number
  dualKnivesBoost: number
  ropeDartBoost: number
  hengDaoBoost: number

  bossBoost: number
  singleMysticBoost: number
  areaMysticBoost: number

  classSpecificAttunement: Record<string, number>

  mindMethods: [MindMethodSlot, MindMethodSlot, MindMethodSlot, MindMethodSlot]

  food: boolean
  tianGongElement: "fire" | "poison" | null
  // A `SET_ID` value, never the display name.
  set: string | null
  shareDebuff5HenZhi: boolean
  shareEasyHurt: boolean

  bowSet: BowSet
  arsenal: Arsenal
  dummyMode: boolean

  rotation: string | null

  selectedBuiltinRotationId?: string | null

  // Injected at the engine boundary, not persisted on the profile blob — the
  // engine never reads storage, so locked fixtures stay byte-exact.
  activeCustomRotation?: Rotation | null
  customSkills?: Skill[] | null
  customBuffs?: Buff[] | null
  customDebuffs?: Debuff[] | null

  buffParams?: Record<string, unknown> | null

  combatSettings?: CombatSettings

  inventory: GearPiece[]
  equipped: EquippedSlots

  martialArtsTalents: MartialArtsTalent[]

  oddities: OddityRegions
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

export interface OddityNode {
  id: number
  stat: TalentStat
  value: number
  enabled: boolean
  icon?: string
}

export type OddityRegions = Record<string, OddityNode[]>

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

export type GearLevel = 86 | 91 | 96
export type GearRarity = "legendary" | "epic"

const UNPATTERNED_GEAR_WORD_NAMES = [
  "Power",
  "Agility",
  "Momentum",
  "Min Phys",
  "Max Phys",
  "Precision",
  "Crit",
  "Affinity",
  "All Martial Boost",
  "Damage VS Boss %",
  "Single-Target Mystic Skill DMG Boost",
  "Area Mystic Skill DMG Boost",
  "Min Void Attack",
  "Max Void Attack",
  "Physical Penetration",
  "Attribute Penetration",
] as const

export type GearWordName =
  | (typeof UNPATTERNED_GEAR_WORD_NAMES)[number]
  | `${WeaponName} Martial Boost`
  | `Min ${AttributeKey}`
  | `Max ${AttributeKey}`

const GEAR_WORD_NAMES: ReadonlySet<string> = new Set<GearWordName>([
  ...UNPATTERNED_GEAR_WORD_NAMES,
  ...WEAPON_NAMES.map((weapon) => `${weapon} Martial Boost` as const),
  ...ATTRIBUTE_KEYS.flatMap((attribute) => [`Min ${attribute}`, `Max ${attribute}`] as const),
])

export function isGearWordName(value: unknown): value is GearWordName {
  return typeof value === "string" && GEAR_WORD_NAMES.has(value)
}

export interface GearWordEntry {
  word: GearWordName | ""
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

export interface Result {
  dps: number
  totalDamage: number
  rotationDuration: number
  graduationRate: number | null
  perSkill: SkillTickResult[]
  ranking: ItemRankingRow[]
  warnings: string[]
  timeline?: TimelineEvent[]
  buffWindows?: BuffWindow[]
  qiBreakWindow?: { startSec: number; endSec: number } | null
  casts?: RotationCast[]
}

export interface CastBuffTag {
  id: string
  name: string
  stacks: number
  maxStacks: number
  effects: BuffStatEffect[]
  dotIntervalSec?: number
  requires?: string
  description?: string
  remainingSec?: number
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
}

export interface SkillTickResult {
  name: string
  type: "weapon" | "mindMethod" | "mystic" | "sustain" | "settlement" | "weaponMystic" | string
  count: number
  expectedDamage: number
  percentOfTotal: number
  castCount?: number
  castTimeSec?: number
  dpsOfCastTime?: number
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
  word: string
  source: "tunement" | "attunement"
  amount: number
  unit: "raw" | "percent"
  expectedDps: number
  dpsDelta: number
  liftPercent: number
  leadVsMin: number | string
}
