// A line with a `maxRoll` is a rollable gear word; one without is display-only.
// A line with a `category` is a buff-targetable stat, so its `enginePath` is a
// `StatKey` and `statRegistry.ts` derives its `StatDef` from this line.
// A line with no `enginePath` lifts more than one field, or resolves against the
// class's primary attribute rather than a fixed block.
import { getAttunement } from "../../engine/attunements"

export type StatLineUnit = "raw" | "percent"
export type StatLineScope = "player" | "target"

export interface StatLineDef {
  id: string
  label: string
  unit: StatLineUnit
  enginePath?: string
  maxRoll?: number
  scope?: StatLineScope
  category?: string
}

export const STAT_LINES = [
  { id: "power", label: "Power", unit: "raw", maxRoll: 49.4 },
  { id: "agility", label: "Agility", unit: "raw", maxRoll: 49.4 },
  { id: "momentum", label: "Momentum", unit: "raw", maxRoll: 49.4 },
  {
    id: "precision",
    label: "Precision Rate",
    unit: "percent",
    enginePath: "precision",
    maxRoll: 0.08,
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "crit",
    label: "Critical Rate",
    unit: "percent",
    enginePath: "critRate",
    maxRoll: 0.09,
    scope: "player",
    category: "Three Rates",
  },
  {
    id: "affinity",
    label: "Affinity Rate",
    unit: "percent",
    enginePath: "affinityRate",
    maxRoll: 0.044,
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
    label: "All Martial Boost",
    unit: "percent",
    enginePath: "allMartialBoost",
    maxRoll: 0.032,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "swordBoost",
    label: "Art of Sword DMG Boost",
    unit: "percent",
    enginePath: "swordBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "spearBoost",
    label: "Art of Spear DMG Boost",
    unit: "percent",
    enginePath: "spearBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "fanBoost",
    label: "Art of Fan DMG Boost",
    unit: "percent",
    enginePath: "fanBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "umbrellaBoost",
    label: "Art of Umbrella DMG Boost",
    unit: "percent",
    enginePath: "umbrellaBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "modaoBoost",
    label: "Art of Modao DMG Boost",
    unit: "percent",
    enginePath: "modaoBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "dualKnivesBoost",
    label: "Art of Twin Blades DMG Boost",
    unit: "percent",
    enginePath: "dualKnivesBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "ropeDartBoost",
    label: "Art of Rope Dart DMG Boost",
    unit: "percent",
    enginePath: "ropeDartBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "hengDaoBoost",
    label: "Art of Hengdao DMG Boost",
    unit: "percent",
    enginePath: "hengDaoBoost",
    maxRoll: 0.062,
    scope: "player",
    category: "Martial Boosts",
  },
  {
    id: "damageVsBoss",
    label: "Combat Boost Against Boss Units",
    unit: "percent",
    enginePath: "bossBoost",
    maxRoll: 0.032,
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "singleTargetMysticBoost",
    label: "Single-Target Mystic Skill DMG Boost",
    unit: "percent",
    enginePath: "singleMysticBoost",
    maxRoll: 0.09797,
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "areaMysticBoost",
    label: "Area Mystic Skill DMG Boost",
    unit: "percent",
    enginePath: "areaMysticBoost",
    maxRoll: 0.07,
    scope: "player",
    category: "Target-Type Boosts",
  },
  {
    id: "minPhys",
    label: "Min Physical Attack",
    unit: "raw",
    enginePath: "phys.min",
    maxRoll: 77.8,
    scope: "player",
    category: "Phys",
  },
  {
    id: "maxPhys",
    label: "Max Physical Attack",
    unit: "raw",
    enginePath: "phys.max",
    maxRoll: 77.8,
    scope: "player",
    category: "Phys",
  },
  {
    id: "physicalPenetration",
    label: "Physical Penetration",
    unit: "percent",
    enginePath: "phys.penetration",
    maxRoll: getAttunement("physPen")?.max ?? 0.078,
    scope: "player",
    category: "Phys",
  },
  {
    id: "minBellstrike",
    label: "Min Bellstrike Attack",
    unit: "raw",
    enginePath: "bellstrike.min",
    maxRoll: 44.2,
    scope: "player",
    category: "Bellstrike",
  },
  {
    id: "maxBellstrike",
    label: "Max Bellstrike Attack",
    unit: "raw",
    enginePath: "bellstrike.max",
    maxRoll: 44.2,
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
    maxRoll: 44.2,
    scope: "player",
    category: "Stonesplit",
  },
  {
    id: "maxStonesplit",
    label: "Max Stonesplit Attack",
    unit: "raw",
    enginePath: "stonesplit.max",
    maxRoll: 44.2,
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
    maxRoll: 44.2,
    scope: "player",
    category: "Silkbind",
  },
  {
    id: "maxSilkbind",
    label: "Max Silkbind Attack",
    unit: "raw",
    enginePath: "silkbind.max",
    maxRoll: 44.2,
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
    maxRoll: 44.2,
    scope: "player",
    category: "Bamboocut",
  },
  {
    id: "maxBamboocut",
    label: "Max Bamboocut Attack",
    unit: "raw",
    enginePath: "bamboocut.max",
    maxRoll: 44.2,
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
  { id: "minVoidAttack", label: "Min Void Attack", unit: "raw", maxRoll: 44.2 },
  { id: "maxVoidAttack", label: "Max Void Attack", unit: "raw", maxRoll: 44.2 },
  {
    id: "formlessPenetration",
    label: "Formless Penetration",
    unit: "percent",
    maxRoll: getAttunement("formlessPen")?.max ?? 0.092,
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
  {
    id: "targetFatigueDamageTaken",
    label: "Target Exhaustion Boost",
    unit: "percent",
    enginePath: "target.fatigueDamageTaken",
    scope: "target",
    category: "Target",
  },
  { id: "hp", label: "HP", unit: "raw", enginePath: "hp" },
  { id: "physDef", label: "Phys Defense", unit: "raw", enginePath: "physDef" },
] as const satisfies readonly StatLineDef[]

export type StatLineId = (typeof STAT_LINES)[number]["id"]

export type GearWordId = Extract<(typeof STAT_LINES)[number], { maxRoll: number }>["id"]

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

export const GEAR_WORD_MAX_ROLL: Readonly<Record<GearWordId, number>> = Object.fromEntries(
  GEAR_WORD_LINES.map((line) => [line.id, line.maxRoll]),
) as Record<GearWordId, number>

export const GEAR_WORD_UNIT: Readonly<Record<GearWordId, StatLineUnit>> = Object.fromEntries(
  GEAR_WORD_LINES.map((line) => [line.id, line.unit]),
) as Record<GearWordId, StatLineUnit>

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
