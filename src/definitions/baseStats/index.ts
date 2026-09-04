import { ARSENAL_BONUS, getSchool } from "../../engine/panel"
import { formlessWordTotals, gearAttributeTotals } from "../../engine/gearStats"
import { APP_PLAYER_LEVEL } from "../../engine/buffs/levelAttributeBonus"
import { tierFromStacks } from "../innerWays/innerWayDef"
import { innerWayDefinition, innerWayLadderStats, slotInnerWayId } from "../innerWays/registry"
import type {
  AttributeKey,
  DisabledTalentPoints,
  EnhancementNode,
  EnhancementSlot,
  GearPiece,
  Inputs,
  MartialArtsTalent,
  OddityNode,
  OddityRegions,
  ScalingSource,
  TalentStat,
} from "../../engine/types"
import baseStatsJson from "../../data/baseStats/baseStats.json"
import { TALENT_POINTS, TALENT_POINT_TIERS } from "../../data/baseStats"
import odditiesJson from "../../data/baseStats/oddities.json"
import enhancementsJson from "../../data/baseStats/enhancements.json"
import classSkillBoostsJson from "../../data/baseStats/classSkillBoosts.json"
import type { TalentPointDef } from "./talentPointDef"
import { isTalentPointEnabled } from "./talentPointGroups"
import { breakthroughAttributes } from "./breakthroughs"
import { AGILITY_PER_POINT, MOMENTUM_PER_POINT, POWER_PER_POINT } from "./attributeConversion"

export * from "./talentPointGroups"
export type { TalentPointStat, TalentPointEffects, TalentPointDef } from "./talentPointDef"

const BASE_LEVEL = APP_PLAYER_LEVEL
const ENHANCEMENT_TIER = "95"

type BaseStatsByLevel = Record<string, Record<string, number>>

interface BaseEntry {
  id: number
  stat: string
  value: number
}

type TieredEntries = Record<string, BaseEntry[]>

interface EnhancementEntry extends BaseEntry {
  slot: string
}

type TieredEnhancements = Record<string, EnhancementEntry[]>

interface BaseAccumulator {
  minPhys: number
  maxPhys: number
  precision: number
  critRate: number
  affinityRate: number
  critDamageBoost: number
  affinityDamageBoost: number
  minFormless: number
  maxFormless: number
  power: number
  agility: number
  momentum: number
}

function readBaseLevel(): BaseAccumulator {
  const row = (baseStatsJson as BaseStatsByLevel)[String(BASE_LEVEL)]
  if (!row) throw new Error(`baseStats.json missing Level ${BASE_LEVEL}`)
  const get = (key: string) => row[key] ?? 0
  return {
    minPhys: get("MIN_W_ATK"),
    maxPhys: get("MAX_W_ATK"),
    precision: get("ACR_PROB"),
    critRate: get("CRI_PROB"),
    affinityRate: get("BASH_PROB"),
    critDamageBoost: get("W_ATK_CRI_UP"),
    affinityDamageBoost: get("BASH_UP"),
    minFormless: 0,
    maxFormless: 0,
    power: 0,
    agility: 0,
    momentum: 0,
  }
}

function applyEntry(acc: BaseAccumulator, entry: BaseEntry): void {
  switch (entry.stat) {
    case "minPhys":
      acc.minPhys += entry.value
      break
    case "maxPhys":
      acc.maxPhys += entry.value
      break
    case "precisionRate":
      acc.precision += entry.value
      break
    case "critRate":
      acc.critRate += entry.value
      break
    case "affinityRate":
      acc.affinityRate += entry.value
      break
    case "critDamage":
      acc.critDamageBoost += entry.value
      break
    case "affinityDamage":
      acc.affinityDamageBoost += entry.value
      break
    case "minFormless":
      acc.minFormless += entry.value
      break
    case "maxFormless":
      acc.maxFormless += entry.value
      break
    case "power":
      acc.power += entry.value
      break
    case "agility":
      acc.agility += entry.value
      break
    case "momentum":
      acc.momentum += entry.value
      break
  }
}

function applyAll(acc: BaseAccumulator, entries: readonly BaseEntry[] | undefined): void {
  if (!entries) return
  for (const entry of entries) applyEntry(acc, entry)
}

function applyTalentPoints(
  acc: BaseAccumulator,
  tier: string,
  points: readonly TalentPointDef[],
  disabled: DisabledTalentPoints | undefined,
): void {
  for (const point of points) {
    if (!isTalentPointEnabled(disabled, tier, point.id)) continue
    for (const [stat, value] of Object.entries(point.effects)) {
      applyEntry(acc, { id: point.id, stat, value })
    }
  }
}

