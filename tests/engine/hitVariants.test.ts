import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"

import {
  makeSkill,
  makeHit,
  makeTrigger,
  selectHitVariant,
  type HitVariant,
  type Skill,
  type TriggerCondition,
} from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"
import { SET_ID } from "../../src/data/sets/ids"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

const CLASS = umbraInputs.classId

function timelineInputs(rotation: Rotation, skills: Skill[], buffs: Buff[] = []): Inputs {
  return {
    ...umbraInputs,
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
    durationFrames: 100,
    effects: [],
    ...patch,
  })
}

function makeGranter(gateId: string): Skill {
  return makeSkill(CLASS, {
    name: "Granter",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        triggers: [makeTrigger({ kind: "applyBuff", targetId: gateId, stacks: 1 })],
      }),
    ],
  })
}

describe("hit variants — coefficient swap", () => {
  it("condition unmet ⇒ the hit's BASE coefficients are used (matches the variant-less twin)", () => {
    const gate = makeGate()
    const variant: HitVariant = {
      id: "hv-1",
      label: "Empowered",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      physMultiplier: 5,
      attributeMultiplier: 0,
      physFixed: 500,
      attributeFixed: 0,
    }
    const empowered = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100, variants: [variant] })],
    })
    const plain = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })
    const rWith = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: empowered.id })] }),
        [empowered],
        [gate],
      ),
    )
    const rWithout = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: plain.id })] }),
        [plain],
        [gate],
      ),
    )
    expect(rWith.totalDamage).toBeGreaterThan(0)
    expect(rWith.totalDamage).toBeCloseTo(rWithout.totalDamage, 10)
  })

  it("condition met (gate applied by an earlier hit) ⇒ the variant's coefficients are used, exactly", () => {
    const gate = makeGate()
    const variant: HitVariant = {
      id: "hv-2",
      label: "Empowered",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      physMultiplier: 5,
      attributeMultiplier: 0,
      physFixed: 500,
      attributeFixed: 0,
    }
    const empowered = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100, variants: [variant] })],
    })
    const granter = makeGranter(gate.id)
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: granter.id }), makeStep({ skillId: empowered.id })],
    })
    const withVariant = simulateTimeline(
      timelineInputs(rotation, [granter, empowered], [gate]),
    ).totalDamage

    const control = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 5, physFixed: 500 })],
    })
    const controlTotal = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: granter.id }), makeStep({ skillId: control.id })],
        }),
        [granter, control],
        [gate],
      ),
    ).totalDamage

    expect(withVariant).toBeCloseTo(controlTotal, 10)
  })

  it("window expiry ⇒ falls back to the BASE row once the gate's window has lapsed", () => {
    const gate = makeGate({ durationFrames: 100 })
    const variant: HitVariant = {
      id: "hv-3",
      label: "Empowered",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      physMultiplier: 5,
      attributeMultiplier: 0,
      physFixed: 500,
      attributeFixed: 0,
    }
    const empowered = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100, variants: [variant] })],
    })
    const plain = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })
    const granter = makeGranter(gate.id)
    const filler = makeSkill(CLASS, {
      name: "Filler",
      castFrames: 200,
      hits: [makeHit({ frame: 0 })],
    })

    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: granter.id }),
        makeStep({ skillId: filler.id }),
        makeStep({ skillId: empowered.id }),
      ],
    })
    const withExpiredGate = simulateTimeline(
      timelineInputs(rotation, [granter, filler, empowered], [gate]),
    ).totalDamage

    const rotationPlain = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: granter.id }),
        makeStep({ skillId: filler.id }),
        makeStep({ skillId: plain.id }),
      ],
    })
    const baseline = simulateTimeline(
      timelineInputs(rotationPlain, [granter, filler, plain], [gate]),
    ).totalDamage

    expect(withExpiredGate).toBeCloseTo(baseline, 10)
  })

  it("a gate active at the cast's own start but expired by the hit's own landing frame still selects the variant", () => {
    const gate = makeGate({ durationFrames: 40 })
    const variant: HitVariant = {
      id: "hv-4",
      label: "Empowered",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      physMultiplier: 5,
      attributeMultiplier: 0,
      physFixed: 500,
      attributeFixed: 0,
    }
    const empowered = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 35, physMultiplier: 1, physFixed: 100, variants: [variant] })],
    })
    const plain = makeSkill(CLASS, {
      name: "Empowered",
      castFrames: 60,
      hits: [makeHit({ frame: 35, physMultiplier: 5, physFixed: 500 })],
    })
    const granter = makeSkill(CLASS, {
      name: "Granter",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 1 })],
        }),
      ],
    })

    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: granter.id }), makeStep({ skillId: empowered.id })],
    })
    const withLateLandingHit = simulateTimeline(
      timelineInputs(rotation, [granter, empowered], [gate]),
    ).totalDamage

    const rotationPlain = makeRotation(CLASS, {
      steps: [makeStep({ skillId: granter.id }), makeStep({ skillId: plain.id })],
    })
    const empoweredBaseline = simulateTimeline(
      timelineInputs(rotationPlain, [granter, plain], [gate]),
    ).totalDamage

    expect(withLateLandingHit).toBeCloseTo(empoweredBaseline, 10)
  })
})

