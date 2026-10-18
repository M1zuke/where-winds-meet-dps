import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import {
  applySetBonuses,
  resolveActiveSets,
  setPieceCount,
  setPieceCountWith,
  setTierLevel,
} from "../../src/engine/setBonuses"
import {
  GEAR_LEVELS,
  WEAPON_SLOTS,
  emptyGearWords,
  type BowGear,
  type GearLevel,
  type GearPiece,
  type GearSlot,
  type Inputs,
} from "../../src/engine/types"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { SET_ID } from "../../src/data/sets/ids"
import { jadeware } from "../../src/data/sets/jadeware"
import { cleftpeak } from "../../src/data/sets/cleftpeak"
import { hawkwing } from "../../src/data/sets/hawkwing"
import { BOW_SET_DEFS } from "../../src/data/sets/bowSets"

interface PieceSpec {
  set?: string
  level: GearLevel
}

function piece(slot: GearSlot, spec: PieceSpec): GearPiece {
  return {
    id: `piece-${slot}`,
    slot,
    level: spec.level,
    rarity: "legendary",
    minPhys: 0,
    maxPhys: 0,
    hp: 0,
    physDef: 0,
    words: emptyGearWords(),
    attunement: "",
    attunementValue: 0,
    relayed: false,
    ...(spec.set ? { set: spec.set } : {}),
  }
}

function inputsWith(specs: readonly PieceSpec[]): Inputs {
  const pieces = specs.map((spec, index) => piece(WEAPON_SLOTS[index], spec))
  return {
    ...defaultInputs,
    inventory: pieces,
    equipped: {
      ...defaultInputs.equipped,
      ...Object.fromEntries(pieces.map((entry) => [entry.slot, entry.id])),
    },
  }
}

const ladder = GEAR_LEVELS

describe("the tier level averages the N highest pieces and rounds up to a rung", () => {
  it("takes the two highest of 105/105/96/96 and lands on 105", () => {
    expect(setTierLevel([105, 105, 96, 96], 2, ladder)).toBe(105)
  })

  it("rounds 100 + 91 = 95.5 up to 96", () => {
    expect(setTierLevel([100, 91], 2, ladder)).toBe(96)
  })

  it("rounds 105 + 96 = 100.5 up to 105", () => {
    expect(setTierLevel([105, 96], 2, ladder)).toBe(105)
  })

  it("uses the last rung past the end of the ladder", () => {
    expect(setTierLevel([110, 110], 2, ladder)).toBe(105)
  })

  it("is inactive with fewer pieces than the tier size", () => {
    expect(setTierLevel([105], 2, ladder)).toBeNull()
  })
})

