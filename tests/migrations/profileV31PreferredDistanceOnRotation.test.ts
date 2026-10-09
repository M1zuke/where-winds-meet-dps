import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V31__preferredDistanceOnRotation,
  movePreferredDistanceOntoRotation,
} from "../../src/migrations/V31__preferredDistanceOnRotation"
import type { StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v30/bellstrikeUmbra.json"

const PROFILES_KEY = "wwm.profiles"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function rawInputsOf(profile: StoredProfile): Record<string, unknown> {
  return profile.inputs as unknown as Record<string, unknown>
}

function profileWithEncounterDistance(meters: number): StoredProfile {
  const profile = clone(LEGACY.profile)
  const inputs = rawInputsOf(profile)
  inputs.combatSettings = {
    ...(inputs.combatSettings as Record<string, unknown>),
    preferredDistanceMeters: meters,
  }
  return profile
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function migratedInputs(profile: StoredProfile): Record<string, unknown> {
  const result = runProfileMigrations(blobOf(profile), {
    toVersion: V31__preferredDistanceOnRotation.to,
  })!
  return rawInputsOf(result.blob.profiles[0] as StoredProfile)
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v30, the version this step reads", () => {
    expect(LEGACY.v).toBe(V31__preferredDistanceOnRotation.to - 1)
  })

  it("holds a custom rotation that carries no distance of its own", () => {
    const rotation = rawInputsOf(LEGACY.profile).activeCustomRotation as Record<string, unknown>
    expect(rotation).toBeTruthy()
    expect(rotation).not.toHaveProperty("preferredDistanceMeters")
  })
})

describe("V31__preferredDistanceOnRotation", () => {
  it("is the only step a v30 blob walks through", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 31 })!
    expect(result.applied).toEqual(["V31__preferredDistanceOnRotation"])
    expect(result.blob.v).toBe(31)
  })

  it("moves the encounter distance onto the active custom rotation", () => {
    const inputs = migratedInputs(profileWithEncounterDistance(7))
    const rotation = inputs.activeCustomRotation as Record<string, unknown>

    expect(rotation.preferredDistanceMeters).toBe(7)
    expect(inputs.combatSettings).not.toHaveProperty("preferredDistanceMeters")
  })

  it("never overwrites a distance the rotation already carries", () => {
    const profile = profileWithEncounterDistance(7)
    const inputs = rawInputsOf(profile)
    inputs.activeCustomRotation = {
      ...(inputs.activeCustomRotation as Record<string, unknown>),
      preferredDistanceMeters: 12,
    }

    const rotation = migratedInputs(profile).activeCustomRotation as Record<string, unknown>
    expect(rotation.preferredDistanceMeters).toBe(12)
  })

  it("drops the encounter field from a profile with no custom rotation, adding no rotation", () => {
    const profile = profileWithEncounterDistance(7)
    delete rawInputsOf(profile).activeCustomRotation

    const inputs = migratedInputs(profile)
    expect(inputs).not.toHaveProperty("activeCustomRotation")
    expect(inputs.combatSettings).not.toHaveProperty("preferredDistanceMeters")
  })

  it("is idempotent", () => {
    const once = movePreferredDistanceOntoRotation(rawInputsOf(profileWithEncounterDistance(7)))
    expect(movePreferredDistanceOntoRotation(once)).toEqual(once)
  })

  it("leaves the user's build otherwise untouched", () => {
    const before = rawInputsOf(LEGACY.profile)
    const after = migratedInputs(clone(LEGACY.profile))

    expect(after.classId).toBe(before.classId)
    expect(after.gearInventory).toEqual(before.gearInventory)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect((after.activeCustomRotation as Record<string, unknown>).steps).toEqual(
      (before.activeCustomRotation as Record<string, unknown>).steps,
    )
  })
})

describe("a v30 profile loaded and imported end to end", () => {
  beforeEach(() => localStorage.clear())

  it("loads with the encounter distance on its custom rotation", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(profileWithEncounterDistance(7))))

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.activeCustomRotation?.preferredDistanceMeters).toBe(7)
  })

  it("loads a profile that never stored a distance at the default 3 m", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(clone(LEGACY.profile))))

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.activeCustomRotation?.preferredDistanceMeters).toBe(3)
  })

  it("imports an unversioned profile with the encounter distance on its custom rotation", () => {
    const imported = importProfile(JSON.stringify(profileWithEncounterDistance(9)))

    expect(imported.inputs.activeCustomRotation?.preferredDistanceMeters).toBe(9)
  })
})
