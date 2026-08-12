import { describe, expect, it } from "vitest"
import { PASSIVE_ID_TO_INNER_WAY } from "../../src/data/innerWays/passiveIds"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { innerWayDefinition } from "../../src/definitions/innerWays/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { allowedInnerWaysForClass } from "../../src/engine/panel"
import type { Inputs } from "../../src/engine/types"
import {
  buildImportDiagnostics,
  innerWaysAbsentFromCapture,
  parseDashboardGearPayload,
  summarizeImport,
} from "../../src/ui/features/gear/import-gear-dialog/dashboardGearPayload"
import { resolveAgainstBuild } from "../../src/ui/features/gear/import-gear-dialog/importedGearPieces"
import {
  MIND_METHOD_SLOT_COUNT,
  importableInnerWays,
  resolveInnerWays,
  toMindMethods,
  type PassiveInnerWayMapping,
} from "../../src/ui/features/gear/import-gear-dialog/importedInnerWays"
import fixture from "./fixtures/dashboardRoleInfo.json"

const fixtureText = JSON.stringify(fixture)
const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

// Mirrors the ids in the fixture; the shipped table only carries what is confirmed.
const mapping: PassiveInnerWayMapping = {
  "3011001": INNER_WAY_ID.swordHorizon,
  "3011002": INNER_WAY_ID.wolfchasersArt,
}

function captureWith(passiveSlots: unknown): string {
  return JSON.stringify({ wearEquipsDetailed: {}, passiveSlots })
}

function resolvedFor(text: string, withMapping: PassiveInnerWayMapping = mapping) {
  return resolveInnerWays(parseDashboardGearPayload(text), inputs, withMapping)
}

describe("reading passiveSlots", () => {
  it("reads the passive id and its tier from a record entry", () => {
    const innerWays = parseDashboardGearPayload(fixtureText).innerWays
    expect(innerWays[0]).toMatchObject({ passiveId: "3011001", reportedTier: 6 })
    expect(innerWays[1]).toMatchObject({ passiveId: "3011002", reportedTier: 5 })
  })

  it("drops an empty slot", () => {
    expect(
      parseDashboardGearPayload(fixtureText).innerWays.map((innerWay) => innerWay.passiveId),
    ).toEqual(["3011001", "3011002", "3019999"])
  })

  it("reads a bare id with no tier", () => {
    expect(parseDashboardGearPayload(captureWith([3011001])).innerWays[0]).toMatchObject({
      passiveId: "3011001",
      reportedTier: null,
    })
  })

  it("reads an id and tier tuple", () => {
    expect(parseDashboardGearPayload(captureWith([[3011001, 5]])).innerWays[0]).toMatchObject({
      passiveId: "3011001",
      reportedTier: 5,
    })
  })

  it("reads a record of slots as well as an array", () => {
    const byIndex = captureWith({ "1": { passiveId: 3011001, tier: 6 } })
    expect(parseDashboardGearPayload(byIndex).innerWays).toHaveLength(1)
  })

  it("keeps an unreadable entry so it shows up as unmapped", () => {
    const innerWays = parseDashboardGearPayload(captureWith([{ what: 1 }])).innerWays
    expect(innerWays[0]).toMatchObject({ passiveId: "?", reportedTier: null })
  })

  it("reports none when the payload has no passiveSlots at all", () => {
    expect(parseDashboardGearPayload(JSON.stringify({ wearEquipsDetailed: {} })).innerWays).toEqual(
      [],
    )
  })

  it("keeps the raw entry so diagnostics survive a shape change", () => {
    expect(parseDashboardGearPayload(fixtureText).innerWays[0]!.raw).toEqual({
      id: 3011001,
      level: 6,
    })
  })

  it("spots a capture made by a bookmarklet too old to carry them", () => {
    const stale = JSON.stringify({
      wearEquipsDetailed: {},
      unrecognizedPayloadKeys: ["passiveSlots"],
    })
    expect(innerWaysAbsentFromCapture(parseDashboardGearPayload(stale))).toBe(true)
    expect(innerWaysAbsentFromCapture(parseDashboardGearPayload(fixtureText))).toBe(false)
  })
})

describe("the shipped passive table is the authority", () => {
  it("names only inner ways that exist", () => {
    for (const innerWayId of Object.values(PASSIVE_ID_TO_INNER_WAY)) {
      expect(innerWayDefinition(innerWayId), innerWayId).toBeDefined()
    }
  })

  it("leaves an id it does not carry unmapped", () => {
    const innerWays = resolveInnerWays(parseDashboardGearPayload(fixtureText), inputs)
    expect(innerWays.map((innerWay) => innerWay.resolution.kind)).toEqual(
      Array(innerWays.length).fill("unmapped"),
    )
  })
})

