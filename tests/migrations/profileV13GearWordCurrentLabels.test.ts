import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V13__gearWordCurrentLabels,
  migrateCurrentGearWordLabel,
} from "../../src/migrations/V13__gearWordCurrentLabels"
import { migrateGearWordId } from "../../src/migrations/V12__gearWordIds"
import { isGearWordId, statLine } from "../../src/data/stats/statLines"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import storedProfileFile from "./testProfiles/v12/bellstrikeUmbra.json"

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

describe("V13__gearWordCurrentLabels — registered in the chain", () => {
  it("a v12 blob migrated to v13 passes through exactly this step and stores ids", () => {
    const result = runProfileMigrations(blobOf(withCurrentLabels(LEGACY.profile), 12), {
      toVersion: 13,
    })!
    expect(result.applied).toEqual(["V13__gearWordCurrentLabels"])
    expect(result.blob.v).toBe(13)
    for (const word of storedWords((result.blob.profiles[0] as StoredProfile).inputs)) {
      expect(isGearWordId(word), word).toBe(true)
    }
  })
})

describe("the user's build survives the hop", () => {
  it("keeps every gear word a v12 profile holds under a reworded label", () => {
    const stored = withCurrentLabels(LEGACY.profile)
    const before = storedWords(stored.inputs)
    const migrated = V13__gearWordCurrentLabels.migrate(blobOf(stored, 12))
    const after = (migrated.profiles[0] as StoredProfile).inputs

    expect(storedWords(after)).toHaveLength(before.length)
    expect(after.inventory).toHaveLength(stored.inputs.inventory.length)
    expect(after.equipped).toEqual(stored.inputs.equipped)
  })

  it("keeps the roll value, not just the word", () => {
    const migrated = V13__gearWordCurrentLabels.migrate(
      blobOf(withCurrentLabels(LEGACY.profile), 12),
    )
    const after = (migrated.profiles[0] as StoredProfile).inputs
    const rolls = after.inventory.flatMap((piece) =>
      piece.words.filter((entry) => entry.word).map((entry) => entry.value),
    )
    expect(rolls.length).toBeGreaterThan(0)
    expect(rolls.every((value) => value > 0)).toBe(true)
  })
})

describe("idempotency", () => {
  it("an already-migrated blob passes through unchanged", () => {
    const once = runProfileMigrations(blobOf(withCurrentLabels(LEGACY.profile), 12), {
      toVersion: 13,
    })!.blob
    const twice = runProfileMigrations(clone(once), { toVersion: 13 })!.blob
    expect(twice).toEqual(once)
  })

  it("does not mutate its input", () => {
    const input = blobOf(withCurrentLabels(LEGACY.profile), 12)
    const copy = clone(input)
    V13__gearWordCurrentLabels.migrate(input)
    expect(input).toEqual(copy)
  })
})
