// Scoped to the mystic art's data shape; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { toadCancel } from "../../src/data/skills/mystic/toad-cancel"
import { toadFury } from "../../src/data/skills/mystic/toad-fury"
import { toadFuryHit } from "../../src/data/skills/mystic/toad-fury-hit"
import { toadPoison, toadPoisonFury } from "../../src/data/skills/mystic/debuffs"
import { DEBUFF } from "../../src/data/skills/mystic/ids"
import { MYSTIC, ROLE } from "../../src/data/skills/ids"
import type { Skill } from "../../src/engine/skill"

const LEVEL_176_POWER = 12.751806
const LEVEL_176_FLAT = 2020.5849
const LEVEL_76_POWER = 13.516714
const FLIP_RATIO = 0.04
const POUNCE_RATIO = 0.24
const HIT_POUNCE_RATIO = 0.312
const VENOM_RATIO = 0.12

const rowOf = (skill: Skill, index: number) => skill.hits[index]!

describe.each([
  ["Leaping Toad - Fury", toadFury, POUNCE_RATIO],
  ["Leaping Toad - Fury (Hit)", toadFuryHit, HIT_POUNCE_RATIO],
])("%s", (_name, skill, pounceRatio) => {
  it("is an area-debuff mystic art on the same 96 frame cast as Toad[Cancel]", () => {
    expect(skill.tags).toContain(MYSTIC.areaDebuff)
    expect(skill.castFrames).toBe(toadCancel.castFrames)
    expect(skill.cancelledBy).toBe("deflectCancel")
  })

  it("carries the level-176 flip and pounce rows", () => {
    for (const [index, ratio] of [
      [0, FLIP_RATIO],
      [1, pounceRatio],
    ] as const) {
      const row = rowOf(skill, index)
      expect(row.physMultiplier).toBeCloseTo(LEVEL_176_POWER * ratio, 5)
      expect(row.attributeMultiplier).toBeCloseTo(LEVEL_176_POWER * ratio * 1.5, 5)
      expect(row.physFixed).toBeCloseTo(LEVEL_176_FLAT * ratio, 3)
      expect(row.attributeFixed).toBe(0)
    }
  })

  it("applies the level-176 venom on the pounce only", () => {
    expect(rowOf(skill, 0).triggers).toEqual([])
    expect(rowOf(skill, 1).triggers.map((trigger) => trigger.targetId)).toEqual([
      DEBUFF.toadPoisonFury,
    ])
  })
})

describe("flip frame", () => {
  it("lands on frame 40 in all three Toad modules", () => {
    for (const skill of [toadCancel, toadFury, toadFuryHit]) expect(rowOf(skill, 0).frame).toBe(40)
  })
})

describe("level 176 against level 76", () => {
  it("plain Fury deals 0.9434 of Toad[Cancel] on the pounce", () => {
    expect(rowOf(toadFury, 1).physMultiplier / rowOf(toadCancel, 1).physMultiplier).toBeCloseTo(
      LEVEL_176_POWER / LEVEL_76_POWER,
      4,
    )
  })

  it("the Hit form's pounce is the plain Fury pounce with its 0.312 ratio over 0.24", () => {
    expect(rowOf(toadFuryHit, 1).physMultiplier / rowOf(toadFury, 1).physMultiplier).toBeCloseTo(
      HIT_POUNCE_RATIO / POUNCE_RATIO,
      6,
    )
    expect(rowOf(toadFuryHit, 0)).toEqual(rowOf(toadFury, 0))
  })
})

describe("Toad Poison (Fury)", () => {
  it("is Toad Poison's shape with the level-176 explosion", () => {
    expect(toadPoisonFury.dot).toMatchObject({
      tickIntervalFrames: toadPoison.dot!.tickIntervalFrames,
      directHit: true,
      mysticCategory: "area-debuff",
    })
    expect(toadPoisonFury.durationFrames).toBe(toadPoison.durationFrames)
    expect(toadPoisonFury.tags).toEqual([ROLE.toadVenom])
    expect(toadPoisonFury.dot!.physMultiplier).toBeCloseTo(LEVEL_176_POWER * VENOM_RATIO, 5)
    expect(toadPoisonFury.dot!.attributeMultiplier).toBeCloseTo(
      LEVEL_176_POWER * VENOM_RATIO * 1.5,
      5,
    )
    expect(toadPoisonFury.dot!.physFixed).toBeCloseTo(LEVEL_176_FLAT * VENOM_RATIO, 3)
  })
})
