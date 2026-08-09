import type { Inputs, AttributeKey, Arsenal } from "./types"
import type { FormulaContext } from "./formula"
import { resolveMindMethodOverrides } from "./mindMethodOverrides"
import schools from "../data/classes/schools.json"
import breakthroughs from "../data/baseStats/breakthroughTiers.json"
import sets from "../data/sets/sets.json"
import armorSetBoniJson from "../data/sets/armorSetBoni.json"

const SCHOOLS = schools as ReadonlyArray<{
  id: string
  cn: string
  en: string
  displayName: string
  primaryAttribute: AttributeKey
  attributeMultiplier: number
  permanentBuffs: string[]
  classMindGroup: string
  allowedMindMethods: string[]
  classBuffs: { label: string; slot: number }[]
  weapons: string[]
  rotations: string[]
}>

const BREAKTHROUGHS = breakthroughs as ReadonlyArray<{
  breakthrough: number
  name: string
  levelRange: string
  resistance: number
  defense: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  multiplier: number
}>

const SETS = (sets as { sets: { name: string; [k: string]: unknown }[] }).sets

export interface DerivedStats {
  classId: string
  primaryAttribute: AttributeKey
  attributeMultiplier: number
  defense: number
  effectiveDefense: number
  generalDamageTaken: number
  fatigueDamageTaken: number
  targetMultiplier: number
  generalDamageBoost: number
  weaponBoosts: Record<string, number>
  typeBoosts: Record<string, number>
  setBonus: Record<string, number>
}

export function getSchool(classId: string) {
  const s = SCHOOLS.find((x) => x.id === classId)
  if (!s) throw new Error(`Unknown classId: ${classId}`)
  return s
}

export function allowedInnerWaysForClass(classId: string): string[] {
  const s = SCHOOLS.find((x) => x.id === classId)
  if (!s) return []
  return [...new Set([s.classMindGroup ?? "", ...s.allowedMindMethods].filter(Boolean))]
}

export function getBreakthrough(bt: number) {
  const t = BREAKTHROUGHS.find((x) => x.breakthrough === bt)
  if (!t) throw new Error(`Unknown breakthrough: ${bt}`)
  return t
}

export function resistanceForBreakthrough(bt: number): number {
  return getBreakthrough(bt).resistance
}

export function resistanceForInputs(inputs: Inputs): number {
  return resistanceForBreakthrough(inputs.breakthrough)
}

export function henZhiActiveForInputs(inputs: Inputs): boolean {
  const stackOf = (name: string) =>
    inputs.mindMethods.find((slot) => slot.name === name)?.stacks ?? ""
  return (
    inputs.shareDebuff5HenZhi ||
    (inputs.mindMethods.some((slot) => slot.name === "Year-Long Lament") &&
      stackOf("Year-Long Lament") === "tier 6")
  )
}

// Pen resistance is zero for every target per the 2026-07 decision; the
// level parameter is kept as plumbing for a future target that has one.
export function penResistanceForLevel(_level: number): { physical: number; attribute: number } {
  return { physical: 0, attribute: 0 }
}
export function penResistanceForInputs(_inputs: Inputs): { physical: number; attribute: number } {
  return penResistanceForLevel(0)
}

// White → yellow conversion — see CLAUDE.md § "White vs Yellow rates":
//   precision:    (white − 65 %) / (1 + resistance) + 65 %   [soft-cap]
//   critRate:     white / (1 + resistance)
//   affinityRate: white / (1 + resistance)
export function effectiveRates(inputs: Inputs) {
  const r = resistanceForInputs(inputs) / 100
  const precision = (inputs.precision - 0.65) / (1 + r) + 0.65
  const critRate = inputs.critRate / (1 + r)
  const affinityRate = inputs.affinityRate / (1 + r)
  return { precision, critRate, affinityRate, resistance: r }
}

export const BOW_SET_BONUS = {
  affinity: 0.022,
  crit: 0.045,
  precision: 0.04,
} as const

// Source: `data/sets/armorSetBoni.json`.
export interface ArmorSetOption {
  name: string
  setKey: string
  stat: "affinityRate" | "critRate" | "precisionRate" | "maxPhys" | "minPhys"
  value: number
}
export const ARMOR_SET_OPTIONS: readonly ArmorSetOption[] = armorSetBoniJson as ArmorSetOption[]

export function applyArmorSet(inputs: Inputs): Inputs {
  if (!inputs.set) return inputs
  const opt = ARMOR_SET_OPTIONS.find((o) => o.setKey === inputs.set)
  if (!opt) return inputs
  switch (opt.stat) {
    case "affinityRate":
      return { ...inputs, affinityRate: inputs.affinityRate + opt.value }
    case "critRate":
      return { ...inputs, critRate: inputs.critRate + opt.value }
    case "precisionRate":
      return { ...inputs, precision: inputs.precision + opt.value }
    case "maxPhys":
      return { ...inputs, phys: { ...inputs.phys, max: inputs.phys.max + opt.value } }
    case "minPhys":
      return { ...inputs, phys: { ...inputs.phys, min: inputs.phys.min + opt.value } }
  }
}

