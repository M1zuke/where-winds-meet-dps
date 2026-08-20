import { beforeEach, describe, expect, it } from "vitest"
import {
  LATEST_PROFILES_VERSION,
  PROFILE_MIGRATIONS,
  runProfileMigrations,
  type Migration,
  type RawProfilesBlob,
} from "../../src/migrations"
import { loadProfiles } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v4/bellstrikeUmbra.json"

const PROFILES_KEY = "wwm.profiles"
type LegacyFile = {
  v: number
  profile: { id: string; name: string; inputs: Record<string, unknown> }
}
const LEGACY = legacyProfileFile as unknown as LegacyFile

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

function blobAt(v: number): RawProfilesBlob {
  const p = clone(LEGACY.profile)
  return { v, profiles: [p], activeId: p.id }
}

describe("migration registry", () => {
  it("every step's `to` matches its file-name prefix and the list is gap-free & ordered", () => {
    const targets = PROFILE_MIGRATIONS.map((m) => m.to)
    expect(targets).toEqual([...targets].sort((a, b) => a - b))
    expect(new Set(targets).size).toBe(targets.length)
    for (const m of PROFILE_MIGRATIONS) {
      expect(m.name.startsWith(`V${m.to}__`), `${m.name} does not start with V${m.to}__`).toBe(true)
    }
  })

  it("LATEST_PROFILES_VERSION is the highest registered step", () => {
    expect(LATEST_PROFILES_VERSION).toBe(Math.max(4, ...PROFILE_MIGRATIONS.map((m) => m.to)))
  })
})

describe("runProfileMigrations — sequential upgrade", () => {
  it("walks a v4 blob up to the latest version and reports the step it applied", () => {
    const result = runProfileMigrations(blobAt(4))!
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
    expect(result.applied).toContain("V5__englishIdsWithoutSitePrefix")
  })

  it("applies the v4 → v5 rename to the profile's inputs", () => {
    const result = runProfileMigrations(blobAt(4))!
    const inputs = (result.blob.profiles[0] as { inputs: Record<string, unknown> }).inputs
    expect(inputs.classId).toBe("bellstrikeUmbra")
  })

  it("is a no-op on a blob already at the latest version", () => {
    const already = runProfileMigrations(blobAt(4))!.blob
    const again = runProfileMigrations(clone(already))!
    expect(again.applied).toEqual([])
    expect(again.blob).toEqual(already)
  })

  it("does not mutate the input blob", () => {
    const input = blobAt(4)
    const snapshot = clone(input)
    runProfileMigrations(input)
    expect(input).toEqual(snapshot)
  })
})

describe("runProfileMigrations — scoped to a target version", () => {
  it("stops at the requested version and applies only the steps up to it", () => {
    const result = runProfileMigrations(blobAt(4), { toVersion: 5 })!
    expect(result.blob.v).toBe(5)
    expect(result.applied).toEqual(["V5__englishIdsWithoutSitePrefix"])
  })

  it("applies nothing to a blob already at the target version", () => {
    const migrated = runProfileMigrations(blobAt(4), { toVersion: 5 })!.blob
    const again = runProfileMigrations(clone(migrated), { toVersion: 5 })!
    expect(again.applied).toEqual([])
    expect(again.blob).toEqual(migrated)
  })

  it("clamps a target above the latest version to the latest", () => {
    const result = runProfileMigrations(blobAt(4), { toVersion: LATEST_PROFILES_VERSION + 5 })!
    expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
  })

  it("leaves a blob newer than the target untouched", () => {
    const newer = blobAt(6)
    const result = runProfileMigrations(clone(newer), { toVersion: 5 })!
    expect(result.blob).toEqual(newer)
    expect(result.applied).toEqual([])
  })
})

describe("runProfileMigrations — never deletes", () => {
  it("keeps profiles from versions older than the chain (no step registered)", () => {
    for (const v of [1, 2, 3]) {
      const result = runProfileMigrations(blobAt(v))!
      expect(result.blob.profiles, `v${v} lost its profiles`).toHaveLength(1)
      expect(result.blob.v).toBe(LATEST_PROFILES_VERSION)
      expect(result.notes.join(" ")).toMatch(/no migration to v/)
    }
  })

  it("keeps a blob whose version is missing or garbage", () => {
    const noVersion = { profiles: [clone(LEGACY.profile)], activeId: "x" } as unknown
    const result = runProfileMigrations(noVersion)!
    expect(result.blob.profiles).toHaveLength(1)
    expect(result.notes.join(" ")).toMatch(/invalid version/)
  })

  it("leaves a FUTURE-version blob untouched rather than shredding it", () => {
    const future = blobAt(LATEST_PROFILES_VERSION + 3)
    const result = runProfileMigrations(future)!
    expect(result.blob).toEqual(future)
    expect(result.applied).toEqual([])
    expect(result.notes.join(" ")).toMatch(/newer than/)
  })

  it("survives a step that throws — the pre-step blob carries forward", () => {
    const exploding: Migration = {
      to: LATEST_PROFILES_VERSION,
      name: `V${LATEST_PROFILES_VERSION}__boom`,
      migrate() {
        throw new Error("boom")
      },
    }
    const before = blobAt(LATEST_PROFILES_VERSION - 1)
    let blob: RawProfilesBlob = before
    let threw = false
    try {
      blob = exploding.migrate(blob)
    } catch {
      threw = true
    }
    expect(threw).toBe(true)
    expect(blob.profiles).toHaveLength(1)

    const result = runProfileMigrations(before)
    expect(result).not.toBeNull()
    expect(result!.blob.profiles).toHaveLength(1)
  })

  it("preserves a non-array `profiles` value instead of discarding the blob", () => {
    const broken = { v: 4, profiles: "corrupt" } as unknown
    const result = runProfileMigrations(broken)!
    expect(result.blob.profiles).toBe("corrupt")
  })

  it("returns null only for input that is not an object at all", () => {
    expect(runProfileMigrations(null)).toBeNull()
    expect(runProfileMigrations("nope")).toBeNull()
    expect(runProfileMigrations([1, 2])).toBeNull()
  })
})

describe("loadProfiles — old blobs survive the load path end to end", () => {
  beforeEach(() => localStorage.clear())

  it("a v1 blob still yields the user's profile, not a fresh default", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobAt(1)))
    const { profiles, firstRun } = loadProfiles()
    expect(firstRun).toBe(false)
    expect(profiles).toHaveLength(1)
    expect(profiles[0].name).toBe("Test")
    expect(profiles[0].inputs.inventory).toHaveLength(8)
  })

  it("a v4 blob keeps its gear and lands on the new class id", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobAt(4)))
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.classId).toBe("bellstrikeUmbra")
    expect(profiles[0].inputs.inventory).toHaveLength(8)
  })

  it("rewrites the stored blob to the latest version so the chain runs once", () => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blobAt(4)))
    loadProfiles()
    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    expect(persisted.v).toBe(LATEST_PROFILES_VERSION)
    expect(persisted.profiles[0].inputs.classId).toBe("bellstrikeUmbra")
    expect(persisted.profiles[0].inputs.inventory).toHaveLength(8)
  })

  it("only a genuinely empty/unparseable store falls back to a default profile", () => {
    localStorage.setItem(PROFILES_KEY, "{not json")
    expect(loadProfiles().profiles[0].name).toBe("Default")
    localStorage.clear()
    expect(loadProfiles().firstRun).toBe(true)
  })
})
