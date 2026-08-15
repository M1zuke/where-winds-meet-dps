import { describe, expect, it } from "vitest"
import { WEAPON_NAMES } from "../../src/engine/types"
import { CLASS_DEFS, classDefinition, martialArtsOf } from "../../src/definitions/classes/registry"
import { MARTIAL_ARTS, martialArtDefinition } from "../../src/definitions/martialArts/registry"

describe("MARTIAL_ARTS", () => {
  it("every registered class's weapons entry resolves to a martial art", () => {
    for (const classDef of CLASS_DEFS()) {
      for (const id of classDef.weapons) {
        expect(martialArtDefinition(id), `${classDef.id}/${id}`).toBeTruthy()
      }
    }
  })

  it("every martial art's weaponType is a member of WEAPON_NAMES", () => {
    for (const martialArt of MARTIAL_ARTS) {
      expect((WEAPON_NAMES as readonly string[]).includes(martialArt.weaponType)).toBe(true)
    }
  })

  it("ids are unique", () => {
    const ids = MARTIAL_ARTS.map((martialArt) => martialArt.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("returns undefined rather than throwing for an unknown id", () => {
    expect(martialArtDefinition("notAMartialArt")).toBeUndefined()
  })

  it("each class's composed martialArts is in the same order as its weapons", () => {
    for (const classDef of CLASS_DEFS()) {
      const composed = classDefinition(classDef.id)!.martialArts
      expect(composed.map((martialArt) => martialArt.id)).toEqual(classDef.weapons)
    }
  })

  it("drops a martial-art id no definition answers to", () => {
    const [first] = MARTIAL_ARTS
    const withDanglingWeapon = {
      weapons: [first!.id, "notAMartialArt"],
    } as unknown as Parameters<typeof martialArtsOf>[0]
    expect(martialArtsOf(withDanglingWeapon)).toEqual([first])
  })
})
