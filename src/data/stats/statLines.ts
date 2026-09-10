// A line with a `maxRoll` is a rollable gear word; one without is display-only.
// A line with a `category` is a buff-targetable stat, so its `enginePath` is a
// `StatKey` and `statRegistry.ts` derives its `StatDef` from this line.
// A line with no `enginePath` lifts more than one field, or resolves against the
// class's primary attribute rather than a fixed block.
import { getAttunement } from "../../engine/attunements"
import { statLineKey } from "../../i18n/contentKeys"
import type { GearLevel, GearLevelValues } from "../../engine/types"

export type StatLineUnit = "raw" | "percent"
export type StatLineScope = "player" | "target"

export interface StatLineDef {
  id: string
  label: string
  unit: StatLineUnit
  enginePath?: string
  maxRoll?: GearLevelValues
  scope?: StatLineScope
  category?: string
}

// Gear-level ladder, 5-star (in-game, 2026-09-07). Several ceilings are shared
// verbatim across many stat lines — each constant below is one ladder row.
const ATTRIBUTE_CEILING: GearLevelValues = { 86: 34.8, 91: 40.4, 96: 49.4, 100: 57.4, 105: 66.8 }
const ATTACK_CEILING: GearLevelValues = { 86: 31, 91: 36.2, 96: 44.2, 100: 51.4, 105: 59.8 }
const PHYS_ATTACK_CEILING: GearLevelValues = { 86: 54.8, 91: 63.8, 96: 77.8, 100: 90.6, 105: 105.6 }
const VOID_ATTACK_CEILING: GearLevelValues = { 96: 44.2, 100: 51.4, 105: 59.8 }
const MARTIAL_ART_BOOST_CEILING: GearLevelValues = {
  86: 0.044,
  91: 0.052,
  96: 0.062,
  100: 0.074,
  105: 0.086,
}
const MYSTIC_BOOST_CEILING: GearLevelValues = {
  86: 0.07,
  91: 0.08,
  96: 0.098,
  100: 0.114,
  105: 0.134,
}