function buildAccumulator(
  breakthrough: number,
  disabled: DisabledTalentPoints | undefined,
): BaseAccumulator {
  const acc = readBaseLevel()
  for (const tier of TALENT_POINT_TIERS) {
    applyTalentPoints(acc, tier, TALENT_POINTS[tier], disabled)
  }
  applyAll(acc, breakthroughAttributes(breakthrough))
  return acc
}

export interface PlayerAttributes {
  power: number
  agility: number
  momentum: number
}

const ACCUMULATOR_BY_SELECTION = new Map<string, BaseAccumulator>()
const ATTRIBUTES_BY_SELECTION = new Map<string, Readonly<PlayerAttributes>>()
const GLOBAL_BASE_BY_SELECTION = new Map<string, Readonly<Record<string, number>>>()

const MAX_CACHED_SELECTIONS = 64

function selectionKey(breakthrough: number, disabled: DisabledTalentPoints | undefined): string {
  const tiers = Object.entries(disabled ?? {})
    .filter(([, ids]) => ids.length > 0)
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([tier, ids]) => `${tier}:${[...ids].sort((left, right) => left - right).join(",")}`)
  return `${breakthrough}|${tiers.join(";")}`
}

function cached<T>(store: Map<string, T>, key: string, build: () => T): T {
  const hit = store.get(key)
  if (hit) return hit
  if (store.size >= MAX_CACHED_SELECTIONS) store.clear()
  const built = build()
  store.set(key, built)
  return built
}

function accumulatorFor(breakthrough: number, disabled?: DisabledTalentPoints): BaseAccumulator {
  return cached(ACCUMULATOR_BY_SELECTION, selectionKey(breakthrough, disabled), () =>
    buildAccumulator(breakthrough, disabled),
  )
}

export function playerAttributes(
  breakthrough: number,
  disabled?: DisabledTalentPoints,
): Readonly<PlayerAttributes> {
  return cached(ATTRIBUTES_BY_SELECTION, selectionKey(breakthrough, disabled), () => {
    const acc = accumulatorFor(breakthrough, disabled)
    return { power: acc.power, agility: acc.agility, momentum: acc.momentum }
  })
}

export interface FormlessAttack {
  min: number
  max: number
}

export function formlessAttack(
  breakthrough: number,
  disabled?: DisabledTalentPoints,
): Readonly<FormlessAttack> {
  const acc = accumulatorFor(breakthrough, disabled)
  return { min: acc.minFormless, max: acc.maxFormless }
}

// A readout, not an engine path: the damage math keeps Formless attack inside
// the primary attribute block and never subtracts this back out.
export function totalFormlessAttack(
  inputs: Inputs,
  equippedPieces: readonly GearPiece[],
): Readonly<FormlessAttack> {
  const fromTalents = formlessAttack(inputs.breakthrough, inputs.disabledTalentPoints)
  const fromGear = formlessWordTotals(equippedPieces, inputs)
  return { min: fromTalents.min + fromGear.min, max: fromTalents.max + fromGear.max }
}

export function globalBase(
  breakthrough: number,
  disabled?: DisabledTalentPoints,
): Readonly<Record<string, number>> {
  return cached(GLOBAL_BASE_BY_SELECTION, selectionKey(breakthrough, disabled), () => {
    const acc = accumulatorFor(breakthrough, disabled)
    return {
      "phys.min":
        acc.minPhys + acc.power * POWER_PER_POINT.minPhys + acc.agility * AGILITY_PER_POINT.minPhys,
      "phys.max":
        acc.maxPhys +
        acc.power * POWER_PER_POINT.maxPhys +
        acc.momentum * MOMENTUM_PER_POINT.maxPhys,
      precision: acc.precision,
      critRate: acc.critRate + acc.agility * AGILITY_PER_POINT.critRate,
      affinityRate: acc.affinityRate + acc.momentum * MOMENTUM_PER_POINT.affinityRate,
      critDamageBoost: acc.critDamageBoost,
      affinityDamageBoost: acc.affinityDamageBoost,
      directCritRate: 0,
      directAffinityRate: 0,
      physBoost: 0,
      attributeDamageBoost: 0,
    }
  })
}

export const DEFAULT_ODDITIES: OddityRegions = (() => {
  const out: OddityRegions = {}
  for (const [region, entries] of Object.entries(odditiesJson as TieredEntries)) {
    out[region] = entries.map((e) => ({
      id: e.id,
      stat: e.stat as OddityNode["stat"],
      value: e.value,
      enabled: true,
    }))
  }
  return out
})()

export const DEFAULT_ENHANCEMENTS: EnhancementNode[] = (
  (enhancementsJson as TieredEnhancements)[ENHANCEMENT_TIER] ?? []
).map((entry) => ({
  id: entry.id,
  slot: entry.slot as EnhancementSlot,
  stat: entry.stat as TalentStat,
  value: entry.value,
}))

