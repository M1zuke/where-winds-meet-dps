import { describe, expect, it } from "vitest"
import { importProfile } from "../../src/storage"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V27__talentBoardNodes,
  talentNodesFromLegacyPoints,
} from "../../src/migrations/V27__talentBoardNodes"
import { TALENT_BOARD } from "../../src/data/baseStats"
import type { Inputs, StoredProfile } from "../../src/engine/types"
import legacyProfileFile from "./testProfiles/v26/bellstrikeUmbra.json"

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

function withLegacyPoints(points: Record<string, number[]>): StoredProfile {
  const profile = clone(LEGACY.profile)
  ;(profile.inputs as unknown as Record<string, unknown>).disabledTalentPoints = points
  return profile
}

describe("profile-v26 fixture", () => {
  it("is v26 and carries no talent selection, so the step has nothing to carry over", () => {
    expect(LEGACY.v).toBe(V27__talentBoardNodes.to - 1)
    expect(LEGACY.profile.inputs).not.toHaveProperty("disabledTalentPoints")
    expect(LEGACY.profile.inputs).not.toHaveProperty("disabledTalentNodes")
  })
})

describe("talentNodesFromLegacyPoints", () => {
  it("reads an empty selection as a board with every node taken", () => {
    expect(talentNodesFromLegacyPoints({})).toEqual([])
    expect(talentNodesFromLegacyPoints(undefined)).toEqual([])
  })

  it("turns a switched-off entry into the node that stood for it", () => {
    expect(talentNodesFromLegacyPoints({ "95.1": [1] })).toEqual([101071])
  })

  it("carries every rank of a stacked grid position", () => {
    expect(talentNodesFromLegacyPoints({ "95.1": [36] })).toEqual([101321, 101332, 101343, 101354])
  })

  it("drops everything behind an entry that sat on the spine", () => {
    const disabled = talentNodesFromLegacyPoints({ "95.1": [18] })
    expect(disabled).toContain(102501)
    expect(disabled).toContain(104221)
    expect(disabled.length).toBeGreaterThan(40)
  })

  it("names only nodes the board defines", () => {
    const ids = new Set(TALENT_BOARD.map((node) => node.id))
    for (const id of talentNodesFromLegacyPoints({ "95.1": [18], "100.2": [5] })) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it("ignores a tier or an index this build cannot place", () => {
    expect(talentNodesFromLegacyPoints({ "90.1": [1] })).toEqual([])
    expect(talentNodesFromLegacyPoints({ "95.1": [999] })).toEqual([])
    expect(talentNodesFromLegacyPoints({ "95.1": ["1"] as unknown as number[] })).toEqual([])
  })
})

describe("V27__talentBoardNodes", () => {
  it("replaces the tiered field with the board's node ids", () => {
    const migrated = V27__talentBoardNodes.migrate(blobOf(withLegacyPoints({ "95.2": [7] })))
    expect(migrated.v).toBe(27)
    expect(inputsOf(migrated)).not.toHaveProperty("disabledTalentPoints")
    expect(inputsOf(migrated).disabledTalentNodes).toEqual([103231, 103242])
  })

  it("runs twice the way it runs once", () => {
    const once = V27__talentBoardNodes.migrate(blobOf(withLegacyPoints({ "95.1": [1] })))
    expect(V27__talentBoardNodes.migrate(clone(once))).toEqual(once)
  })

  it("leaves a profile that never had the field alone", () => {
    const migrated = V27__talentBoardNodes.migrate(blobOf(clone(LEGACY.profile)))
    expect(inputsOf(migrated)).not.toHaveProperty("disabledTalentNodes")
  })

  it("reaches a profile walked through the whole chain", () => {
    const result = runProfileMigrations(blobOf(withLegacyPoints({ "100.1": [7] })))
    expect(inputsOf(result!.blob).disabledTalentNodes).toEqual([104101, 104111])
  })

  it("lands on an imported profile as a selection the engine can read", () => {
    const imported = importProfile(
      JSON.stringify({ v: LEGACY.v, profile: withLegacyPoints({ "95.1": [39] }) }),
    )
    expect(imported.inputs.disabledTalentNodes).toEqual([101281, 101292, 101303, 101314])
  })
})
