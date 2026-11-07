import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import {
  buildImportDiagnostics,
  parseDashboardGearPayload,
} from "../../src/ui/features/gear/import-gear-dialog/dashboardGearPayload"
import {
  equippedFromImported,
  resolveAgainstBuild,
  toGearPieces,
} from "../../src/ui/features/gear/import-gear-dialog/importedGearPieces"
import bookmarkletSource from "../../src/ui/features/gear/import-gear-dialog/gearImportBookmarklet.js?raw"
import fixture from "./fixtures/dashboardRoleInfoMartialArts.json"

type Capture = typeof fixture

const umbraInputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
const bamboocutInputs: Inputs = { ...defaultInputs, classId: "bamboocutDraught" }

function clone(): Capture {
  return JSON.parse(JSON.stringify(fixture)) as Capture
}

function withWeaponGameSlotsSwapped(): Capture {
  const swapped = clone()
  const detailed = swapped.wearEquipsDetailed as Record<string, unknown>
  const wearEquips = swapped.wearEquips as Record<string, number>
  ;[detailed["1"], detailed["2"]] = [detailed["2"], detailed["1"]]
  ;[wearEquips["1"], wearEquips["2"]] = [wearEquips["2"], wearEquips["1"]]
  return swapped
}

function resolve(capture: Capture, inputs: Inputs = umbraInputs) {
  return resolveAgainstBuild(parseDashboardGearPayload(JSON.stringify(capture)), inputs)
}

function slotOfGameSlot(result: ReturnType<typeof resolve>, gameSlotId: string) {
  const piece = result.pieces.find((candidate) => candidate.gameSlotId === gameSlotId)!
  return piece.slot.kind === "mapped" ? piece.slot.slot : null
}

describe("an import places each weapon on its martial art's slot", () => {
  it("puts the sword on the left weapon and the spear on the right", () => {
    const result = resolve(clone())
    expect(slotOfGameSlot(result, "1")).toBe("leftWeapon")
    expect(slotOfGameSlot(result, "2")).toBe("rightWeapon")
  })

  it("keeps sword-left and spear-right when the game listed them the other way round", () => {
    const result = resolve(withWeaponGameSlotsSwapped())
    expect(slotOfGameSlot(result, "1")).toBe("rightWeapon")
    expect(slotOfGameSlot(result, "2")).toBe("leftWeapon")

    const pieces = toGearPieces(result, {})
    const equipped = equippedFromImported(pieces)
    expect(equipped.leftWeapon).not.toBeNull()
    expect(equipped.rightWeapon).not.toBeNull()
    expect(pieces.find((piece) => piece.id === equipped.leftWeapon)!.slot).toBe("leftWeapon")
  })

  it("falls back to the equipped art of the game slot when the item id is unknown", () => {
    const capture = clone()
    ;(capture.wearEquips as Record<string, number>)["1"] = 1
    const detailed = capture.wearEquipsDetailed as Record<string, { no: string }>
    detailed["1"] = { ...detailed["1"], no: "1" }
    const result = resolve(capture)

    expect(result.pieces.find((piece) => piece.gameSlotId === "1")!.weaponType).toBeNull()
    expect(slotOfGameSlot(result, "1")).toBe("leftWeapon")
    expect(slotOfGameSlot(result, "2")).toBe("rightWeapon")
    expect(result.pieces.some((piece) => piece.weaponPlacedByGameSlot)).toBe(false)
  })

  it("keeps the game-slot mapping and flags both weapons for a class that uses neither", () => {
    const result = resolve(clone(), bamboocutInputs)
    expect(slotOfGameSlot(result, "1")).toBe("leftWeapon")
    expect(slotOfGameSlot(result, "2")).toBe("rightWeapon")
    for (const gameSlotId of ["1", "2"])
      expect(
        result.pieces.find((piece) => piece.gameSlotId === gameSlotId)!.weaponPlacedByGameSlot,
      ).toBe(true)
  })

  it("flags no weapon when both land on their art's slot", () => {
    const result = resolve(clone())
    expect(result.pieces.some((piece) => piece.weaponPlacedByGameSlot)).toBe(false)
  })
})

describe("the equipped martial arts", () => {
  it("are parsed from the capture", () => {
    const parsed = parseDashboardGearPayload(JSON.stringify(clone()))
    expect(parsed.equippedMartialArts?.main).toEqual({
      rawId: 10101,
      martialArtId: "strategicSword",
      foreignToClass: false,
    })
    expect(parsed.equippedMartialArts?.sub?.martialArtId).toBe("heavenquakerSpear")
  })

  it("are absent from a capture that carries neither", () => {
    const capture = clone() as Partial<Capture>
    delete capture.kongfuMain
    delete capture.kongfuSub
    expect(parseDashboardGearPayload(JSON.stringify(capture)).equippedMartialArts).toBeNull()
  })

  it("are flagged when they belong to another class", () => {
    const result = resolve(clone(), bamboocutInputs)
    expect(result.equippedMartialArts?.main?.foreignToClass).toBe(true)
    expect(result.equippedMartialArts?.sub?.foreignToClass).toBe(true)
    expect(resolve(clone()).equippedMartialArts?.main?.foreignToClass).toBe(false)
  })

  it("reach the diagnostics with each weapon's item id and type, and no role name", () => {
    const diagnostics = JSON.parse(buildImportDiagnostics(resolve(clone()))) as {
      equippedMartialArts: { main: { rawId: number } }
      pieces: { gameSlotId: string; itemId: number; weaponType: string | null }[]
    }
    expect(diagnostics.equippedMartialArts.main.rawId).toBe(10101)
    const sword = diagnostics.pieces.find((piece) => piece.gameSlotId === "1")!
    expect(sword.itemId).toBe(1101672)
    expect(sword.weaponType).toBe("Sword")
    expect(JSON.stringify(diagnostics)).not.toContain(String(fixture.roleName))
  })
})

describe("the bookmarklet", () => {
  it("carries kongfuMain and kongfuSub", () => {
    expect(bookmarkletSource).toContain('"kongfuMain"')
    expect(bookmarkletSource).toContain('"kongfuSub"')
  })
})
