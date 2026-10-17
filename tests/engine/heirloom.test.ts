import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { GEAR_WORD_IDS } from "../../src/data/stats/statLines"
import { heirloomMatch, heirloomSwapFor, isHeirloom } from "../../src/engine/heirloom"
import { newCustomGraduationBuildId } from "../../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import type { GearPiece, GearWordId } from "../../src/engine/types"
import { GEAR_SLOTS } from "../../src/engine/types"

const MULTI_BUILD_CLASS = "bellstrikeUmbra"
const SINGLE_BUILD_CLASS = "stonesplitStrength"

function helmOf(classId: string): GearPiece {
  return classDefinition(classId)!.graduationBuilds[0].gear.find((piece) => piece.slot === "helm")!
}

function wordsOf(piece: GearPiece): GearWordId[] {
  return piece.words.map((word) => word.word).filter((word): word is GearWordId => word !== "")
}

function wordsOutside(taken: readonly string[], count: number): GearWordId[] {
  return GEAR_WORD_IDS.filter((word) => !taken.includes(word)).slice(0, count)
}

function pieceFrom(
  target: GearPiece,
  words: readonly string[],
  patch: Partial<GearPiece> = {},
): GearPiece {
  return {
    ...target,
    id: "test-piece",
    words: words.map((word) => ({ word: word as GearWordId, value: 1 })) as GearPiece["words"],
    ...patch,
  }
}

describe("heirloom — the same stat lines as a graduation build's piece", () => {
  const target = helmOf(MULTI_BUILD_CLASS)
  const perfect = wordsOf(target)

  it("counts a piece carrying the build's five lines, whatever the rolls are", () => {
    expect(isHeirloom(pieceFrom(target, perfect), { classId: MULTI_BUILD_CLASS })).toBe(true)
  })

  it("ignores the order the lines sit in", () => {
    expect(
      isHeirloom(pieceFrom(target, [...perfect].reverse()), { classId: MULTI_BUILD_CLASS }),
    ).toBe(true)
  })

  it("counts a relayed piece too — the rolls play no part", () => {
    expect(
      isHeirloom(pieceFrom(target, perfect, { relayed: true }), { classId: MULTI_BUILD_CLASS }),
    ).toBe(true)
  })

  it("names every build the piece is perfect for", () => {
    const match = heirloomMatch(pieceFrom(target, perfect), { classId: MULTI_BUILD_CLASS })
    const perfectFor = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds.filter((build) => {
      const helm = build.gear.find((piece) => piece.slot === target.slot)!
      return wordsOf(helm).sort().join() === [...perfect].sort().join()
    })
    expect(match.builds.map((build) => build.id)).toEqual(perfectFor.map((build) => build.id))
  })

  it("does not count a piece in another slot", () => {
    expect(
      isHeirloom(pieceFrom(target, perfect, { slot: "greaves" }), { classId: MULTI_BUILD_CLASS }),
    ).toBe(false)
  })

  it("does not count a piece that is two lines off", () => {
    const [firstForeign, secondForeign] = wordsOutside(perfect, 2)
    const twoOff = [...perfect]
    twoOff[1] = firstForeign
    twoOff[2] = secondForeign
    expect(isHeirloom(pieceFrom(target, twoOff), { classId: MULTI_BUILD_CLASS })).toBe(false)
  })
})

describe("heirloom — the build the profile follows", () => {
  const builds = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds
  const target = helmOf(MULTI_BUILD_CLASS)
  const perfect = wordsOf(target)

  it("follows the match when the profile follows the build the piece is perfect for", () => {
    const match = heirloomMatch(pieceFrom(target, perfect), {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: builds[0].id,
    })
    expect(match.followed).toBe(true)
  })

  it("keeps the match but not the follow while the profile follows another build", () => {
    const sameHelm = (build: (typeof builds)[number]) =>
      [...wordsOf(build.gear.find((piece) => piece.slot === "helm")!)].sort().join() ===
      [...perfect].sort().join()
    const other = builds.find((build) => !sameHelm(build))!
    const match = heirloomMatch(pieceFrom(target, perfect), {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: other.id,
    })
    expect(match.builds.map((build) => build.id)).toEqual(
      builds.filter(sameHelm).map((build) => build.id),
    )
    expect(match.followed).toBe(false)
  })

  it("follows the sole build of a single-build class without being told which", () => {
    const sole = helmOf(SINGLE_BUILD_CLASS)
    const match = heirloomMatch(pieceFrom(sole, wordsOf(sole)), {
      classId: SINGLE_BUILD_CLASS,
      graduationBuildId: null,
    })
    expect(match.followed).toBe(true)
  })
})

