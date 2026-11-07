export const ATTACK_FOOD_IDS = [
  "rotisserieVenison",
  "crispyPheasant",
  "doubleShreds",
  "camelMilkWine",
  "wildGinsengMeatballs",
  "simmeringFishSlices",
  "clayOvenFlatbread",
  "jadescaleSlices",
  "twinImmortalsStew",
  "caiNengjiaAttackBun",
] as const

export type AttackFoodId = (typeof ATTACK_FOOD_IDS)[number]

export const HP_FOOD_IDS = [
  "fruitCreamRolls",
  "braisedSnakehead",
  "wineBraisedPork",
  "wheatFriedMushrooms",
  "persimmonPastry",
  "lotusSoup",
] as const

export type HpFoodId = (typeof HP_FOOD_IDS)[number]

export interface PhysAttackRange {
  min: number
  max: number
}

export interface AttackFood {
  id: AttackFoodId
  minBreakthrough: number
  channel: "beforeMultiplier" | "afterMultiplier"
  physAttack: PhysAttackRange
}

export interface HpFood {
  id: HpFoodId
  minBreakthrough: number
  maxHp: number
}

// In-game values as of 2026-10-18.
export const ATTACK_FOODS: readonly AttackFood[] = [
  {
    id: "rotisserieVenison",
    minBreakthrough: 13,
    channel: "beforeMultiplier",
    physAttack: { min: 10, max: 20 },
  },
  {
    id: "crispyPheasant",
    minBreakthrough: 13,
    channel: "beforeMultiplier",
    physAttack: { min: 20, max: 40 },
  },
  {
    id: "doubleShreds",
    minBreakthrough: 13,
    channel: "beforeMultiplier",
    physAttack: { min: 50, max: 100 },
  },
  {
    id: "camelMilkWine",
    minBreakthrough: 13,
    channel: "beforeMultiplier",
    physAttack: { min: 70, max: 140 },
  },
  {
    id: "wildGinsengMeatballs",
    minBreakthrough: 14,
    channel: "beforeMultiplier",
    physAttack: { min: 90, max: 180 },
  },
  {
    id: "simmeringFishSlices",
    minBreakthrough: 16,
    channel: "beforeMultiplier",
    physAttack: { min: 120, max: 240 },
  },
  {
    id: "clayOvenFlatbread",
    minBreakthrough: 18,
    channel: "beforeMultiplier",
    physAttack: { min: 140, max: 280 },
  },
  {
    id: "jadescaleSlices",
    minBreakthrough: 20,
    channel: "beforeMultiplier",
    physAttack: { min: 160, max: 320 },
  },
  {
    id: "twinImmortalsStew",
    minBreakthrough: 20,
    channel: "beforeMultiplier",
    physAttack: { min: 200, max: 400 },
  },
  {
    id: "caiNengjiaAttackBun",
    minBreakthrough: 14,
    channel: "afterMultiplier",
    physAttack: { min: 90, max: 180 },
  },
]

// In-game values as of 2026-10-18.
export const HP_FOODS: readonly HpFood[] = [
  { id: "fruitCreamRolls", minBreakthrough: 13, maxHp: 8200 },
  { id: "braisedSnakehead", minBreakthrough: 14, maxHp: 10300 },
  { id: "wineBraisedPork", minBreakthrough: 16, maxHp: 13800 },
  { id: "wheatFriedMushrooms", minBreakthrough: 18, maxHp: 15800 },
  { id: "persimmonPastry", minBreakthrough: 20, maxHp: 22000 },
  { id: "lotusSoup", minBreakthrough: 20, maxHp: 28000 },
]

export const NO_PHYS_ATTACK: PhysAttackRange = { min: 0, max: 0 }

interface FoodSelection {
  food?: unknown
  hpFood?: unknown
  breakthrough: number
}

export function appliedAttackFood(inputs: FoodSelection): AttackFood | null {
  const food = ATTACK_FOODS.find((candidate) => candidate.id === inputs.food)
  return food && food.minBreakthrough <= inputs.breakthrough ? food : null
}

export function appliedHpFood(inputs: FoodSelection): HpFood | null {
  const food = HP_FOODS.find((candidate) => candidate.id === inputs.hpFood)
  return food && food.minBreakthrough <= inputs.breakthrough ? food : null
}

export function bestRecipeAttackFoodAt(breakthrough: number): AttackFoodId | null {
  let best: AttackFood | null = null
  for (const food of ATTACK_FOODS) {
    if (food.channel !== "beforeMultiplier" || food.minBreakthrough > breakthrough) continue
    if (best?.channel !== "beforeMultiplier" || food.physAttack.max > best.physAttack.max) {
      best = food
    }
  }
  return best?.id ?? null
}

export function foodPhysAttackBeforeMultiplier(inputs: FoodSelection): PhysAttackRange {
  const food = appliedAttackFood(inputs)
  return food?.channel === "beforeMultiplier" ? food.physAttack : NO_PHYS_ATTACK
}

export function foodPhysAttackAfterMultiplier(inputs: FoodSelection): PhysAttackRange {
  const food = appliedAttackFood(inputs)
  return food?.channel === "afterMultiplier" ? food.physAttack : NO_PHYS_ATTACK
}
