import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V25__addOddityHpDefenseNodes,
  addMissingOddityNodes,
} from "../../src/migrations/V25__addOddityHpDefenseNodes"
import legacyProfileFile from "./testProfiles/v24/bellstrikeUmbra.json"

interface LegacyNode {
  id: number
  stat: string
  value: number
  enabled?: boolean
}

type LegacyOddities = Record<string, LegacyNode[]>

interface LegacyProfile {
  id: string
  name: string
  inputs: Record<string, unknown> & { oddities: LegacyOddities }
}

type LegacyFile = { v: number; profile: LegacyProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

const ADDED_QINGHE_IDS = [
  102, 107, 108, 110, 117, 123, 128, 141, 151, 152, 104, 106, 111, 124, 127, 136,
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: LegacyProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id } as unknown as RawProfilesBlob
}

function inputsOf(blob: RawProfilesBlob): LegacyProfile["inputs"] {
  return (blob.profiles[0] as unknown as LegacyProfile).inputs
}

describe("profile-v24 fixture", () => {
  it("is v24 and carries only the pre-Oddity-expansion attack nodes", () => {
    expect(LEGACY.v).toBe(V25__addOddityHpDefenseNodes.to - 1)
    const oddities = LEGACY.profile.inputs.oddities
    expect(oddities.Qinghe).toHaveLength(6)
    expect(
      oddities.Qinghe.every((node) => node.stat === "minPhys" || node.stat === "maxPhys"),
    ).toBe(true)
  })
})

describe("addMissingOddityNodes", () => {
  it("appends every Max HP and Physical Defense id a region does not have yet", () => {
    const after = addMissingOddityNodes(clone(LEGACY.profile.inputs.oddities)) as LegacyOddities
    const ids = new Set(after.Qinghe.map((node) => node.id))
    for (const id of ADDED_QINGHE_IDS) expect(ids.has(id)).toBe(true)
  })

  it("leaves every already-stored node exactly as it was", () => {
    const before = clone(LEGACY.profile.inputs.oddities)
    before.Qinghe[0] = { ...before.Qinghe[0], enabled: false, value: 999 }
    const after = addMissingOddityNodes(clone(before)) as LegacyOddities
    expect(after.Qinghe[0]).toEqual(before.Qinghe[0])
  })

  it("keeps a stored node whose id the table no longer carries", () => {
    const before = clone(LEGACY.profile.inputs.oddities)
    before.Qinghe.push({ id: 9999, stat: "maxPhys", value: 1, enabled: true })
    const after = addMissingOddityNodes(clone(before)) as LegacyOddities
    expect(after.Qinghe.some((node) => node.id === 9999)).toBe(true)
  })

  it("adds the new nodes as enabled", () => {
    const after = addMissingOddityNodes(clone(LEGACY.profile.inputs.oddities)) as LegacyOddities
    expect(after.Qinghe.find((node) => node.id === 102)).toEqual({
      id: 102,
      stat: "maxHp",
      value: 150,
      enabled: true,
    })
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
  it("raises the oddity Max HP and Physical Defense totals to the v25 table", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V25__addOddityHpDefenseNodes.migrate(clone(before))
    expect(migrated.v).toBe(25)
    let hp = 0
    let physDef = 0
    for (const nodes of Object.values(inputsOf(migrated).oddities)) {
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
    const expected: Record<string, unknown> = { ...clone(inputsOf(before)) }
    delete expected.oddities
    const actual: Record<string, unknown> = { ...clone(inputsOf(migrated)) }
    delete actual.oddities
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
    const migrated = result.blob.profiles[0] as unknown as LegacyProfile
    expect(migrated.id).toBe(LEGACY.profile.id)
    expect(migrated.name).toBe(LEGACY.profile.name)
    expect(migrated.inputs.equipped).toEqual(LEGACY.profile.inputs.equipped)
  })
})
