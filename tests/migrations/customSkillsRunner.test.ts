import { beforeEach, describe, expect, it } from "vitest"
import { runChain, type ChainStep, type VersionedBlob } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  LATEST_CUSTOM_SKILLS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { loadCustomSkills } from "../../src/storage"
import storeV3File from "./testCustomSkills/v3/store.json"

const SKILLS_KEY = "wwm.customSkills"
const STORE_V3 = storeV3File as unknown as RawCustomSkillsBlob

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const blobAt = (v: number): RawCustomSkillsBlob => ({ ...clone(STORE_V3), v })

describe("custom-skill migration registry", () => {
  it("every step's `to` matches its file-name prefix and the list is gap-free & ordered", () => {
    const targets = CUSTOM_SKILL_MIGRATIONS.map((m) => m.to)
    expect(targets).toEqual([...targets].sort((a, b) => a - b))
    expect(new Set(targets).size).toBe(targets.length)
    for (let index = 1; index < targets.length; index++) {
      expect(targets[index]).toBe(targets[index - 1] + 1)
    }
    for (const m of CUSTOM_SKILL_MIGRATIONS) {
      expect(m.name.startsWith(`V${m.to}__`), `${m.name} does not start with V${m.to}__`).toBe(true)
    }
  })

  it("starts right after the version the store had before it grew a chain", () => {
    expect(CUSTOM_SKILL_MIGRATIONS[0].to).toBe(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION + 1)
  })

  it("LATEST_CUSTOM_SKILLS_VERSION is the highest registered step", () => {
    expect(LATEST_CUSTOM_SKILLS_VERSION).toBe(
      Math.max(
        OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION,
        ...CUSTOM_SKILL_MIGRATIONS.map((m) => m.to),
      ),
    )
  })
})

describe("runCustomSkillMigrations — sequential upgrade", () => {
  it("walks the oldest migratable blob to the latest version through every step", () => {
    const result = runCustomSkillMigrations(blobAt(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION))!
    expect(result.blob.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
    expect(result.applied).toEqual(CUSTOM_SKILL_MIGRATIONS.map((m) => m.name))
    expect(result.blob.skills).toHaveLength(STORE_V3.skills.length)
  })

  it("is a no-op on a blob already at the latest version", () => {
    const already = runCustomSkillMigrations(blobAt(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION))!.blob
    const again = runCustomSkillMigrations(clone(already))!
    expect(again.applied).toEqual([])
    expect(again.blob).toEqual(already)
  })

  it("does not mutate the input blob", () => {
    const input = blobAt(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION)
    const snapshot = clone(input)
    runCustomSkillMigrations(input)
    expect(input).toEqual(snapshot)
  })
})

describe("runCustomSkillMigrations — scoped to a target version", () => {
  it("stops at the requested version and applies only the steps up to it", () => {
    const first = CUSTOM_SKILL_MIGRATIONS[0]
    const result = runCustomSkillMigrations(blobAt(first.to - 1), { toVersion: first.to })!
    expect(result.blob.v).toBe(first.to)
    expect(result.applied).toEqual([first.name])
  })

  it("clamps a target beyond the latest version to the latest", () => {
    const result = runCustomSkillMigrations(blobAt(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION), {
      toVersion: LATEST_CUSTOM_SKILLS_VERSION + 10,
    })!
    expect(result.blob.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
  })
})

describe("runCustomSkillMigrations — degenerate input", () => {
  it("returns null for anything that is not an object", () => {
    expect(runCustomSkillMigrations(null)).toBeNull()
    expect(runCustomSkillMigrations("garbage")).toBeNull()
    expect(runCustomSkillMigrations([1, 2, 3])).toBeNull()
  })

  it("treats a missing or non-numeric version as 0 and says so", () => {
    const result = runCustomSkillMigrations({ skills: [] })!
    expect(result.blob.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
    expect(result.notes.some((note) => /treated as 0/.test(note))).toBe(true)
  })

  it("leaves a blob from a newer build untouched", () => {
    const newer = blobAt(LATEST_CUSTOM_SKILLS_VERSION + 1)
    const result = runCustomSkillMigrations(newer)!
    expect(result.blob).toEqual(newer)
    expect(result.applied).toEqual([])
    expect(result.notes.some((note) => /newer/.test(note))).toBe(true)
  })

  it("keeps the pre-step blob when a step throws, and still reaches the target version", () => {
    const throwing: ChainStep<VersionedBlob> = {
      to: 2,
      name: "V2__throws",
      migrate() {
        throw new Error("boom")
      },
    }
    const result = runChain<VersionedBlob>([throwing], 2, { v: 1, payload: "kept" })!
    expect(result.blob).toEqual({ v: 2, payload: "kept" })
    expect(result.applied).toEqual([])
    expect(result.notes.some((note) => /V2__throws failed/.test(note))).toBe(true)
  })
})

describe("loadCustomSkills — what the chain is allowed to read", () => {
  beforeEach(() => localStorage.clear())

  it("drops a store older than the chain's floor instead of guessing its shape", () => {
    localStorage.setItem(
      SKILLS_KEY,
      JSON.stringify(blobAt(OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION - 1)),
    )
    expect(loadCustomSkills()).toEqual([])
  })

  it("drops a store whose skills are not an array", () => {
    localStorage.setItem(
      SKILLS_KEY,
      JSON.stringify({ v: OLDEST_MIGRATABLE_CUSTOM_SKILLS_VERSION, skills: {} }),
    )
    expect(loadCustomSkills()).toEqual([])
  })

  it("reads a store a newer build wrote without writing it back", () => {
    const newer = JSON.stringify(blobAt(LATEST_CUSTOM_SKILLS_VERSION + 1))
    localStorage.setItem(SKILLS_KEY, newer)
    expect(loadCustomSkills().length).toBe(STORE_V3.skills.length)
    expect(localStorage.getItem(SKILLS_KEY)).toBe(newer)
  })
})
