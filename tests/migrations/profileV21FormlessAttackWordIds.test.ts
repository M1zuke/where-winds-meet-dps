import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V21__formlessAttackWordIds,
  migrateFormlessWordId,
} from "../../src/migrations/V21__formlessAttackWordIds"
import { isGearWordId } from "../../src/data/stats/statLines"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v20/bellstrikeUmbra.json"

const LEGACY_INPUTS_KEY = "wwm.inputs"
const LEGACY_INPUTS_VERSION = 5
const RETIRED_MAX_ID = "maxVoidAttack"
const RETIRED_MIN_ID = "minVoidAttack"

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

describe("profile-v20 fixture", () => {
  it("is v20 and still stores the retired Formless attack ids", () => {
    expect(LEGACY.v).toBe(21 - 1)
    expect(LEGACY.v).toBe(V21__formlessAttackWordIds.to - 1)
    expect(storedWords(LEGACY.profile.inputs)).toContain(RETIRED_MAX_ID)
  })

  it("stores an id the stat-line table no longer holds", () => {
    expect(isGearWordId(RETIRED_MAX_ID)).toBe(false)
    expect(isGearWordId(RETIRED_MIN_ID)).toBe(false)
  })
})

describe("migrateFormlessWordId", () => {
  it("carries both retired ids to the live Formless attack ids", () => {
    expect(migrateFormlessWordId(RETIRED_MIN_ID)).toBe("minFormless")
    expect(migrateFormlessWordId(RETIRED_MAX_ID)).toBe("maxFormless")
  })

  it("lands on ids the stat-line table holds", () => {
    expect(isGearWordId(migrateFormlessWordId(RETIRED_MIN_ID))).toBe(true)
    expect(isGearWordId(migrateFormlessWordId(RETIRED_MAX_ID))).toBe(true)
  })

  it("leaves current, unrelated and empty words unchanged", () => {
    expect(migrateFormlessWordId("maxFormless")).toBe("maxFormless")
    expect(migrateFormlessWordId("formlessPenetration")).toBe("formlessPenetration")
    expect(migrateFormlessWordId("maxPhys")).toBe("maxPhys")
    expect(migrateFormlessWordId("")).toBe("")
  })
})

describe("V21__formlessAttackWordIds — called directly", () => {
  it("rewrites every stored word to a live id without touching values", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V21__formlessAttackWordIds.migrate(clone(before))
    expect(migrated.v).toBe(V21__formlessAttackWordIds.to)
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
    const migrated = V21__formlessAttackWordIds.migrate(clone(before))
    const expected = clone(inputsOf(before))
    expected.inventory = expected.inventory.map((piece) => ({
      ...piece,
      words: piece.words.map((entry) => ({
        ...entry,
        word: migrateFormlessWordId(entry.word) as typeof entry.word,
      })) as typeof piece.words,
    }))
    expect(inputsOf(migrated)).toEqual(expected)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V21__formlessAttackWordIds.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V21__formlessAttackWordIds.migrate(clone(once))).toEqual(once)
  })

  it("leaves a profile with no inventory untouched", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.inventory = []
    const migrated = V21__formlessAttackWordIds.migrate(blobOf(profile))
    expect(inputsOf(migrated).inventory).toEqual([])
  })
})

describe("V21__formlessAttackWordIds — registered in the chain", () => {
  it("a v20 blob migrated to v21 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 21 })!
    expect(result.applied).toEqual(["V21__formlessAttackWordIds"])
    expect(result.blob.v).toBe(21)
    expect(storedWords(inputsOf(result.blob))).toHaveLength(
      storedWords(LEGACY.profile.inputs).length,
    )
    for (const word of storedWords(inputsOf(result.blob))) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })

  it("carries the user's build across the hop", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 21 })!
    const migrated = result.blob.profiles[0] as StoredProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
    expect(migrated.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
    expect(migrated.inputs.mindMethods).toEqual(LEGACY.profile.inputs.mindMethods)
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the roll on an imported profile's Formless words instead of clearing it", () => {
    const imported = importProfile(JSON.stringify(LEGACY.profile))
    for (const word of storedWords(imported.inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
    const rolls = imported.inputs.inventory.flatMap((piece) =>
      piece.words.filter((entry) => entry.word === "maxFormless").map((entry) => entry.value),
    )
    expect(rolls.every((roll) => roll > 0)).toBe(true)
  })

  it("renames the stored words in the legacy inputs store", () => {
    localStorage.setItem(
      LEGACY_INPUTS_KEY,
      JSON.stringify({ v: LEGACY_INPUTS_VERSION, inputs: clone(LEGACY.profile.inputs) }),
    )
    for (const word of storedWords(loadProfiles().profiles[0].inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})
