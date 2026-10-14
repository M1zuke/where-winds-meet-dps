import { describe, expect, it } from "vitest"
import {
  oneRetuneTunedLinesChance,
  tunementDrawChances,
  tunementSetChance,
} from "../../src/engine/tunementChance"
import { retuneWeightPool } from "../../src/data/stats/gearRetuneWeights"
import { retunePoolChoices } from "../../src/engine/retunement"
import type { GearPiece, GearSlot, GearWordId } from "../../src/engine/types"

type Words = readonly (GearWordId | "")[]

function piece(slot: GearSlot, level: GearPiece["level"], words: Words = []): GearPiece {
  const lines = [0, 1, 2, 3, 4].map((index) => ({
    word: words[index] ?? "",
    value: 0,
    retuned: false,
  })) as GearPiece["words"]
  return {
    id: "tunement-chance",
    slot,
    level,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: lines,
    attunement: "",
    attunementValue: 0,
    relayed: false,
  }
}

describe("the first line's chances", () => {
  it("split a level-86 disc's pool between its two drawable lines", () => {
    const chances = tunementDrawChances(piece("disc", 86), null, 0)
    expect(chances.get("minPhys")).toBeCloseTo(889 / 2667)
    expect(chances.get("maxPhys")).toBeCloseTo(1778 / 2667)
  })

  it("draw only the weapon type's own attribute attack", () => {
    const chances = tunementDrawChances(piece("leftWeapon", 86), "Sword", 0)
    expect(chances.get("maxBellstrike")).toBeCloseTo(1778 / 8000)
    expect(chances.get("maxStonesplit")).toBeUndefined()
  })

  it("read a spear's own level-86 pool", () => {
    const chances = tunementDrawChances(piece("rightWeapon", 86), "Spear", 0)
    expect(chances.get("maxBellstrike")).toBeCloseTo(889 / 7999)
    expect(chances.get("maxStonesplit")).toBeCloseTo(889 / 7999)
  })

  it("ignore every other line on the piece", () => {
    const empty = tunementDrawChances(piece("disc", 86), null, 0)
    const filled = tunementDrawChances(piece("disc", 86, ["", "maxPhys", "minPhys"]), null, 0)
    expect(filled).toEqual(empty)
  })
})

describe("a retunable line's chances", () => {
  it("weigh every line the weapon type can roll", () => {
    const chances = tunementDrawChances(piece("leftWeapon", 86), "Sword", 2)
    expect(chances.get("crit")).toBeCloseTo(930 / 14565)
    expect(chances.get("swordBoost")).toBeCloseTo(215 / 14565)
    expect(chances.get("spearBoost")).toBeUndefined()
  })

  it("exclude a word another retunable line already holds", () => {
    const chances = tunementDrawChances(piece("leftWeapon", 86, ["", "crit"]), "Sword", 2)
    expect(chances.get("crit")).toBeUndefined()
    expect(chances.get("affinity")).toBeCloseTo(930 / (14565 - 930))
  })

  it("keep the line's own word drawable", () => {
    const chances = tunementDrawChances(piece("leftWeapon", 86, ["", "", "crit"]), "Sword", 2)
    expect(chances.get("crit")).toBeCloseTo(930 / 14565)
  })

  it("let the first line's word roll once more", () => {
    const chances = tunementDrawChances(piece("leftWeapon", 86, ["crit"]), "Sword", 2)
    expect(chances.get("crit")).toBeCloseTo(930 / 14565)
  })

  it("allow one boost line per piece", () => {
    const open = tunementDrawChances(piece("helm", 96), null, 2)
    const capped = tunementDrawChances(piece("helm", 96, ["", "singleTargetMysticBoost"]), null, 2)
    expect(open.get("areaMysticBoost")).toBeGreaterThan(0)
    expect(capped.get("areaMysticBoost")).toBeUndefined()
  })

  it("allow two attack lines per piece", () => {
    const oneHeld = tunementDrawChances(piece("disc", 86, ["", "maxBellstrike"]), null, 3)
    const twoHeld = tunementDrawChances(
      piece("disc", 86, ["", "maxBellstrike", "maxSilkbind"]),
      null,
      3,
    )
    expect(oneHeld.get("maxStonesplit")).toBeGreaterThan(0)
    expect(twoHeld.get("maxStonesplit")).toBeUndefined()
  })

  it("sums the two older mystic lines a level-86 helm rolls into the app's single word", () => {
    const chances = tunementDrawChances(piece("helm", 86), null, 1)
    const single = chances.get("singleTargetMysticBoost")!
    expect(single / chances.get("crit")!).toBeCloseTo((2 * 431) / 930)
    expect(chances.get("areaMysticBoost")).toBeCloseTo(single)
  })

  it("never adds up past certainty", () => {
    for (const level of [86, 91, 96, 100, 105] as const) {
      for (const slot of ["leftWeapon", "disc", "helm", "greaves"] as const) {
        for (const lineIndex of [0, 1]) {
          const chances = tunementDrawChances(piece(slot, level), "Sword", lineIndex)
          const total = [...chances.values()].reduce((sum, chance) => sum + chance, 0)
          expect(total).toBeGreaterThan(0)
          expect(total).toBeLessThanOrEqual(1 + 1e-9)
        }
      }
    }
  })
})

