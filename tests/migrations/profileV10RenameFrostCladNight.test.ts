import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V10__renameFrostCladNight } from "../../src/migrations/V10__renameFrostCladNight"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v9/stonesplitStrength.json"

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

function frostCladName(inputs: Inputs): string {
  return inputs.mindMethods[0].name
}

describe("profile-v9 fixture", () => {
  it("is v9 and still carries the pre-v10 name", () => {
    expect(LEGACY.v).toBe(9)
    expect(LEGACY.v).toBe(V10__renameFrostCladNight.to - 1)
    expect(LEGACY.profile.inputs.classId).toBe("stonesplitStrength")
    expect(frostCladName(LEGACY.profile.inputs)).toBe("Frostwhite Night")
    expect(LEGACY.profile.inputs.inventory.length).toBeGreaterThan(0)
  })
})

describe("V10__renameFrostCladNight — called directly", () => {
  it("renames the stored inner way without changing its tier", () => {
    const migrated = V10__renameFrostCladNight.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V10__renameFrostCladNight.to)
    expect(inputsOf(migrated).mindMethods[0]).toEqual({
      name: "Frost-Clad Night",
      stacks: "tier 6",
    })
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V10__renameFrostCladNight.migrate(clone(before))
    const expected = clone(inputsOf(before))
    expected.mindMethods[0].name = "Frost-Clad Night"
    expect(inputsOf(migrated)).toEqual(expected)
  })

  it("leaves an already-correct name unchanged", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.mindMethods[0].name = "Frost-Clad Night"
    const migrated = V10__renameFrostCladNight.migrate(blobOf(profile))
    expect(inputsOf(migrated)).toEqual(profile.inputs)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V10__renameFrostCladNight.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V10__renameFrostCladNight.migrate(clone(once))).toEqual(once)
  })
})

describe("V10__renameFrostCladNight — registered in the chain", () => {
  it("a v9 blob migrated to v10 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 10 })!
    expect(result.applied).toEqual(["V10__renameFrostCladNight"])
    expect(result.blob.v).toBe(10)
    expect(frostCladName(inputsOf(result.blob))).toBe("Frost-Clad Night")
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  beforeEach(() => localStorage.clear())

  it("renames the old name in a bare imported profile", () => {
    expect(frostCladName(importProfile(JSON.stringify(LEGACY.profile)).inputs)).toBe(
      "Frost-Clad Night",
    )
  })

  it("renames the old name in the legacy inputs store", () => {
    localStorage.setItem(
      LEGACY_INPUTS_KEY,
      JSON.stringify({ v: 5, inputs: clone(LEGACY.profile.inputs) }),
    )
    expect(frostCladName(loadProfiles().profiles[0].inputs)).toBe("Frost-Clad Night")
  })
})