export const ARSENAL_BONUS = { min: 131, max: 263 } as const

const PRIMARY_TO_ARSENAL: Readonly<Record<AttributeKey, Arsenal>> = {
  Bellstrike: "bellstrike",
  Stonesplit: "stonesplit",
  Silkbind: "silkbind",
  Bamboocut: "bamboocut",
}

export function defaultArsenalForClass(classId: string): Arsenal {
  return PRIMARY_TO_ARSENAL[getSchool(classId).primaryAttribute]
}

export function swapArsenal(inputs: Inputs, next: Arsenal): Inputs {
  if (inputs.arsenal === next) return inputs
  return { ...inputs, arsenal: next }
}

export function applyBowSet(inputs: Inputs): Inputs {
  switch (inputs.bowSet) {
    case "affinity":
      return { ...inputs, affinityRate: inputs.affinityRate + BOW_SET_BONUS.affinity }
    case "crit":
      return { ...inputs, critRate: inputs.critRate + BOW_SET_BONUS.crit }
    case "precision":
      return { ...inputs, precision: inputs.precision + BOW_SET_BONUS.precision }
    default:
      return inputs
  }
}

export function deriveStats(inputs: Inputs): DerivedStats {
  const school = getSchool(inputs.classId)
  const target = getBreakthrough(inputs.breakthrough)

  const effectiveDefense = target.defense * (1 - inputs.phys.penetration)

  const setBonus: Record<string, number> = {}
  if (inputs.set) {
    const s = SETS.find((x) => x.name === inputs.set)
    if (s) {
      for (const [k, v] of Object.entries(s)) {
        if (typeof v === "number") setBonus[k] = v
      }
    }
  }

  const targetGeneralDamageTaken = inputs.dummyMode ? 0 : target.generalDamageTaken
  const targetFatigueDamageTaken = inputs.dummyMode ? 0 : target.fatigueDamageTaken
  const effectiveBossBoost = inputs.bossBoost

  const henZhi = inputs.shareDebuff5HenZhi ? 0.05 : 0
  const easyHurt = inputs.shareEasyHurt ? 0.05 : 0
  const tianGongFire =
    inputs.tianGongElement === "fire" ? (setBonus["Low-Qi Direct Affinity Rate"] ?? 0) : 0
  const generalDamageBoost =
    henZhi + easyHurt + tianGongFire + (setBonus["Phys Boost"] ?? 0) + targetGeneralDamageTaken

  const weaponBoosts: Record<string, number> = {
    Sword: inputs.swordBoost,
    Spear: inputs.spearBoost,
    Fan: inputs.fanBoost,
    Umbrella: inputs.umbrellaBoost,
    Modao: inputs.modaoBoost,
    "Twin Blades": inputs.dualKnivesBoost,
    "Rope Dart": inputs.ropeDartBoost,
    Hengdao: inputs.hengDaoBoost,
    Knuckles: 0,
  }

  const typeBoosts: Record<string, number> = {
    Boss: effectiveBossBoost,
    control: inputs.singleMysticBoost,
    burst: inputs.singleMysticBoost,
    area: inputs.areaMysticBoost,
    "area-debuff": inputs.areaMysticBoost,
    "area-damage": inputs.areaMysticBoost,
  }

  return {
    classId: school.id,
    primaryAttribute: school.primaryAttribute,
    attributeMultiplier: school.attributeMultiplier,
    defense: target.defense,
    effectiveDefense,
    generalDamageTaken: targetGeneralDamageTaken,
    fatigueDamageTaken: targetFatigueDamageTaken,
    targetMultiplier: target.multiplier,
    generalDamageBoost,
    weaponBoosts,
    typeBoosts,
    setBonus,
  }
}

export interface TargetOverride {
  defenseDelta?: number
  generalDamageTakenDelta?: number
  fatigueDamageTakenDelta?: number
}

