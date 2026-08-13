import { getAttunement } from "../../engine/attunements"
import type { GearWordName } from "../../engine/types"
import { ATTRIBUTE_KEYS, WEAPON_NAMES } from "../../engine/types"

function sameRollFor<TName extends string>(
  names: readonly TName[],
  roll: number,
): Record<TName, number> {
  return Object.fromEntries(names.map((name) => [name, roll])) as Record<TName, number>
}

function sameUnitFor<TName extends string>(
  names: readonly TName[],
  unit: GearWordUnit,
): Record<TName, GearWordUnit> {
  return Object.fromEntries(names.map((name) => [name, unit])) as Record<TName, GearWordUnit>
}

export const GEAR_WORD_MAX_ROLL: Readonly<Record<GearWordName, number>> = {
  Power: 49.4,
  Agility: 49.4,
  Momentum: 49.4,
  "Min Phys": 77.8,
  "Max Phys": 77.8,
  Precision: 0.08,
  Crit: 0.09,
  Affinity: 0.044,
  "All Martial Boost": 0.032,
  "Damage VS Boss %": 0.032,
  "Single-Target Mystic Skill DMG Boost": 0.09797,
  "Area Mystic Skill DMG Boost": 0.07,
  "Min Void Attack": 44.2,
  "Max Void Attack": 44.2,
  "Physical Penetration": getAttunement("physPen")?.max ?? 0.078,
  "Attribute Penetration": getAttunement("formlessPen")?.max ?? 0.092,
  ...sameRollFor(
    WEAPON_NAMES.map((weapon) => `${weapon} Martial Boost` as const),
    0.062,
  ),
  ...sameRollFor(
    ATTRIBUTE_KEYS.flatMap((attribute) => [`Min ${attribute}`, `Max ${attribute}`] as const),
    44.2,
  ),
}

export type GearWordUnit = "raw" | "percent"

export const GEAR_WORD_UNIT: Readonly<Record<GearWordName, GearWordUnit>> = {
  Power: "raw",
  Agility: "raw",
  Momentum: "raw",
  "Min Phys": "raw",
  "Max Phys": "raw",
  Precision: "percent",
  Crit: "percent",
  Affinity: "percent",
  "All Martial Boost": "percent",
  "Damage VS Boss %": "percent",
  "Single-Target Mystic Skill DMG Boost": "percent",
  "Area Mystic Skill DMG Boost": "percent",
  "Min Void Attack": "raw",
  "Max Void Attack": "raw",
  "Physical Penetration": "percent",
  "Attribute Penetration": "percent",
  ...sameUnitFor(
    WEAPON_NAMES.map((weapon) => `${weapon} Martial Boost` as const),
    "percent",
  ),
  ...sameUnitFor(
    ATTRIBUTE_KEYS.flatMap((attribute) => [`Min ${attribute}`, `Max ${attribute}`] as const),
    "raw",
  ),
}