describe("multi-condition trigger — AND semantics", () => {
  function buildScenario(applyA: boolean, applyB: boolean) {
    const gateA = makeGate({ name: "GateA", durationFrames: 1000 })
    const gateB = makeGate({ name: "GateB", durationFrames: 1000 })
    const sub = makeSkill(CLASS, {
      name: "Sub",
      castFrames: 60,
      hits: [makeHit({ physMultiplier: 1, physFixed: 999 })],
    })
    const main = makeSkill(CLASS, {
      name: "Main",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({
              kind: "castSkill",
              targetId: sub.id,
              condition: { buffId: gateA.id, op: "gte", stacks: 1 },
              conditions: [{ buffId: gateB.id, op: "gte", stacks: 1 }],
            }),
          ],
        }),
      ],
    })
    const granterA = makeGranter(gateA.id)
    const granterB = makeGranter(gateB.id)
    const steps = []
    if (applyA) steps.push(makeStep({ skillId: granterA.id }))
    if (applyB) steps.push(makeStep({ skillId: granterB.id }))
    steps.push(makeStep({ skillId: main.id }))
    const rotation = makeRotation(CLASS, { steps })
    return simulateTimeline(
      timelineInputs(rotation, [sub, main, granterA, granterB], [gateA, gateB]),
    )
  }

  it("fires only when BOTH the legacy condition and the extra conditions entry hold", () => {
    const both = buildScenario(true, true)
    expect(both.perSkill.find((s) => s.name === "Sub")).toBeTruthy()
  })

  it("does not fire with only the legacy `condition` satisfied", () => {
    const onlyA = buildScenario(true, false)
    expect(onlyA.perSkill.find((s) => s.name === "Sub")).toBeUndefined()
  })

  it("does not fire with only the extra `conditions` entry satisfied", () => {
    const onlyB = buildScenario(false, true)
    expect(onlyB.perSkill.find((s) => s.name === "Sub")).toBeUndefined()
  })
})

describe("selectHitVariant — pure selection helper", () => {
  it("returns the FIRST matching variant when two match, and null for a hit with no variants", () => {
    const v1: HitVariant = {
      id: "v1",
      label: "a",
      conditions: [],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }
    const v2: HitVariant = {
      id: "v2",
      label: "b",
      conditions: [],
      physMultiplier: 2,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }
    const hit = makeHit({ variants: [v1, v2] })
    expect(selectHitVariant(hit, () => true)?.id).toBe("v1")
    expect(selectHitVariant(makeHit(), () => true)).toBeNull()
  })
})

