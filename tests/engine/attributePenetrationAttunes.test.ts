import { describe, expect, it } from "vitest"
import { computeGearContribution } from "../../src/engine/gearStats"
import { defaultInputs } from "../../src/engine/defaults"
import { attunementsFor } from "../../src/engine/attunements"
import type { GearLevel, GearPiece } from "../../src/engine/types"

function weaponAt(level: GearLevel, attunement: string, attunementValue: number): GearPiece {
  return {
    id: "attribute-pen-weapon",
    slot: "leftWeapon",
    level,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: [
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
      { word: "", value: 0, retuned: false },
    ],
    attunement,
    attunementValue,
  }
}

describe("the level-86 attribute penetration attunements", () => {
  it.each([
    ["bellstrikePen", "bellstrike.penetration"],
    ["stonesplitPen", "stonesplit.penetration"],
    ["silkbindPen", "silkbind.penetration"],
    ["bamboocutPen", "bamboocut.penetration"],
  ])("%s raises its own attribute's penetration", (attunement, path) => {
    const contribution = computeGearContribution(weaponAt(86, attunement, 0.09), defaultInputs)
    expect(contribution).toContainEqual({ path, amount: 0.09 })
  })

  it("is offered on a weapon at level 86 and not at level 91", () => {
    const idsAt = (level: GearLevel) =>
      attunementsFor("leftWeapon", defaultInputs.classId, level).map((option) => option.id)
    expect(idsAt(86)).toContain("bellstrikePen")
    expect(idsAt(91)).not.toContain("bellstrikePen")
  })

  it("contributes nothing on a level-91 piece", () => {
    const contribution = computeGearContribution(weaponAt(91, "bellstrikePen", 0.09), defaultInputs)
    expect(contribution.some((entry) => entry.path === "bellstrike.penetration")).toBe(false)
  })
})