describe("resolving against the build", () => {
  it("resolves a mapped id to its inner way and keeps the reported tier", () => {
    expect(resolvedFor(fixtureText)[0]!.resolution).toEqual({
      kind: "resolved",
      innerWayId: INNER_WAY_ID.swordHorizon,
      name: "Sword Horizon",
      tier: 6,
      tierAssumed: false,
    })
  })

  it("refuses an inner way this class cannot slot", () => {
    const foreign: PassiveInnerWayMapping = { "3011001": INNER_WAY_ID.frostCladNight }
    expect(allowedInnerWaysForClass(inputs.classId)).not.toContain(INNER_WAY_ID.frostCladNight)
    expect(resolvedFor(fixtureText, foreign)[0]!.resolution).toMatchObject({
      kind: "notForThisClass",
      innerWayId: INNER_WAY_ID.frostCladNight,
    })
  })

  it("assumes the top tier when the payload reports none", () => {
    expect(resolvedFor(captureWith([3011001]))[0]!.resolution).toMatchObject({
      tier: 6,
      tierAssumed: true,
    })
  })

  it("narrows a tier the app does not model down, never up", () => {
    const tiers = innerWayDefinition(INNER_WAY_ID.swordHorizon)!.selectableTiers
    expect(tiers).not.toContain(3)
    expect(resolvedFor(captureWith([[3011001, 3]]))[0]!.resolution).toMatchObject({
      tier: Math.min(...tiers),
      tierAssumed: true,
    })
  })

  it("keeps a tier the ladder models", () => {
    expect(resolvedFor(captureWith([[3011002, 5]]))[0]!.resolution).toMatchObject({
      tier: 5,
      tierAssumed: false,
    })
  })
})

describe("toMindMethods", () => {
  it("leaves the slots alone when nothing resolved", () => {
    expect(toMindMethods(resolvedFor(fixtureText, {}), inputs)).toBeNull()
  })

  it("writes the class inner way into the locked first slot", () => {
    const slots = toMindMethods(resolvedFor(fixtureText), inputs)!
    expect(slots[0]).toEqual({
      id: INNER_WAY_ID.swordHorizon,
      name: "Sword Horizon",
      stacks: "tier 6",
    })
    expect(slots[1]).toEqual({
      id: INNER_WAY_ID.wolfchasersArt,
      name: "Wolfchaser's Art",
      stacks: "tier 5",
    })
  })

  it("keeps the locked slot when the capture has no class inner way for it", () => {
    const held: Inputs = {
      ...inputs,
      mindMethods: [
        { id: INNER_WAY_ID.swordHorizon, name: "Sword Horizon", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const slots = toMindMethods(
      resolveInnerWays(parseDashboardGearPayload(fixtureText), held, {
        "3011002": INNER_WAY_ID.wolfchasersArt,
      }),
      held,
    )!
    expect(slots[0]).toEqual(held.mindMethods[0])
    expect(slots[1]!.id).toBe(INNER_WAY_ID.wolfchasersArt)
  })

  it("always writes four slots and empties the ones the capture has nothing for", () => {
    const slots = toMindMethods(resolvedFor(fixtureText), inputs)!
    expect(slots).toHaveLength(MIND_METHOD_SLOT_COUNT)
    expect(slots.slice(2)).toEqual([
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ])
  })

  it("slots the same inner way only once", () => {
    const doubled = captureWith([
      { id: 3011002, level: 6 },
      { id: 3011003, level: 5 },
    ])
    const twice: PassiveInnerWayMapping = {
      "3011002": INNER_WAY_ID.wolfchasersArt,
      "3011003": INNER_WAY_ID.wolfchasersArt,
    }
    expect(importableInnerWays(resolvedFor(doubled, twice))).toEqual([
      { innerWayId: INNER_WAY_ID.wolfchasersArt, tier: 6 },
    ])
  })
})

describe("summary and diagnostics", () => {
  it("counts the inner ways and how many resolved", () => {
    const summary = summarizeImport(parseDashboardGearPayload(fixtureText))
    expect(summary).toMatchObject({ innerWayCount: 3, resolvedInnerWayCount: 0 })
  })

  it("resolves the inner ways alongside the gear", () => {
    const result = resolveAgainstBuild(parseDashboardGearPayload(fixtureText), inputs)
    expect(result.innerWays.map((innerWay) => innerWay.passiveId)).toEqual([
      "3011001",
      "3011002",
      "3019999",
    ])
  })

  it("carries the passive ids and their raw entries", () => {
    const diagnostics = JSON.parse(buildImportDiagnostics(parseDashboardGearPayload(fixtureText)))
    expect(diagnostics.passiveSlots[0]).toEqual({
      passiveId: "3011001",
      reportedTier: 6,
      resolved: null,
      raw: { id: 3011001, level: 6 },
    })
  })
})
