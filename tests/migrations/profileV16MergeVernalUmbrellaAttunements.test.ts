import { beforeEach, describe, expect, it } from "vitest"
import { importProfile, loadCustomSkills } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import { V16__mergeVernalUmbrellaAttunements } from "../../src/migrations/V16__mergeVernalUmbrellaAttunements"
import type { StoredProfile } from "../../src/engine/types"
import { makeSkill } from "../../src/engine/skill"
import legacyProfileFile from "./testProfiles/v15/silkbindJade.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const CUSTOM_SKILLS_VERSION = 3
const MERGED = "umbFrequentProjectile"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withAttunements(profile: StoredProfile, attunements: string[]): StoredProfile {
  const inventory = profile.inputs.inventory.map((piece, index) =>
    index < attunements.length ? { ...piece, attunement: attunements[index] } : piece,
  )
  return { ...profile, inputs: { ...profile.inputs, inventory } }
}

function blobOf(profile: StoredProfile, version = LEGACY.v): RawProfilesBlob {
  return { v: version, profiles: [profile], activeId: profile.id }
}

function attunementsOf(blob: RawProfilesBlob): string[] {
  return (blob.profiles[0] as StoredProfile).inputs.inventory.map((piece) => piece.attunement)
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores v15, the version this step reads", () => {
    expect(LEGACY.v).toBe(15)
    expect(LEGACY.v).toBe(V16__mergeVernalUmbrellaAttunements.to - 1)
  })
})

describe("V16__mergeVernalUmbrellaAttunements — called directly", () => {
  it("carries umbSpecial and umbCharged to the merged id, value untouched", () => {
    const before = blobOf(withAttunements(clone(LEGACY.profile), ["umbSpecial", "umbCharged"]))
    const migrated = V16__mergeVernalUmbrellaAttunements.migrate(before)
    expect(migrated.v).toBe(V16__mergeVernalUmbrellaAttunements.to)
    expect(attunementsOf(migrated).slice(0, 2)).toEqual([MERGED, MERGED])
    expect((migrated.profiles[0] as StoredProfile).inputs.inventory[0].attunementValue).toBe(
      LEGACY.profile.inputs.inventory[0].attunementValue,
    )
  })

  it("leaves every still-offered attunement id alone", () => {
    const before = blobOf(withAttunements(clone(LEGACY.profile), ["umbQ", "physPen", "fanSpecial"]))
    const migrated = V16__mergeVernalUmbrellaAttunements.migrate(before)
    expect(attunementsOf(migrated).slice(0, 3)).toEqual(["umbQ", "physPen", "fanSpecial"])
  })

  it("touches nothing but the retired attunement ids", () => {
    const before = blobOf(withAttunements(clone(LEGACY.profile), ["umbSpecial"]))
    const migrated = V16__mergeVernalUmbrellaAttunements.migrate(clone(before))
    const beforeInputs = (before.profiles[0] as StoredProfile).inputs
    const migratedInputs = (migrated.profiles[0] as StoredProfile).inputs
    expect(migratedInputs).toEqual({
      ...beforeInputs,
      inventory: beforeInputs.inventory.map((piece, index) =>
        index === 0 ? { ...piece, attunement: MERGED } : piece,
      ),
    })
  })

  it("does not mutate its input", () => {
    const input = blobOf(withAttunements(clone(LEGACY.profile), ["umbSpecial", "umbCharged"]))
    const snapshot = clone(input)
    V16__mergeVernalUmbrellaAttunements.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is idempotent", () => {
    const once = V16__mergeVernalUmbrellaAttunements.migrate(
      blobOf(withAttunements(clone(LEGACY.profile), ["umbSpecial", "umbCharged"])),
    )
    expect(V16__mergeVernalUmbrellaAttunements.migrate(clone(once))).toEqual(once)
  })
})

describe("V16__mergeVernalUmbrellaAttunements — registered in the chain", () => {
  it("a v15 blob migrated to v16 passes through exactly this step", () => {
    const result = runProfileMigrations(
      blobOf(withAttunements(clone(LEGACY.profile), ["umbSpecial", "umbCharged"])),
      { toVersion: 16 },
    )!
    expect(result.applied).toEqual(["V16__mergeVernalUmbrellaAttunements"])
    expect(result.blob.v).toBe(16)
    expect(attunementsOf(result.blob).slice(0, 2)).toEqual([MERGED, MERGED])
  })
})

describe("hydrateInputs backstop — a bare import never walks the chain", () => {
  beforeEach(() => localStorage.clear())

  it("still merges the retired ids", () => {
    const bare = withAttunements(clone(LEGACY.profile), ["umbSpecial", "umbCharged"])
    const imported = importProfile(JSON.stringify(bare))
    expect(imported.inputs.inventory.map((piece) => piece.attunement).slice(0, 2)).toEqual([
      MERGED,
      MERGED,
    ])
  })
})

describe("custom skills backstop — the store heals through its hydrator", () => {
  beforeEach(() => localStorage.clear())

  function saveCustomSkill(tags: string[]): void {
    const skill = makeSkill("silkbindJade", { id: "custom-drone-copy", name: "Drone Copy", tags })
    localStorage.setItem(
      CUSTOM_SKILLS_KEY,
      JSON.stringify({ v: CUSTOM_SKILLS_VERSION, skills: [skill] }),
    )
  }

  it("renames a stored attune:umbSpecial so it cannot mask the merged tag", () => {
    saveCustomSkill(["weapon:Umbrella", "attack:light", "attune:umbSpecial"])
    const tags = loadCustomSkills()[0].tags ?? []
    expect(tags).toContain("attune:umbFrequentProjectile")
    expect(tags).not.toContain("attune:umbSpecial")
  })

  it("renames attune:umbCharged and dedupes against an already-merged tag", () => {
    saveCustomSkill(["attune:umbCharged", "attune:umbFrequentProjectile"])
    const tags = loadCustomSkills()[0].tags ?? []
    expect(tags.filter((tag) => tag === "attune:umbFrequentProjectile")).toHaveLength(1)
    expect(tags).not.toContain("attune:umbCharged")
  })

  it("leaves every other attune tag alone", () => {
    saveCustomSkill(["attune:fanSpecial", "attune:umbQ"])
    const tags = loadCustomSkills()[0].tags ?? []
    expect(tags).toContain("attune:fanSpecial")
    expect(tags).toContain("attune:umbQ")
  })
})
