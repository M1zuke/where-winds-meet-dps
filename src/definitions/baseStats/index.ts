import { arsenalAttack, arsenalHp, getSchool } from "../../engine/panel"
import {
  formlessWordTotals,
  gearAttributeTotals,
  gearHpTotal,
  gearPhysDefTotal,
} from "../../engine/gearStats"
import { APP_PLAYER_LEVEL } from "../../engine/buffs/levelAttributeBonus"
import { tierFromStacks } from "../innerWays/innerWayDef"
import { innerWayDefinition, innerWayLadderStats, slotInnerWayId } from "../innerWays/registry"
import { DEFAULT_ARSENAL_SCORES } from "./arsenal"
import type {
  ArsenalScores,
  AttributeKey,
  DisabledTalentNodes,
  EnhancementLevels,
  GearPiece,
  Inputs,
  MartialArtsTalent,
  ScalingSource,
  UnclaimedOddityNodes,
} from "../../engine/types"
import {
  artAttackStageAt,
  BASE_STAT_LEVELS,
  CLASS_SKILL_BOOSTS,
  TALENT_BOARD,
} from "../../data/baseStats"
import { effectiveDisabledTalentNodes, isTalentNodeTaken } from "./talentBoardGraph"
import { ODDITY_BOARD, isOddityNodeClaimed } from "./oddityBoardGraph"
import { breakthroughAttributes, defaultBreakthrough } from "./breakthroughs"
import {
  AGILITY_PER_POINT,
  BODY_PER_POINT,
  DEFENSE_PER_POINT,
  MOMENTUM_PER_POINT,
  POWER_PER_POINT,
} from "./attributeConversion"
import {
  averageEnhancementBonus,
  DEFAULT_ENHANCEMENTS,
  enhancementContributions as enhancementAttackContributions,
  enhancementHpTotal,
  enhancementPhysDefTotal,
} from "./enhancements"

export * from "./talentBoardGraph"
export * from "./oddityBoardGraph"
export {
  defineOddityRegion,
  type OddityNodeDef,
  type OddityNodeKind,
  type OddityStat,
} from "./oddityNodeDef"
export * from "./enhancements"
export * from "./arsenal"
export type { TalentPointStat, TalentPointEffects, TalentPointDef } from "./talentPointDef"
export {
  defineTalentNode,
  type TalentGate,
  type TalentGateKind,
  type TalentNodeDef,
} from "./talentNodeDef"

const BASE_LEVEL = APP_PLAYER_LEVEL

interface BaseEntry {
  id: number
  stat: string
  value: number
}

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
  body: number
  defense: number
  hp: number
  physDef: number
}

function readBaseLevel(): BaseAccumulator {
  const row = BASE_STAT_LEVELS[BASE_LEVEL]
  if (!row) throw new Error(`No base stat row for level ${BASE_LEVEL}`)
  return {
    minPhys: row.minPhys,
    maxPhys: row.maxPhys,
    precision: row.precisionRate,
    critRate: row.critRate,
    affinityRate: row.affinityRate,
    critDamageBoost: row.critDamage,
    affinityDamageBoost: row.affinityDamage,
    minFormless: 0,
    maxFormless: 0,
    power: 0,
    agility: 0,
    momentum: 0,
    body: 0,
    defense: 0,
    hp: row.maxHp,
    physDef: row.physDef,
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
    case "body":
      acc.body += entry.value
      break
    case "defense":
      acc.defense += entry.value
      break
    case "maxHp":
      acc.hp += entry.value
      break
    case "physDef":
      acc.physDef += entry.value
      break
  }
}

function applyAll(acc: BaseAccumulator, entries: readonly BaseEntry[] | undefined): void {
  if (!entries) return
  for (const entry of entries) applyEntry(acc, entry)
}

function applyTalentBoard(acc: BaseAccumulator, disabled: DisabledTalentNodes): void {
  for (const node of TALENT_BOARD) {
    if (!node.effects || !isTalentNodeTaken(disabled, node.id)) continue
    for (const [stat, value] of Object.entries(node.effects)) {
      applyEntry(acc, { id: node.id, stat, value })
    }
  }
}

function buildAccumulator(
  breakthrough: number,
  disabled: DisabledTalentNodes | undefined,
): BaseAccumulator {
  const acc = readBaseLevel()
  applyTalentBoard(acc, effectiveDisabledTalentNodes(disabled, breakthrough))
  applyAll(acc, breakthroughAttributes(breakthrough))
  return acc
}

export interface PlayerAttributes {
  power: number
  agility: number
  momentum: number
  body: number
  defense: number
}

