import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { heirloomMatch, heirloomSwapFor, isHeirloom } from "../../src/engine/heirloom"
import { newCustomGraduationBuildId } from "../../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import type { GearPiece, GearSlot, GearWordId } from "../../src/engine/types"
import { GEAR_SLOTS } from "../../src/engine/types"

const CLASS_ID = "bamboocutDraught"

function shippedWeapon(slot: GearSlot): GearPiece {
  return classDefinition(CLASS_ID)!.graduationBuilds[0].gear.find((piece) => piece.slot === slot)!
}

function pieceWith(slot: GearSlot, words: readonly string[]): GearPiece {
  return {
    ...shippedWeapon(slot),
    id: "test-piece",
    words: words.map((word) => ({ word, value: 1, retuned: false })) as GearPiece["words"],
  }
}

function wordsOf(piece: GearPiece): string[] {
  return piece.words.map((entry) => entry.word)
}

describe("heirloom on a weapon in its martial art's slot", () => {
  it("counts a weapon carrying the build's words in the slot of its art", () => {
    const left = shippedWeapon("leftWeapon")
    expect(isHeirloom(pieceWith("leftWeapon", wordsOf(left)), { classId: CLASS_ID })).toBe(true)
    const right = shippedWeapon("rightWeapon")
    expect(isHeirloom(pieceWith("rightWeapon", wordsOf(right)), { classId: CLASS_ID })).toBe(true)
  })

  it("does not count a weapon whose words belong to the other art's slot", () => {
    const rightWords = wordsOf(shippedWeapon("rightWeapon"))
    expect(
      heirloomMatch(pieceWith("leftWeapon", rightWords), { classId: CLASS_ID }).builds,
    ).toEqual([])
  })
})

describe("a heirloom swap suggestion", () => {
  function customWithForeignBoostOnRight(): CustomGraduationBuild {
    const now = new Date().toISOString()
    const shipped = classDefinition(CLASS_ID)!.graduationBuilds[0]
    return {
      id: newCustomGraduationBuildId(),
      name: "Mine",
      classId: CLASS_ID,
      slots: GEAR_SLOTS.map((slot) => {
        const piece = shipped.gear.find((gear) => gear.slot === slot)!
        const words = wordsOf(piece).map((word) =>
          slot === "rightWeapon" && word === "dualKnivesBoost" ? "gauntletsBoost" : word,
        )
        return {
          slot,
          words: words as unknown as CustomGraduationBuild["slots"][number]["words"],
          attunement: piece.attunement,
        }
      }),
      set: shipped.set,
      bowSet: shipped.bowSet,
      arsenal: shipped.arsenal,
      rotationId: shipped.rotationId,
      createdAt: now,
      updatedAt: now,
    }
  }

  it("never names another weapon type's boost", () => {
    const rightWords = wordsOf(shippedWeapon("rightWeapon")).map((word) =>
      word === "dualKnivesBoost" ? "crit" : word,
    )
    const swap = heirloomSwapFor(pieceWith("rightWeapon", rightWords), {
      classId: CLASS_ID,
      customGraduationBuild: customWithForeignBoostOnRight(),
    })
    expect(swap?.word).not.toBe("gauntletsBoost" satisfies GearWordId)
  })

  it("still names its own art's boost", () => {
    const rightWords = wordsOf(shippedWeapon("rightWeapon")).map((word) =>
      word === "dualKnivesBoost" ? "crit" : word,
    )
    const swap = heirloomSwapFor(pieceWith("rightWeapon", rightWords), { classId: CLASS_ID })
    expect(swap?.word).toBe("dualKnivesBoost")
  })
})
