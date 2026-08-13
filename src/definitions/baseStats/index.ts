import { ARSENAL_BONUS, getSchool } from "../../engine/panel"
import { gearAttributeTotals } from "../../engine/gearStats"
import { APP_PLAYER_LEVEL } from "../../engine/buffs/levelAttributeBonus"
import { tierFromStacks } from "../innerWays/innerWayDef"
import { innerWayDefinition, slotInnerWayId } from "../innerWays/registry"
import type {
  AttributeKey,
  GearPiece,
  Inputs,
  MartialArtsTalent,
  OddityNode,
  OddityRegions,
  ScalingSource,
  TalentStat,
} from "../../engine/types"
import baseStatsJson from "../../data/baseStats/baseStats.json"
import talentPointsJson from "../../data/baseStats/talentPoints.json"
import odditiesJson from "../../data/baseStats/oddities.json"
import enhancementsJson from "../../data/baseStats/enhancements.json"
import breakthroughJson from "../../data/baseStats/breakthroughAttributes.json"
import classSkillBoostsJson from "../../data/baseStats/classSkillBoosts.json"

const BASE_LEVEL = APP_PLAYER_LEVEL
const TALENT_TIERS = ["95.1", "95.2", "100.1"] as const
const ENHANCEMENT_TIER = "95"
const BREAKTHROUGH_TIER = "16"

// Phys deltas mirror `engine/itemRanking.ts` rows 62-64 (Power/Agility/Momentum
// at amount 40.4 splitting into the listed white deltas). Crit/affinity
// per-point are the user-provided ground-truth values: +0.076 % crit per
// agility, +0.038 % affinity per momentum.
const POWER_PER_POINT = {
  minPhys: 0.225,
  maxPhys: 1.36,
} as const
const AGILITY_PER_POINT = {
  minPhys: 0.9,
  critRate: 0.00076,
} as const
const MOMENTUM_PER_POINT = {
  maxPhys: 0.9,
  affinityRate: 0.00038,
} as const

type BaseStatsByLevel = Record<string, Record<string, number>>

interface BaseEntry {
  id: number
  stat: string
  value: number
}

type TieredEntries = Record<string, BaseEntry[]>

interface BaseAccumulator {
  minPhys: number
  maxPhys: number
  precision: number
  critRate: number
  affinityRate: number
  critDamageBoost: number
  affinityDamageBoost: number
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
  for (const e of entries) applyEntry(acc, e)
}

function buildAccumulator(): BaseAccumulator {
  const acc = readBaseLevel()
  for (const tier of TALENT_TIERS) {
    applyAll(acc, (talentPointsJson as TieredEntries)[tier])
  }
  applyAll(acc, (enhancementsJson as TieredEntries)[ENHANCEMENT_TIER])
  applyAll(acc, (breakthroughJson as TieredEntries)[BREAKTHROUGH_TIER])
  return acc
}

const ACC: BaseAccumulator = buildAccumulator()

export const PLAYER_ATTRIBUTES: Readonly<{
  power: number
  agility: number
  momentum: number
}> = {
  power: ACC.power,
  agility: ACC.agility,
  momentum: ACC.momentum,
}

export const GLOBAL_BASE: Readonly<Record<string, number>> = (() => {
  const minPhys =
    ACC.minPhys + ACC.power * POWER_PER_POINT.minPhys + ACC.agility * AGILITY_PER_POINT.minPhys
  const maxPhys =
    ACC.maxPhys + ACC.power * POWER_PER_POINT.maxPhys + ACC.momentum * MOMENTUM_PER_POINT.maxPhys
  const critRate = ACC.critRate + ACC.agility * AGILITY_PER_POINT.critRate
  const affinityRate = ACC.affinityRate + ACC.momentum * MOMENTUM_PER_POINT.affinityRate
  return {
    "phys.min": minPhys,
    "phys.max": maxPhys,
    precision: ACC.precision,
    critRate,
    affinityRate,
    critDamageBoost: ACC.critDamageBoost,
    affinityDamageBoost: ACC.affinityDamageBoost,
    directCritRate: 0,
    directAffinityRate: 0,
    physBoost: 0,
    attributeDamageBoost: 0,
  }
})()

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
  scalesWith: keyof typeof PLAYER_ATTRIBUTES
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

export function totalPlayerAttributes(equippedPieces: readonly GearPiece[]): {
  power: number
  agility: number
  momentum: number
} {
  const gear = gearAttributeTotals(equippedPieces)
  return {
    power: PLAYER_ATTRIBUTES.power + gear.power,
    agility: PLAYER_ATTRIBUTES.agility + gear.agility,
    momentum: PLAYER_ATTRIBUTES.momentum + gear.momentum,
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

export function buildScalingSources(
  inputs: Inputs,
  equippedPieces: readonly GearPiece[] = [],
): Record<ScalingSource, number> {
  const totals = totalPlayerAttributes(equippedPieces)
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
  const base: Record<string, number> = {
    ...GLOBAL_BASE,
    [`${key}.min`]: CLASS_PRIMARY_BASE.min,
    [`${key}.max`]: CLASS_PRIMARY_BASE.max,
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
      applyPanelStats(out, primaryKey, def.tiers[tierNumber]?.panelStats)
    }
  })
  return out
}
