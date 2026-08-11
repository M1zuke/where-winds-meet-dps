// Ivorybloom and Rainwhisper were removed from the armor-set data, so a stored
// `set` naming one is now illegal. `V8__dropRemovedArmorSets` heals stored
// profiles; `hydrateInputs` holds the same invariant on the two paths that never
// walk the chain, which is why the step is called directly below rather than
// asserted through `loadProfiles` alone — see MIGRATION-TESTS.md §3.
//
// `profile-v7.json` was produced by walking the captured `profile-v6.json`
// through the real chain, the same hop the app performs on load.
import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet, ARMOR_SET_OPTIONS } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import { V8__dropRemovedArmorSets } from "../../src/migrations/V8__dropRemovedArmorSets"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/profile-v7.json"

const PROFILES_KEY = "wwm.profiles"
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

function writeProfile(profile: StoredProfile): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(profile)))
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

describe("profile-v7 fixture", () => {
  it("is v7 and still carries the pre-v8 shape", () => {
    expect(LEGACY.v).toBe(7)
    expect(LEGACY.v).toBe(LATEST_PROFILES_VERSION - 1)
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
  it("the v7 fixture walks to the latest version through this step", () => {
    const result = runProfileMigrations(blobOf(withSet(clone(LEGACY.profile), "Ivorybloom")))!
    expect(result.applied).toContain("V8__dropRemovedArmorSets")
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
    expect(inputsOf(result.blob).set).toBeNull()
  })
})

describe("V8__dropRemovedArmorSets — end to end through loadProfiles", () => {
  beforeEach(() => localStorage.clear())

  it("clears the set and persists the upgraded blob at the latest version", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Ivorybloom"))
    expect(loadOne().inputs.set).toBeNull()

    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    expect(persisted.profiles[0].inputs.set).toBeNull()
  })

  it("carries the rest of the real build through — only the set differs from a Hawking load", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Hawking"))
    const kept = loadOne()

    localStorage.clear()
    writeProfile(withSet(clone(LEGACY.profile), "Rainwhisper"))
    const cleared = loadOne()

    expect({ ...cleared.inputs, set: kept.inputs.set }).toEqual(kept.inputs)
    expect(cleared.id).toBe(LEGACY.profile.id)
    expect(cleared.name).toBe(LEGACY.profile.name)
    expect(cleared.inputs.breakthrough).toBe(LEGACY.profile.inputs.breakthrough)
    expect(cleared.inputs.arsenal).toBe(LEGACY.profile.inputs.arsenal)
    expect(cleared.inputs.mindMethods).toEqual(LEGACY.profile.inputs.mindMethods)
    expect(cleared.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(cleared.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
  })

  it("still computes a positive-DPS run", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Ivorybloom"))
    const after = loadOne()
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(after.inputs))))
    expect(result.dps).toBeGreaterThan(0)
  })

  it("is idempotent across repeated loads", () => {
    writeProfile(withSet(clone(LEGACY.profile), "Ivorybloom"))
    const once = loadOne()
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify({ v: LATEST_PROFILES_VERSION, profiles: [clone(once)], activeId: once.id }),
    )
    expect(loadOne()).toEqual(once)
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

  it("keeps a surviving set on a bare imported profile", () => {
    const bare = withSet(clone(LEGACY.profile), "Jadeware")
    expect(importProfile(JSON.stringify(bare)).inputs.set).toBe("Jadeware")
  })

  it("clears a removed set on the legacy wwm.inputs blob rolled into a profile", () => {
    localStorage.setItem(
      "wwm.inputs",
      JSON.stringify({ v: 5, inputs: withSet(clone(LEGACY.profile), "Rainwhisper").inputs }),
    )
    expect(loadOne().inputs.set).toBeNull()
  })
})
