import { beforeEach, describe, expect, it } from "vitest"
import { loadCustomRotations } from "../../src/storage"
import { builtinSkillsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V5__englishIdsWithoutSitePrefix } from "../../src/migrations/V5__englishIdsWithoutSitePrefix"
import type { StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v4/bellstrikeUmbra.json"

const CUSTOM_ROTATIONS_KEY = "wwm.customRotations"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

const inputsOf = (blob: RawProfilesBlob) =>
  (blob.profiles[0] as { inputs: Record<string, unknown> }).inputs

describe("profile-v4 fixture — the stored blob is genuinely pre-rename", () => {
  it("is version 4 and carries the legacy pinyin class id", () => {
    expect(LEGACY.v).toBe(4)
    expect(LEGACY.v).toBe(V5__englishIdsWithoutSitePrefix.to - 1)
    expect(LEGACY.profile.inputs.classId).toBe("mingJinYing")
  })
})

// `hydrateInputs` repairs ids too, so asserting only the loaded result would
// still pass with V5 unregistered. These pin the step itself.
describe("V5__englishIdsWithoutSitePrefix — called directly", () => {
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

  it("does not mutate its input, and migrating twice equals migrating once", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V5__englishIdsWithoutSitePrefix.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V5__englishIdsWithoutSitePrefix.migrate(clone(once))).toEqual(once)
  })
})

describe("V5__englishIdsWithoutSitePrefix — registered in the chain", () => {
  it("a v4 blob migrated to v5 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 5 })!
    expect(result.applied).toEqual(["V5__englishIdsWithoutSitePrefix"])
    expect(result.blob.v).toBe(5)
    expect(inputsOf(result.blob).classId).toBe("bellstrikeUmbra")
  })
})

describe("v4 profile carrying legacy `site-` entity ids", () => {
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

  it("the rewritten step ids resolve against the shipped built-in skills", () => {
    const migrated = V5__englishIdsWithoutSitePrefix.migrate(blobOf(withLegacyRotation()))
    const inputs = inputsOf(migrated) as unknown as StoredProfile["inputs"]
    const known = new Set(builtinSkillsForClass(inputs.classId).map((s) => s.id))
    for (const step of inputs.activeCustomRotation!.steps) {
      expect(known.has(step.skillId), `unresolved step skillId ${step.skillId}`).toBe(true)
    }
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
