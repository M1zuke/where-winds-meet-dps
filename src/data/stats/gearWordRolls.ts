import { getAttunement } from "../../engine/attunements"
import type { GearWordName } from "../../engine/types"
import { ATTRIBUTE_KEYS, WEAPON_NAMES } from "../../engine/types"

function sameRollFor<TName extends string>(
  names: readonly TName[],
  roll: number,
): Record<TName, number> {
  return Object.fromEntries(names.map((name) => [name, roll])) as Record<TName, number>
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
