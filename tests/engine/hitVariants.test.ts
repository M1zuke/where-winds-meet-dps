import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"

import {
  makeSkill,
  makeHit,
  makeTrigger,
  selectHitVariant,
  type HitVariant,
  type Skill,
} from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

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
        makeRotation(CLASS, { steps: [makeStep({ skillId: empowered.id, hitCount: 1 })] }),
        [empowered],
        [gate],
      ),
    )
    const rWithout = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: plain.id, hitCount: 1 })] }),
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
      steps: [
        makeStep({ skillId: granter.id, hitCount: 1 }),
        makeStep({ skillId: empowered.id, hitCount: 1 }),
      ],
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
          steps: [
            makeStep({ skillId: granter.id, hitCount: 1 }),
            makeStep({ skillId: control.id, hitCount: 1 }),
          ],
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
        makeStep({ skillId: granter.id, hitCount: 1 }),
        makeStep({ skillId: filler.id, hitCount: 1 }),
        makeStep({ skillId: empowered.id, hitCount: 1 }),
      ],
    })
    const withExpiredGate = simulateTimeline(
      timelineInputs(rotation, [granter, filler, empowered], [gate]),
    ).totalDamage

    const rotationPlain = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: granter.id, hitCount: 1 }),
        makeStep({ skillId: filler.id, hitCount: 1 }),
        makeStep({ skillId: plain.id, hitCount: 1 }),
      ],
    })
    const baseline = simulateTimeline(
      timelineInputs(rotationPlain, [granter, filler, plain], [gate]),
    ).totalDamage

    expect(withExpiredGate).toBeCloseTo(baseline, 10)
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
    if (applyA) steps.push(makeStep({ skillId: granterA.id, hitCount: 1 }))
    if (applyB) steps.push(makeStep({ skillId: granterB.id, hitCount: 1 }))
    steps.push(makeStep({ skillId: main.id, hitCount: 1 }))
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
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: skillNew.id, hitCount: 1 })] }),
        [skillNew],
      ),
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
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: legacySkill.id, hitCount: 1 })] }),
        [legacySkill],
      ),
    )

    expect(r.totalDamage).toBeGreaterThan(0)
    expect(r.totalDamage).toBeCloseTo(r2.totalDamage, 10)
  })
})
