import { beforeEach, describe, expect, it } from "vitest"
import { SET_BY_ID } from "../../src/definitions/sets/registry"
import type { StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V23__renameHawking, migrateHawkingSetId } from "../../src/migrations/V23__renameHawking"
import { importProfile } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v22/bellstrikeUmbra.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function profileOf(blob: RawProfilesBlob): StoredProfile {
  return blob.profiles[0] as StoredProfile
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v22 with the previous set id", () => {
    expect(LEGACY.v).toBe(22)
    expect(LEGACY.v).toBe(V23__renameHawking.to - 1)
    expect(LEGACY.profile.inputs.set).toBe("hawking")
  })
})

describe("V23__renameHawking — called directly", () => {
  it("renames the persisted set id to the current built-in id", () => {
    const migrated = V23__renameHawking.migrate(blobOf(clone(LEGACY.profile)))
    expect(profileOf(migrated).inputs.set).toBe("hawkwing")
    expect(SET_BY_ID.hawkwing).toBeDefined()
  })

  it("touches nothing else in the profile", () => {
    const migrated = profileOf(V23__renameHawking.migrate(blobOf(clone(LEGACY.profile))))
    expect(migrated).toEqual({
      ...LEGACY.profile,
      inputs: { ...LEGACY.profile.inputs, set: "hawkwing" },
    })
  })

  it("leaves current, unrelated and missing values unchanged", () => {
    expect(migrateHawkingSetId("hawkwing")).toBe("hawkwing")
    expect(migrateHawkingSetId("jadeware")).toBe("jadeware")
    expect(migrateHawkingSetId(null)).toBeNull()
    expect(migrateHawkingSetId(undefined)).toBeUndefined()
  })

  it("does not mutate its input", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    V23__renameHawking.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V23__renameHawking.migrate(blobOf(clone(LEGACY.profile)))
    expect(V23__renameHawking.migrate(clone(once))).toEqual(once)
  })
})

describe("V23__renameHawking — registered in the chain", () => {
  it("a v22 blob migrated to v23 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 23 })!
    expect(result.applied).toEqual(["V23__renameHawking"])
    expect(result.blob.v).toBe(23)
    expect(profileOf(result.blob).inputs.set).toBe("hawkwing")
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still renames the previous set id", () => {
    const imported = importProfile(JSON.stringify(clone(LEGACY.profile)))
    expect(imported.inputs.set).toBe("hawkwing")
  })
})
