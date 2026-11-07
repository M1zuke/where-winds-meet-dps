import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { runEngine } from "../../src/engine/dps"
import { applySetBonuses } from "../../src/engine/setBonuses"
import { SET_ID } from "../../src/data/sets/ids"
import { withGearSet } from "../helpers/withGearSet"

const FABRICATE = { fabricatePieces: true }

describe("the test helper that equips a set", () => {
  const unset = withGearSet(defaultInputs, null, FABRICATE)

  it("refuses to invent pieces unless asked to", () => {
    expect(() => withGearSet(defaultInputs, SET_ID.jadeware)).toThrow()
  })

  it("refuses to invent pieces when inventory exists but nothing is equipped", () => {
    const stocked = { ...unset, equipped: defaultInputs.equipped }
    expect(() => withGearSet(stocked, SET_ID.jadeware)).toThrow()
  })

  it("equips the four set-bearing slots with pieces that store no stats of their own", () => {
    expect(unset.inventory.map((piece) => piece.slot).sort()).toEqual(
      ["disc", "leftWeapon", "pendant", "rightWeapon"].sort(),
    )
    for (const piece of unset.inventory) {
      expect([piece.minPhys, piece.maxPhys, piece.hp, piece.physDef]).toEqual([0, 0, 0, 0])
      expect(piece.words.every((entry) => entry.word === "")).toBe(true)
    }
  })

  it("is stat-neutral only before stats are derived", () => {
    const { inventory: _inventory, equipped: _equipped, ...unsetFields } = unset
    const { inventory: _bareInventory, equipped: _bareEquipped, ...bareFields } = defaultInputs
    void [_inventory, _equipped, _bareInventory, _bareEquipped]
    expect(unsetFields).toEqual(bareFields)
    expect(runEngine(unset).dps).toBe(runEngine(defaultInputs).dps)
    expect(withDerivedStats(unset).phys.max).not.toBe(withDerivedStats(defaultInputs).phys.max)
  })

  it("puts the set on the four set-bearing pieces only", () => {
    const equipped = withGearSet(defaultInputs, SET_ID.jadeware, FABRICATE)
    const withSet = equipped.inventory.filter((piece) => piece.set === SET_ID.jadeware)
    expect(withSet.map((piece) => piece.slot).sort()).toEqual(
      ["disc", "leftWeapon", "pendant", "rightWeapon"].sort(),
    )
    expect(applySetBonuses(equipped).phys.max).toBeGreaterThan(defaultInputs.phys.max)
  })
})
