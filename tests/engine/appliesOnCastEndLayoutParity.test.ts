// docs/TIMELINE.md § Triggers: "A status the player only gains once the
// granting cast is over opens at that cast's end, declared on the trigger."
// The layout pass and pass 1 each keep their own status ledger and must
// apply this identically, or a step laid out mid-cast can see a grant the
// live scoring pass has not opened yet (or vice versa). Every skill and buff
// below is placeholder content authored only for this file.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function timelineInputs(rotation: Rotation, skills: Skill[], buffs: Buff[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    set: null,
  }
}

describe("a next cast landing between a granting hit's frame and its cast's end", () => {
  const granted = makeBuff(CLASS, { name: "Granted (test)", durationFrames: 600, effects: [] })
  const echo = makeBuff(CLASS, { name: "Echo (test)", durationFrames: 600, effects: [] })

  // Landing frame 10, well before Grants' own 60-frame cast ends — the case
  // an ordinary next rotation step can never reach on its own, since a step
  // always starts at the previous one's own end at the earliest.
  const midCast = makeSkill(CLASS, {
    name: "Mid Cast",
    castFrames: 6,
    hits: [
      makeHit({
        frame: 10,
        triggers: [
          {
            kind: "applyBuff",
            targetId: echo.id,
            stacks: 1,
            condition: { buffId: granted.id, op: "gte", stacks: 1 },
          },
        ],
      }),
    ],
  })

  const grants = makeSkill(CLASS, {
    name: "Grants",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          {
            kind: "applyBuff",
            targetId: granted.id,
            stacks: 1,
            condition: null,
            appliesOnCastEnd: true,
          },
          { kind: "castSkill", targetId: midCast.id, stacks: 0, condition: null },
        ],
      }),
    ],
  })

  const nextStep = makeSkill(CLASS, {
    name: "Next Step",
    castFrames: 20,
    // A legality flag reads the layout ledger directly (docs/TIMELINE.md §
    // "Cast legality") — this only holds if the layout ledger agrees Echo
    // was never granted, i.e. Granted had not opened yet at Mid Cast's frame.
    castConditions: [{ buffId: echo.id, op: "eq", stacks: 0 }],
    hits: [
      makeHit({
        frame: 0,
        physFixed: 1,
        variants: [
          {
            id: "next-step-boosted",
            label: "Boosted",
            conditions: [{ buffId: echo.id, op: "gte", stacks: 1 }],
            physMultiplier: 0,
            attributeMultiplier: 0,
            physFixed: 9999,
            attributeFixed: 0,
          },
        ],
      }),
    ],
  })

  const rotation = makeRotation(CLASS, {
    steps: [grants, nextStep].map((skill) => makeStep({ skillId: skill.id })),
  })
  const result = simulateTimeline(
    timelineInputs(rotation, [grants, midCast, nextStep], [granted, echo]),
  )

  it("the layout ledger shows the grant still closed at Mid Cast's frame, so Next Step stays legal", () => {
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(result.warnings.some((warning) => warning.includes("Next Step"))).toBe(false)
  })

  it("a hit variant reading the same grant sees exactly what pass 1 scores, not the boosted row", () => {
    const nextStepRow = result.perSkill.find((row) => row.name === "Next Step")
    expect(nextStepRow?.count).toBe(1)
    expect(nextStepRow?.expectedDamage).toBeLessThan(100)
  })
})
