import { describe, expect, it } from "vitest"
import { importProfile, loadProfiles } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V24__enhancementLevelsPerSlot,
  enhancementLevelsFromLegacyNodes,
} from "../../src/migrations/V24__enhancementLevelsPerSlot"
import { DEFAULT_ENHANCEMENTS, levelForEnhancementValue } from "../../src/definitions/baseStats"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v23/bellstrikeUmbra.json"

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

const LEGACY_NODES = [
  { id: 1, slot: "disc", stat: "maxPhys", value: 160 },
  { id: 2, slot: "pendant", stat: "maxPhys", value: 160 },
  { id: 3, slot: "leftWeapon", stat: "maxPhys", value: 33 },
  { id: 4, slot: "leftWeapon", stat: "minPhys", value: 46 },
  { id: 5, slot: "rightWeapon", stat: "maxPhys", value: 79 },
  { id: 6, slot: "rightWeapon", stat: "minPhys", value: 118 },
]

describe("profile-v23 fixture", () => {
  it("is v23 and carries no enhancements field, so the step has nothing to do", () => {
    expect(LEGACY.v).toBe(24 - 1)
    expect(LEGACY.v).toBe(V24__enhancementLevelsPerSlot.to - 1)
    expect(LEGACY.profile.inputs).not.toHaveProperty("enhancements")
  })
})

describe("enhancementLevelsFromLegacyNodes", () => {
  it("takes the higher of a slot's two old nodes", () => {
    const levels = enhancementLevelsFromLegacyNodes(LEGACY_NODES)
    expect(levels.leftWeapon).toBe(levelForEnhancementValue("leftWeapon", "maxPhys", 33))
    expect(levels.leftWeapon).toBeGreaterThan(levelForEnhancementValue("leftWeapon", "minPhys", 46))
  })

  it("resolves a value between two levels to the lower one", () => {
    // Level 33 grants maxPhys 34, level 34 grants 36 (see the ladder table) — 35
    // sits strictly between them.
    expect(levelForEnhancementValue("leftWeapon", "maxPhys", 35)).toBe(33)
  })

  it("defaults the four armour slots the old model never tracked", () => {
    const levels = enhancementLevelsFromLegacyNodes(LEGACY_NODES)
    for (const slot of ["helm", "armor", "greaves", "bracer"] as const) {
      expect(levels[slot]).toBe(DEFAULT_ENHANCEMENTS[slot])
    }
  })

  it("passes an already-migrated object straight through untouched", () => {
    expect(enhancementLevelsFromLegacyNodes(DEFAULT_ENHANCEMENTS)).toEqual(DEFAULT_ENHANCEMENTS)
  })

  it("ignores a node naming an unknown slot or a non-numeric value", () => {
    const levels = enhancementLevelsFromLegacyNodes([
      { id: 9, slot: "notASlot", stat: "maxPhys", value: 999 },
      { id: 10, slot: "disc", stat: "maxPhys", value: "not-a-number" },
    ])
    expect(levels.disc).toBe(DEFAULT_ENHANCEMENTS.disc)
  })
})

describe("V24__enhancementLevelsPerSlot — called directly", () => {
  it("converts a stored array of nodes into one level per slot", () => {
    const before = blobOf({
      ...clone(LEGACY.profile),
      inputs: { ...clone(LEGACY.profile.inputs), enhancements: LEGACY_NODES } as unknown as Inputs,
    })
    const migrated = V24__enhancementLevelsPerSlot.migrate(clone(before))
    expect(migrated.v).toBe(24)
    expect(inputsOf(migrated).enhancements).toEqual(enhancementLevelsFromLegacyNodes(LEGACY_NODES))
  })

  it("leaves a profile with no enhancements field untouched", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V24__enhancementLevelsPerSlot.migrate(clone(before))
    expect(inputsOf(migrated)).not.toHaveProperty("enhancements")
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf({
      ...clone(LEGACY.profile),
      inputs: { ...clone(LEGACY.profile.inputs), enhancements: LEGACY_NODES } as unknown as Inputs,
    })
    const migrated = V24__enhancementLevelsPerSlot.migrate(clone(before))
    const expected = { ...clone(inputsOf(before)) }
    delete (expected as Partial<Inputs>).enhancements
    const actual = { ...clone(inputsOf(migrated)) }
    delete (actual as Partial<Inputs>).enhancements
    expect(actual).toEqual(expected)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf({
      ...clone(LEGACY.profile),
      inputs: { ...clone(LEGACY.profile.inputs), enhancements: LEGACY_NODES } as unknown as Inputs,
    })
    const snapshot = clone(input)
    const once = V24__enhancementLevelsPerSlot.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V24__enhancementLevelsPerSlot.migrate(clone(once))).toEqual(once)
  })
})

describe("V24__enhancementLevelsPerSlot — registered in the chain", () => {
  it("a v23 blob migrated to v24 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 24 })!
    expect(result.applied).toEqual(["V24__enhancementLevelsPerSlot"])
    expect(result.blob.v).toBe(24)
  })

  it("carries the user's build across the hop", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 24 })!
    const migrated = result.blob.profiles[0] as StoredProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
    expect(migrated.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
  })
})

describe("hydrator backstops — the paths that never walk the chain", () => {
  it("lands an imported legacy-array profile on one level per slot", () => {
    const legacyProfile = {
      ...clone(LEGACY.profile),
      inputs: { ...clone(LEGACY.profile.inputs), enhancements: LEGACY_NODES } as unknown as Inputs,
    }
    const wrapped = JSON.stringify({ v: LEGACY.v, profile: legacyProfile })
    const imported = importProfile(wrapped)
    expect(imported.inputs.enhancements).toEqual(enhancementLevelsFromLegacyNodes(LEGACY_NODES))
  })

  it("a profile with no enhancements field lands on level 65 everywhere after the full walk", () => {
    const wrapped = JSON.stringify({ v: LEGACY.v, profile: clone(LEGACY.profile) })
    const imported = importProfile(wrapped)
    expect(imported.inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })
})

describe("a default profile carries no stale enhancements shape", () => {
  it("loadProfiles() on an empty store lands on level 65 everywhere", () => {
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.enhancements).toEqual(DEFAULT_ENHANCEMENTS)
  })
})
