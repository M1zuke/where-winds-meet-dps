import { beforeEach, describe, expect, it } from "vitest"
import type { StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V29__divinecraftElement,
  migrateDivinecraftField,
} from "../../src/migrations/V29__divinecraftElement"
import { importProfile } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v28/bellstrikeUmbra.json"

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

function rawInputs(profile: StoredProfile): Record<string, unknown> {
  return profile.inputs as unknown as Record<string, unknown>
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v28 with the element under the previous key", () => {
    expect(LEGACY.v).toBe(28)
    expect(LEGACY.v).toBe(V29__divinecraftElement.to - 1)
    expect(rawInputs(LEGACY.profile).tianGongElement).toBe("fire")
    expect(rawInputs(LEGACY.profile)).not.toHaveProperty("divinecraft")
  })
})

describe("V29__divinecraftElement — called directly", () => {
  it("carries the element to its new home and drops the old key", () => {
    const migrated = profileOf(V29__divinecraftElement.migrate(blobOf(clone(LEGACY.profile))))

    expect(migrated.inputs.divinecraft).toBe("fire")
    expect(rawInputs(migrated)).not.toHaveProperty("tianGongElement")
  })

  it("touches nothing else in the profile", () => {
    const migrated = profileOf(V29__divinecraftElement.migrate(blobOf(clone(LEGACY.profile))))
    const { tianGongElement: _moved, ...untouched } = rawInputs(clone(LEGACY.profile))

    expect(rawInputs(migrated)).toEqual({ ...untouched, divinecraft: "fire" })
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
  })

  it("keeps an element this build does not recognise rather than emptying the field", () => {
    expect(migrateDivinecraftField({ tianGongElement: "thunder" })).toEqual({
      divinecraft: "thunder",
    })
  })

  it("carries a stored none, and leaves a profile that never held the key alone", () => {
    expect(migrateDivinecraftField({ tianGongElement: null })).toEqual({ divinecraft: null })
    expect(migrateDivinecraftField({ food: true })).toEqual({ food: true })
  })

  it("keeps the new key when a blob already holds both", () => {
    expect(migrateDivinecraftField({ divinecraft: "poison", tianGongElement: "fire" })).toEqual({
      divinecraft: "poison",
    })
  })

  it("does not mutate its input", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    V29__divinecraftElement.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V29__divinecraftElement.migrate(blobOf(clone(LEGACY.profile)))
    expect(V29__divinecraftElement.migrate(clone(once))).toEqual(once)
  })
})

describe("V29__divinecraftElement — registered in the chain", () => {
  it("a v28 blob migrated to v29 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 29 })!

    expect(result.applied).toEqual(["V29__divinecraftElement"])
    expect(result.blob.v).toBe(29)
    expect(profileOf(result.blob).inputs.divinecraft).toBe("fire")
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still carries the element to its new home and drops the old key", () => {
    const imported = importProfile(JSON.stringify(clone(LEGACY.profile)))

    expect(imported.inputs.divinecraft).toBe("fire")
    expect(rawInputs(imported)).not.toHaveProperty("tianGongElement")
  })
})
