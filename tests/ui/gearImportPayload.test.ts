import { describe, expect, it } from "vitest"
import {
  GearImportError,
  buildImportDiagnostics,
  parseDashboardGearPayload,
  previewablePieces,
} from "../../src/ui/features/gear/import-gear-dialog/dashboardGearPayload"
import fixture from "./fixtures/dashboardRoleInfo.json"

const fixtureText = JSON.stringify(fixture)

function pieceFor(text: string, gameSlotId: string) {
  const found = parseDashboardGearPayload(text).pieces.find(
    (piece) => piece.gameSlotId === gameSlotId,
  )
  if (!found) throw new Error(`no piece for slot ${gameSlotId}`)
  return found
}

describe("parseDashboardGearPayload rejections", () => {
  it("rejects an empty paste", () => {
    expect(() => parseDashboardGearPayload("   ")).toThrow(/Paste the JSON/)
  })

  it("rejects non-JSON", () => {
    expect(() => parseDashboardGearPayload("not json at all")).toThrow(/not valid JSON/)
  })

  it("rejects a non-object", () => {
    expect(() => parseDashboardGearPayload("[1,2,3]")).toThrow(/not an object/)
  })

  it("rejects another tool's envelope", () => {
    expect(() =>
      parseDashboardGearPayload(JSON.stringify({ source: "some-other-tool", v: 1 })),
    ).toThrow(/not the WWM dashboard bookmarklet/)
  })

  it("rejects a newer envelope version", () => {
    expect(() =>
      parseDashboardGearPayload(
        JSON.stringify({ source: "wwm-dashboard", v: 2, wearEquipsDetailed: {} }),
      ),
    ).toThrow(/newer bookmarklet \(v2\)/)
  })

  it("rejects a payload with no gear map", () => {
    expect(() => parseDashboardGearPayload(JSON.stringify({ roleName: "x" }))).toThrow(
      /no wearEquipsDetailed/,
    )
  })

  it("throws GearImportError, not a bare Error", () => {
    expect(() => parseDashboardGearPayload("{}")).toThrow(GearImportError)
  })
})

describe("parseDashboardGearPayload acceptance", () => {
  it("accepts an empty gear map as zero pieces", () => {
    expect(parseDashboardGearPayload(JSON.stringify({ wearEquipsDetailed: {} })).pieces).toEqual([])
  })

  it("accepts a raw dashboard capture nested under data", () => {
    const raw = JSON.stringify({ data: { roleName: "Raw", wearEquipsDetailed: { "1": {} } } })
    const result = parseDashboardGearPayload(raw)
    expect(result.roleName).toBe("Raw")
    expect(result.pieces).toHaveLength(1)
  })

  it("reads the role name, character level and declared extra keys", () => {
    const result = parseDashboardGearPayload(fixtureText)
    expect(result.roleName).toBe("Testwanderer")
    expect(result.characterLevel).toBe(100)
    expect(result.unrecognizedPayloadKeys).toContain("roleId")
  })

  it("reads the item id from wearEquips", () => {
    expect(pieceFor(fixtureText, "1").itemId).toBe(1101672)
  })

  it("falls back to the detail entry's own item number", () => {
    const text = JSON.stringify({
      wearEquipsDetailed: { "1": { no: "1101672", exVo: { baseAffixes: [] } } },
    })
    expect(pieceFor(text, "1").itemId).toBe(1101672)
  })
})

describe("slot resolution", () => {
  it("maps slot 3 to the helm", () => {
    expect(pieceFor(fixtureText, "3").slot).toEqual({ kind: "mapped", slot: "helm" })
  })

  it("marks the bow as having no app equivalent", () => {
    expect(pieceFor(fixtureText, "9").slot).toEqual({ kind: "noAppEquivalent" })
  })

  it("marks a slot id absent from the table", () => {
    expect(pieceFor(fixtureText, "33").slot).toEqual({ kind: "unknownSlotId" })
  })

  it("hides bow and ring from the preview but keeps unknown slots visible", () => {
    const shown = previewablePieces(parseDashboardGearPayload(fixtureText))
    expect(shown.map((piece) => piece.gameSlotId)).toEqual(["1", "2", "3", "33"])
  })

  it("orders the preview like the Equipped card, not like the payload keys", () => {
    const detailed: Record<string, unknown> = {}
    // Payload order deliberately scrambled relative to GEAR_SLOTS.
    for (const gameSlotId of ["8", "3", "11", "1", "5", "10", "4", "2"]) {
      detailed[gameSlotId] = { exVo: { baseAffixes: [] } }
    }
    const shown = previewablePieces(
      parseDashboardGearPayload(JSON.stringify({ wearEquipsDetailed: detailed })),
    )
    expect(
      shown.map((piece) => (piece.slot.kind === "mapped" ? piece.slot.slot : piece.slot.kind)),
    ).toEqual([
      "leftWeapon",
      "rightWeapon",
      "disc",
      "pendant",
      "helm",
      "armor",
      "greaves",
      "bracer",
    ])
  })
})

