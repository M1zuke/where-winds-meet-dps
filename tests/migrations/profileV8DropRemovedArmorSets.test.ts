// Ivorybloom and Rainwhisper were removed from the armor-set data, so a stored
// `set` naming one is now illegal. `V8__dropRemovedArmorSets` heals stored
// profiles; `hydrateInputs` holds the same invariant on the two paths that never
// walk the chain, which is why the step is called directly below rather than
// asserted through `loadProfiles` alone — see docs/TESTING.md § "Migration
// tests".
import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { ARMOR_SET_OPTIONS } from "../../src/engine/panel"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V8__dropRemovedArmorSets } from "../../src/migrations/V8__dropRemovedArmorSets"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v7/bellstrikeUmbra.json"

const REMOVED_SETS = ["Ivorybloom", "Rainwhisper", "Rainwhisper (no shield)"]

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withSet(profile: StoredProfile, set: string | null): StoredProfile {
  return { ...profile, inputs: { ...profile.inputs, set } }
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function inputsOf(blob: RawProfilesBlob): Inputs {
  return (blob.profiles[0] as StoredProfile).inputs
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

describe("profile-v7 fixture", () => {
  it("is v7 and still carries the pre-v8 shape", () => {
    expect(LEGACY.v).toBe(7)
    expect(LEGACY.v).toBe(V8__dropRemovedArmorSets.to - 1)
    expect(LEGACY.profile.inputs.classId).toBe("bellstrikeUmbra")
    expect(LEGACY.profile.inputs.set).toBe("Hawking")
    expect(LEGACY.profile.inputs.inventory.length).toBeGreaterThan(0)
  })
})

describe("V8__dropRemovedArmorSets — called directly", () => {
  for (const removed of REMOVED_SETS) {
    it(`clears a stored ${removed}`, () => {
      const migrated = V8__dropRemovedArmorSets.migrate(
        blobOf(withSet(clone(LEGACY.profile), removed)),
      )
      expect(migrated.v).toBe(V8__dropRemovedArmorSets.to)
      expect(inputsOf(migrated).set).toBeNull()
    })
  }

  for (const option of ARMOR_SET_OPTIONS) {
    it(`leaves ${option.setKey} untouched`, () => {
      const migrated = V8__dropRemovedArmorSets.migrate(
        blobOf(withSet(clone(LEGACY.profile), option.setKey)),
      )
      expect(inputsOf(migrated).set).toBe(option.setKey)
    })
  }

  it("leaves an already-unset profile at null", () => {
    const migrated = V8__dropRemovedArmorSets.migrate(blobOf(withSet(clone(LEGACY.profile), null)))
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("touches nothing but the set", () => {
    const before = blobOf(withSet(clone(LEGACY.profile), "Ivorybloom"))
    const migrated = V8__dropRemovedArmorSets.migrate(clone(before))
    expect(inputsOf(migrated)).toEqual({ ...inputsOf(before), set: null })
    expect((migrated.profiles[0] as StoredProfile).id).toBe(LEGACY.profile.id)
    expect((migrated.profiles[0] as StoredProfile).name).toBe(LEGACY.profile.name)
  })

  it("does not mutate its input", () => {
    const input = blobOf(withSet(clone(LEGACY.profile), "Rainwhisper"))
    const snapshot = clone(input)
    V8__dropRemovedArmorSets.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V8__dropRemovedArmorSets.migrate(
      blobOf(withSet(clone(LEGACY.profile), "Ivorybloom")),
    )
    expect(V8__dropRemovedArmorSets.migrate(clone(once))).toEqual(once)
  })
})

describe("V8__dropRemovedArmorSets — registered in the chain", () => {
  it("a v7 blob migrated to v8 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(withSet(clone(LEGACY.profile), "Ivorybloom")), {
      toVersion: 8,
    })!
    expect(result.applied).toEqual(["V8__dropRemovedArmorSets"])
    expect(result.blob.v).toBe(8)
    expect(inputsOf(result.blob).set).toBeNull()
  })
})

// The chain never runs on these two, so only the `hydrateInputs` allowlist pass
// stands between them and an illegal stored set.
describe("hydrateInputs backstop — the paths that bypass the chain", () => {
  beforeEach(() => localStorage.clear())

  it("clears a removed set on a bare imported profile", () => {
    const bare = withSet(clone(LEGACY.profile), "Ivorybloom")
    expect(importProfile(JSON.stringify(bare)).inputs.set).toBeNull()
  })

  it("keeps a surviving set on a bare imported profile, healed to its id", () => {
    const bare = withSet(clone(LEGACY.profile), "Jadeware")
    expect(importProfile(JSON.stringify(bare)).inputs.set).toBe("jadeware")
  })

  it("clears a removed set on the legacy wwm.inputs blob rolled into a profile", () => {
    localStorage.setItem(
      "wwm.inputs",
      JSON.stringify({ v: 5, inputs: withSet(clone(LEGACY.profile), "Rainwhisper").inputs }),
    )
    expect(loadOne().inputs.set).toBeNull()
  })
})
