// Drives the captured pre-rename profile through the loader and asserts it
// lands on the current id scheme with the user's build intact.
import { beforeEach, describe, expect, it } from "vitest"
import { loadProfiles, loadCustomRotations } from "../../src/storage"
import { builtinSkillsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { withDerivedStats, DERIVED_STAT_FIELDS } from "../../src/engine/derivedInputs"
import {
  LATEST_PROFILES_VERSION,
  runProfileMigrations,
  type RawProfilesBlob,
} from "../../src/migrations"
import { V5__englishIdsWithoutSitePrefix } from "../../src/migrations/V5__englishIdsWithoutSitePrefix"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/profile-v4.json"

const PROFILES_KEY = "wwm.profiles"
const CUSTOM_ROTATIONS_KEY = "wwm.customRotations"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function blobOf(profile: StoredProfile, v = LEGACY.v): RawProfilesBlob {
  return { v, profiles: [profile], activeId: profile.id }
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

describe("profile-v4 fixture — the stored blob is genuinely pre-rename", () => {
  it("is version 4 and carries the legacy pinyin class id", () => {
    expect(LEGACY.v).toBe(4)
    expect(LEGACY.profile.inputs.classId).toBe("mingJinYing")
  })
})

// `hydrateInputs` repairs ids too, so asserting only the loaded result would
// still pass with V5 unregistered. These pin the step itself.
describe("V5 step — v4 → v5 in isolation", () => {
  it("is registered, and the chain walks a v4 blob to the latest version", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)))!
    expect(result.applied).toEqual([
      "V5__englishIdsWithoutSitePrefix",
      "V6__dropDerivedStats",
      "V7__clampSingleMysticWordRoll",
      "V8__dropRemovedArmorSets",
      "V9__renameSteadfastDevotion",
      "V10__renameFrostCladNight",
      "V11__setIdsWithoutDisplayName",
    ])
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
  })

  it("migrating the raw v4 blob rewrites classId without any hydration", () => {
    const migrated = V5__englishIdsWithoutSitePrefix.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(5)
    expect(inputsOf(migrated).classId).toBe("bellstrikeUmbra")
  })

  it("carries the whole build across the step untouched", () => {
    const migrated = V5__englishIdsWithoutSitePrefix.migrate(blobOf(clone(LEGACY.profile)))
    const before = LEGACY.profile.inputs
    const after = inputsOf(migrated)
    expect(after.inventory).toEqual(before.inventory)
    expect(after.equipped).toEqual(before.equipped)
    expect(after.mindMethods).toEqual(before.mindMethods)
    expect(after.oddities).toEqual(before.oddities)
  })

  it("the stored blob is rewritten to the latest version on load", () => {
    localStorage.clear()
    writeProfilesBlob(clone(LEGACY.profile))
    loadProfiles()
    expect(JSON.parse(localStorage.getItem(PROFILES_KEY)!).v).toBe(LATEST_PROFILES_VERSION)
  })
})

describe("v4 profile → current id scheme", () => {
  beforeEach(() => localStorage.clear())

  it("heals the pinyin class id to bellstrikeUmbra", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    expect(loadOne().inputs.classId).toBe("bellstrikeUmbra")
  })

  it("keeps the user's build intact — name, breakthrough, gear; stats now derived, not stored", () => {
    const before = clone(LEGACY.profile)
    writeProfilesBlob(clone(before))
    const after = loadOne()

    expect(after.id).toBe(before.id)
    expect(after.name).toBe(before.name)
    expect(after.inputs.breakthrough).toBe(before.inputs.breakthrough)
    expect(after.inputs.arsenal).toBe(before.inputs.arsenal)
    expect(after.inputs.inventory).toHaveLength(before.inputs.inventory.length)
    expect(after.inputs.equipped).toEqual(before.inputs.equipped)
    expect(after.inputs.phys).toEqual({ min: 0, max: 0, penetration: 0 })
    expect(after.inputs.bellstrike).toEqual({ min: 0, max: 0, penetration: 0 })
    expect(after.inputs.precision).toBe(0)
    expect(after.inputs.critRate).toBe(0)
    expect(after.inputs.affinityRate).toBe(0)

    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    const persistedInputs = persisted.profiles[0].inputs as Record<string, unknown>
    for (const field of DERIVED_STAT_FIELDS) {
      expect(field in persistedInputs, `${field} leaked into the persisted blob`).toBe(false)
    }
  })

  it("keeps every selected inner way (none dropped by the class allowlist)", () => {
    const before = clone(LEGACY.profile)
    writeProfilesBlob(clone(before))
    const after = loadOne()
    expect(after.inputs.mindMethods.map((m) => m.name)).toEqual(
      before.inputs.mindMethods.map((m) => m.name),
    )
  })

  it("the healed profile still computes positive DPS", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const loaded: Inputs = loadOne().inputs
    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(loaded))))
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((w) => /no default rotation/i.test(w))).toBe(false)
  })

  it("is idempotent — re-saving and re-loading changes nothing further", () => {
    writeProfilesBlob(clone(LEGACY.profile))
    const once = loadOne()
    writeProfilesBlob(clone(once))
    expect(loadOne()).toEqual(once)
  })

  it("leaves an already-migrated profile untouched", () => {
    const migrated = clone(LEGACY.profile)
    migrated.inputs.classId = "bellstrikeUmbra"
    writeProfilesBlob(clone(migrated))
    const after = loadOne()
    expect(after.inputs.classId).toBe("bellstrikeUmbra")
    writeProfilesBlob(clone(after))
    expect(loadOne()).toEqual(after)
  })
})

