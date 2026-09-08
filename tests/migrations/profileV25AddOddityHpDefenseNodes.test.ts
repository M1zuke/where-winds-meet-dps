import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V25__addOddityHpDefenseNodes,
  addMissingOddityNodes,
} from "../../src/migrations/V25__addOddityHpDefenseNodes"
import { DEFAULT_ODDITIES } from "../../src/definitions/baseStats"
import type { Inputs, OddityRegions, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v24/bellstrikeUmbra.json"

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

describe("profile-v24 fixture", () => {
  it("is v24 and carries only the pre-Oddity-expansion attack nodes", () => {
    expect(LEGACY.v).toBe(25 - 1)
    expect(LEGACY.v).toBe(V25__addOddityHpDefenseNodes.to - 1)
    const oddities = LEGACY.profile.inputs.oddities
    expect(oddities.Qinghe).toHaveLength(6)
    expect(
      oddities.Qinghe.every((node) => node.stat === "minPhys" || node.stat === "maxPhys"),
    ).toBe(true)
  })
})

describe("addMissingOddityNodes", () => {
  it("appends every default node id a region does not have yet", () => {
    const before = clone(LEGACY.profile.inputs.oddities)
    const after = addMissingOddityNodes(before) as typeof before
    for (const [region, defNodes] of Object.entries(DEFAULT_ODDITIES)) {
      const ids = new Set(after[region].map((node) => node.id))
      for (const defNode of defNodes) expect(ids.has(defNode.id)).toBe(true)
    }
  })

  it("leaves every already-stored node exactly as it was", () => {
    const before = clone(LEGACY.profile.inputs.oddities)
    before.Qinghe[0] = { ...before.Qinghe[0], enabled: false, value: 999 }
    const after = addMissingOddityNodes(clone(before)) as typeof before
    expect(after.Qinghe[0]).toEqual(before.Qinghe[0])
  })

  it("keeps a stored node whose id the current definition list no longer carries", () => {
    const before = clone(LEGACY.profile.inputs.oddities)
    before.Qinghe.push({ id: 9999, stat: "maxPhys", value: 1, enabled: true })
    const after = addMissingOddityNodes(clone(before)) as typeof before
    expect(after.Qinghe.some((node) => node.id === 9999)).toBe(true)
  })

  it("adds the new nodes as enabled, matching the definition's default value", () => {
    const after = addMissingOddityNodes(clone(LEGACY.profile.inputs.oddities)) as OddityRegions
    const added = after.Qinghe.find((node) => node.id === 102)!
    const defNode = DEFAULT_ODDITIES.Qinghe.find((node) => node.id === 102)!
    expect(added).toEqual({ ...defNode, enabled: true })
  })

  it("passes through a value that is not an object untouched", () => {
    expect(addMissingOddityNodes("not-an-object")).toBe("not-an-object")
    expect(addMissingOddityNodes(undefined)).toBeUndefined()
  })

  it("is idempotent", () => {
    const once = addMissingOddityNodes(clone(LEGACY.profile.inputs.oddities))
    const twice = addMissingOddityNodes(clone(once))
    expect(twice).toEqual(once)
  })
})

describe("V25__addOddityHpDefenseNodes — called directly", () => {
  it("raises the oddity Max HP and Physical Defense totals to the current definition list", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V25__addOddityHpDefenseNodes.migrate(clone(before))
    expect(migrated.v).toBe(25)
    const oddities = inputsOf(migrated).oddities
    let hp = 0
    let physDef = 0
    for (const nodes of Object.values(oddities)) {
      for (const node of nodes) {
        if (node.stat === "maxHp") hp += node.value
        if (node.stat === "physDef") physDef += node.value
      }
    }
    expect(hp).toBe(8150)
    expect(physDef).toBe(50)
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V25__addOddityHpDefenseNodes.migrate(clone(before))
    const expected = { ...clone(inputsOf(before)) }
    delete (expected as Partial<Inputs>).oddities
    const actual = { ...clone(inputsOf(migrated)) }
    delete (actual as Partial<Inputs>).oddities
    expect(actual).toEqual(expected)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V25__addOddityHpDefenseNodes.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V25__addOddityHpDefenseNodes.migrate(clone(once))).toEqual(once)
  })
})

describe("V25__addOddityHpDefenseNodes — registered in the chain", () => {
  it("a v24 blob migrated to v25 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 25 })!
    expect(result.applied).toEqual(["V25__addOddityHpDefenseNodes"])
    expect(result.blob.v).toBe(25)
  })

  it("carries the user's build across the hop", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 25 })!
    const migrated = result.blob.profiles[0] as StoredProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
    expect(migrated.inputs.inventory).toHaveLength(LEGACY.profile.inputs.inventory.length)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
  })
})