describe("no-op regression — a skill with neither variants nor extra conditions is unchanged", () => {
  it("matches an identical skill built the pre-feature way (plain hits/triggers only)", () => {
    const hitNew = makeHit({ physMultiplier: 2, physFixed: 50 })
    const skillNew = makeSkill(CLASS, { name: "Plain", castFrames: 60, hits: [hitNew] })
    const r = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps: [makeStep({ skillId: skillNew.id })] }), [
        skillNew,
      ]),
    )

    const legacyHit = {
      id: hitNew.id,
      frame: 0,
      physMultiplier: 2,
      attributeMultiplier: 0,
      physFixed: 50,
      attributeFixed: 0,
      extraCritDamage: 0,
      triggers: [],
    }
    const legacySkill = { ...skillNew, hits: [legacyHit] }
    const r2 = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps: [makeStep({ skillId: legacySkill.id })] }), [
        legacySkill,
      ]),
    )

    expect(r.totalDamage).toBeGreaterThan(0)
    expect(r.totalDamage).toBeCloseTo(r2.totalDamage, 10)
  })
})

describe("hit variant — cast-length override", () => {
  function skillWithVariant(variant: HitVariant, opts: { secondHitVariant?: HitVariant } = {}) {
    const hits = [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1, variants: [variant] })]
    if (opts.secondHitVariant) {
      hits.push(
        makeHit({ frame: 10, physMultiplier: 1, physFixed: 1, variants: [opts.secondHitVariant] }),
      )
    }
    return makeSkill(CLASS, { name: "Variant carrier", castFrames: 90, hits })
  }

  function durationSec(skill: Skill, buffs: Buff[] = []) {
    return simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: skill.id })],
        }),
        [skill],
        buffs,
      ),
    ).rotationDuration
  }

  it("an active variant's override drives the cast length instead of the skill-level value", () => {
    const skill = skillWithVariant({
      id: "hv-cast-1",
      label: "Longer",
      conditions: [],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      castFrames: 30,
    })
    expect(durationSec(skill)).toBeCloseTo(30 / FPS, 10)
  })

  it("an unmet condition leaves the skill-level cast length in force", () => {
    const gate = makeGate({ maxStacks: 10 })
    const skill = skillWithVariant({
      id: "hv-cast-2",
      label: "Longer",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 5 }],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      castFrames: 30,
    })
    expect(durationSec(skill, [gate])).toBeCloseTo(90 / FPS, 10)
  })

  it("a condition met by the rotation's declared opening stacks activates the override", () => {
    const gate = makeGate({ maxStacks: 10 })
    const skill = skillWithVariant({
      id: "hv-cast-3",
      label: "Longer",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 5 }],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      castFrames: 30,
    })
    const seconds = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: skill.id })],
          openingStacks: { [gate.id]: 7 },
        }),
        [skill],
        [gate],
      ),
    ).rotationDuration
    expect(seconds).toBeCloseTo(30 / FPS, 10)
  })

  it("the skill-level not-yet-measured sentinel on a variant counts as no override", () => {
    const skill = skillWithVariant({
      id: "hv-cast-4",
      label: "Unmeasured",
      conditions: [],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      castFrames: -1,
    })
    expect(durationSec(skill)).toBeCloseTo(90 / FPS, 10)
  })

  it("of several hits each selecting an active variant, the first in authoring order decides", () => {
    const skill = skillWithVariant(
      {
        id: "hv-cast-5a",
        label: "First",
        conditions: [],
        physMultiplier: 1,
        attributeMultiplier: 0,
        physFixed: 1,
        attributeFixed: 0,
        castFrames: 20,
      },
      {
        secondHitVariant: {
          id: "hv-cast-5b",
          label: "Second",
          conditions: [],
          physMultiplier: 1,
          attributeMultiplier: 0,
          physFixed: 1,
          attributeFixed: 0,
          castFrames: 50,
        },
      },
    )
    expect(durationSec(skill)).toBeCloseTo(20 / FPS, 10)
  })

  it("a condition met by a MID-FIGHT trigger (not the rotation's opening state) activates the override", () => {
    const gate = makeGate({ maxStacks: 10 })
    const granter = makeSkill(CLASS, {
      name: "Granter",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: gate.id, stacks: 5 })],
        }),
      ],
    })
    const skill = skillWithVariant({
      id: "hv-cast-6",
      label: "Longer",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 5 }],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      castFrames: 30,
    })
    const seconds = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: granter.id }), makeStep({ skillId: skill.id })],
        }),
        [granter, skill],
        [gate],
      ),
    ).castDuration
    expect(seconds).toBeCloseTo((60 + 30) / FPS, 10)
  })
})