export const CLASS_PRIMARY_BASE = {
  min: 0,
  max: 0,
  penetration: 0,
} as const

const PRIMARY_ATTACK_KEY: Readonly<Record<AttributeKey, string>> = {
  Bellstrike: "bellstrike",
  Stonesplit: "stonesplit",
  Silkbind: "silkbind",
  Bamboocut: "bamboocut",
}

interface ClassSkillBoost {
  skill: string
  stat: string
  maxBonus: number
  scalesWith: keyof PlayerAttributes
  scaleMax: number
}
type ClassSkillBoosts = Record<string, ClassSkillBoost[]>

const STAT_TO_PATH: Readonly<Record<string, string>> = {
  minPhys: "phys.min",
  maxPhys: "phys.max",
  physPenetration: "phys.penetration",
  minBellstrike: "bellstrike.min",
  maxBellstrike: "bellstrike.max",
  bellstrikePenetration: "bellstrike.penetration",
  minStonesplit: "stonesplit.min",
  maxStonesplit: "stonesplit.max",
  stonesplitPenetration: "stonesplit.penetration",
  minSilkbind: "silkbind.min",
  maxSilkbind: "silkbind.max",
  silkbindPenetration: "silkbind.penetration",
  minBamboocut: "bamboocut.min",
  maxBamboocut: "bamboocut.max",
  bamboocutPenetration: "bamboocut.penetration",
  precisionRate: "precision",
  critRate: "critRate",
  affinityRate: "affinityRate",
  critDamage: "critDamageBoost",
  affinityDamage: "affinityDamageBoost",
  attributeDamage: "attributeDamageBoost",
}

export function getDefaultTalentsForClass(classId: string): MartialArtsTalent[] {
  const boosts = (classSkillBoostsJson as ClassSkillBoosts)[classId]
  if (!boosts) return []
  return boosts.map((b, i) => ({
    id: `default-${classId}-${i}`,
    name: b.skill,
    enabled: true,
    stat: b.stat as TalentStat,
    maxBonus: b.maxBonus,
    scalesWith: b.scalesWith as ScalingSource,
    scaleMax: b.scaleMax,
  }))
}

export function totalPlayerAttributes(
  breakthrough: number,
  equippedPieces: readonly GearPiece[],
  disabled?: DisabledTalentPoints,
): Readonly<PlayerAttributes> {
  const fromBreakthrough = playerAttributes(breakthrough, disabled)
  const gear = gearAttributeTotals(equippedPieces)
  return {
    power: fromBreakthrough.power + gear.power,
    agility: fromBreakthrough.agility + gear.agility,
    momentum: fromBreakthrough.momentum + gear.momentum,
  }
}

export function userTalentContributions(
  talents: readonly MartialArtsTalent[],
  scalingSources: Readonly<Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of talents) {
    if (!t.enabled) continue
    const attr = scalingSources[t.scalesWith] ?? 0
    const scale = t.scaleMax > 0 ? Math.min(attr / t.scaleMax, 1) : 1
    const bonus = scale * t.maxBonus
    if (!bonus) continue
    const path = STAT_TO_PATH[t.stat] ?? t.stat
    out[path] = (out[path] ?? 0) + bonus
  }
  return out
}

export function oddityContributions(oddities: OddityRegions): Record<string, number> {
  const out: Record<string, number> = {}
  for (const nodes of Object.values(oddities)) {
    for (const n of nodes) {
      if (!n.enabled || !n.value) continue
      const path = STAT_TO_PATH[n.stat] ?? n.stat
      out[path] = (out[path] ?? 0) + n.value
    }
  }
  return out
}

export function enhancementCap(id: number): number | undefined {
  return DEFAULT_ENHANCEMENTS.find((entry) => entry.id === id)?.value
}

export function clampEnhancementValue(id: number, value: number): number {
  if (!Number.isFinite(value)) return 0
  const cap = enhancementCap(id)
  if (cap === undefined) return value
  return Math.min(Math.max(value, 0), cap)
}

export function enhancementContributions(
  enhancements: readonly EnhancementNode[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const node of enhancements) {
    if (!node.value) continue
    const path = STAT_TO_PATH[node.stat] ?? node.stat
    out[path] = (out[path] ?? 0) + node.value
  }
  return out
}