const ACCUMULATOR_BY_SELECTION = new Map<string, BaseAccumulator>()
const ATTRIBUTES_BY_SELECTION = new Map<string, Readonly<PlayerAttributes>>()
const GLOBAL_BASE_BY_SELECTION = new Map<string, Readonly<Record<string, number>>>()

const MAX_CACHED_SELECTIONS = 64

function selectionKey(breakthrough: number, disabled: DisabledTalentNodes | undefined): string {
  const ids = [...(disabled ?? [])].sort((left, right) => left - right)
  return `${breakthrough}|${ids.join(",")}`
}

function cached<T>(store: Map<string, T>, key: string, build: () => T): T {
  const hit = store.get(key)
  if (hit) return hit
  if (store.size >= MAX_CACHED_SELECTIONS) store.clear()
  const built = build()
  store.set(key, built)
  return built
}

function accumulatorFor(breakthrough: number, disabled?: DisabledTalentNodes): BaseAccumulator {
  return cached(ACCUMULATOR_BY_SELECTION, selectionKey(breakthrough, disabled), () =>
    buildAccumulator(breakthrough, disabled),
  )
}

export function playerAttributes(
  breakthrough: number,
  disabled?: DisabledTalentNodes,
): Readonly<PlayerAttributes> {
  return cached(ATTRIBUTES_BY_SELECTION, selectionKey(breakthrough, disabled), () => {
    const acc = accumulatorFor(breakthrough, disabled)
    return {
      power: acc.power,
      agility: acc.agility,
      momentum: acc.momentum,
      body: acc.body,
      defense: acc.defense,
    }
  })
}

export interface FormlessAttack {
  min: number
  max: number
}

export function formlessAttack(
  breakthrough: number,
  disabled?: DisabledTalentNodes,
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
  const fromTalents = formlessAttack(inputs.breakthrough, inputs.disabledTalentNodes)
  const fromGear = formlessWordTotals(equippedPieces, inputs)
  return { min: fromTalents.min + fromGear.min, max: fromTalents.max + fromGear.max }
}

