import { beforeEach, describe, expect, it } from "vitest"
import { SET_BY_ID } from "../../src/definitions/sets/registry"
import { makeRotation } from "../../src/engine/rotation"
import { makeSkill } from "../../src/engine/skill"
import type { StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V17__renameCleftpeak,
  migrateCleftpeakBuffId,
  migrateCleftpeakSetId,
  migrateCleftpeakTag,
} from "../../src/migrations/V17__renameCleftpeak"
import { importProfile, loadCustomSkills } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v16/stonesplitStrength.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile
const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const CUSTOM_SKILLS_VERSION = 3

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
  it("stores v16 with the previous set id", () => {
    expect(LEGACY.v).toBe(16)
    expect(LEGACY.v).toBe(V17__renameCleftpeak.to - 1)
    expect(LEGACY.profile.inputs.set).toBe("shatteredRidge")
  })
})

describe("V17__renameCleftpeak — called directly", () => {
  it("renames the persisted set id to the current built-in id", () => {
    const migrated = V17__renameCleftpeak.migrate(blobOf(clone(LEGACY.profile)))
    expect(profileOf(migrated).inputs.set).toBe("cleftpeak")
    expect(SET_BY_ID.cleftpeak).toBeDefined()
  })

  it("renames the persisted buff id on an active custom rotation", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.activeCustomRotation = makeRotation(profile.inputs.classId, {
      permanentBuffIds: ["shatteredRidgeDeflect"],
    })
    const migrated = profileOf(V17__renameCleftpeak.migrate(blobOf(profile)))
    expect(migrated.inputs.activeCustomRotation?.permanentBuffIds).toEqual(["cleftpeakDeflect"])
  })

  it("touches nothing else in the profile", () => {
    const migrated = profileOf(V17__renameCleftpeak.migrate(blobOf(clone(LEGACY.profile))))
    expect(migrated).toEqual({
      ...LEGACY.profile,
      inputs: { ...LEGACY.profile.inputs, set: "cleftpeak" },
    })
  })

  it("leaves current, unrelated and missing values unchanged", () => {
    expect(migrateCleftpeakSetId("cleftpeak")).toBe("cleftpeak")
    expect(migrateCleftpeakSetId("jadeware")).toBe("jadeware")
    expect(migrateCleftpeakSetId(null)).toBeNull()
    expect(migrateCleftpeakSetId(undefined)).toBeUndefined()
    expect(migrateCleftpeakBuffId("shatteredRidgeDeflect")).toBe("cleftpeakDeflect")
    expect(migrateCleftpeakBuffId("mountainSplitter")).toBe("mountainSplitter")
    expect(migrateCleftpeakTag("prop:shatteredRidgeBoost")).toBe("prop:cleftpeakBoost")
    expect(migrateCleftpeakTag("role:anxiSoldier")).toBe("role:anxiSoldier")
  })

  it("does not mutate its input", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    V17__renameCleftpeak.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V17__renameCleftpeak.migrate(blobOf(clone(LEGACY.profile)))
    expect(V17__renameCleftpeak.migrate(clone(once))).toEqual(once)
  })
})

describe("V17__renameCleftpeak — registered in the chain", () => {
  it("a v16 blob migrated to v17 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 17 })!
    expect(result.applied).toEqual(["V17__renameCleftpeak"])
    expect(result.blob.v).toBe(17)
    expect(profileOf(result.blob).inputs.set).toBe("cleftpeak")
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still renames the previous set id", () => {
    const imported = importProfile(JSON.stringify(clone(LEGACY.profile)))
    expect(imported.inputs.set).toBe("cleftpeak")
  })
})

describe("custom skill backstop — the store heals through its hydrator", () => {
  beforeEach(() => localStorage.clear())

  it("renames the previous buff id and property tag", () => {
    const skill = makeSkill("stonesplitStrength", {
      id: "custom-cleftpeak-copy",
      tags: ["prop:shatteredRidgeBoost"],
      receives: ["shatteredRidgeDeflect"],
      triggersBuffs: ["shatteredRidgeDeflect"],
    })
    localStorage.setItem(
      CUSTOM_SKILLS_KEY,
      JSON.stringify({ v: CUSTOM_SKILLS_VERSION, skills: [skill] }),
    )

    const loaded = loadCustomSkills()[0]
    expect(loaded.tags).toContain("prop:cleftpeakBoost")
    expect(loaded.tags).not.toContain("prop:shatteredRidgeBoost")
    expect(loaded.receives).toEqual(["cleftpeakDeflect"])
    expect(loaded.triggersBuffs).toEqual(["cleftpeakDeflect"])
  })
})
