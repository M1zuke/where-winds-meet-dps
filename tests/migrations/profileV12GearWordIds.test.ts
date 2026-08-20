import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V12__gearWordIds, migrateGearWordId } from "../../src/migrations/V12__gearWordIds"
import { isGearWordId } from "../../src/data/stats/statLines"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v11/bellstrikeUmbra.json"

const LEGACY_INPUTS_KEY = "wwm.inputs"

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

function storedWords(inputs: Inputs): string[] {
  return inputs.inventory.flatMap((piece) => piece.words.map((entry) => entry.word)).filter(Boolean)
}

describe("profile-v11 fixture", () => {
  it("is v11 and still stores gear words as display names", () => {
    expect(LEGACY.v).toBe(11)
    expect(LEGACY.v).toBe(V12__gearWordIds.to - 1)
    expect(LEGACY.profile.inputs.classId).toBe("bellstrikeUmbra")
    expect(LEGACY.profile.inputs.inventory.length).toBeGreaterThan(0)
    expect(storedWords(LEGACY.profile.inputs)).toContain("Max Void Attack")
  })
})

describe("migrateGearWordId", () => {
  it("maps every display name a profile can hold to a live gear word id", () => {
    for (const name of storedWords(LEGACY.profile.inputs)) {
      expect(isGearWordId(migrateGearWordId(name)), name).toBe(true)
    }
  })

  it("carries the once-renamed legacy names straight to their id", () => {
    expect(migrateGearWordId("Single Burst")).toBe("singleTargetMysticBoost")
    expect(migrateGearWordId("AoE Damage")).toBe("areaMysticBoost")
    expect(migrateGearWordId("Min Formless")).toBe("minVoidAttack")
  })

  it("renames the attribute penetration word to the formless id", () => {
    expect(migrateGearWordId("Attribute Penetration")).toBe("formlessPenetration")
  })

  it("leaves an already-migrated id alone", () => {
    expect(migrateGearWordId("maxVoidAttack")).toBe("maxVoidAttack")
  })
})

describe("V12__gearWordIds — called directly", () => {
  it("rewrites every stored word to its id without touching values", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V12__gearWordIds.migrate(clone(before))
    expect(migrated.v).toBe(V12__gearWordIds.to)
    for (const word of storedWords(inputsOf(migrated))) {
      expect(isGearWordId(word), word).toBe(true)
    }
    const valuesBefore = inputsOf(before).inventory.flatMap((piece) =>
      piece.words.map((entry) => entry.value),
    )
    const valuesAfter = inputsOf(migrated).inventory.flatMap((piece) =>
      piece.words.map((entry) => entry.value),
    )
    expect(valuesAfter).toEqual(valuesBefore)
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V12__gearWordIds.migrate(clone(before))
    const expected = clone(inputsOf(before))
    expected.inventory = expected.inventory.map((piece) => ({
      ...piece,
      words: piece.words.map((entry) => ({
        ...entry,
        word: migrateGearWordId(entry.word) as typeof entry.word,
      })) as typeof piece.words,
    }))
    expect(inputsOf(migrated)).toEqual(expected)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V12__gearWordIds.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V12__gearWordIds.migrate(clone(once))).toEqual(once)
  })

  it("leaves a profile with no inventory untouched", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.inventory = []
    const migrated = V12__gearWordIds.migrate(blobOf(profile))
    expect(inputsOf(migrated).inventory).toEqual([])
  })
})

describe("V12__gearWordIds — registered in the chain", () => {
  it("a v11 blob migrated to v12 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 12 })!
    expect(result.applied).toEqual(["V12__gearWordIds"])
    expect(result.blob.v).toBe(12)
    // No word was cleared: a name the map missed would arrive here as "".
    expect(storedWords(inputsOf(result.blob))).toHaveLength(
      storedWords(LEGACY.profile.inputs as unknown as Inputs).length,
    )
    for (const word of storedWords(inputsOf(result.blob))) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  beforeEach(() => localStorage.clear())

  it("renames the stored words in a bare imported profile", () => {
    const imported = importProfile(JSON.stringify(LEGACY.profile))
    for (const word of storedWords(imported.inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })

  it("renames the stored words in the legacy inputs store", () => {
    localStorage.setItem(
      LEGACY_INPUTS_KEY,
      JSON.stringify({ v: 5, inputs: clone(LEGACY.profile.inputs) }),
    )
    for (const word of storedWords(loadProfiles().profiles[0].inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})
