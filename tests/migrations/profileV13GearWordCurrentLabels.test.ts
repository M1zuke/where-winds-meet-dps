import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import {
  LATEST_PROFILES_VERSION,
  PROFILE_MIGRATIONS,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import {
  V13__gearWordCurrentLabels,
  migrateCurrentGearWordLabel,
} from "../../src/migrations/V13__gearWordCurrentLabels"
import { migrateGearWordId } from "../../src/migrations/V12__gearWordIds"
import { isGearWordId, statLine } from "../../src/data/stats/statLines"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import storedProfileFile from "./testProfiles/v12/bellstrikeUmbra.json"

const PROFILES_KEY = "wwm.profiles"

type StoredFile = { v: number; profile: StoredProfile }
const LEGACY = storedProfileFile as unknown as StoredFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function storedWords(inputs: Inputs): string[] {
  return inputs.inventory.flatMap((piece) => piece.words.map((entry) => entry.word)).filter(Boolean)
}

// No forward walk can produce this shape, so the fixture cannot carry it.
function withCurrentLabels(profile: StoredProfile): StoredProfile {
  const next = clone(profile)
  for (const piece of next.inputs.inventory) {
    for (const entry of piece.words) {
      if (!entry.word) continue
      const label = statLine(migrateGearWordId(entry.word))?.label
      if (label) entry.word = label as typeof entry.word
    }
  }
  return next
}

function blobOf(profile: StoredProfile, version: number): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

describe("the v12 fixture", () => {
  it("is v12 and already stores its gear words as ids", () => {
    expect(LEGACY.v).toBe(12)
    expect(LEGACY.v).toBe(V13__gearWordCurrentLabels.to - 1)
    const words = storedWords(LEGACY.profile.inputs)
    expect(words.length).toBeGreaterThan(0)
    for (const word of words) expect(isGearWordId(word), word).toBe(true)
  })
})

describe("a label is what V12 cannot translate", () => {
  it("V12 alone leaves one unresolvable, which is what clears the roll", () => {
    const unresolved = storedWords(withCurrentLabels(LEGACY.profile).inputs).filter(
      (word) => !isGearWordId(migrateGearWordId(word)),
    )
    expect(unresolved.length).toBeGreaterThan(0)
  })
})

describe("migrateCurrentGearWordLabel", () => {
  it("resolves every reworded label to a live gear word", () => {
    const words = storedWords(withCurrentLabels(LEGACY.profile).inputs)
    expect(words.length).toBeGreaterThan(0)
    for (const word of words) {
      expect(isGearWordId(migrateCurrentGearWordLabel(migrateGearWordId(word))), word).toBe(true)
    }
  })

  it("leaves an id and an unknown string alone", () => {
    expect(migrateCurrentGearWordLabel("swordBoost")).toBe("swordBoost")
    expect(migrateCurrentGearWordLabel("Not A Word")).toBe("Not A Word")
  })
})

describe("V13 is registered and the chain reaches it", () => {
  it("is the latest step", () => {
    expect(PROFILE_MIGRATIONS).toContain(V13__gearWordCurrentLabels)
    expect(LATEST_PROFILES_VERSION).toBe(13)
  })

  it("a v12 blob walks to v13 and stores ids", () => {
    const result = runProfileMigrations(blobOf(withCurrentLabels(LEGACY.profile), 12))!
    expect(result.applied).toContain("V13__gearWordCurrentLabels")
    expect(result.blob.v).toBe(13)
    for (const word of storedWords((result.blob.profiles[0] as StoredProfile).inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})

describe("the user's build survives", () => {
  beforeEach(() => localStorage.clear())

  it("keeps every gear word a v12 profile holds under a reworded label", () => {
    const stored = withCurrentLabels(LEGACY.profile)
    const before = storedWords(stored.inputs)
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(stored, 12)))

    const loaded = loadProfiles().profiles[0].inputs

    expect(storedWords(loaded)).toHaveLength(before.length)
    expect(loaded.inventory).toHaveLength(stored.inputs.inventory.length)
    expect(loaded.equipped).toEqual(stored.inputs.equipped)
  })

  it("keeps the roll value, not just the word", () => {
    const stored = withCurrentLabels(LEGACY.profile)
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(stored, 12)))

    const loaded = loadProfiles().profiles[0].inputs
    const rolls = loaded.inventory.flatMap((piece) =>
      piece.words.filter((entry) => entry.word).map((entry) => entry.value),
    )
    expect(rolls.length).toBeGreaterThan(0)
    expect(rolls.every((value) => value > 0)).toBe(true)
  })

  it("persists the repair at the latest version, so the walk runs once", () => {
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify(blobOf(withCurrentLabels(LEGACY.profile), 12)),
    )
    loadProfiles()

    const written = JSON.parse(localStorage.getItem(PROFILES_KEY)!) as RawProfilesBlob
    expect(written.v).toBe(LATEST_PROFILES_VERSION)
    for (const word of storedWords((written.profiles[0] as StoredProfile).inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})

describe("idempotency", () => {
  it("an already-migrated blob passes through unchanged", () => {
    const once = runProfileMigrations(blobOf(withCurrentLabels(LEGACY.profile), 12))!.blob
    const twice = runProfileMigrations(clone(once))!.blob
    expect(twice).toEqual(once)
  })

  it("does not mutate its input", () => {
    const input = blobOf(withCurrentLabels(LEGACY.profile), 12)
    const copy = clone(input)
    V13__gearWordCurrentLabels.migrate(input)
    expect(input).toEqual(copy)
  })
})
