import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { isHitTrigger, makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
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

function makeGate(patch: Partial<Buff> = {}): Buff {
  return makeBuff(CLASS, {
    name: "Gate",
    activation: "triggered",
    durationFrames: 6000,
    effects: [],
    maxStacks: 10,
    ...patch,
  })
}

function granter(gateId: string, stacks: number): Skill {
  return makeSkill(CLASS, {
    name: "Granter",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        triggers: [makeTrigger({ kind: "applyBuff", targetId: gateId, stacks })],
      }),
    ],
  })
}

function converter(sourceId: string, targetId: string): Skill {
  return makeSkill(CLASS, {
    name: "Converter",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          { ...makeTrigger({ kind: "applyBuff", targetId, stacks: 1 }), transferFrom: sourceId },
        ],
      }),
    ],
  })
}

function probe(): Skill {
  return makeSkill(CLASS, {
    name: "Probe",
    castFrames: 60,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
  })
}

function chipStacks(inputs: Inputs, castIndex: number, buffId: string): number {
  const cast = (simulateTimeline(inputs).casts ?? [])[castIndex]
  return cast?.buffs.find((buff) => buff.id === buffId)?.stacks ?? 0
}

describe("a trigger with transferFrom", () => {
  it("moves the source's stacks onto the target and empties the source", () => {
    const source = makeGate({ name: "Source" })
    const target = makeGate({ name: "Target" })
    const grant = granter(source.id, 4)
    const convert = converter(source.id, target.id)
    const after = probe()
    const inputs = timelineInputs(
      makeRotation(CLASS, {
        steps: [grant, convert, after].map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
      }),
      [grant, convert, after],
      [source, target],
    )
    expect(chipStacks(inputs, 2, target.id)).toBe(4)
    expect(chipStacks(inputs, 2, source.id)).toBe(0)
  })

  it("clamps the target at its cap", () => {
    const source = makeGate({ name: "Source", maxStacks: 10 })
    const target = makeGate({ name: "Target", maxStacks: 3 })
    const grant = granter(source.id, 7)
    const convert = converter(source.id, target.id)
    const after = probe()
    const inputs = timelineInputs(
      makeRotation(CLASS, {
        steps: [grant, convert, after].map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
      }),
      [grant, convert, after],
      [source, target],
    )
    expect(chipStacks(inputs, 2, target.id)).toBe(3)
    expect(chipStacks(inputs, 2, source.id)).toBe(0)
  })

  it("transfers nothing from a source whose window has lapsed", () => {
    const source = makeGate({ name: "Source", durationFrames: 30 })
    const target = makeGate({ name: "Target" })
    const grant = granter(source.id, 4)
    const convert = converter(source.id, target.id)
    const after = probe()
    const inputs = timelineInputs(
      makeRotation(CLASS, {
        steps: [grant, convert, after].map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
      }),
      [grant, convert, after],
      [source, target],
    )
    expect(chipStacks(inputs, 2, target.id)).toBe(0)
  })

  it("the target write reaching the cap fires the target's onMaxStacks", () => {
    const payout = makeGate({ name: "Payout", maxStacks: 1 })
    const source = makeGate({ name: "Source" })
    const target = makeGate({
      name: "Target",
      maxStacks: 4,
      onMaxStacks: [makeTrigger({ kind: "applyBuff", targetId: payout.id, stacks: 1 })],
    })
    const grant = granter(source.id, 4)
    const convert = converter(source.id, target.id)
    const after = probe()
    const inputs = timelineInputs(
      makeRotation(CLASS, {
        steps: [grant, convert, after].map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
      }),
      [grant, convert, after],
      [source, target, payout],
    )
    expect(chipStacks(inputs, 2, payout.id)).toBe(1)
  })

  it("a cast-length gate on the target sees the transferred count in the layout pass", () => {
    const source = makeGate({ name: "Source" })
    const target = makeGate({ name: "Target" })
    const grant = granter(source.id, 5)
    const convert = converter(source.id, target.id)
    const gated = makeSkill(CLASS, {
      name: "Gated",
      castFrames: 90,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          variants: [
            {
              id: "hv-transfer",
              label: "Transferred",
              conditions: [{ buffId: target.id, op: "gte", stacks: 5 }],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 1,
              attributeFixed: 0,
              castFrames: 30,
            },
          ],
        }),
      ],
    })
    const inputs = timelineInputs(
      makeRotation(CLASS, {
        steps: [grant, convert, gated].map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
      }),
      [grant, convert, gated],
      [source, target],
    )
    expect(simulateTimeline(inputs).rotationDuration).toBeCloseTo((60 + 60 + 30) / FPS, 10)
  })

  it("is rejected when combined with extendFrames", () => {
    const base = makeTrigger({ kind: "applyBuff", targetId: "target", stacks: 1 })
    expect(isHitTrigger({ ...base, transferFrom: "source" })).toBe(true)
    expect(isHitTrigger({ ...base, transferFrom: "source", extendFrames: 60 })).toBe(false)
    expect(isHitTrigger({ ...base, transferFrom: "" })).toBe(false)
  })
})