describe("v4 profile carrying legacy `site-` entity ids", () => {
  beforeEach(() => localStorage.clear())

  function withLegacyRotation(): StoredProfile {
    const p = clone(LEGACY.profile)
    p.inputs.selectedBuiltinRotationId = "builtin-mingJinYing-eazy-t6-wolf"
    p.inputs.activeCustomRotation = {
      id: "rot-legacy",
      name: "legacy",
      classId: "mingJinYing",
      steps: [
        { id: "s1", skillId: "site-mingJinYing-swordq", hitCount: 1, prePull: false },
        { id: "s2", skillId: "site-mingJinYing-spearheavy", hitCount: 1, prePull: false },
      ],
      permanentBuffIds: ["site-buff-mingJinYing-river-flow"],
      prePullHitsCount: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    ;(p.inputs as unknown as Record<string, unknown>).siteBuffParams = { swordHorizon: true }
    return p
  }

  it("the V5 step alone rewrites every id in the raw blob", () => {
    const migrated = V5__englishIdsWithoutSitePrefix.migrate(blobOf(withLegacyRotation()))
    const inputs = inputsOf(migrated) as unknown as StoredProfile["inputs"]
    expect(inputs.selectedBuiltinRotationId).toBe("builtin-bellstrikeUmbra-eazy-t6-wolf")
    expect(inputs.activeCustomRotation!.classId).toBe("bellstrikeUmbra")
    expect(inputs.activeCustomRotation!.steps.map((s) => s.skillId)).toEqual([
      "bellstrikeUmbra-swordq",
      "bellstrikeUmbra-spearheavy",
    ])
    expect(inputs.activeCustomRotation!.permanentBuffIds).toEqual([
      "buff-bellstrikeUmbra-river-flow",
    ])
    expect(inputs.buffParams).toEqual({ swordHorizon: true })
    expect("siteBuffParams" in (inputs as unknown as Record<string, unknown>)).toBe(false)
  })

  it("rewrites the built-in rotation id, the rotation classId and every step skillId", () => {
    writeProfilesBlob(withLegacyRotation())
    const inputs = loadOne().inputs

    expect(inputs.selectedBuiltinRotationId).toBe("builtin-bellstrikeUmbra-eazy-t6-wolf")
    expect(inputs.activeCustomRotation!.classId).toBe("bellstrikeUmbra")
    expect(inputs.activeCustomRotation!.steps.map((s) => s.skillId)).toEqual([
      "bellstrikeUmbra-swordq",
      "bellstrikeUmbra-spearheavy",
    ])
    expect(inputs.activeCustomRotation!.permanentBuffIds).toEqual([
      "buff-bellstrikeUmbra-river-flow",
    ])
  })

  it("the rewritten step ids resolve against the shipped built-in skills", () => {
    writeProfilesBlob(withLegacyRotation())
    const inputs = loadOne().inputs
    const known = new Set(builtinSkillsForClass(inputs.classId).map((s) => s.id))
    for (const step of inputs.activeCustomRotation!.steps) {
      expect(known.has(step.skillId), `unresolved step skillId ${step.skillId}`).toBe(true)
    }
  })

  it("renames the persisted `siteBuffParams` field to `buffParams`", () => {
    writeProfilesBlob(withLegacyRotation())
    const inputs = loadOne().inputs
    expect(inputs.buffParams).toEqual({ swordHorizon: true })
    expect("siteBuffParams" in (inputs as unknown as Record<string, unknown>)).toBe(false)
  })

  it("is idempotent over the id rewrite", () => {
    writeProfilesBlob(withLegacyRotation())
    const once = loadOne()
    writeProfilesBlob(clone(once))
    expect(loadOne()).toEqual(once)
  })
})

describe("saved custom rotations carrying legacy ids", () => {
  beforeEach(() => localStorage.clear())

  it("heals classId and step skillIds, and the result resolves", () => {
    localStorage.setItem(
      CUSTOM_ROTATIONS_KEY,
      JSON.stringify({
        v: 3,
        rotations: [
          {
            id: "rot-1",
            name: "mine",
            classId: "mingJinYing",
            steps: [{ id: "s1", skillId: "site-mingJinYing-swordq", hitCount: 1, prePull: false }],
            permanentBuffIds: [],
            prePullHitsCount: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    )

    const [rotation] = loadCustomRotations()
    expect(rotation.classId).toBe("bellstrikeUmbra")
    expect(rotation.steps[0].skillId).toBe("bellstrikeUmbra-swordq")

    const known = new Set(builtinSkillsForClass("bellstrikeUmbra").map((s) => s.id))
    expect(known.has(rotation.steps[0].skillId)).toBe(true)
  })
})

describe("the shipped default rotation is on the new scheme", () => {
  it("every step of Umbra's default rotation resolves", () => {
    const rotation = defaultRotationForClass("bellstrikeUmbra")!
    const known = new Set(builtinSkillsForClass("bellstrikeUmbra").map((s) => s.id))
    for (const step of rotation.steps) {
      expect(known.has(step.skillId), `unresolved ${step.skillId}`).toBe(true)
    }
  })
})