describe("gear set tiers", () => {
  it("two sets' 2-pieces add together", () => {
    const inputs = inputsWith([
      { set: SET_ID.jadeware, level: 105 },
      { set: SET_ID.jadeware, level: 105 },
      { set: SET_ID.cleftpeak, level: 96 },
      { set: SET_ID.cleftpeak, level: 96 },
    ])
    const active = resolveActiveSets(inputs)
    expect(active.twoPiece.map((entry) => entry.setId).sort()).toEqual(
      [SET_ID.jadeware, SET_ID.cleftpeak].sort(),
    )
    expect(active.fourPiece).toBeNull()
    const applied = applySetBonuses(inputs)
    expect(applied.phys.max).toBeCloseTo(inputs.phys.max + jadeware.panelBonus.value[105]!, 10)
    expect(applied.phys.min).toBeCloseTo(inputs.phys.min + cleftpeak.panelBonus.value[96]!, 10)
  })

  it("a single piece activates nothing", () => {
    const inputs = inputsWith([{ set: SET_ID.hawkwing, level: 105 }])
    expect(resolveActiveSets(inputs).twoPiece).toEqual([])
    expect(applySetBonuses(inputs)).toEqual(inputs)
  })

  it("the 4-piece needs four pieces", () => {
    const three = inputsWith([
      { set: SET_ID.hawkwing, level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
    ])
    expect(resolveActiveSets(three).fourPiece).toBeNull()
    const four = inputsWith([
      { set: SET_ID.hawkwing, level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
    ])
    expect(resolveActiveSets(four).fourPiece).toBe(SET_ID.hawkwing)
  })

  it("the 2-piece reads the tier level from the equipped pieces' levels", () => {
    const inputs = inputsWith([
      { set: SET_ID.hawkwing, level: 100 },
      { set: SET_ID.hawkwing, level: 91 },
    ])
    expect(resolveActiveSets(inputs).twoPiece).toEqual([{ setId: SET_ID.hawkwing, level: 96 }])
    expect(applySetBonuses(inputs).affinityRate).toBeCloseTo(
      inputs.affinityRate + hawkwing.panelBonus.value[96]!,
      10,
    )
  })

  it("an unknown set id counts toward nothing and stays as stored", () => {
    const inputs = inputsWith([
      { set: "setFromALaterBuild", level: 105 },
      { set: "setFromALaterBuild", level: 105 },
      { set: "setFromALaterBuild", level: 105 },
      { set: "setFromALaterBuild", level: 105 },
    ])
    expect(resolveActiveSets(inputs)).toEqual({ twoPiece: [], fourPiece: null, bow: null })
    expect(applySetBonuses(inputs)).toEqual(inputs)
    expect(inputs.inventory.every((entry) => entry.set === "setFromALaterBuild")).toBe(true)
  })

  it("an armor-group set id counts toward nothing", () => {
    const inputs = inputsWith([
      { set: SET_ID.calmwaters, level: 105 },
      { set: SET_ID.calmwaters, level: 105 },
      { set: SET_ID.calmwaters, level: 105 },
      { set: SET_ID.calmwaters, level: 105 },
    ])
    expect(resolveActiveSets(inputs)).toEqual({ twoPiece: [], fourPiece: null, bow: null })
  })

  it("keeps an armor-group set's own 4-piece param inactive", () => {
    const inputs = inputsWith(
      WEAPON_SLOTS.map(() => ({ set: SET_ID.calmwaters, level: 105 as GearLevel })),
    )
    expect(paramsFromInputs(inputs).calmwatersSet).toBeUndefined()
    expect(paramsFromInputs(inputs).armorSet).toBeUndefined()
  })

  it("counts the equipped carriers, with and without a candidate placed in its slot", () => {
    const inputs = inputsWith([
      { set: SET_ID.hawkwing, level: 96 },
      { level: 96 },
      { set: SET_ID.hawkwing, level: 96 },
    ])
    expect(setPieceCount(inputs, SET_ID.hawkwing)).toBe(2)
    expect(setPieceCountWith(inputs, "piece-rightWeapon", SET_ID.hawkwing)).toBe(3)
    expect(setPieceCountWith(inputs, "piece-leftWeapon", SET_ID.jadeware)).toBe(1)
  })
})

describe("bow set", () => {
  function bowInputs(bowGear: BowGear): Inputs {
    return { ...defaultInputs, bowGear }
  }
  const crit = (level: 91 | 96 | 100 | 105) =>
    ({ level, rarity: "legendary", set: "crit" }) as const

  it("needs a matching pair", () => {
    const mismatched = bowInputs({
      bow: crit(105),
      thumbRing: { level: 105, rarity: "legendary", set: "affinity" },
    })
    expect(resolveActiveSets(mismatched).bow).toBeNull()
    expect(resolveActiveSets(bowInputs({ bow: crit(105), thumbRing: null })).bow).toBeNull()
    expect(resolveActiveSets(bowInputs({ bow: crit(105), thumbRing: crit(105) })).bow).toEqual({
      set: "crit",
      level: 105,
    })
  })

  it("follows the averaging rule on the two pieces' levels", () => {
    const inputs = bowInputs({ bow: crit(100), thumbRing: crit(91) })
    expect(resolveActiveSets(inputs).bow).toEqual({ set: "crit", level: 96 })
    expect(applySetBonuses(inputs).critRate).toBeCloseTo(
      inputs.critRate + BOW_SET_DEFS.crit.value[96]!,
      10,
    )
  })
})