export const STAT_LINES = [
  { id: "power", label: "Power", unit: "raw", maxRoll: ATTRIBUTE_CEILING },
  { id: "agility", label: "Agility", unit: "raw", maxRoll: ATTRIBUTE_CEILING },
  { id: "momentum", label: "Momentum", unit: "raw", maxRoll: ATTRIBUTE_CEILING },
  { id: "body", label: "Constitution", unit: "raw" },
  { id: "defense", label: "Defense", unit: "raw" },
  {
    id: "precision",
    label: "Precision Rate",
    unit: "percent",
    enginePath: "precision",
    maxRoll: { 86: 0.056, 91: 0.066, 96: 0.08, 100: 0.094, 105: 0.108 },
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "crit",
    label: "Critical Rate",
    unit: "percent",
    enginePath: "critRate",
    maxRoll: { 86: 0.064, 91: 0.074, 96: 0.09, 100: 0.104, 105: 0.122 },
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "affinity",
    label: "Affinity Rate",
    unit: "percent",
    enginePath: "affinityRate",
    maxRoll: { 86: 0.032, 91: 0.036, 96: 0.044, 100: 0.052, 105: 0.06 },
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "directCritRate",
    label: "Direct Crit",
    unit: "percent",
    enginePath: "directCritRate",
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "directAffinityRate",
    label: "Direct Affinity",
    unit: "percent",
    enginePath: "directAffinityRate",
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "physBoost",
    label: "Physical Damage Boost",
    unit: "percent",
    enginePath: "physBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "critDamageBoost",
    label: "Crit Damage Boost",
    unit: "percent",
    enginePath: "critDamageBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "affinityDamageBoost",
    label: "Affinity Damage Boost",
    unit: "percent",
    enginePath: "affinityDamageBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "attributeDamageBoost",
    label: "Attribute Damage Boost",
    unit: "percent",
    enginePath: "attributeDamageBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "sustainDamageBoost",
    label: "Sustain Damage Boost",
    unit: "percent",
    enginePath: "sustainDamageBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "allDamageBoost",
    label: "General Damage Boost",
    unit: "percent",
    enginePath: "allDamageBoost",
    scope: "player",
    category: "Damage Boosts",
  },
  {
    id: "allMartialBoost",
    label: "All Martial Arts Boost",
    unit: "percent",
    enginePath: "allMartialBoost",
    maxRoll: { 86: 0.022, 91: 0.026, 96: 0.032, 100: 0.036, 105: 0.042 },
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "swordBoost",
    label: "Art of Sword DMG Boost",
    unit: "percent",
    enginePath: "swordBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "spearBoost",
    label: "Art of Spear DMG Boost",
    unit: "percent",
    enginePath: "spearBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "fanBoost",
    label: "Art of Fan DMG Boost",
    unit: "percent",
    enginePath: "fanBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "umbrellaBoost",
    label: "Art of Umbrella DMG Boost",
    unit: "percent",
    enginePath: "umbrellaBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "modaoBoost",
    label: "Art of Modao DMG Boost",
    unit: "percent",
    enginePath: "modaoBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "dualKnivesBoost",
    label: "Art of Twin Blades DMG Boost",
    unit: "percent",
    enginePath: "dualKnivesBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "ropeDartBoost",
    label: "Art of Rope Dart DMG Boost",
    unit: "percent",
    enginePath: "ropeDartBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "hengDaoBoost",
    label: "Art of Hengdao DMG Boost",
    unit: "percent",
    enginePath: "hengDaoBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "gauntletsBoost",
    label: "Art of Gauntlets DMG Boost",
    unit: "percent",
    enginePath: "gauntletsBoost",
    maxRoll: MARTIAL_ART_BOOST_CEILING,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "damageVsBoss",
    label: "Combat Boost Against Boss Units",
    unit: "percent",
    enginePath: "bossBoost",
    maxRoll: { 86: 0.024, 91: 0.026, 96: 0.032, 100: 0.038, 105: 0.044 },
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "singleTargetMysticBoost",
    label: "Single-Target Mystic Skill DMG Boost",
    unit: "percent",
    enginePath: "singleMysticBoost",
    maxRoll: MYSTIC_BOOST_CEILING,
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "areaMysticBoost",
    label: "Area Mystic Skill DMG Boost",
    unit: "percent",
    enginePath: "areaMysticBoost",
    maxRoll: MYSTIC_BOOST_CEILING,
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "minPhys",
    label: "Min Physical Attack",
    unit: "raw",
    enginePath: "phys.min",
    maxRoll: PHYS_ATTACK_CEILING,
    scope: "player",
    category: "Phys",
  },
  {
    id: "maxPhys",
    label: "Max Physical Attack",
    unit: "raw",
    enginePath: "phys.max",
    maxRoll: PHYS_ATTACK_CEILING,
    scope: "player",
    category: "Phys",
  },
  {
    id: "physicalPenetration",
    label: "Physical Penetration",
    unit: "percent",
    enginePath: "phys.penetration",
    maxRoll: getAttunement("physPen")?.max ?? {},
    scope: "player",
    category: "Phys",
  },
  {
    id: "minBellstrike",
    label: "Min Bellstrike Attack",
    unit: "raw",
    enginePath: "bellstrike.min",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Bellstrike",
  },
  {
    id: "maxBellstrike",
    label: "Max Bellstrike Attack",
    unit: "raw",
    enginePath: "bellstrike.max",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Bellstrike",
  },
  {
    id: "bellstrikePenetration",
    label: "Bellstrike Penetration",
    unit: "percent",
    enginePath: "bellstrike.penetration",
    scope: "player",
    category: "Bellstrike",
  },
  {
    id: "minStonesplit",
    label: "Min Stonesplit Attack",
    unit: "raw",
    enginePath: "stonesplit.min",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Stonesplit",
  },
  {
    id: "maxStonesplit",
    label: "Max Stonesplit Attack",
    unit: "raw",
    enginePath: "stonesplit.max",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Stonesplit",
  },
  {
    id: "stonesplitPenetration",
    label: "Stonesplit Penetration",
    unit: "percent",
    enginePath: "stonesplit.penetration",
    scope: "player",
    category: "Stonesplit",
  },
  {
    id: "minSilkbind",
    label: "Min Silkbind Attack",
    unit: "raw",
    enginePath: "silkbind.min",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Silkbind",
  },
  {
    id: "maxSilkbind",
    label: "Max Silkbind Attack",
    unit: "raw",
    enginePath: "silkbind.max",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Silkbind",
  },
  {
    id: "silkbindPenetration",
    label: "Silkbind Penetration",
    unit: "percent",
    enginePath: "silkbind.penetration",
    scope: "player",
    category: "Silkbind",
  },
  {
    id: "minBamboocut",
    label: "Min Bamboocut Attack",
    unit: "raw",
    enginePath: "bamboocut.min",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Bamboocut",
  },
  {
    id: "maxBamboocut",
    label: "Max Bamboocut Attack",
    unit: "raw",
    enginePath: "bamboocut.max",
    maxRoll: ATTACK_CEILING,
    scope: "player",
    category: "Bamboocut",
  },
  {
    id: "bamboocutPenetration",
    label: "Bamboocut Penetration",
    unit: "percent",
    enginePath: "bamboocut.penetration",
    scope: "player",
    category: "Bamboocut",
  },
  { id: "minFormless", label: "Min Formless Attack", unit: "raw", maxRoll: VOID_ATTACK_CEILING },
  { id: "maxFormless", label: "Max Formless Attack", unit: "raw", maxRoll: VOID_ATTACK_CEILING },
  {
    id: "formlessPenetration",
    label: "Formless Penetration",
    unit: "percent",
    maxRoll: getAttunement("formlessPen")?.max ?? {},
  },
  {
    id: "targetDefense",
    label: "Target Defense",
    unit: "raw",
    enginePath: "target.defense",
    scope: "target",
    category: "Target",
  },
  {
    id: "targetDefensePct",
    label: "Target Defense %",
    unit: "percent",
    enginePath: "target.defensePct",
    scope: "target",
    category: "Target",
  },
  {
    id: "targetGeneralDamageTaken",
    label: "Target Vulnerability",
    unit: "percent",
    enginePath: "target.generalDamageTaken",
    scope: "target",
    category: "Target",
  },
  // Retired: no engine path, so it is display-only and unpickable. Do not
  // re-add one — nothing consumes it. Id/label stay for a profile that
  // already stored this stat on a custom buff or debuff.
  { id: "targetFatigueDamageTaken", label: "Target Exhaustion Boost", unit: "percent" },
  { id: "hp", label: "HP", unit: "raw", enginePath: "hp" },
  { id: "physDef", label: "Phys Defense", unit: "raw", enginePath: "physDef" },
  { id: "maxHp", label: "Max HP", unit: "raw" },
] as const satisfies readonly StatLineDef[]

