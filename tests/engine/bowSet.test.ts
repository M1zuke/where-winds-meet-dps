import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { applySetBonuses } from "../../src/engine/setBonuses"
import {
  BOW_GEAR_LEVELS,
  type BowGearLevel,
  type BowSet,
  type Inputs,
} from "../../src/engine/types"
import { withBowSet } from "../helpers/withGearSet"

const EXPECTED_BONUS: Readonly<
  Record<Exclude<BowSet, null>, Readonly<Record<BowGearLevel, number>>>
> = {
  precision: { 91: 0.033, 96: 0.04, 100: 0.047, 105: 0.054 },
  crit: { 91: 0.037, 96: 0.045, 100: 0.052, 105: 0.061 },
  affinity: { 91: 0.018, 96: 0.022, 100: 0.026, 105: 0.03 },
}

const STAT_BY_SET = {
  precision: "precision",
  crit: "critRate",
  affinity: "affinityRate",
} as const

describe("bow set bonus by bow level", () => {
  for (const [choice, byLevel] of Object.entries(EXPECTED_BONUS)) {
    for (const level of BOW_GEAR_LEVELS) {
      it(`${choice} at level ${level} adds ${byLevel[level]} to its own rate only`, () => {
        const set = choice as Exclude<BowSet, null>
        const applied = applySetBonuses(withBowSet(defaultInputs, set, level))
        for (const stat of ["precision", "critRate", "affinityRate"] as const) {
          const expected =
            stat === STAT_BY_SET[set] ? defaultInputs[stat] + byLevel[level] : defaultInputs[stat]
          expect(applied[stat]).toBeCloseTo(expected, 10)
        }
      })
    }
  }

  it("adds nothing with no bow set", () => {
    expect(applySetBonuses(defaultInputs)).toEqual(defaultInputs)
  })

  it("adds nothing for a stored bow set it does not recognise", () => {
    const unrecognised: Inputs = withBowSet(defaultInputs, "somethingElse" as BowSet, 100)
    expect(applySetBonuses(unrecognised)).toEqual(unrecognised)
  })
})
