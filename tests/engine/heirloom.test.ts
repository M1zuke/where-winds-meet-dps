import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { GEAR_WORD_IDS } from "../../src/data/stats/statLines"
import { heirloomMatch, heirloomSwapFor, isHeirloom } from "../../src/engine/heirloom"
import type { GearPiece, GearWordId } from "../../src/engine/types"

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
    expect(isHeirloom(pieceFrom(target, perfect), MULTI_BUILD_CLASS)).toBe(true)
  })

  it("ignores the order the lines sit in", () => {
    expect(isHeirloom(pieceFrom(target, [...perfect].reverse()), MULTI_BUILD_CLASS)).toBe(true)
  })

  it("counts a relayed piece too — the rolls play no part", () => {
    expect(isHeirloom(pieceFrom(target, perfect, { relayed: true }), MULTI_BUILD_CLASS)).toBe(true)
  })

  it("names every build the piece is perfect for", () => {
    const match = heirloomMatch(pieceFrom(target, perfect), MULTI_BUILD_CLASS)
    const perfectFor = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds.filter((build) => {
      const helm = build.gear.find((piece) => piece.slot === target.slot)!
      return wordsOf(helm).sort().join() === [...perfect].sort().join()
    })
    expect(match.builds.map((build) => build.id)).toEqual(perfectFor.map((build) => build.id))
  })

  it("does not count a piece in another slot", () => {
    expect(isHeirloom(pieceFrom(target, perfect, { slot: "greaves" }), MULTI_BUILD_CLASS)).toBe(
      false,
    )
  })

  it("does not count a piece that is two lines off", () => {
    const [firstForeign, secondForeign] = wordsOutside(perfect, 2)
    const twoOff = [...perfect]
    twoOff[1] = firstForeign
    twoOff[2] = secondForeign
    expect(isHeirloom(pieceFrom(target, twoOff), MULTI_BUILD_CLASS)).toBe(false)
  })
})

describe("heirloom — the build the profile follows", () => {
  const builds = classDefinition(MULTI_BUILD_CLASS)!.graduationBuilds
  const target = helmOf(MULTI_BUILD_CLASS)
  const perfect = wordsOf(target)

  it("follows the match when the profile follows the build the piece is perfect for", () => {
    const match = heirloomMatch(pieceFrom(target, perfect), MULTI_BUILD_CLASS, builds[0].id)
    expect(match.followed).toBe(true)
  })

  it("keeps the match but not the follow while the profile follows another build", () => {
    const match = heirloomMatch(pieceFrom(target, perfect), MULTI_BUILD_CLASS, builds[1].id)
    expect(match.builds.map((build) => build.id)).toEqual([builds[0].id])
    expect(match.followed).toBe(false)
  })

  it("follows the sole build of a single-build class without being told which", () => {
    const sole = helmOf(SINGLE_BUILD_CLASS)
    const match = heirloomMatch(pieceFrom(sole, wordsOf(sole)), SINGLE_BUILD_CLASS, null)
    expect(match.followed).toBe(true)
  })
})

describe("heirloom — one retune away", () => {
  const target = helmOf(SINGLE_BUILD_CLASS)
  const perfect = wordsOf(target)
  const [foreign] = wordsOutside(perfect, 1)
  const oneOff = [...perfect]
  oneOff[2] = foreign

  it("names the line to retune and the word it needs", () => {
    const swap = heirloomSwapFor(pieceFrom(target, oneOff), SINGLE_BUILD_CLASS)
    expect(swap).toMatchObject({ slotIndex: 2, currentWord: foreign, word: perfect[2] })
  })

  it("stays silent when the line that differs is the first one, which never retunes", () => {
    const firstLineOff = [...perfect]
    firstLineOff[0] = foreign
    expect(heirloomSwapFor(pieceFrom(target, firstLineOff), SINGLE_BUILD_CLASS)).toBeNull()
  })

  it("stays silent for a relayed piece, which cannot be retuned", () => {
    expect(
      heirloomSwapFor(pieceFrom(target, oneOff, { relayed: true }), SINGLE_BUILD_CLASS),
    ).toBeNull()
  })

  it("stays silent once another line carries the retune mark", () => {
    const piece = pieceFrom(target, oneOff)
    const words = piece.words.map((word, index) =>
      index === 3 ? { ...word, retuned: true } : word,
    ) as GearPiece["words"]
    expect(heirloomSwapFor({ ...piece, words }, SINGLE_BUILD_CLASS)).toBeNull()
  })

  it("stays silent when the word it needs was retuned out of the pool", () => {
    const piece = pieceFrom(target, oneOff, { retunedOutWords: [perfect[2]] })
    expect(heirloomSwapFor(piece, SINGLE_BUILD_CLASS)).toBeNull()
  })

  it("offers no swap for a piece that is already an heirloom", () => {
    expect(heirloomSwapFor(pieceFrom(target, perfect), SINGLE_BUILD_CLASS)).toBeNull()
  })
})