describe("hit variant — frame override", () => {
  function skillWithFrameVariant(variant: HitVariant) {
    return makeSkill(CLASS, {
      name: "Frame carrier",
      castFrames: 90,
      hits: [makeHit({ frame: 10, physMultiplier: 1, physFixed: 1, variants: [variant] })],
    })
  }

  function hitFrameOf(skill: Skill, buffs: Buff[] = [], leadingStep?: Skill) {
    const steps = leadingStep
      ? [makeStep({ skillId: leadingStep.id }), makeStep({ skillId: skill.id })]
      : [makeStep({ skillId: skill.id })]
    const skills = leadingStep ? [leadingStep, skill] : [skill]
    const result = simulateTimeline(timelineInputs(makeRotation(CLASS, { steps }), skills, buffs))
    return result.timeline?.find((event) => event.skillName === skill.name)?.frame
  }

  it("an active variant's frame replaces the hit's own landing frame", () => {
    const skill = skillWithFrameVariant({
      id: "hv-frame-1",
      label: "Later",
      conditions: [],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      frame: 40,
    })
    expect(hitFrameOf(skill)).toBe(40)
  })

  it("an unmet condition leaves the hit's own frame in force", () => {
    const gate = makeGate({ maxStacks: 10 })
    const skill = skillWithFrameVariant({
      id: "hv-frame-2",
      label: "Later",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 5 }],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      frame: 40,
    })
    expect(hitFrameOf(skill, [gate])).toBe(10)
  })

  it("a condition met by an earlier step's mid-fight trigger moves the hit's frame too", () => {
    const gate = makeGate({ maxStacks: 10 })
    const granter = makeGranter(gate.id)
    const skill = skillWithFrameVariant({
      id: "hv-frame-3",
      label: "Later",
      conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      physMultiplier: 1,
      attributeMultiplier: 0,
      physFixed: 1,
      attributeFixed: 0,
      frame: 40,
    })
    expect(hitFrameOf(skill, [gate], granter)).toBe(60 + 40)
  })
})

