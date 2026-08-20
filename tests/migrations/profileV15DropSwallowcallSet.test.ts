import { beforeEach, describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { ARMOR_SET_OPTIONS } from "../../src/engine/panel"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V15__dropSwallowcallSet } from "../../src/migrations/V15__dropSwallowcallSet"
import type { StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v14/silkbindJade.json"

const RETIRED_SET_ID = "swallowcall"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withSet(profile: StoredProfile, set: string | null): StoredProfile {
  return { ...profile, inputs: { ...profile.inputs, set } }
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function inputsOf(blob: RawProfilesBlob) {
  return (blob.profiles[0] as StoredProfile).inputs
}

describe("profile-v14 fixture", () => {
  it("is v14, the version this step reads", () => {
    expect(LEGACY.v).toBe(14)
    expect(LEGACY.v).toBe(V15__dropSwallowcallSet.to - 1)
  })
})

describe("V15__dropSwallowcallSet — called directly", () => {
  it("clears a stored swallowcall", () => {
    const migrated = V15__dropSwallowcallSet.migrate(
      blobOf(withSet(clone(LEGACY.profile), RETIRED_SET_ID)),
    )
    expect(migrated.v).toBe(V15__dropSwallowcallSet.to)
    expect(inputsOf(migrated).set).toBeNull()
  })

  for (const option of ARMOR_SET_OPTIONS) {
    it(`leaves the still-offered ${option.setKey} untouched`, () => {
      const migrated = V15__dropSwallowcallSet.migrate(
        blobOf(withSet(clone(LEGACY.profile), option.setKey)),
      )
      expect(inputsOf(migrated).set).toBe(option.setKey)
    })
  }

  it("leaves an already-unset profile at null", () => {
    const migrated = V15__dropSwallowcallSet.migrate(blobOf(withSet(clone(LEGACY.profile), null)))
    expect(inputsOf(migrated).set).toBeNull()
  })

  it("touches nothing but the set", () => {
    const before = blobOf(withSet(clone(LEGACY.profile), RETIRED_SET_ID))
    const migrated = V15__dropSwallowcallSet.migrate(clone(before))
    expect(inputsOf(migrated)).toEqual({ ...inputsOf(before), set: null })
    expect((migrated.profiles[0] as StoredProfile).id).toBe(LEGACY.profile.id)
  })

  it("does not mutate its input", () => {
    const input = blobOf(withSet(clone(LEGACY.profile), RETIRED_SET_ID))
    const snapshot = clone(input)
    V15__dropSwallowcallSet.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V15__dropSwallowcallSet.migrate(
      blobOf(withSet(clone(LEGACY.profile), RETIRED_SET_ID)),
    )
    expect(V15__dropSwallowcallSet.migrate(clone(once))).toEqual(once)
  })
})

describe("V15__dropSwallowcallSet — registered in the chain", () => {
  it("a v14 blob migrated to v15 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(withSet(clone(LEGACY.profile), RETIRED_SET_ID)), {
      toVersion: 15,
    })!
    expect(result.applied).toEqual(["V15__dropSwallowcallSet"])
    expect(result.blob.v).toBe(15)
    expect(inputsOf(result.blob).set).toBeNull()
  })

  it("reaches a profile still storing the pre-V11 display name", () => {
    const result = runProfileMigrations(blobOf(withSet(clone(LEGACY.profile), "Swallowcall"), 10), {
      toVersion: 15,
    })!
    expect(result.blob.v).toBe(15)
    expect(inputsOf(result.blob).set).toBeNull()
  })
})

describe("hydrateInputs backstop — swallowcall on a bare import, never walking the chain", () => {
  beforeEach(() => localStorage.clear())

  it("clears it", () => {
    const bare = withSet(clone(LEGACY.profile), RETIRED_SET_ID)
    expect(importProfile(JSON.stringify(bare)).inputs.set).toBeNull()
  })

  it("keeps a set that is still offered", () => {
    const bare = withSet(clone(LEGACY.profile), "mistwillow")
    expect(importProfile(JSON.stringify(bare)).inputs.set).toBe("mistwillow")
  })
})