describe("heirloom — a build the user authored", () => {
  const target = helmOf(MULTI_BUILD_CLASS)
  const shipped = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds
  const everyShippedHelmWord = shipped.flatMap((build) =>
    wordsOf(build.gear.find((piece) => piece.slot === "helm")!),
  )
  const ownWords = wordsOutside(everyShippedHelmWord, 5)
  const custom: CustomGraduationBuild = {
    id: newCustomGraduationBuildId(),
    name: "Mine",
    classId: MULTI_BUILD_CLASS,
    slots: GEAR_SLOTS.map((slot) => {
      const piece = shipped[0].gear.find((gear) => gear.slot === slot)!
      return {
        slot,
        words: (slot === "helm"
          ? ownWords
          : wordsOf(piece)) as unknown as CustomGraduationBuild["slots"][number]["words"],
        attunement: piece.attunement,
      }
    }),
    set: shipped[0].set,
    bowSet: shipped[0].bowSet,
    arsenal: shipped[0].arsenal,
    rotationId: shipped[0].rotationId,
    createdAt: "2026-09-16T00:00:00.000Z",
    updatedAt: "2026-09-16T00:00:00.000Z",
  }

  it("counts a piece no shipped build would call perfect", () => {
    const piece = pieceFrom(target, ownWords)
    expect(isHeirloom(piece, { classId: MULTI_BUILD_CLASS })).toBe(false)
    expect(isHeirloom(piece, { classId: MULTI_BUILD_CLASS, customGraduationBuild: custom })).toBe(
      true,
    )
  })

  it("is followed like any other build once the profile names it", () => {
    const match = heirloomMatch(pieceFrom(target, ownWords), {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: custom.id,
      customGraduationBuild: custom,
    })
    expect(match.builds.map((build) => build.id)).toEqual([custom.id])
    expect(match.followed).toBe(true)
  })

  it("is ignored by a profile playing another class", () => {
    const piece = pieceFrom(target, ownWords)
    expect(isHeirloom(piece, { classId: SINGLE_BUILD_CLASS, customGraduationBuild: custom })).toBe(
      false,
    )
  })
})

describe("heirloom — one retune away", () => {
  const target = helmOf(SINGLE_BUILD_CLASS)
  const perfect = wordsOf(target)
  const [foreign] = wordsOutside(perfect, 1)
  const oneOff = [...perfect]
  oneOff[2] = foreign

  it("names the line to retune and the word it needs", () => {
    const swap = heirloomSwapFor(pieceFrom(target, oneOff), { classId: SINGLE_BUILD_CLASS })
    expect(swap).toMatchObject({ slotIndex: 2, currentWord: foreign, word: perfect[2] })
  })

  it("stays silent when the line that differs is the first one, which never retunes", () => {
    const firstLineOff = [...perfect]
    firstLineOff[0] = foreign
    expect(
      heirloomSwapFor(pieceFrom(target, firstLineOff), { classId: SINGLE_BUILD_CLASS }),
    ).toBeNull()
  })

  it("stays silent for a relayed piece, which cannot be retuned", () => {
    expect(
      heirloomSwapFor(pieceFrom(target, oneOff, { relayed: true }), {
        classId: SINGLE_BUILD_CLASS,
      }),
    ).toBeNull()
  })

  it("stays silent once another line carries the retune mark", () => {
    const piece = pieceFrom(target, oneOff)
    const words = piece.words.map((word, index) =>
      index === 3 ? { ...word, retuned: true } : word,
    ) as GearPiece["words"]
    expect(heirloomSwapFor({ ...piece, words }, { classId: SINGLE_BUILD_CLASS })).toBeNull()
  })

  it("stays silent when the word it needs was retuned out of the pool", () => {
    const piece = pieceFrom(target, oneOff, { retunedOutWords: [perfect[2]] })
    expect(heirloomSwapFor(piece, { classId: SINGLE_BUILD_CLASS })).toBeNull()
  })

  it("offers no swap for a piece that is already an heirloom", () => {
    expect(heirloomSwapFor(pieceFrom(target, perfect), { classId: SINGLE_BUILD_CLASS })).toBeNull()
  })
})

