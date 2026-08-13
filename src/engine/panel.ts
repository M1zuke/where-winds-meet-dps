import type { Inputs, AttributeKey, Arsenal } from "./types"
import type { FormulaContext } from "./formula"
import { ATTUNEMENT_OPTIONS } from "./attunements"
import { MYSTIC_TYPE_BOOST_STAT_KEY, WEAPON_BOOST_STAT_KEY, type StatKey } from "./statRegistry"
import { henZhiActiveForInputs, innerWayScalar } from "../definitions/innerWays/registry"
import { classDefinition, type ClassDefinition } from "../definitions/classes/registry"
import { getBreakthrough } from "../definitions/baseStats/breakthroughs"
import { SET_BY_ID, SET_DEFS } from "../definitions/sets/registry"

export { getBreakthrough, henZhiActiveForInputs }

const CLASS_SPECIFIC_ATTUNEMENT_PATH_PREFIX = "classSpecificAttunement."

// The scoped stats (BUFFS.md § "Category 3") are keyed by what the entity
// declares — a weapon name, a mystic category — and `statRegistry` already owns
// that vocabulary. Reading it here keeps one list instead of a copy per
// consumer.
function scopedStatMap(
  inputs: Inputs,
  keyByCategory: Readonly<Record<string, StatKey>>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [category, statKey] of Object.entries(keyByCategory)) {
    out[category] = (inputs as unknown as Record<string, number>)[statKey] ?? 0
  }
  return out
}

// The 6 % target-defense reduction. The party-applied debuff is its only live
// supplier; the channel stays open because an inner way may declare
// `targetDefenseMultiplier` instead.
const HEN_ZHI_DEFENSE_MULTIPLIER = 0.94

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
}

export function getSchool(classId: string): ClassDefinition {
  const definition = classDefinition(classId)
  if (!definition) throw new Error(`Unknown classId: ${classId}`)
  return definition
}

// Returns inner-way IDS; the UI renders them through `innerWayName`.
export function allowedInnerWaysForClass(classId: string): string[] {
  return [...(classDefinition(classId)?.innerWays ?? [])]
}

export function resistanceForBreakthrough(bt: number): number {
  return getBreakthrough(bt).resistance
}

export function resistanceForInputs(inputs: Inputs): number {
  return resistanceForBreakthrough(inputs.breakthrough)
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

// `setKey` is the set's id (`Inputs.set` value), not its display name; render
// `name` for the label.
export interface ArmorSetOption {
  name: string
  setKey: string
  stat: "affinityRate" | "critRate" | "precisionRate" | "maxPhys" | "minPhys"
  value: number
}
export const ARMOR_SET_OPTIONS: readonly ArmorSetOption[] = SET_DEFS.filter(
  (set) => set.panelBonus,
).map((set) => ({ name: set.name, setKey: set.id, ...set.panelBonus! }))

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

  const setFormula = (inputs.set ? SET_BY_ID[inputs.set]?.formulaBonus : undefined) ?? {}

  const targetGeneralDamageTaken = inputs.dummyMode ? 0 : target.generalDamageTaken
  const targetFatigueDamageTaken = inputs.dummyMode ? 0 : target.fatigueDamageTaken
  const effectiveBossBoost = inputs.bossBoost

  const henZhi = inputs.shareDebuff5HenZhi ? 0.05 : 0
  const easyHurt = inputs.shareEasyHurt ? 0.05 : 0
  const tianGongFire =
    inputs.tianGongElement === "fire" ? (setFormula.lowQiDirectAffinityRate ?? 0) : 0
  const generalDamageBoost =
    henZhi + easyHurt + tianGongFire + (setFormula.physBoost ?? 0) + targetGeneralDamageTaken

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

  const henZhiActive = henZhiActiveForInputs(inputs)
  const effectiveDefense = target.defense * (henZhiActive ? HEN_ZHI_DEFENSE_MULTIPLIER : 1)

  const chargeBonus = innerWayScalar(inputs.mindMethods, "chargeBonus")

  const targetGeneralDamageTaken = inputs.dummyMode ? 0 : target.generalDamageTaken
  const targetFatigueDamageTaken = inputs.dummyMode ? 0 : target.fatigueDamageTaken
  const effectiveBossBoost = inputs.bossBoost

  const generalDamageBoost =
    targetGeneralDamageTaken +
    innerWayScalar(inputs.mindMethods, "generalDamageBoost") +
    (inputs.set ? (SET_BY_ID[inputs.set]?.formulaBonus?.generalDamageBoost ?? 0) : 0) +
    (inputs.shareEasyHurt ? 0.08 : 0) +
    (inputs.tianGongElement === "fire" ? 0.015 : 0) +
    (inputs.tianGongElement === "poison" ? 0.01 : 0) +
    effectiveBossBoost +
    (school.generalDamageBoost ?? 0)

  const classSpecificAttunement: Record<string, number> = {}
  for (const attunementId of school.classSpecificAttunements) {
    classSpecificAttunement[attunementId] = inputs.classSpecificAttunement[attunementId] ?? 0
  }

  const attuneBoostByTag: Record<string, number> = {}
  for (const option of ATTUNEMENT_OPTIONS) {
    if (!option.affectsTag || !option.enginePath?.startsWith(CLASS_SPECIFIC_ATTUNEMENT_PATH_PREFIX))
      continue
    if (option.classIds && !option.classIds.includes(inputs.classId)) continue
    const amount = inputs.classSpecificAttunement[option.id] ?? 0
    if (amount)
      attuneBoostByTag[option.affectsTag] = (attuneBoostByTag[option.affectsTag] ?? 0) + amount
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
    classSpecificAttunement,
    attuneBoostByTag,
    shareDebuffs: {
      henZhi: inputs.shareDebuff5HenZhi,
      easyHurt: inputs.shareEasyHurt,
    },
    allMartialBoost: inputs.allMartialBoost,
    weaponBoosts: scopedStatMap(inputs, WEAPON_BOOST_STAT_KEY),
    mysticTypeBoosts: scopedStatMap(inputs, MYSTIC_TYPE_BOOST_STAT_KEY),
    dotDamageBoost: innerWayScalar(inputs.mindMethods, "dotDamageBoost"),
    physPenResistance: penResistanceForInputs(inputs).physical,
    attrPenResistance: penResistanceForInputs(inputs).attribute,
    rateResistance: eff.resistance,
    hawkwingPhysBonus,
    dotDamageMultiplier,
  }
}
