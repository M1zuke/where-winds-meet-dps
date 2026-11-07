import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadCustomRotations } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V30__removeNightwickTipsylayHybrid,
  migrateNightwickTipsylayId,
  migrateRotationNightwickTipsylayIds,
} from "../../src/migrations/V30__removeNightwickTipsylayHybrid"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v29/bamboocutDraught.json"

const CLASS = "bamboocutDraught"
const REMOVED_ID = "bamboocutDraught-nightwick-tipsylay"
const SURVIVING_ID = "bamboocutDraught-nightwick-primepick"
const FOLLOW_UP_ID = "bamboocutDraught-nightwick-primepick-follow-up"
const CUSTOM_ROTATIONS_KEY = "wwm.customRotations"
const CUSTOM_ROTATIONS_VERSION = 3

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function rotationNaming(...skillIds: string[]): Rotation {
  return makeRotation(CLASS, { steps: skillIds.map((skillId) => makeStep({ skillId })) })
}

function profileWithRotation(rotation: Rotation | null): StoredProfile {
  const profile = clone(LEGACY.profile)
  profile.inputs.activeCustomRotation = rotation
  return profile
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function inputsOf(blob: RawProfilesBlob): Inputs {
  return (blob.profiles[0] as StoredProfile).inputs
}

const stepIds = (rotation: Rotation) => rotation.steps.map((step) => step.skillId)

describe("the captured profile is genuinely pre-change", () => {
  it("stores v29, the version this step reads", () => {
    expect(LEGACY.v).toBe(V30__removeNightwickTipsylayHybrid.to - 1)
  })

  it("the removed id is gone from the library and the surviving one is not", () => {
    const skillIds = new Set(builtinSkillsForClass(CLASS).map((skill) => skill.id))
    expect(skillIds.has(REMOVED_ID)).toBe(false)
    expect(skillIds.has(SURVIVING_ID)).toBe(true)
  })
})

describe("migrateNightwickTipsylayId", () => {
  it("moves the removed id onto the surviving one and leaves every other value alone", () => {
    expect(migrateNightwickTipsylayId(REMOVED_ID)).toBe(SURVIVING_ID)
    expect(migrateNightwickTipsylayId(SURVIVING_ID)).toBe(SURVIVING_ID)
    expect(migrateNightwickTipsylayId(FOLLOW_UP_ID)).toBe(FOLLOW_UP_ID)
    expect(migrateNightwickTipsylayId(undefined)).toBeUndefined()
    expect(migrateNightwickTipsylayId(7)).toBe(7)
  })
})

describe("migrateRotationNightwickTipsylayIds", () => {
  it("remaps only the steps naming the removed id and keeps their order", () => {
    const rotation = rotationNaming(REMOVED_ID, FOLLOW_UP_ID, REMOVED_ID, SURVIVING_ID)
    expect(stepIds(migrateRotationNightwickTipsylayIds(rotation))).toEqual([
      SURVIVING_ID,
      FOLLOW_UP_ID,
      SURVIVING_ID,
      SURVIVING_ID,
    ])
  })

  it("keeps every other field of the rotation and of each step", () => {
    const rotation = rotationNaming(REMOVED_ID)
    rotation.steps[0] = { ...rotation.steps[0], id: "step-kept" }
    const migrated = migrateRotationNightwickTipsylayIds(clone(rotation))
    expect(migrated).toEqual({
      ...rotation,
      steps: [{ ...rotation.steps[0], skillId: SURVIVING_ID }],
    })
  })

  it("leaves a value that is not a rotation alone", () => {
    expect(migrateRotationNightwickTipsylayIds(null)).toBeNull()
    expect(migrateRotationNightwickTipsylayIds("rotation")).toBe("rotation")
    expect(migrateRotationNightwickTipsylayIds({ id: "no-steps" })).toEqual({ id: "no-steps" })
  })
})

describe("V30__removeNightwickTipsylayHybrid — called directly", () => {
  it("rewrites the active custom rotation and nothing else in the inputs", () => {
    const profile = profileWithRotation(rotationNaming(REMOVED_ID, FOLLOW_UP_ID))
    const migrated = V30__removeNightwickTipsylayHybrid.migrate(blobOf(clone(profile)))
    expect(stepIds(inputsOf(migrated).activeCustomRotation!)).toEqual([SURVIVING_ID, FOLLOW_UP_ID])
    expect({ ...inputsOf(migrated), activeCustomRotation: null }).toEqual({
      ...profile.inputs,
      activeCustomRotation: null,
    })
  })

  it("leaves a profile without an active rotation untouched", () => {
    const profile = profileWithRotation(null)
    const migrated = V30__removeNightwickTipsylayHybrid.migrate(blobOf(clone(profile)))
    expect(inputsOf(migrated)).toEqual(profile.inputs)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(profileWithRotation(rotationNaming(REMOVED_ID)))
    const snapshot = clone(input)
    const once = V30__removeNightwickTipsylayHybrid.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V30__removeNightwickTipsylayHybrid.migrate(clone(once))).toEqual(once)
  })
})

describe("V30__removeNightwickTipsylayHybrid — registered in the chain", () => {
  it("a v29 blob migrated to v30 passes through exactly this step", () => {
    const blob = blobOf(profileWithRotation(rotationNaming(REMOVED_ID)))
    const result = runProfileMigrations(clone(blob), { toVersion: 30 })!
    expect(result.applied).toEqual(["V30__removeNightwickTipsylayHybrid"])
    expect(result.blob.v).toBe(30)
    expect(stepIds(inputsOf(result.blob).activeCustomRotation!)).toEqual([SURVIVING_ID])
  })

  it("carries the user's build across the hop", () => {
    const result = runProfileMigrations(clone(blobOf(LEGACY.profile)), { toVersion: 30 })!
    const migrated = result.blob.profiles[0] as StoredProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.inputs.inventory).toEqual(LEGACY.profile.inputs.inventory)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  beforeEach(() => localStorage.clear())

  it("an imported profile's active rotation resolves onto the surviving id", () => {
    const imported = importProfile(
      JSON.stringify(profileWithRotation(rotationNaming(REMOVED_ID, FOLLOW_UP_ID))),
    )
    expect(stepIds(imported.inputs.activeCustomRotation!)).toEqual([SURVIVING_ID, FOLLOW_UP_ID])
  })

  it("a saved custom rotation resolves onto the surviving id", () => {
    localStorage.setItem(
      CUSTOM_ROTATIONS_KEY,
      JSON.stringify({ v: CUSTOM_ROTATIONS_VERSION, rotations: [rotationNaming(REMOVED_ID)] }),
    )
    const [loaded] = loadCustomRotations()
    expect(stepIds(loaded)).toEqual([SURVIVING_ID])
  })
})