export function buildContext(
  inputs: Inputs,
  targetOverride?: TargetOverride,
  hawkwingPhysBonus?: number,
  dotDamageMultiplier?: number,
): FormulaContext {
  const school = getSchool(inputs.classId)
  const baseTarget = getBreakthrough(inputs.breakthrough)
  const target = {
    ...baseTarget,
    defense: baseTarget.defense + (targetOverride?.defenseDelta ?? 0),
    generalDamageTaken:
      baseTarget.generalDamageTaken + (targetOverride?.generalDamageTakenDelta ?? 0),
    fatigueDamageTaken:
      baseTarget.fatigueDamageTaken + (targetOverride?.fatigueDamageTakenDelta ?? 0),
  }
  const eff = effectiveRates(inputs)

  const pct = (n: number) => n * 100

  const mindMethodNames = inputs.mindMethods.filter((m) => m.name).map((m) => m.name)
  const has = (name: string) => mindMethodNames.includes(name)
  const stackOf = (name: string) => inputs.mindMethods.find((m) => m.name === name)?.stacks ?? ""

  const henZhiActive = henZhiActiveForInputs(inputs)
  const effectiveDefense = target.defense * (henZhiActive ? 0.94 : 1)

  const chargeBonus = has("Mighty Song") ? 0.15 : 0

  const setBonus: Record<string, number> = {}
  if (inputs.set) {
    const s = SETS.find((x) => x.name === inputs.set)
    if (s)
      for (const [k, v] of Object.entries(s)) {
        if (typeof v === "number") setBonus[k] = v
      }
  }

  const targetGeneralDamageTaken = inputs.dummyMode ? 0 : target.generalDamageTaken
  const targetFatigueDamageTaken = inputs.dummyMode ? 0 : target.fatigueDamageTaken
  const effectiveBossBoost = inputs.bossBoost

  const generalDamageBoost =
    targetGeneralDamageTaken +
    (has("Soldier's Return") ? 0.08 : 0) +
    (has("Star-Picker") && stackOf("Star-Picker") === "tier 6" ? 0.03 : 0) +
    (inputs.set === "Swaying Heights" ? 0.0375 : 0) +
    (inputs.shareEasyHurt ? 0.08 : 0) +
    (inputs.tianGongElement === "fire" ? 0.015 : 0) +
    (inputs.tianGongElement === "poison" ? 0.01 : 0) +
    effectiveBossBoost +
    (has("Endurance Doctrine") ? 0.02 : 0)

  const dingYinByTag: Record<string, number> = {}
  for (const tag of school.permanentBuffs) {
    if (tag && tag !== "N/A") dingYinByTag[tag] = inputs.dingYinByTag[tag] ?? 0
  }

  return {
    smallPhys: inputs.phys.min,
    largePhys: inputs.phys.max,
    outerPen: pct(inputs.phys.penetration),
    bellstrike: {
      min: inputs.bellstrike.min,
      max: inputs.bellstrike.max,
      pen: pct(inputs.bellstrike.penetration),
    },
    stonesplit: {
      min: inputs.stonesplit.min,
      max: inputs.stonesplit.max,
      pen: pct(inputs.stonesplit.penetration),
    },
    silkbind: {
      min: inputs.silkbind.min,
      max: inputs.silkbind.max,
      pen: pct(inputs.silkbind.penetration),
    },
    bamboocut: {
      min: inputs.bamboocut.min,
      max: inputs.bamboocut.max,
      pen: pct(inputs.bamboocut.penetration),
    },
    primaryAttribute: school.primaryAttribute,
    attributePrimaryBonus: school.attributeMultiplier,

    precisionPanel: eff.precision,
    critPanel: eff.critRate,
    affinityPanel: eff.affinityRate,
    directCritPanel: inputs.directCritRate,
    directAffinityPanel: inputs.directAffinityRate,
    physDmgBoostPanel: inputs.physBoost,
    critDmgBoostPanel: inputs.critDamageBoost,
    affinityDmgBoostPanel: inputs.affinityDamageBoost,
    attributeDmgBoostPanel: inputs.attributeDamageBoost,
    sustainDmgBoostPanel: inputs.sustainDamageBoost,

    generalDamageBoost,
    allDamageBoost: inputs.allDamageBoost ?? 0,
    chargeBonus,
    effectiveDefense,
    fatigueDamageTaken: targetFatigueDamageTaken,
    hasSixHenZhi: henZhiActive,
    food: inputs.food,
    set: inputs.set,
    tianGong: inputs.tianGongElement,
    dingYinByTag,
    shareDebuffs: {
      henZhi: inputs.shareDebuff5HenZhi,
      easyHurt: inputs.shareEasyHurt,
    },
    boostZoneOverrides: resolveMindMethodOverrides(inputs).boostZoneOverrides,
    allMartialBoost: inputs.allMartialBoost,
    weaponBoosts: {
      Sword: inputs.swordBoost,
      Spear: inputs.spearBoost,
      Fan: inputs.fanBoost,
      Umbrella: inputs.umbrellaBoost,
      Modao: inputs.modaoBoost,
      "Twin Blades": inputs.dualKnivesBoost,
      "Rope Dart": inputs.ropeDartBoost,
      Hengdao: inputs.hengDaoBoost,
    },
    mysticTypeBoosts: {
      control: inputs.singleMysticBoost,
      burst: inputs.singleMysticBoost,
      area: inputs.areaMysticBoost,
      "area-debuff": inputs.areaMysticBoost,
      "area-damage": inputs.areaMysticBoost,
    },
    dotDamageBoost: has("Insightful Strike") ? 0.1 : 0,
    physPenResistance: penResistanceForInputs(inputs).physical,
    attrPenResistance: penResistanceForInputs(inputs).attribute,
    rateResistance: eff.resistance,
    hawkwingPhysBonus,
    dotDamageMultiplier,
  }
}
