import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"
import { swordChargeStage15Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-5-hit"

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
}

function timelineInputs(rotation: Rotation, skills: Skill[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: [],
    activeCustomRotation: rotation,
    set: null,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
  }
}

describe("Second Track Slash releases onto its own level-0 form when Endurance runs out first", () => {
  it("flags the early release and casts the level-0 form instead of stage 1", () => {
    // 80 (NO_ODDITY_ENDURANCE capacity) − 71 leaves 9; Second Track Slash's
    // own upfront cost of 6 leaves 3, below the 4.2 its stage-1 drain
    // (14/s for 0.3 s) needs to sustain from its own frame 12.
    const drainsEndurance = makeSkill(CLASS, {
      name: "Drains Endurance",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 71 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [drainsEndurance, swordChargeStage15Hit].map((skill) =>
            makeStep({ skillId: skill.id }),
          ),
        }),
        [drainsEndurance],
      ),
    )
    expect(
      result.warnings.some(
        (warning) =>
          warning.includes("released early") &&
          warning.includes("Sword Charge Stage 1, 5-Hit") &&
          warning.includes("Sword Charge Stage 1, Level 0 Release"),
      ),
    ).toBe(true)
    expect(
      result.casts?.some((cast) => cast.skillName === "Sword Charge Stage 1, Level 0 Release"),
    ).toBe(true)
    expect(result.casts?.some((cast) => cast.skillName === "Sword Charge Stage 1, 5-Hit")).toBe(
      false,
    )
  })
})
