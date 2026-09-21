import { describe, expect, it } from "vitest"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V28__oddityBoardNodes,
  unclaimedOddityNodesFromLegacy,
} from "../../src/migrations/V28__oddityBoardNodes"
import { ODDITY_BOARD, oddityRegionNodes } from "../../src/definitions/baseStats"
import legacyProfileFile from "./testProfiles/v27/bellstrikeUmbra.json"

interface LegacyNode {
  id: number
  stat: string
  value: number
  enabled?: boolean
}

interface LegacyProfile {
  id: string
  name: string
  inputs: Record<string, unknown> & { oddities: Record<string, LegacyNode[]> }
}

type LegacyFile = { v: number; profile: LegacyProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: LegacyProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id } as unknown as RawProfilesBlob
}

function inputsOf(blob: RawProfilesBlob): Record<string, unknown> {
  return (blob.profiles[0] as unknown as LegacyProfile).inputs
}

function allEnabled(): Record<string, LegacyNode[]> {
  const stored = clone(LEGACY.profile.inputs.oddities)
  for (const nodes of Object.values(stored)) {
    for (const node of nodes) node.enabled = true
  }
  return stored
}

function switchedOffRegions(): string[] {
  return Object.entries(LEGACY.profile.inputs.oddities)
    .filter(([, nodes]) => nodes.some((node) => node.enabled === false))
    .map(([region]) => region)
}

describe("profile-v27 fixture", () => {
  it("is v27 and still stores oddities as per-region node objects", () => {
    expect(LEGACY.v).toBe(V28__oddityBoardNodes.to - 1)
    expect(LEGACY.profile.inputs.oddities.Qinghe.length).toBeGreaterThan(0)
    expect(LEGACY.profile.inputs.oddities.Qinghe[0]).toHaveProperty("stat")
  })
})

describe("unclaimedOddityNodesFromLegacy", () => {
  it("claims the whole board when every stored node was enabled", () => {
    expect(unclaimedOddityNodesFromLegacy(allEnabled())).toEqual({})
  })

  it("releases only the regions the profile actually switched a melody off in", () => {
    const unclaimed = unclaimedOddityNodesFromLegacy(clone(LEGACY.profile.inputs.oddities))
    expect(Object.keys(unclaimed).sort()).toEqual(switchedOffRegions().sort())
  })

  it("releases a stored node that was switched off, and everything past it", () => {
    const stored = allEnabled()
    stored.Qinghe = stored.Qinghe.map((node) =>
      node.id === 102 ? { ...node, enabled: false } : node,
    )
    const unclaimed = unclaimedOddityNodesFromLegacy(stored)
    expect(unclaimed.Qinghe).toContain(102)
    expect(unclaimed.Qinghe).toContain(105)
  })

  it("maps a placeholder attack id onto that region's own attack melody", () => {
    const stored = allEnabled()
    const firstMaxPhys = stored.Qinghe.find((node) => node.stat === "maxPhys")!
    stored.Qinghe = stored.Qinghe.map((node) =>
      node === firstMaxPhys ? { ...node, enabled: false } : node,
    )
    const unclaimed = unclaimedOddityNodesFromLegacy(stored)
    const boardMaxPhys = oddityRegionNodes("Qinghe")
      .filter((node) => node.stat === "maxPhys")
      .map((node) => node.id)
    expect(boardMaxPhys).toContain(unclaimed.Qinghe[0])
  })

  it("ignores an id that names no melody and is not an attack placeholder", () => {
    expect(
      unclaimedOddityNodesFromLegacy({
        Qinghe: [{ id: 999999, stat: "maxHp", value: 1, enabled: false }],
      }),
    ).toEqual({})
  })

  it("passes through a value that is not an object", () => {
    expect(unclaimedOddityNodesFromLegacy("not-an-object")).toEqual({})
    expect(unclaimedOddityNodesFromLegacy(undefined)).toEqual({})
  })
})

describe("V28__oddityBoardNodes — called directly", () => {
  it("replaces the stored node lists with the ids the profile has not claimed", () => {
    const migrated = V28__oddityBoardNodes.migrate(blobOf(clone(LEGACY.profile)))
    expect(migrated.v).toBe(28)
    expect(inputsOf(migrated).oddities).toBeUndefined()
    expect(Object.keys(inputsOf(migrated).unclaimedOddityNodes as object).sort()).toEqual(
      switchedOffRegions().sort(),
    )
  })

  it("touches nothing else in the inputs", () => {
    const before = blobOf(clone(LEGACY.profile))
    const migrated = V28__oddityBoardNodes.migrate(clone(before))
    const expected: Record<string, unknown> = { ...clone(inputsOf(before)) }
    delete expected.oddities
    const actual: Record<string, unknown> = { ...clone(inputsOf(migrated)) }
    delete actual.unclaimedOddityNodes
    expect(actual).toEqual(expected)
  })

  it("does not mutate its input and is idempotent", () => {
    const input = blobOf(clone(LEGACY.profile))
    const snapshot = clone(input)
    const once = V28__oddityBoardNodes.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V28__oddityBoardNodes.migrate(clone(once))).toEqual(once)
  })
})

describe("V28__oddityBoardNodes — registered in the chain", () => {
  it("a v27 blob migrated to v28 passes through exactly this step", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 28 })!
    expect(result.applied).toEqual(["V28__oddityBoardNodes"])
    expect(result.blob.v).toBe(28)
  })

  it("leaves every region the profile never switched off fully claimed", () => {
    const result = runProfileMigrations(blobOf(clone(LEGACY.profile)), { toVersion: 28 })!
    const unclaimed = (inputsOf(result.blob) as { unclaimedOddityNodes: Record<string, number[]> })
      .unclaimedOddityNodes
    const touched = new Set(switchedOffRegions())
    for (const region of ODDITY_BOARD) {
      if (touched.has(region.key)) continue
      expect(unclaimed[region.key]).toBeUndefined()
    }
  })
})
