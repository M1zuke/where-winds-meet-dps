// Scoped to Bamboocut Draught's Inebriate - Deepdaze duration — the class
// carries no validated anchor (docs/TESTING.md § "Class scoping"), so
// nothing here asserts an absolute DPS number.
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

function skyspeakAt(tier: number): Inputs["mindMethods"] {
  return [
    { id: INNER_WAY_ID.skyspeak, name: "Skyspeak", stacks: String(tier) },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
}

const grantDeepdaze = makeSkill(CLASS, {
  name: "Test Deepdaze Entry",
  castFrames: 12,
  hits: [makeHit({ frame: 0, triggers: deepdazeEntryTriggers() })],
})

const idlePad = makeSkill(CLASS, {
  name: "Test Idle",
  castFrames: 180,
  hits: [makeHit({ frame: 0 })],
})

function runEntry(mindMethods: Inputs["mindMethods"]) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    customSkills: [grantDeepdaze],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: grantDeepdaze.id, hitCount: 1 })],
      openingStacks: { [STATUS.bingePoints]: 200 },
    }),
  })
}

function deepdazeWindow(result: ReturnType<typeof runEntry>) {
  return result.buffWindows!.find((window) => window.id === STATUS.inebriateDeepdaze)!
}

describe("Inebriate - Deepdaze duration", () => {
  it("lasts 5 s without Skyspeak", () => {
    const window = deepdazeWindow(runEntry(defaultInputs.mindMethods))
    expect(window.endSec - window.startSec).toBeCloseTo(5, 1)
  })

  it("lasts 10 s with Skyspeak tier 3", () => {
    const window = deepdazeWindow(runEntry(skyspeakAt(3)))
    expect(window.endSec - window.startSec).toBeCloseTo(10, 1)
  })

  it("Skyspeak tier 2 leaves it at 5 s", () => {
    const window = deepdazeWindow(runEntry(skyspeakAt(2)))
    expect(window.endSec - window.startSec).toBeCloseTo(5, 1)
  })

  it("a Hero's Blood landing inside a running Deepdaze does not lengthen it", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      mindMethods: skyspeakAt(3),
      customSkills: [grantDeepdaze, idlePad],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [
          makeStep({ skillId: grantDeepdaze.id, hitCount: 1 }),
          makeStep({ skillId: idlePad.id, hitCount: 1 }),
          makeStep({ skillId: SKILL.herosBlood, hitCount: 2 }),
        ],
        openingStacks: { [STATUS.bingePoints]: 200 },
      }),
    })
    const window = deepdazeWindow(result)
    expect(window.endSec - window.startSec).toBeCloseTo(10, 1)
  })

  it("the ultimate's Deepdaze also gets the tier-3 extension", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      mindMethods: skyspeakAt(3),
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: SKILL.skystrikeGauntletsEx, hitCount: 1 })],
      }),
    })
    const window = deepdazeWindow(result)
    expect(window.endSec - window.startSec).toBeCloseTo(10, 1)
  })
})