describe("the chance of a piece's whole set of tunements", () => {
  function tunedChance(held: Words, word: GearWordId): number {
    return tunementDrawChances(piece("disc", 86, ["", ...held]), null, held.length + 1).get(word)!
  }

  it("is unknown for a piece with no lines", () => {
    expect(tunementSetChance(piece("disc", 86), null)).toBeNull()
  })

  it("is the first line's own chance when nothing is tuned on", () => {
    expect(tunementSetChance(piece("disc", 86, ["maxPhys"]), null)).toBeCloseTo(1778 / 2667)
  })

  it("multiplies the first line by the tuned line", () => {
    const expected = (1778 / 2667) * tunedChance([], "crit")
    expect(tunementSetChance(piece("disc", 86, ["maxPhys", "crit"]), null)).toBeCloseTo(expected)
  })

  it("adds up both orders two tuned lines can arrive in", () => {
    const critFirst = tunedChance([], "crit") * tunedChance(["crit"], "affinity")
    const affinityFirst = tunedChance([], "affinity") * tunedChance(["affinity"], "crit")
    expect(tunementSetChance(piece("disc", 86, ["", "crit", "affinity"]), null)).toBeCloseTo(
      critFirst + affinityFirst,
    )
  })

  it("does not depend on which line holds which tuned word", () => {
    const one = tunementSetChance(
      piece("helm", 96, ["crit", "affinity", "power", "momentum"]),
      null,
    )
    const other = tunementSetChance(
      piece("helm", 96, ["crit", "momentum", "affinity", "power"]),
      null,
    )
    expect(other).toBeCloseTo(one!)
  })

  it("is zero for a word tuned on twice", () => {
    expect(tunementSetChance(piece("disc", 86, ["maxPhys", "crit", "crit"]), null)).toBe(0)
  })

  it("is zero for a line only a relay can carry", () => {
    expect(tunementSetChance(piece("leftWeapon", 96, ["", "maxBellstrike"]), "Sword")).toBe(0)
  })
})

describe("the chance of lines two to five with one of them from a retune", () => {
  const library = retuneWeightPool("Bellstrike", 96, "disc")!

  function withRetuned(words: Words, retunedLine: number): GearPiece {
    const base = piece("disc", 96, words)
    return {
      ...base,
      words: base.words.map((entry, index) => ({
        ...entry,
        retuned: index === retunedLine,
      })) as GearPiece["words"],
    }
  }

  const pendant = piece("disc", 96, ["maxPhys", "maxPhys", "momentum", "power", "allMartialBoost"])
  const firstLineChance = (first: GearWordId) =>
    tunementDrawChances(piece("disc", 96), null, 0).get(first)!

  it("is unknown without a retune library", () => {
    expect(oneRetuneTunedLinesChance(piece("disc", 91, ["maxPhys", "crit"]), null, null)).toBeNull()
  })

  it("is unknown with no tuned line", () => {
    expect(oneRetuneTunedLinesChance(piece("disc", 96, ["maxPhys"]), null, library)).toBeNull()
  })

  it("rolls any stat onto the retuned line, then retunes it once into the stat it holds", () => {
    const retuned = withRetuned(["maxPhys", "crit"], 1)
    const natural = tunementDrawChances(piece("disc", 96), null, 1)
    const unmodelledShare = 1 - [...natural.values()].reduce((sum, chance) => sum + chance, 0)
    const retuneInto = (heldWord: GearWordId | "") =>
      retunePoolChoices(withRetuned(["maxPhys", heldWord], 1), library).find(
        (choice) => choice.word === "crit",
      )!.pDraw
    let expected = unmodelledShare * retuneInto("")
    for (const [word, chance] of natural) {
      expected += chance * (word === "crit" ? 1 : retuneInto(word))
    }
    expect(oneRetuneTunedLinesChance(retuned, null, library)).toEqual({
      lineIndex: 1,
      chance: expect.closeTo(expected, 12),
    })
  })

  it("retunes the line marked R", () => {
    const marked = withRetuned(["maxPhys", "crit", "power"], 2)
    expect(oneRetuneTunedLinesChance(marked, null, library)!.lineIndex).toBe(2)
  })

  it("picks the line that makes the piece most likely when none is marked", () => {
    const best = oneRetuneTunedLinesChance(pendant, null, library)!
    for (const line of [1, 2, 3, 4]) {
      const forced = oneRetuneTunedLinesChance(
        withRetuned(
          pendant.words.map((entry) => entry.word),
          line,
        ),
        null,
        library,
      )!
      expect(best.chance).toBeGreaterThanOrEqual(forced.chance - 1e-15)
    }
  })

  it("is never below the chance of tuning the same lines without a retune", () => {
    expect(oneRetuneTunedLinesChance(pendant, null, library)!.chance).toBeGreaterThanOrEqual(
      tunementSetChance(pendant, null)! / firstLineChance("maxPhys"),
    )
  })

  it("adds nothing for a stat the library cannot retune into", () => {
    const outsideLibrary = withRetuned(["maxPhys", "allMartialBoost"], 1)
    expect(oneRetuneTunedLinesChance(outsideLibrary, null, library)!.chance).toBeCloseTo(
      tunementSetChance(outsideLibrary, null)! / firstLineChance("maxPhys"),
      12,
    )
  })

  it("takes the first line as given, even one that could not roll", () => {
    const anyFirstLine = piece("disc", 96, ["maxPhys", "crit"])
    const unrollableFirstLine = piece("disc", 96, ["crit", "crit"])
    expect(oneRetuneTunedLinesChance(unrollableFirstLine, null, library)!.chance).toBeCloseTo(
      oneRetuneTunedLinesChance(anyFirstLine, null, library)!.chance,
      15,
    )
  })
})