describe("affix extraction from the equipmentDetails tuple", () => {
  it("reads id, value and rolled ratio, and derives the max roll", () => {
    const affix = pieceFor(fixtureText, "1").affixes[0]!
    expect(affix.affixId).toBe("9793015")
    expect(affix.rawValue).toBe(0.05828)
    expect(affix.rolledRatio).toBe(0.94)
    expect(affix.derivedMax).toBeCloseTo(0.062, 10)
  })

  it("separates the six-digit attunement affix from the tunements", () => {
    const piece = pieceFor(fixtureText, "1")
    expect(piece.affixes.map((affix) => affix.affixId)).toEqual([
      "9793015",
      "9793119",
      "9793120",
      "9793005",
      "9793008",
    ])
    expect(piece.attunement?.affixId).toBe("280701")
    expect(piece.attunement?.isAttunementAffix).toBe(true)
  })

  it("keeps the first five tunements and overflows the rest", () => {
    const piece = pieceFor(fixtureText, "2")
    expect(piece.affixes).toHaveLength(5)
    expect(piece.overflowAffixes.map((affix) => affix.affixId)).toEqual(["9999999"])
    expect(piece.attunement?.affixId).toBe("280701")
  })

  it("reports no attunement when the piece has none", () => {
    const text = JSON.stringify({
      wearEquipsDetailed: {
        "1": { exVo: { baseAffixes: [{ equipmentDetails: [9793015, 0.05, 1, 3, true] }] } },
      },
    })
    expect(pieceFor(text, "1").attunement).toBeNull()
  })

  it("keeps the raw entry so diagnostics survive a shape change", () => {
    expect(pieceFor(fixtureText, "1").affixes[0]!.raw).toEqual({
      equipmentDetails: [9793015, 0.05828, 0.94, 3, true],
    })
  })

  it("does not drop a sibling when one entry is unreadable", () => {
    const text = JSON.stringify({
      wearEquipsDetailed: {
        "1": { exVo: { baseAffixes: [null, { equipmentDetails: [9793119, 0.09, 1, 3, true] }] } },
      },
    })
    const affixes = pieceFor(text, "1").affixes
    expect(affixes).toHaveLength(2)
    expect(affixes[0]!.affixId).toBe("?")
    expect(affixes[1]!.affixId).toBe("9793119")
  })
})

describe("observed base stats", () => {
  it("reads weapon attack from exVo.baseAttrs", () => {
    expect(pieceFor(fixtureText, "1").observedBaseStats).toEqual({ minPhys: 65, maxPhys: 151 })
  })

  it("reads armor hp and defense from exVo.baseAttrs", () => {
    expect(pieceFor(fixtureText, "3").observedBaseStats).toEqual({ hp: 5774, physDef: 22 })
  })

  it("reports null when baseAttrs carries nothing we model", () => {
    expect(pieceFor(fixtureText, "9").observedBaseStats).toBeNull()
  })
})

describe("buildImportDiagnostics", () => {
  it("carries affix ids and derived max rolls", () => {
    const diagnostics = JSON.parse(buildImportDiagnostics(parseDashboardGearPayload(fixtureText)))
    const weapon = diagnostics.pieces.find(
      (piece: { gameSlotId: string }) => piece.gameSlotId === "1",
    )
    expect(weapon.baseAffixes).toHaveLength(5)
    expect(weapon.baseAffixes[0].affixId).toBe("9793015")
    expect(weapon.attunement.affixId).toBe("280701")
  })

  it("leaks no role identity", () => {
    const diagnostics = buildImportDiagnostics(parseDashboardGearPayload(fixtureText))
    expect(diagnostics).not.toMatch(/Testwanderer|roleName/)
  })
})
