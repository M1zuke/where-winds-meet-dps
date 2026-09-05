import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadCustomRotations } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V22__mysticArtIds,
  migrateMysticId,
  migrateRotationMysticIds,
} from "../../src/migrations/V22__mysticArtIds"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Rotation } from "../../src/engine/rotation"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v21/bellstrikeUmbra.json"

const CLASS = "bellstrikeUmbra"
const CUSTOM_ROTATIONS_KEY = "wwm.customRotations"
const CUSTOM_ROTATIONS_VERSION = 3

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

function rotationOf(blob: RawProfilesBlob): Rotation {
  return inputsOf(blob).activeCustomRotation!
}

const storedStepIds = (rotation: Rotation) => rotation.steps.map((step) => step.skillId)

describe("profile-v21 fixture", () => {
  it("is v21 and still names mystic arts and their debuffs under a class id", () => {
    expect(LEGACY.v).toBe(V22__mysticArtIds.to - 1)
    const rotation = LEGACY.profile.inputs.activeCustomRotation!
    expect(storedStepIds(rotation)).toContain(`${CLASS}-flute-of-the-tides-prepull`)
    expect(storedStepIds(rotation)).toContain(`${CLASS}-dragon-fire-smolder-2-hits`)
    expect(rotation.permanentBuffIds).toContain(`debuff-${CLASS}-combustion`)
  })

  it("stores ids the class's library no longer holds", () => {
    const skillIds = new Set(builtinSkillsForClass(CLASS).map((skill) => skill.id))
    const debuffIds = new Set(builtinDebuffsForClass(CLASS).map((debuff) => debuff.id))
    expect(skillIds.has(`${CLASS}-flute-of-the-tides-prepull`)).toBe(false)
    expect(debuffIds.has(`debuff-${CLASS}-combustion`)).toBe(false)
  })
})

describe("migrateMysticId", () => {
  it("moves a class-prefixed mystic art onto the shared id, for every class that shipped it", () => {
    for (const classId of [
      "bellstrikeUmbra",
      "bellstrikeSplendor",
      "stonesplitStrength",
      "silkbindJade",
      "bamboocutDraught",
    ]) {
      expect(migrateMysticId(`${classId}-flute-of-the-tides-full`)).toBe(
        "mystic-flute-of-the-tides-full",
      )
      expect(migrateMysticId(`${classId}-poet1`)).toBe("mystic-poet1")
      expect(migrateMysticId(`debuff-${classId}-combustion`)).toBe("debuff-mystic-combustion")
      expect(migrateMysticId(`debuff-${classId}-toad-poison`)).toBe("debuff-mystic-toad-poison")
    }
  })

  it("renames the Smolder debuff away from its dark-fire slug", () => {
    expect(migrateMysticId("debuff-bellstrikeUmbra-dark-fire")).toBe("debuff-mystic-smolder")
    expect(migrateMysticId("debuff-bellstrikeSplendor-dark-fire")).toBe("debuff-mystic-smolder")
  })

  it("lands on ids the library holds", () => {
    const skillIds = new Set(builtinSkillsForClass(CLASS).map((skill) => skill.id))
    const debuffIds = new Set(builtinDebuffsForClass(CLASS).map((debuff) => debuff.id))
    expect(skillIds.has(migrateMysticId(`${CLASS}-dragon-head-plus`))).toBe(true)
    expect(debuffIds.has(migrateMysticId(`debuff-${CLASS}-dark-fire`))).toBe(true)
  })

  it("leaves class-owned, user-authored, already-shared and empty ids unchanged", () => {
    expect(migrateMysticId(`${CLASS}-swordq`)).toBe(`${CLASS}-swordq`)
    expect(migrateMysticId(`debuff-${CLASS}-bleed-tick`)).toBe(`debuff-${CLASS}-bleed-tick`)
    expect(migrateMysticId("sk-user-authored-slash")).toBe("sk-user-authored-slash")
    expect(migrateMysticId("mystic-poet1")).toBe("mystic-poet1")
    expect(migrateMysticId("revelryScript")).toBe("revelryScript")
    expect(migrateMysticId("")).toBe("")
    expect(migrateMysticId(null)).toBeNull()
  })
})

describe("V22__mysticArtIds — called directly", () => {
  it("rewrites every step and permanent status of the active rotation onto the shared ids", () => {
    const migrated = V22__mysticArtIds.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V22__mysticArtIds.to)
    expect(storedStepIds(rotationOf(migrated))).toEqual([
      "mystic-flute-of-the-tides-prepull",
      "mystic-drunkenpoet-prepull",
      `${CLASS}-swordq`,
      "mystic-dragon-fire-smolder-2-hits",
      "mystic-dragon-head-plus",
    ])
    expect(rotationOf(migrated).permanentBuffIds).toEqual([
      "debuff-mystic-combustion",
      "revelryScript",
    ])
  })

  it("every migrated step resolves in the class's library", () => {
    const migrated = V22__mysticArtIds.migrate(blobOf(clone(LEGACY.profile)))
    const skillIds = new Set(builtinSkillsForClass(CLASS).map((skill) => skill.id))
    for (const skillId of storedStepIds(rotationOf(migrated))) {
      expect(skillIds.has(skillId), skillId).toBe(true)
    }
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V22__mysticArtIds.migrate(clone(before))
    const expected = clone(inputsOf(before))
    expected.activeCustomRotation = migrateRotationMysticIds(expected.activeCustomRotation)
    expect(inputsOf(migrated)).toEqual(expected)
  })

  it("leaves a profile without an active rotation untouched", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.activeCustomRotation = null
    const migrated = V22__mysticArtIds.migrate(blobOf(profile))
    expect(inputsOf(migrated)).toEqual(profile.inputs)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V22__mysticArtIds.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V22__mysticArtIds.migrate(clone(once))).toEqual(once)
  })
})

describe("V22__mysticArtIds — registered in the chain", () => {
  it("a v21 blob migrated to v22 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 22 })!
    expect(result.applied).toEqual(["V22__mysticArtIds"])
    expect(result.blob.v).toBe(22)
    expect(storedStepIds(rotationOf(result.blob))).toContain("mystic-flute-of-the-tides-prepull")
  })

  it("carries the user's build across the hop", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 22 })!
    const migrated = result.blob.profiles[0] as StoredProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
    expect(migrated.inputs.inventory).toEqual(LEGACY.profile.inputs.inventory)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
    expect(migrated.inputs.mindMethods).toEqual(LEGACY.profile.inputs.mindMethods)
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  beforeEach(() => localStorage.clear())

  it("an imported profile's active rotation resolves onto the shared ids", () => {
    const imported = importProfile(JSON.stringify(LEGACY.profile))
    expect(storedStepIds(imported.inputs.activeCustomRotation!)).toEqual(
      storedStepIds(rotationOf(V22__mysticArtIds.migrate(blobOf(clone(LEGACY.profile))))),
    )
  })

  it("a saved custom rotation resolves onto the shared ids", () => {
    const stored = clone(LEGACY.profile.inputs.activeCustomRotation!)
    localStorage.setItem(
      CUSTOM_ROTATIONS_KEY,
      JSON.stringify({ v: CUSTOM_ROTATIONS_VERSION, rotations: [stored] }),
    )
    const [loaded] = loadCustomRotations()
    expect(storedStepIds(loaded)).toContain("mystic-dragon-head-plus")
    expect(storedStepIds(loaded)).not.toContain(`${CLASS}-dragon-head-plus`)
    expect(loaded.permanentBuffIds).toContain("debuff-mystic-combustion")
  })
})