export type StatLineId = (typeof STAT_LINES)[number]["id"]

export type GearWordId = Extract<(typeof STAT_LINES)[number], { maxRoll: object }>["id"]

export type StatPathKey = Extract<(typeof STAT_LINES)[number], { category: string }>["enginePath"]

const STAT_LINE_DEFS: readonly StatLineDef[] = STAT_LINES

const STAT_LINE_BY_ID = new Map(STAT_LINE_DEFS.map((line) => [line.id, line]))

export function statLine(id: string): StatLineDef | undefined {
  return STAT_LINE_BY_ID.get(id)
}

export function statLineLabel(id: string): string {
  return STAT_LINE_BY_ID.get(id)?.label ?? id
}

export const GEAR_WORD_LINES: readonly StatLineDef[] = STAT_LINE_DEFS.filter(
  (line) => line.maxRoll !== undefined,
)

export const GEAR_WORD_IDS = GEAR_WORD_LINES.map((line) => line.id) as readonly GearWordId[]

const GEAR_WORD_ID_SET: ReadonlySet<string> = new Set<string>(GEAR_WORD_IDS)

const GEAR_WORD_ID_BY_PATH = new Map(
  GEAR_WORD_LINES.filter((line) => line.enginePath).map((line) => [
    line.enginePath as string,
    line.id as GearWordId,
  ]),
)

export function gearWordIdForPath(enginePath: string | undefined): GearWordId | undefined {
  return enginePath ? GEAR_WORD_ID_BY_PATH.get(enginePath) : undefined
}

export function isGearWordId(value: unknown): value is GearWordId {
  return typeof value === "string" && GEAR_WORD_ID_SET.has(value)
}

// A word a profile holds that this build has no line for — a roll another build
// wrote and this one must keep without showing or scoring it.
export function isUnknownGearWord(value: unknown): boolean {
  return typeof value === "string" && value !== "" && !GEAR_WORD_ID_SET.has(value)
}

export const GEAR_WORD_MAX_ROLL: Readonly<Record<GearWordId, GearLevelValues>> = Object.fromEntries(
  GEAR_WORD_LINES.map((line) => [line.id, line.maxRoll]),
) as Record<GearWordId, GearLevelValues>

export const GEAR_WORD_UNIT: Readonly<Record<GearWordId, StatLineUnit>> = Object.fromEntries(
  GEAR_WORD_LINES.map((line) => [line.id, line.unit]),
) as Record<GearWordId, StatLineUnit>

/** 0 for a word that does not roll at this level — see the ladder's `—` rule. */
export function gearWordMaxRoll(word: GearWordId, level: GearLevel): number {
  return GEAR_WORD_MAX_ROLL[word][level] ?? 0
}

export const STAT_PATH_LINES: readonly (StatLineDef & {
  enginePath: string
  scope: StatLineScope
  category: string
})[] = STAT_LINE_DEFS.filter(
  (line): line is StatLineDef & { enginePath: string; scope: StatLineScope; category: string } =>
    !!line.enginePath && !!line.category && !!line.scope,
)

const PLAYER_PATHED_LINES = STAT_LINE_DEFS.filter(
  (line): line is StatLineDef & { enginePath: string } =>
    !!line.enginePath && line.scope !== "target",
)

export const PATH_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  PLAYER_PATHED_LINES.map((line) => [line.enginePath, line.label]),
)

export const PATH_STAT_LINE_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  PLAYER_PATHED_LINES.map((line) => [line.enginePath, statLineKey(line.id)]),
)

// Penetration paths are percent-valued but render through `fmtPenetration`, so
// they are deliberately absent here and listed separately below.
export const PERCENT_PATHS: ReadonlySet<string> = new Set(
  PLAYER_PATHED_LINES.filter(
    (line) => line.unit === "percent" && !line.enginePath.endsWith(".penetration"),
  ).map((line) => line.enginePath),
)

export const PENETRATION_PATHS: ReadonlySet<string> = new Set(
  PLAYER_PATHED_LINES.filter((line) => line.enginePath.endsWith(".penetration")).map(
    (line) => line.enginePath,
  ),
)
