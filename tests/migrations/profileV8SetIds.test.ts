// `Inputs.set` stopped storing the set's display name and stores a stable id
// from `src/data/sets/` instead — see docs/CALCULATION.md § "Mind-method
// layers" and MIGRATIONS.md. A profile saved before this holds the old name.
import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import {
  V8__setIdsWithoutDisplayName,
  migrateSetId,
} from "../../src/migrations/V8__setIdsWithoutDisplayName"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/profile-v7.json"

const PROFILES_KEY = "wwm.profiles"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function writeProfilesBlob(profile: StoredProfile): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(profile)))
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

const inputsOf = (blob: RawProfilesBlob) =>
  (blob.profiles[0] as unknown as { inputs: Inputs }).inputs

function withSet(profile: StoredProfile, set: string | null): StoredProfile {
  return { ...clone(profile), inputs: { ...clone(profile.inputs), set } }
}

function pipelineDps(inputs: Inputs): ReturnType<typeof runEngine> {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs))))
}

describe("profile-v7 fixture — the stored blob predates the set id rename", () => {
  it("is version 7 and carries the set by its old display name", () => {
    expect(LEGACY.v).toBe(7)
    expect(LEGACY.profile.inputs.set).toBe("Hawking")
  })
})

describe("migrateSetId — the frozen name table", () => {
  it("maps every one of the 11 legacy display names to its id", () => {
    expect(migrateSetId("Hawking")).toBe("hawking")
    expect(migrateSetId("Jadeware")).toBe("jadeware")
    expect(migrateSetId("Rainwhisper")).toBe("rainwhisper")
    expect(migrateSetId("Rainwhisper (no shield)")).toBe("rainwhisperNoShield")
    expect(migrateSetId("Ivorybloom")).toBe("ivorybloom")
    expect(migrateSetId("Swallowcall")).toBe("swallowcall")
    expect(migrateSetId("Swift Gale")).toBe("swiftGale")
    expect(migrateSetId("Swaying Heights")).toBe("swayingHeights")
    expect(migrateSetId("Mistwillow")).toBe("mistwillow")
    expect(migrateSetId("Stars Align")).toBe("starsAlign")
    expect(migrateSetId("Shattered Ridge")).toBe("shatteredRidge")
  })

  it("degrades an unrecognised or absent value to no set, rather than throwing", () => {
    expect(migrateSetId("Some Removed Set")).toBeNull()
    expect(migrateSetId(null)).toBeNull()
    expect(migrateSetId(undefined)).toBeNull()
    expect(migrateSetId("")).toBeNull()
    expect(migrateSetId(42)).toBeNull()
  })

  it("is idempotent — an already-migrated id passes through unchanged", () => {
    expect(migrateSetId("hawking")).toBe("hawking")
    expect(migrateSetId("rainwhisperNoShield")).toBe("rainwhisperNoShield")
  })
})

describe("V8 step — v7 → v8 in isolation", () => {
  it("rewrites the legacy display name to its id", () => {
    const migrated = V8__setIdsWithoutDisplayName.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V8__setIdsWithoutDisplayName.to)
    expect(inputsOf(migrated).set).toBe("hawking")
  })

  it("degrades an unrecognised set to null instead of leaving it dangling", () => {
    const migrated = V8__setIdsWithoutDisplayName.migrate(
      blobOf(withSet(LEGACY.profile, "A Removed Set")),
    )
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("leaves no set (null) alone", () => {
    const migrated = V8__setIdsWithoutDisplayName.migrate(blobOf(withSet(LEGACY.profile, null)))
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("carries every neighbouring field across the step untouched", () => {
    const migrated = V8__setIdsWithoutDisplayName.migrate(blobOf(clone(LEGACY.profile)))
    const before = LEGACY.profile.inputs
    const after = inputsOf(migrated)
    expect(after.inventory).toEqual(before.inventory)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect(after.classId).toBe(before.classId)
    expect(after.breakthrough).toBe(before.breakthrough)
  })

  it("is registered, and the chain reports it for a v7 blob", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)))!
    expect(result.applied).toContain("V8__setIdsWithoutDisplayName")
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
  })

  it("does not mutate its input, and migrating twice equals migrating once", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V8__setIdsWithoutDisplayName.migrate(input)
    expect(input).toEqual(snapshot)
    const twice = V8__setIdsWithoutDisplayName.migrate(once)
    expect(twice).toEqual(once)
  })
})

describe("v7 profile with the legacy set name → loaded build", () => {
  beforeEach(() => localStorage.clear())

  it("arrives with the id, so the set's bonus still resolves", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const after = loadOne()
    expect(after.inputs.set).toBe("hawking")

    const result = pipelineDps(after.inputs)
    expect(result.dps).toBeGreaterThan(0)
  })

  it("re-persists the blob at the latest version so the walk runs once", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    loadProfiles()
    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    expect(persisted.profiles[0].inputs.set).toBe("hawking")
  })

  it("is idempotent — loading twice in a row yields an equal profile", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const once = loadOne()
    writeProfilesBlob(clone(once))
    expect(loadOne()).toEqual(once)
  })
})
