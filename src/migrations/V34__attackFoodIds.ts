// v33 → v34 — `food` was a boolean: `true` = +120/+240 physical attack, `false`
// = none. It now names the attack food eaten, and `hpFood` names the Max HP
// food. `true` becomes the food closest to the old +120/+240 that the profile's
// breakthrough can eat; `false` becomes none. A string already there is kept
// exactly as stored.
import { defaultBreakthrough } from "../definitions/baseStats/breakthroughs"
import type { Migration, RawProfilesBlob } from "./types"

const VALID_BREAKTHROUGHS = new Set([12, 13, 14, 15, 16, 17, 18, 19, 20, 21])

const LEGACY_TARGET_TO_BREAKTHROUGH: Record<string, number> = {
  "81": 12,
  "86": 13,
  "91": 14,
  "96": 16,
}

export function resolveStoredBreakthrough(inputs: Record<string, unknown>): number {
  if (typeof inputs.breakthrough === "number" && VALID_BREAKTHROUGHS.has(inputs.breakthrough)) {
    return inputs.breakthrough
  }
  const trial =
    typeof inputs.targetId === "string" ? (inputs.targetId.match(/^(\d+)/)?.[1] ?? "") : ""
  return LEGACY_TARGET_TO_BREAKTHROUGH[trial] ?? defaultBreakthrough()
}

const FOOD_FOR_TRUE_BY_MIN_BREAKTHROUGH = [
  { minBreakthrough: 16, food: "simmeringFishSlices" },
  { minBreakthrough: 14, food: "wildGinsengMeatballs" },
  { minBreakthrough: 0, food: "camelMilkWine" },
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function foodForTrue(breakthrough: number): string {
  return FOOD_FOR_TRUE_BY_MIN_BREAKTHROUGH.find((entry) => breakthrough >= entry.minBreakthrough)!
    .food
}

export function migrateFoodField(inputs: Record<string, unknown>): Record<string, unknown> {
  const food =
    inputs.food === true
      ? foodForTrue(resolveStoredBreakthrough(inputs))
      : inputs.food === false || inputs.food === undefined
        ? null
        : inputs.food
  return { ...inputs, food, hpFood: inputs.hpFood === undefined ? null : inputs.hpFood }
}

export const V34__attackFoodIds: Migration = {
  to: 34,
  name: "V34__attackFoodIds",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRecord(profile) && isRecord(profile.inputs)
            ? { ...profile, inputs: migrateFoodField(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 34, profiles }
  },
}
