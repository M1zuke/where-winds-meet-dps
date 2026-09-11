import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import {
  isHitTrigger,
  makeHit,
  makeSkill,
  makeTrigger,
  type HitTrigger,
  type Skill,
} from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { isBuff, makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const EXHAUSTED_FROM_SEC = 1
const EXHAUSTED_FOR_SEC = 2

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[],
  patch: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    set: null,
    ...patch,
  }
}

function rotationOf(skills: Skill[], patch: Partial<Rotation> = {}): Rotation {
  return makeRotation(CLASS, {
    steps: skills.map((skill) => makeStep({ skillId: skill.id, hitCount: 1 })),
    ...patch,
  })
}

const withBreakWindow: Partial<Rotation> = {
  qiBreak: { startSec: EXHAUSTED_FROM_SEC, durationSec: EXHAUSTED_FOR_SEC, lowQiLeadSec: 0 },
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

function granter(trigger: HitTrigger, name = "Granter"): Skill {
  return makeSkill(CLASS, {
    name,
    castFrames: 60,
    hits: [makeHit({ frame: 0, triggers: [trigger] })],
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

describe("a trigger bound to a Qi phase", () => {
  it("fires only while the clock-driven phase matches", () => {
    const gate = makeGate()
    const grant = granter(
      makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1, phase: "exhausted" }),
    )
    const beforeBreak = probe()
    const duringBreak = probe()
    const skills = [grant, beforeBreak, grant, duringBreak]
    const inputs = timelineInputs(rotationOf(skills, withBreakWindow), skills, [gate])
    expect(chipStacks(inputs, 1, gate.id)).toBe(0)
    expect(chipStacks(inputs, 3, gate.id)).toBe(1)
  })

  it("the layout pass sees the phase-gated grant when sizing a cast", () => {
    const gate = makeGate()
    const grant = granter(
      makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1, phase: "exhausted" }),
    )
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
              id: "hv-phase",
              label: "Marked",
              conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
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
    const skills = [grant, gated, grant, gated]
    const inputs = timelineInputs(rotationOf(skills, withBreakWindow), skills, [gate])
    expect(simulateTimeline(inputs).rotationDuration).toBeCloseTo((60 + 90 + 60 + 30) / FPS, 10)
  })
})

describe("a trigger with its own cooldown", () => {
  it("fires first time and again only once the cooldown has passed", () => {
    const gate = makeGate()
    const grant = granter(
      makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1, cooldownFrames: 100 }),
    )
    const after = probe()
    const skills = [grant, grant, grant, after]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate])
    expect(chipStacks(inputs, 3, gate.id)).toBe(2)
  })

  it("an attempt blocked by its conditions does not start the cooldown", () => {
    const key = makeGate({ name: "Key" })
    const gate = makeGate()
    const grant = granter(
      makeTrigger({
        kind: "applyBuff",
        targetId: gate.id,
        stacks: 1,
        cooldownFrames: 1000,
        conditions: [{ buffId: key.id, op: "gte", stacks: 1 }],
      }),
    )
    const unlock = granter(
      makeTrigger({ kind: "applyBuff", targetId: key.id, stacks: 1 }),
      "Unlock",
    )
    const after = probe()
    const skills = [grant, unlock, grant, after]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate, key])
    expect(chipStacks(inputs, 3, gate.id)).toBe(1)
  })

  it("a generated cast honours the cooldown", () => {
    const gate = makeGate()
    const sub = makeSkill(CLASS, {
      name: "Sub",
      castFrames: 0,
      triggerable: true,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1 })],
        }),
      ],
    })
    const caster = granter(
      makeTrigger({ kind: "castSkill", targetId: sub.id, stacks: 1, cooldownFrames: 100 }),
      "Caster",
    )
    const after = probe()
    const skills = [caster, caster, caster, after]
    const inputs = timelineInputs(rotationOf(skills), [...skills, sub], [gate])
    expect(chipStacks(inputs, 3, gate.id)).toBe(2)
  })
})

describe("a marker with requiresMinTier", () => {
  const param = "testMarkerParam"

  function markerInputs(tier: number): { inputs: Inputs; gate: Buff } {
    const gate = makeGate({ requiresParam: param, requiresMinTier: 4 })
    const grant = granter(makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1 }))
    const after = probe()
    const skills = [grant, after]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate], {
      buffParams: { [param]: true, [`${param}Tier`]: tier },
    })
    return { inputs, gate }
  }

  it("is dropped below the tier and kept from it", () => {
    const below = markerInputs(3)
    expect(chipStacks(below.inputs, 1, below.gate.id)).toBe(0)
    const at = markerInputs(4)
    expect(chipStacks(at.inputs, 1, at.gate.id)).toBe(1)
  })

  it("is rejected without requiresParam", () => {
    expect(isBuff(makeGate({ requiresParam: param, requiresMinTier: 4 }))).toBe(true)
    expect(isBuff(makeGate({ requiresMinTier: 4 }))).toBe(false)
  })
})

describe("isHitTrigger", () => {
  const base = makeTrigger({ kind: "applyBuff", targetId: "target", stacks: 1 })

  it("accepts only the three Qi phases", () => {
    expect(isHitTrigger({ ...base, phase: "exhausted" })).toBe(true)
    expect(isHitTrigger({ ...base, phase: "stagger" })).toBe(false)
  })

  it("accepts only a finite non-negative cooldown", () => {
    expect(isHitTrigger({ ...base, cooldownFrames: 0 })).toBe(true)
    expect(isHitTrigger({ ...base, cooldownFrames: -1 })).toBe(false)
    expect(isHitTrigger({ ...base, cooldownFrames: Number.NaN })).toBe(false)
  })
})
