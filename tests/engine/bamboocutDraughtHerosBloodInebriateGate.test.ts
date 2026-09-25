// Scoped to Bamboocut Draught's Hero's Blood - Inebriate availability gate
// (docs/TESTING.md § "Class scoping"); the class's anchor is
// bamboocutDraughtProfile.test.ts, so nothing here asserts an absolute DPS
// number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { deepdazeEntryTriggers } from "../../src/data/skills/bamboocut-draught/buffs/deepdazeEntry"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

const grantDeepdaze = makeSkill(CLASS, {
  name: "Test Deepdaze Granter",
  castFrames: 12,
  hits: [makeHit({ frame: 0, triggers: deepdazeEntryTriggers() })],
})

const skyspeakOnly: Inputs["mindMethods"] = [
  { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "1" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

const skyspeakAndEonpourTier6: Inputs["mindMethods"] = [
  { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: "1" },
  { id: INNER_WAY_ID.eonpour, name: "Eonpour", stacks: "6" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function totalHerosBloodInebriateHits(result: ReturnType<typeof runEngine>): number {
  const skillRow = result.perSkill.find((row) => row.breakdownName === "Hero's Blood - Inebriate")
  return skillRow?.count ?? 0
}

describe("Hero's Blood - Inebriate is castable once per Deepdaze entry", () => {
  it("lands on the first cast inside a fresh Deepdaze and deals nothing on a second cast in the same window", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: skyspeakOnly,
      customSkills: [grantDeepdaze],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [
          makeStep({ skillId: grantDeepdaze.id }),
          makeStep({ skillId: SKILL.herosBloodInebriate }),
          makeStep({ skillId: SKILL.herosBloodInebriate }),
        ],
        openingStacks: { [STATUS.bingePoints]: 200 },
      }),
      set: null,
    })
    // 11 damaging hits on the first cast, none on the second.
    expect(totalHerosBloodInebriateHits(result)).toBe(11)
  })

  it("lands again after an in-Deepdaze Eonpour payout re-grants it", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: skyspeakAndEonpourTier6,
      customSkills: [grantDeepdaze],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [
          makeStep({ skillId: grantDeepdaze.id }),
          makeStep({ skillId: SKILL.herosBloodInebriate }),
          makeStep({ skillId: SKILL.peakfall }),
          makeStep({ skillId: SKILL.herosBloodInebriate }),
        ],
        qiBreak: { startSec: 0, durationSec: 30, lowQiLeadSec: 0 },
        openingStacks: { [STATUS.bingePoints]: 200 },
      }),
      set: null,
    })
    expect(totalHerosBloodInebriateHits(result)).toBe(22)
  })
})

describe("deepdazeEntryTriggers orders its grants", () => {
  it("grants Enhance Special Skill before it opens Deepdaze, in the same trigger list", () => {
    const targets = deepdazeEntryTriggers().map((trigger) => trigger.targetId)
    const enhanceIndex = targets.indexOf(STATUS.enhanceSpecialSkill)
    const deepdazeIndex = targets.indexOf(STATUS.inebriateDeepdaze)
    expect(enhanceIndex).toBeGreaterThanOrEqual(0)
    expect(deepdazeIndex).toBeGreaterThan(enhanceIndex)
  })
})