// The buff engine's prepass (docs/TIMELINE.md § "Hit variants") is fed
// exclusively from this walk, ahead of the real simulation — the class-buff
// system's own Cleftpeak stack (a build-wide, ungated-by-skill "every
// damaging hit grants a stack" module) is the only externally observable
// read of what the prepass believes a hit's own landing frame was.
describe("hit variant frame override — seen by the buff-engine prepass", () => {
  function skillGrantingAt(variantFrame: number): Skill {
    return makeSkill(CLASS, {
      name: "Prepass Frame Carrier",
      castFrames: 110,
      hits: [
        makeHit({ frame: 50, physMultiplier: 1, physFixed: 1000 }),
        makeHit({
          frame: 10,
          physMultiplier: 1,
          physFixed: 1,
          variants: [
            {
              id: "hv-prepass-frame",
              label: "Later",
              conditions: [],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 1,
              attributeFixed: 0,
              frame: variantFrame,
            },
          ],
        }),
      ],
    })
  }

  function damageOfFixedHit(variantFrame: number): number {
    const skill = skillGrantingAt(variantFrame)
    const inputs: Inputs = {
      ...umbraInputs,
      customSkills: [skill],
      customBuffs: [],
      activeCustomRotation: makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] }),
      set: SET_ID.cleftpeak,
    }
    return simulateTimeline(inputs).timeline!.find((event) => event.frame === 50)!.damage
  }

  it("a later variant frame delays the stack this hit grants, so an earlier fixed hit in the same cast lands before it, unboosted", () => {
    // Granting before frame 50 (the fixed hit) lets its stack reach that hit;
    // granting after it, at the resolved variant frame, does not — the
    // prepass would only blur this distinction by reading the bare frame 10
    // (itself before 50) regardless of which case is under test.
    const grantsBeforeFixedHit = damageOfFixedHit(5)
    const grantsAfterFixedHit = damageOfFixedHit(100)
    expect(grantsAfterFixedHit).toBeLessThan(grantsBeforeFixedHit)
    const shortfall = 1 - grantsAfterFixedHit / grantsBeforeFixedHit
    expect(shortfall).toBeGreaterThan(0.005)
    expect(shortfall).toBeLessThan(0.02)
  })
})

describe("conditional hits — a hit that occurs only when its own conditions hold", () => {
  function skillWithConditionalHit(conditions: TriggerCondition[]) {
    return makeSkill(CLASS, {
      name: "Conditional",
      castFrames: 60,
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 }),
        makeHit({ frame: 10, physMultiplier: 1, physFixed: 100, conditions }),
      ],
    })
  }

  it("unmet ⇒ the hit deals no damage, matching the hit-1-less twin exactly", () => {
    const gate = makeGate()
    const skill = skillWithConditionalHit([{ buffId: gate.id, op: "gte", stacks: 1 }])
    const withGate = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] }),
        [skill],
        [gate],
      ),
    )
    const firstHitOnly = makeSkill(CLASS, {
      name: "Conditional",
      castFrames: 60,
      hits: [skill.hits[0]],
    })
    const singleHitOnly = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: firstHitOnly.id })] }),
        [firstHitOnly],
        [gate],
      ),
    )
    expect(withGate.totalDamage).toBeCloseTo(singleHitOnly.totalDamage, 10)
  })

  it("met by an earlier step's mid-fight trigger ⇒ the hit lands, and its own trigger fires too", () => {
    const gate = makeGate()
    const marker = makeGate({ name: "Marker" })
    const granter = makeGranter(gate.id)
    const skill = makeSkill(CLASS, {
      name: "Conditional",
      castFrames: 60,
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 }),
        makeHit({
          frame: 10,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
          triggers: [makeTrigger({ kind: "applyBuff", targetId: marker.id, stacks: 1 })],
        }),
      ],
    })
    const reader = makeSkill(CLASS, {
      name: "Reader",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          variants: [
            {
              id: "hv-marker",
              label: "Marked",
              conditions: [{ buffId: marker.id, op: "gte", stacks: 1 }],
              physMultiplier: 10,
              attributeMultiplier: 0,
              physFixed: 1000,
              attributeFixed: 0,
            },
          ],
        }),
      ],
    })
    const stepsWithGranter = [
      makeStep({ skillId: granter.id }),
      makeStep({ skillId: skill.id }),
      makeStep({ skillId: reader.id }),
    ]
    const gateHeld = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: stepsWithGranter }),
        [granter, skill, reader],
        [gate, marker],
      ),
    )
    const gateUnheld = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: skill.id }), makeStep({ skillId: reader.id })],
        }),
        [granter, skill, reader],
        [gate, marker],
      ),
    )
    const readerDamage = (r: typeof gateHeld) =>
      r.perSkill.find((s) => s.name === "Reader")?.expectedDamage
    expect(readerDamage(gateHeld)).toBeGreaterThan(readerDamage(gateUnheld) ?? 0)
  })
})