export function buildScalingSources(
  inputs: Inputs,
  equippedPieces: readonly GearPiece[] = [],
): Record<ScalingSource, number> {
  const totals = totalPlayerAttributes(
    inputs.breakthrough,
    equippedPieces,
    inputs.disabledTalentPoints,
  )
  return {
    power: totals.power,
    agility: totals.agility,
    momentum: totals.momentum,
    "phys.min": inputs.phys.min,
    "phys.max": inputs.phys.max,
    "phys.penetration": inputs.phys.penetration,
    "bellstrike.min": inputs.bellstrike.min,
    "bellstrike.max": inputs.bellstrike.max,
    "bellstrike.penetration": inputs.bellstrike.penetration,
    "stonesplit.min": inputs.stonesplit.min,
    "stonesplit.max": inputs.stonesplit.max,
    "stonesplit.penetration": inputs.stonesplit.penetration,
    "silkbind.min": inputs.silkbind.min,
    "silkbind.max": inputs.silkbind.max,
    "silkbind.penetration": inputs.silkbind.penetration,
    "bamboocut.min": inputs.bamboocut.min,
    "bamboocut.max": inputs.bamboocut.max,
    "bamboocut.penetration": inputs.bamboocut.penetration,
  }
}

export function getConfiguredBase(
  inputs: Inputs,
  equippedPieces: readonly GearPiece[] = [],
): Readonly<Record<string, number>> {
  const key = primaryAttackKey(inputs.classId)
  const formless = formlessAttack(inputs.breakthrough, inputs.disabledTalentPoints)
  const base: Record<string, number> = {
    ...globalBase(inputs.breakthrough, inputs.disabledTalentPoints),
    [`${key}.min`]: CLASS_PRIMARY_BASE.min + formless.min,
    [`${key}.max`]: CLASS_PRIMARY_BASE.max + formless.max,
    [`${key}.penetration`]: CLASS_PRIMARY_BASE.penetration,
  }
  const arsenal = arsenalContribution(inputs.arsenal)
  if (arsenal) {
    base[`${arsenal.block}.min`] = (base[`${arsenal.block}.min`] ?? 0) + arsenal.min
    base[`${arsenal.block}.max`] = (base[`${arsenal.block}.max`] ?? 0) + arsenal.max
  }
  const sources = buildScalingSources(inputs, equippedPieces)
  for (const [path, amount] of Object.entries(
    userTalentContributions(inputs.martialArtsTalents, sources),
  )) {
    base[path] = (base[path] ?? 0) + amount
  }
  const oddities = inputs.oddities ?? DEFAULT_ODDITIES
  for (const [path, amount] of Object.entries(oddityContributions(oddities))) {
    base[path] = (base[path] ?? 0) + amount
  }
  const enhancements = inputs.enhancements ?? DEFAULT_ENHANCEMENTS
  for (const [path, amount] of Object.entries(enhancementContributions(enhancements))) {
    base[path] = (base[path] ?? 0) + amount
  }
  return base
}

const ARSENAL_TO_BLOCK: Readonly<Record<string, string>> = {
  general: "phys",
  bellstrike: "bellstrike",
  stonesplit: "stonesplit",
  silkbind: "silkbind",
  bamboocut: "bamboocut",
}

function arsenalContribution(
  arsenal: Inputs["arsenal"],
): { block: string; min: number; max: number } | null {
  if (!arsenal) return null
  const block = ARSENAL_TO_BLOCK[arsenal]
  if (!block) return null
  return { block, min: ARSENAL_BONUS.min, max: ARSENAL_BONUS.max }
}

function primaryAttackKey(classId: string): string {
  const school = getSchool(classId)
  return PRIMARY_ATTACK_KEY[school.primaryAttribute as AttributeKey]
}

function applyPanelStats(
  out: Record<string, number>,
  primaryKey: string,
  stats: Readonly<Partial<Record<string, number>>> | undefined,
): void {
  if (!stats) return
  for (const [rawPath, amount] of Object.entries(stats)) {
    if (amount === undefined) continue
    const path = rawPath.startsWith("primaryAttr.")
      ? `${primaryKey}.${rawPath.slice("primaryAttr.".length)}`
      : rawPath
    out[path] = (out[path] ?? 0) + amount
  }
}

export function getMindMethodContributions(inputs: Inputs): Record<string, number> {
  const out: Record<string, number> = {}
  const school = getSchool(inputs.classId)
  const primaryKey = PRIMARY_ATTACK_KEY[school.primaryAttribute as AttributeKey]
  inputs.mindMethods.forEach((slot) => {
    const innerWayId = slotInnerWayId(slot)
    if (!innerWayId) return
    const def = innerWayDefinition(innerWayId)
    if (!def) return
    applyPanelStats(out, primaryKey, def.panelStats)
    if (!def.tiers) return
    const tier = tierFromStacks(slot.stacks)
    const unlockedTiers = Object.keys(def.tiers)
      .map(Number)
      .filter((tierNumber) => tierNumber <= tier)
      .sort((a, b) => a - b)
    for (const tierNumber of unlockedTiers) {
      const tier = def.tiers[tierNumber]
      applyPanelStats(out, primaryKey, tier?.panelStats)
      if (tier?.ladder)
        applyPanelStats(out, primaryKey, innerWayLadderStats(tier.ladder, inputs.breakthrough))
    }
  })
  return out
}
