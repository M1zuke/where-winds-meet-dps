import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import { V9__renameSteadfastDevotion } from "../../src/migrations/V9__renameSteadfastDevotion"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v8/stonesplitStrength.json"

const PROFILES_KEY = "wwm.profiles"
const LEGACY_INPUTS_KEY = "wwm.inputs"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function inputsOf(blob: RawProfilesBlob): Inputs {
  return (blob.profiles[0] as StoredProfile).inputs
}

function steadfastName(inputs: Inputs): string {
  return inputs.mindMethods[2].name
}

describe("profile-v8 fixture", () => {
  it("is v8 and still carries the pre-v9 name", () => {
    expect(LEGACY.v).toBe(8)
    expect(LEGACY.v).toBe(V9__renameSteadfastDevotion.to - 1)
    expect(LEGACY.profile.inputs.classId).toBe("stonesplitStrength")
    expect(steadfastName(LEGACY.profile.inputs)).toBe("Lone Loyalty")
    expect(LEGACY.profile.inputs.inventory.length).toBeGreaterThan(0)
  })
})

describe("V9__renameSteadfastDevotion — called directly", () => {
  it("renames the stored inner way without changing its tier", () => {
    const migrated = V9__renameSteadfastDevotion.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V9__renameSteadfastDevotion.to)
    expect(inputsOf(migrated).mindMethods[2]).toEqual({
      name: "Steadfast Devotion",
      stacks: "tier 6",
    })
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V9__renameSteadfastDevotion.migrate(clone(before))
    const expected = clone(inputsOf(before))
    expected.mindMethods[2].name = "Steadfast Devotion"
    expect(inputsOf(migrated)).toEqual(expected)
  })

  it("leaves an already-correct name unchanged", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.mindMethods[2].name = "Steadfast Devotion"
    const migrated = V9__renameSteadfastDevotion.migrate(blobOf(profile))
    expect(inputsOf(migrated)).toEqual(profile.inputs)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V9__renameSteadfastDevotion.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V9__renameSteadfastDevotion.migrate(clone(once))).toEqual(once)
  })
})

describe("V9__renameSteadfastDevotion — registered in the chain", () => {
  it("walks the v8 fixture through the rename", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)))!
    expect(result.applied).toContain("V9__renameSteadfastDevotion")
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
    expect(steadfastName(inputsOf(result.blob))).toBe("Steadfast Devotion")
  })
})

describe("V9__renameSteadfastDevotion — storage paths", () => {
  beforeEach(() => localStorage.clear())

  it("upgrades and persists a saved profile without losing its build", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(clone(LEGACY.profile))))
    const { profiles } = loadProfiles()
    const loaded = profiles[0]
    expect(steadfastName(loaded.inputs)).toBe("Steadfast Devotion")
    expect(loaded.id).toBe(LEGACY.profile.id)
    expect(loaded.name).toBe(LEGACY.profile.name)
    expect(loaded.inputs.breakthrough).toBe(LEGACY.profile.inputs.breakthrough)
    expect(loaded.inputs.arsenal).toBe(LEGACY.profile.inputs.arsenal)
    expect(loaded.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(loaded.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)

    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    expect(persisted.profiles[0].inputs.mindMethods[2].name).toBe("Steadfast Devotion")
  })

  it("is idempotent across repeated loads", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(clone(LEGACY.profile))))
    const once = loadProfiles()
    expect(loadProfiles()).toEqual(once)
  })

  it("renames the old name in a bare imported profile", () => {
    expect(steadfastName(importProfile(JSON.stringify(LEGACY.profile)).inputs)).toBe(
      "Steadfast Devotion",
    )
  })

  it("renames the old name in the legacy inputs store", () => {
    localStorage.setItem(
      LEGACY_INPUTS_KEY,
      JSON.stringify({ v: 5, inputs: clone(LEGACY.profile.inputs) }),
    )
    expect(steadfastName(loadProfiles().profiles[0].inputs)).toBe("Steadfast Devotion")
  })
})
