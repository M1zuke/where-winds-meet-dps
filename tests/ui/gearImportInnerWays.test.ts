import { describe, expect, it } from "vitest"
import {
  PASSIVE_ID_TO_INNER_WAY,
  PASSIVE_INNER_WAY_NAMES,
} from "../../src/data/innerWays/passiveIds"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { INNER_WAYS, innerWayDefinition } from "../../src/definitions/innerWays/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { allowedInnerWaysForClass, getSchool } from "../../src/engine/panel"
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
  unsupportedInnerWayNames,
  type PassiveInnerWayMapping,
  type PassiveInnerWayNames,
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

function resolvedFor(
  text: string,
  withMapping: PassiveInnerWayMapping = mapping,
  withNames: PassiveInnerWayNames = {},
) {
  return resolveInnerWays(parseDashboardGearPayload(text), inputs, withMapping, withNames)
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

  it("carries a passive id for every inner way the engine models", () => {
    const mapped = new Set(Object.values(PASSIVE_ID_TO_INNER_WAY))
    for (const def of INNER_WAYS) expect(mapped, def.id).toContain(def.id)
  })

  it("maps each passive id to at most one inner way", () => {
    const mapped = Object.values(PASSIVE_ID_TO_INNER_WAY)
    expect(new Set(mapped).size).toBe(mapped.length)
  })

  it("has a catalog name for every id it models", () => {
    for (const passiveId of Object.keys(PASSIVE_ID_TO_INNER_WAY)) {
      expect(PASSIVE_INNER_WAY_NAMES[passiveId], passiveId).toBeDefined()
    }
  })

  it("leaves an id in neither table unmapped", () => {
    const innerWays = resolveInnerWays(parseDashboardGearPayload(fixtureText), inputs)
    expect(innerWays.map((innerWay) => innerWay.resolution.kind)).toEqual(
      Array(innerWays.length).fill("unmapped"),
    )
  })
})

describe("an inner way the engine has no module for", () => {
  const catalog = {
    "3011001": "Sandswirl Tail",
    "3011002": "Vital Leech",
    "3019999": "Sandswirl Tail",
  }

  it("keeps the game's name so the user can see what is missing", () => {
    expect(resolvedFor(fixtureText, {}, catalog)[0]!.resolution).toEqual({
      kind: "unsupported",
      name: "Sandswirl Tail",
    })
  })

  it("names each one once, in capture order", () => {
    const resolved = resolvedFor(fixtureText, {}, catalog)
    expect(unsupportedInnerWayNames(resolved)).toEqual(["Sandswirl Tail", "Vital Leech"])
  })

  it("names none when every entry resolved", () => {
    expect(unsupportedInnerWayNames(resolvedFor(fixtureText))).toEqual([])
  })

  it("is left out of the slots", () => {
    expect(toMindMethods(resolvedFor(fixtureText, {}, catalog))).toBeNull()
  })

  it("yields to the engine's own name once a module is mapped", () => {
    expect(resolvedFor(fixtureText, mapping, catalog)[0]!.resolution).toMatchObject({
      kind: "resolved",
      name: "Sword Horizon",
    })
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

  it("resolves Breaking Point's passive id", () => {
    const captured = captureWith([[453, 6]])
    const resolved = resolveInnerWays(
      parseDashboardGearPayload(captured),
      inputs,
      PASSIVE_ID_TO_INNER_WAY,
      PASSIVE_INNER_WAY_NAMES,
    )
    expect(resolved[0]!.resolution).toEqual({
      kind: "resolved",
      innerWayId: INNER_WAY_ID.breakingPoint,
      name: "Breaking Point",
      tier: 6,
      tierAssumed: false,
    })
  })
})

describe("toMindMethods", () => {
  it("leaves the slots alone when nothing resolved", () => {
    expect(toMindMethods(resolvedFor(fixtureText, {}))).toBeNull()
  })

  it("fills the slots in capture order, whichever the class signature is", () => {
    const slots = toMindMethods(resolvedFor(fixtureText))!
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

  it("gives the first slot away to a non-signature inner way", () => {
    const signature = getSchool(inputs.classId).classMindGroup
    expect(signature).toBe(INNER_WAY_ID.swordHorizon)
    const withoutSignature: PassiveInnerWayMapping = { "3011002": INNER_WAY_ID.wolfchasersArt }
    const slots = toMindMethods(resolvedFor(fixtureText, withoutSignature))!
    expect(slots[0]!.id).toBe(INNER_WAY_ID.wolfchasersArt)
  })

  it("replaces a held slot the capture does not carry rather than keeping it", () => {
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
    )!
    expect(slots[0]!.id).toBe(INNER_WAY_ID.wolfchasersArt)
    expect(slots.map((slot) => slot.id)).not.toContain(INNER_WAY_ID.swordHorizon)
  })

  it("always writes four slots and empties the ones the capture has nothing for", () => {
    const slots = toMindMethods(resolvedFor(fixtureText))!
    expect(slots).toHaveLength(MIND_METHOD_SLOT_COUNT)
    expect(slots.slice(2)).toEqual([
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ])
  })

  it("keeps only the first four when the capture carries more", () => {
    const five = captureWith([151, 153, 154, 81, 42].map((id) => ({ id, level: 6 })))
    const slots = toMindMethods(
      resolveInnerWays(parseDashboardGearPayload(five), inputs, PASSIVE_ID_TO_INNER_WAY),
    )!
    expect(slots.map((slot) => slot.id)).toEqual([
      INNER_WAY_ID.wolfchasersArt,
      INNER_WAY_ID.insightfulStrike,
      INNER_WAY_ID.swordHorizon,
      INNER_WAY_ID.moraleChant,
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
