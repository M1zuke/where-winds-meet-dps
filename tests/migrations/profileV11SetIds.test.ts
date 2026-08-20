// `Inputs.set` stores a stable id from `src/data/sets/`, not the set's display
// name. A profile saved before that holds the old name — docs/MIGRATIONS.md.
import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V11__setIdsWithoutDisplayName,
  migrateSetId,
} from "../../src/migrations/V11__setIdsWithoutDisplayName"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v10/stonesplitStrength.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

const inputsOf = (blob: RawProfilesBlob) =>
  (blob.profiles[0] as unknown as { inputs: Inputs }).inputs

function withSet(profile: StoredProfile, set: string | null): StoredProfile {
  return { ...clone(profile), inputs: { ...clone(profile.inputs), set } }
}

describe("profile-v10 fixture — the stored blob predates the set id rename", () => {
  it("is version 10 and carries the set by its old display name", () => {
    expect(LEGACY.v).toBe(10)
    expect(LEGACY.profile.inputs.set).toBe("Shattered Ridge")
  })
})

describe("migrateSetId — the frozen name table", () => {
  it("maps every surviving legacy display name to its id", () => {
    expect(migrateSetId("Hawking")).toBe("hawking")
    expect(migrateSetId("Jadeware")).toBe("jadeware")
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
    expect(migrateSetId("shatteredRidge")).toBe("shatteredRidge")
  })
})

describe("V11 step — v10 → v11 in isolation", () => {
  it("rewrites the legacy display name to its id", () => {
    const migrated = V11__setIdsWithoutDisplayName.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V11__setIdsWithoutDisplayName.to)
    expect(inputsOf(migrated).set).toBe("shatteredRidge")
  })

  it("degrades an unrecognised set to null instead of leaving it dangling", () => {
    const migrated = V11__setIdsWithoutDisplayName.migrate(
      blobOf(withSet(LEGACY.profile, "A Removed Set")),
    )
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("leaves no set (null) alone", () => {
    const migrated = V11__setIdsWithoutDisplayName.migrate(blobOf(withSet(LEGACY.profile, null)))
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("carries every neighbouring field across the step untouched", () => {
    const migrated = V11__setIdsWithoutDisplayName.migrate(blobOf(clone(LEGACY.profile)))
    const before = LEGACY.profile.inputs
    const after = inputsOf(migrated)
    expect(after.inventory).toEqual(before.inventory)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect(after.classId).toBe(before.classId)
    expect(after.breakthrough).toBe(before.breakthrough)
  })

  it("does not mutate its input, and migrating twice equals migrating once", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V11__setIdsWithoutDisplayName.migrate(input)
    expect(input).toEqual(snapshot)
    const twice = V11__setIdsWithoutDisplayName.migrate(once)
    expect(twice).toEqual(once)
  })
})

describe("V11__setIdsWithoutDisplayName — registered in the chain", () => {
  it("a v10 blob migrated to v11 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 11 })!
    expect(result.applied).toEqual(["V11__setIdsWithoutDisplayName"])
    expect(result.blob.v).toBe(11)
    expect(inputsOf(result.blob).set).toBe("shatteredRidge")
  })
})
