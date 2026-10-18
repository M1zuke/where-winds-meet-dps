import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V34__attackFoodIds,
  migrateFoodField,
  resolveStoredBreakthrough,
} from "../../src/migrations/V34__attackFoodIds"
import { appliedAttackFood } from "../../src/data/consumables/foods"
import type { StoredProfile } from "../../src/engine/types"
import umbraFile from "./testProfiles/v33/bellstrikeUmbra.json"
import bamboocutFile from "./testProfiles/v33/bamboocutDraught.json"

type CapturedFile = { v: number; profile: StoredProfile }
const UMBRA = umbraFile as unknown as CapturedFile
const BAMBOOCUT = bamboocutFile as unknown as CapturedFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function rawInputsOf(profile: StoredProfile): Record<string, unknown> {
  return profile.inputs as unknown as Record<string, unknown>
}

function blobOf(profile: StoredProfile, version: number): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function migratedInputs(profile: StoredProfile): Record<string, unknown> {
  const result = runProfileMigrations(blobOf(profile, 33), { toVersion: V34__attackFoodIds.to })!
  return rawInputsOf(result.blob.profiles[0] as StoredProfile)
}

function withFood(food: unknown, breakthrough: number): StoredProfile {
  const profile = clone(UMBRA.profile)
  const inputs = rawInputsOf(profile)
  inputs.food = food
  inputs.breakthrough = breakthrough
  return profile
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v33, the version this step reads", () => {
    expect(UMBRA.v).toBe(V34__attackFoodIds.to - 1)
    expect(BAMBOOCUT.v).toBe(V34__attackFoodIds.to - 1)
  })

  it("holds food as a boolean and no HP food", () => {
    expect(rawInputsOf(UMBRA.profile).food).toBe(true)
    expect("hpFood" in rawInputsOf(UMBRA.profile)).toBe(false)
  })
})

describe("V34__attackFoodIds", () => {
  it("is the only step a v33 blob walks through", () => {
    const result = runProfileMigrations(blobOf(clone(UMBRA.profile), 33), { toVersion: 34 })!
    expect(result.applied).toEqual(["V34__attackFoodIds"])
    expect(result.blob.v).toBe(34)
  })

  it.each([
    [13, "camelMilkWine"],
    [14, "wildGinsengMeatballs"],
    [15, "wildGinsengMeatballs"],
    [16, "simmeringFishSlices"],
    [17, "simmeringFishSlices"],
    [20, "simmeringFishSlices"],
  ])("turns food on at breakthrough %i into %s", (breakthrough, food) => {
    const inputs = migratedInputs(withFood(true, breakthrough))
    expect(inputs.food).toBe(food)
    expect(appliedAttackFood({ food: inputs.food, breakthrough })).not.toBeNull()
  })

  it.each([13, 14, 15, 16, 20])("turns food off at breakthrough %i into none", (breakthrough) => {
    expect(migratedInputs(withFood(false, breakthrough)).food).toBeNull()
  })

  it("keeps the fish slices numbers where they were obtainable", () => {
    const inputs = migratedInputs(clone(UMBRA.profile))
    expect(inputs.food).toBe("simmeringFishSlices")
    expect(appliedAttackFood({ food: inputs.food, breakthrough: 16 })).toMatchObject({
      physAttack: { min: 120, max: 240 },
    })
  })

  it.each([
    ["86", "camelMilkWine"],
    ["91", "wildGinsengMeatballs"],
  ])("maps food on by the legacy target %s to %s", (targetId, food) => {
    const profile = clone(UMBRA.profile)
    const inputs = rawInputsOf(profile)
    delete inputs.breakthrough
    inputs.targetId = targetId
    inputs.food = true
    const migrated = migratedInputs(profile)
    expect(migrated.food).toBe(food)
    expect(
      appliedAttackFood({ food: migrated.food, breakthrough: resolveStoredBreakthrough(inputs) }),
    ).not.toBeNull()
  })

  it("adds an empty HP food", () => {
    expect(migratedInputs(clone(UMBRA.profile)).hpFood).toBeNull()
  })

  it("keeps a food this build does not recognise exactly as stored", () => {
    const inputs = migratedInputs(withFood("aFoodFromALaterBuild", 16))
    expect(inputs.food).toBe("aFoodFromALaterBuild")
  })

  it("keeps an HP food already stored", () => {
    const profile = clone(UMBRA.profile)
    rawInputsOf(profile).hpFood = "lotusSoup"
    expect(migratedInputs(profile).hpFood).toBe("lotusSoup")
  })

  it("leaves the user's build otherwise untouched", () => {
    const before = rawInputsOf(UMBRA.profile)
    const after = migratedInputs(clone(UMBRA.profile))
    const { food: _beforeFood, ...beforeRest } = before
    const { food: _afterFood, hpFood: _hpFood, ...afterRest } = after
    void [_beforeFood, _afterFood, _hpFood]
    expect(afterRest).toEqual(beforeRest)
  })

  it("migrates a profile of another class the same way", () => {
    expect(rawInputsOf(BAMBOOCUT.profile).breakthrough).toBe(17)
    expect(migratedInputs(clone(BAMBOOCUT.profile)).food).toBe("simmeringFishSlices")
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(rawInputsOf(UMBRA.profile))
    const snapshot = clone(input)
    const once = migrateFoodField(input)
    expect(input).toEqual(snapshot)
    expect(migrateFoodField(once)).toEqual(once)
    expect(
      runProfileMigrations(blobOf(clone(UMBRA.profile), 34), { toVersion: 34 })!.applied,
    ).toEqual([])
  })
})
