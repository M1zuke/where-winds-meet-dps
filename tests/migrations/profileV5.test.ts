// Drives the captured pre-strip profile through the loader and asserts the
// derived stat fields are gone while the user's build survives untouched.
import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles } from "../../src/storage"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import {
  DERIVED_STAT_FIELDS,
  withDerivedStats,
  withZeroedDerivedStats,
} from "../../src/engine/derivedInputs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import { V6__dropDerivedStats } from "../../src/migrations/V6__dropDerivedStats"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v5/bellstrikeUmbra.json"

const PROFILES_KEY = "wwm.profiles"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function writeProfilesBlob(profile: StoredProfile): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(blobOf(profile)))
}

function loadOne(): StoredProfile {
  const { profiles } = loadProfiles()
  expect(profiles).toHaveLength(1)
  return profiles[0]
}

const inputsOf = (blob: RawProfilesBlob) =>
  (blob.profiles[0] as { inputs: Record<string, unknown> }).inputs

function pipelineDps(inputs: Inputs): ReturnType<typeof runEngine> {
  return runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs))))
}

// Gear-word contributions are measured by diffing `ctx` before/after applying
// a word spec (see gearStats.ts computeGearContribution); diffing against a
// large stored value vs. against zero rounds to a different float in the last
// couple of bits, so the deep comparison can only be a near-equality, not
// `toEqual`.
function findDivergences(actual: unknown, expected: unknown, path = "root"): string[] {
  if (typeof actual === "number" && typeof expected === "number") {
    const withinTolerance =
      Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(actual), Math.abs(expected))
    return withinTolerance ? [] : [`${path}: ${actual} !== ${expected}`]
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length)
      return [`${path}: length ${actual.length} !== ${expected.length}`]
    return actual.flatMap((item, index) =>
      findDivergences(item, expected[index], `${path}[${index}]`),
    )
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const actualRecord = actual as Record<string, unknown>
    const expectedRecord = expected as Record<string, unknown>
    const keys = new Set([...Object.keys(actualRecord), ...Object.keys(expectedRecord)])
    return [...keys].flatMap((key) =>
      findDivergences(actualRecord[key], expectedRecord[key], `${path}.${key}`),
    )
  }
  return Object.is(actual, expected) ? [] : [`${path}: ${String(actual)} !== ${String(expected)}`]
}

describe("profile-v5 fixture — the stored blob is genuinely pre-strip", () => {
  it("is version 5 and still carries the arsenal-subtraction garbage", () => {
    expect(LEGACY.v).toBe(5)
    expect(LEGACY.profile.inputs.bamboocut).toEqual({ min: -131, max: -226.8, penetration: 0 })
    expect("phys" in LEGACY.profile.inputs).toBe(true)
    expect("dingYinByTag" in LEGACY.profile.inputs).toBe(true)
  })
})

// hydrateInputs zero-fills these fields too, so asserting only the loaded
// result would still pass with V6 unregistered — these pin the step itself.
describe("V6 step — v5 → v6 in isolation", () => {
  it("strips every derived stat field from the raw blob", () => {
    const migrated = V6__dropDerivedStats.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(V6__dropDerivedStats.to)
    const inputs = inputsOf(migrated)
    for (const field of DERIVED_STAT_FIELDS) {
      expect(field in inputs, `${field} should have been stripped`).toBe(false)
    }
  })

  it("carries every neighbouring field across the step untouched", () => {
    const migrated = V6__dropDerivedStats.migrate(blobOf(clone(LEGACY.profile)))
    const before = LEGACY.profile.inputs
    const after = inputsOf(migrated) as unknown as StoredProfile["inputs"]
    expect(after.inventory).toEqual(before.inventory)
    expect(after.inventory).toHaveLength(9)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect(after.oddities).toEqual(before.oddities)
    expect(after.martialArtsTalents).toEqual(before.martialArtsTalents)
    expect(after.combatSettings).toEqual(before.combatSettings)
    expect(after.classId).toBe(before.classId)
    expect(after.breakthrough).toBe(before.breakthrough)
    expect(after.arsenal).toBe(before.arsenal)
    expect(after.set).toBe(before.set)
    expect(after.bowSet).toBe(before.bowSet)
    expect(after.food).toBe(before.food)
    expect(after.dummyMode).toBe(before.dummyMode)
    expect(after.selectedBuiltinRotationId).toBe(before.selectedBuiltinRotationId)
    expect(after.activeCustomRotation).toEqual(before.activeCustomRotation)
    const migratedProfile = migrated.profiles[0] as StoredProfile
    expect(migratedProfile.id).toBe(LEGACY.profile.id)
    expect(migratedProfile.name).toBe(LEGACY.profile.name)
  })

  it("is registered, and the chain reports it for a v5 blob", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)))!
    expect(result.applied).toContain("V6__dropDerivedStats")
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
  })

  it("does not mutate its input, and migrating twice equals migrating once", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V6__dropDerivedStats.migrate(input)
    expect(input).toEqual(snapshot)
    const twice = V6__dropDerivedStats.migrate(once)
    expect(twice).toEqual(once)
  })
})

describe("v5 profile → v6 dropped-stats scheme", () => {
  beforeEach(() => localStorage.clear())

  it("loads with derived fields zeroed and the build otherwise intact", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const after = loadOne()

    expect(after.id).toBe(LEGACY.profile.id)
    expect(after.name).toBe(LEGACY.profile.name)
    expect(after.inputs.breakthrough).toBe(LEGACY.profile.inputs.breakthrough)
    expect(after.inputs.arsenal).toBe(LEGACY.profile.inputs.arsenal)
    expect(after.inputs.inventory).toHaveLength(9)
    expect(after.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
    expect(after.inputs.mindMethods.map((slot) => slot.name)).toEqual(
      LEGACY.profile.inputs.mindMethods.map((slot) => slot.name),
    )

    expect(after.inputs.phys).toEqual({ min: 0, max: 0, penetration: 0 })
    expect(after.inputs.critRate).toBe(0)
    expect(after.inputs.classSpecificAttunement).toEqual({})
  })

  it("re-persists the blob at the latest version with no derived stat field present", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    loadProfiles()
    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    const persistedInputs = persisted.profiles[0].inputs as Record<string, unknown>
    for (const field of DERIVED_STAT_FIELDS) {
      expect(field in persistedInputs, `${field} leaked into the persisted blob`).toBe(false)
    }
  })

  it("the strip does not change DPS — the app derives past whatever is stored", () => {
    const rawInputs = LEGACY.profile.inputs as unknown as Inputs
    const withStats = pipelineDps(rawInputs)
    const zeroed = pipelineDps(withZeroedDerivedStats(rawInputs))
    expect(findDivergences(zeroed, withStats)).toEqual([])
    expect(zeroed.dps).toBeCloseTo(withStats.dps, 6)
  })

  it("the loaded profile still computes positive DPS", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const result = pipelineDps(loadOne().inputs)
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((warning) => /no default rotation/i.test(warning))).toBe(false)
  })

  it("is idempotent — loading twice in a row yields an equal profile", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const once = loadOne()
    writeProfilesBlob(clone(once))
    expect(loadOne()).toEqual(once)
  })
})