const SINGLE_TARGET_BUILD = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds.find((build) =>
  build.gear.some(
    (piece) =>
      piece.slot === "helm" && piece.words.some((word) => word.word === "singleTargetMysticBoost"),
  ),
)!
const OTHER_UMBRA_BUILD = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds.find(
  (build) => build.id !== SINGLE_TARGET_BUILD.id,
)!

function singleTargetPiece(slot: GearPiece["slot"]): GearPiece {
  return SINGLE_TARGET_BUILD.gear.find((piece) => piece.slot === slot)!
}

function withWordSwapped(piece: GearPiece, from: string, to: string): GearWordId[] {
  return wordsOf(piece).map((word) => (word === from ? (to as GearWordId) : word))
}

describe("heirloom — the build at the piece's gear level", () => {
  const helm = singleTargetPiece("helm")

  it("counts a level-100 helm carrying All Mystic Skill DMG Boost where the build carries the single-target line", () => {
    const words = withWordSwapped(helm, "singleTargetMysticBoost", "allMysticBoost")
    expect(isHeirloom(pieceFrom(helm, words, { level: 100 }), { classId: MULTI_BUILD_CLASS })).toBe(
      true,
    )
  })

  it("keeps comparing a level-96 piece against the build's own words", () => {
    expect(isHeirloom(pieceFrom(helm, wordsOf(helm)), { classId: MULTI_BUILD_CLASS })).toBe(true)
    const allMystic = withWordSwapped(helm, "singleTargetMysticBoost", "allMysticBoost")
    expect(isHeirloom(pieceFrom(helm, allMystic), { classId: MULTI_BUILD_CLASS })).toBe(false)
  })

  it("names the All Mystic line as the one retune for a level-100 piece still carrying the single-target line", () => {
    const swap = heirloomSwapFor(pieceFrom(helm, wordsOf(helm), { level: 100 }), {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: SINGLE_TARGET_BUILD.id,
    })
    expect(swap).toMatchObject({
      currentWord: "singleTargetMysticBoost",
      word: "allMysticBoost",
    })
  })
})

describe("heirloom — one retune away from any build", () => {
  const armor = singleTargetPiece("armor")

  it("finds the swap toward a later build when an earlier one is two lines off", () => {
    const words = ["affinity", "allMysticBoost", "momentum", "crit", "maxPhys"]
    const piece = pieceFrom(armor, words, { level: 100 })
    piece.words[3] = { ...piece.words[3], retuned: true }
    const match = heirloomMatch(piece, { classId: MULTI_BUILD_CLASS })
    expect(match.swaps).toHaveLength(1)
    expect(match.swap).toMatchObject({ slotIndex: 3, currentWord: "crit", word: "affinity" })
    const armorWords = [...wordsOf(armor)].sort().join()
    const sameArmor = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds.filter(
      (build) =>
        [...wordsOf(build.gear.find((candidate) => candidate.slot === "armor")!)].sort().join() ===
        armorWords,
    )
    expect(match.swap!.builds.map((build) => build.id)).toEqual(sameArmor.map((build) => build.id))
  })

  it("puts the swap toward the followed build first", () => {
    const helm = singleTargetPiece("helm")
    const piece = pieceFrom(helm, ["affinity", "affinity", "momentum", "maxPhys", "crit"], {
      level: 100,
    })
    const followingSingleTarget = heirloomMatch(piece, {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: SINGLE_TARGET_BUILD.id,
    })
    const followingOther = heirloomMatch(piece, {
      classId: MULTI_BUILD_CLASS,
      graduationBuildId: OTHER_UMBRA_BUILD.id,
    })
    expect(followingSingleTarget.swaps.map((swap) => swap.word)).toEqual([
      "allMysticBoost",
      "power",
    ])
    expect(followingOther.swaps.map((swap) => swap.word)).toEqual(["power", "allMysticBoost"])
    expect(followingOther.swap).toBe(followingOther.swaps[0])
  })

  it("names every build one swap completes", () => {
    const weapon = singleTargetPiece("leftWeapon")
    const [foreign] = wordsOutside(wordsOf(weapon), 1)
    const piece = pieceFrom(weapon, withWordSwapped(weapon, "power", foreign))
    const swap = heirloomSwapFor(piece, { classId: MULTI_BUILD_CLASS })
    expect(swap).toMatchObject({ currentWord: foreign, word: "power" })
    expect(swap!.builds.map((build) => build.id).sort()).toEqual(
      classDefinition(MULTI_BUILD_CLASS)!
        .graduationBuilds.map((build) => build.id)
        .sort(),
    )
  })
})