export function globalBase(
  breakthrough: number,
  disabled?: DisabledTalentNodes,
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

export function getDefaultTalentsForClass(
  classId: string,
  breakthrough: number = defaultBreakthrough(),
): MartialArtsTalent[] {
  const boosts = CLASS_SKILL_BOOSTS[classId]
  if (!boosts) return []
  const resolvedStage = artAttackStageAt(classId, breakthrough)
  return boosts.map((boost, index) => ({
    id: `default-${classId}-${index}`,
    name: boost.skill,
    enabled: true,
    stat: boost.stat,
    maxBonus: boost.stage ? resolvedStage[boost.stage] : boost.maxBonus,
    scalesWith: boost.scalesWith,
    scaleMax: boost.scaleMax,
  }))
}

export function resyncDefaultTalentsForBreakthrough(inputs: Inputs): Inputs {
  const nonDefault = inputs.martialArtsTalents.filter((talent) => !talent.id.startsWith("default-"))
  return {
    ...inputs,
    martialArtsTalents: [
      ...nonDefault,
      ...getDefaultTalentsForClass(inputs.classId, inputs.breakthrough),
    ],
  }
}

export function totalPlayerAttributes(
  breakthrough: number,
  equippedPieces: readonly GearPiece[],
  disabled?: DisabledTalentNodes,
): Readonly<PlayerAttributes> {
  const fromBreakthrough = playerAttributes(breakthrough, disabled)
  const gear = gearAttributeTotals(equippedPieces)
  return {
    power: fromBreakthrough.power + gear.power,
    agility: fromBreakthrough.agility + gear.agility,
    momentum: fromBreakthrough.momentum + gear.momentum,
    body: fromBreakthrough.body,
    defense: fromBreakthrough.defense,
  }
}

export function totalMaxHp(
  breakthrough: number,
  equippedPieces: readonly GearPiece[],
  disabled?: DisabledTalentNodes,
  enhancements: EnhancementLevels = DEFAULT_ENHANCEMENTS,
  unclaimedOddityNodes: UnclaimedOddityNodes = {},
  arsenalScores: ArsenalScores = DEFAULT_ARSENAL_SCORES,
): number {
  const acc = accumulatorFor(breakthrough, disabled)
  return (
    acc.hp +
    gearHpTotal(equippedPieces) +
    acc.body * BODY_PER_POINT.hp +
    acc.defense * DEFENSE_PER_POINT.hp +
    arsenalHp(breakthrough, arsenalScores) +
    enhancementHpTotal(enhancements) +
    averageEnhancementBonus(enhancements).maxHp +
    oddityHpTotal(unclaimedOddityNodes)
  )
}

export function effectiveMaxHp(
  breakthrough: number,
  equippedPieces: readonly GearPiece[],
  disabled?: DisabledTalentNodes,
  enhancements: EnhancementLevels = DEFAULT_ENHANCEMENTS,
  unclaimedOddityNodes: UnclaimedOddityNodes = {},
  arsenalScores: ArsenalScores = DEFAULT_ARSENAL_SCORES,
): number {
  const raw = totalMaxHp(
    breakthrough,
    equippedPieces,
    disabled,
    enhancements,
    unclaimedOddityNodes,
    arsenalScores,
  )
  return raw * (1 + averageEnhancementBonus(enhancements).percent)
}

export function totalPhysDef(
  breakthrough: number,
  equippedPieces: readonly GearPiece[],
  disabled?: DisabledTalentNodes,
  enhancements: EnhancementLevels = DEFAULT_ENHANCEMENTS,
  unclaimedOddityNodes: UnclaimedOddityNodes = {},
): number {
  const acc = accumulatorFor(breakthrough, disabled)
  return (
    acc.physDef +
    gearPhysDefTotal(equippedPieces) +
    acc.defense * DEFENSE_PER_POINT.physDef +
    enhancementPhysDefTotal(enhancements) +
    oddityPhysDefTotal(unclaimedOddityNodes)
  )
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

export function oddityContributions(unclaimed: UnclaimedOddityNodes): Record<string, number> {
  const out: Record<string, number> = {}
  for (const region of ODDITY_BOARD) {
    for (const node of region.nodes) {
      if (!node.value || node.stat === undefined) continue
      if (node.stat === "maxHp" || node.stat === "physDef") continue
      if (!isOddityNodeClaimed(unclaimed, region.key, node.id)) continue
      const path = STAT_TO_PATH[node.stat] ?? node.stat
      out[path] = (out[path] ?? 0) + node.value
    }
  }
  return out
}

function oddityStatTotal(unclaimed: UnclaimedOddityNodes, stat: "maxHp" | "physDef"): number {
  let total = 0
  for (const region of ODDITY_BOARD) {
    for (const node of region.nodes) {
      if (node.stat !== stat || !node.value) continue
      if (isOddityNodeClaimed(unclaimed, region.key, node.id)) total += node.value
    }
  }
  return total
}

export function oddityHpTotal(unclaimed: UnclaimedOddityNodes): number {
  return oddityStatTotal(unclaimed, "maxHp")
}

export function oddityPhysDefTotal(unclaimed: UnclaimedOddityNodes): number {
  return oddityStatTotal(unclaimed, "physDef")
}

export function buildScalingSources(
  inputs: Inputs,
  equippedPieces: readonly GearPiece[] = [],
): Record<ScalingSource, number> {
  const totals = totalPlayerAttributes(
    inputs.breakthrough,
    equippedPieces,
    inputs.disabledTalentNodes,
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
  const formless = formlessAttack(inputs.breakthrough, inputs.disabledTalentNodes)
  const base: Record<string, number> = {
    ...globalBase(inputs.breakthrough, inputs.disabledTalentNodes),
    [`${key}.min`]: CLASS_PRIMARY_BASE.min + formless.min,
    [`${key}.max`]: CLASS_PRIMARY_BASE.max + formless.max,
    [`${key}.penetration`]: CLASS_PRIMARY_BASE.penetration,
  }
  const arsenal = arsenalContribution(inputs.arsenal, inputs.breakthrough, inputs.arsenalScores)
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
  for (const [path, amount] of Object.entries(
    oddityContributions(inputs.unclaimedOddityNodes ?? {}),
  )) {
    base[path] = (base[path] ?? 0) + amount
  }
  const enhancements = inputs.enhancements ?? DEFAULT_ENHANCEMENTS
  for (const [path, amount] of Object.entries(enhancementAttackContributions(enhancements))) {
    base[path] = (base[path] ?? 0) + amount
  }
  return base
}

export const ARSENAL_TO_BLOCK: Readonly<Record<string, string>> = {
  general: "phys",
  bellstrike: "bellstrike",
  stonesplit: "stonesplit",
  silkbind: "silkbind",
  bamboocut: "bamboocut",
}

function arsenalContribution(
  arsenal: Inputs["arsenal"],
  breakthrough: number,
  arsenalScores: ArsenalScores,
): { block: string; min: number; max: number } | null {
  if (!arsenal) return null
  const block = ARSENAL_TO_BLOCK[arsenal]
  if (!block) return null
  const attack = arsenalAttack(breakthrough, arsenalScores)
  return { block, min: attack.min, max: attack.max }
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
