import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import {
  makeSkill,
  makeHit,
  makeTrigger,
  type HitVariant,
  type Skill,
} from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
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

function gate(patch: Partial<Buff>): Buff {
  return makeBuff(CLASS, { name: "Gate", activation: "triggered", effects: [], ...patch })
}

function filler(name: string, castFrames: number, triggers = [] as Skill["hits"][0]["triggers"]) {
  return makeSkill(CLASS, {
    name,
    castFrames,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1, triggers })],
  })
}

function stacksOnCast(result: ReturnType<typeof simulateTimeline>, index: number, id: string) {
  return result.casts?.[index]?.buffs.find((chip) => chip.id === id)?.stacks
}

describe("onExpire — a lapsing window resets another status", () => {
  const counter = gate({ name: "Counter", durationFrames: 36000, maxStacks: 200 })
  const state = gate({
    name: "State",
    durationFrames: 80,
    maxStacks: 1,
    onExpire: { targetId: counter.id, stacks: 60 },
  })
  const gatedVariant: HitVariant = {
    id: "hv-gated",
    label: "Gated",
    conditions: [{ buffId: counter.id, op: "gte", stacks: 200 }],
    physMultiplier: 1,
    attributeMultiplier: 0,
    physFixed: 1,
    attributeFixed: 0,
    castFrames: 30,
  }
  const opener = filler("Opener", 60, [
    makeTrigger({ kind: "applyBuff", targetId: counter.id, stacks: 200 }),
    makeTrigger({ kind: "applyBuff", targetId: state.id, stacks: 1 }),
  ])
  const gated = makeSkill(CLASS, {
    name: "Gated",
    castFrames: 90,
    hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1, variants: [gatedVariant] })],
  })

  it("sets the target at the lapse frame, so a later cast's variant no longer holds and the chip shows the reset", () => {
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: opener.id, hitCount: 1 }),
            makeStep({ skillId: gated.id, hitCount: 1 }),
            makeStep({ skillId: gated.id, hitCount: 1 }),
          ],
        }),
        [opener, gated],
        [counter, state],
      ),
    )
    expect(stacksOnCast(result, 0, counter.id)).toBe(200)
    expect(stacksOnCast(result, 2, counter.id)).toBe(60)
    expect(result.rotationDuration).toBeCloseTo((60 + 30 + 90) / FPS, 10)
  })

  it("a refreshed window does not fire; only the final lapse does", () => {
    const refresher = filler("Refresher", 60, [
      makeTrigger({ kind: "applyBuff", targetId: state.id, stacks: 1 }),
    ])
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: opener.id, hitCount: 1 }),
            makeStep({ skillId: refresher.id, hitCount: 1 }),
            makeStep({ skillId: gated.id, hitCount: 1 }),
            makeStep({ skillId: gated.id, hitCount: 1 }),
          ],
        }),
        [opener, refresher, gated],
        [counter, state],
      ),
    )
    expect(stacksOnCast(result, 1, counter.id)).toBe(200)
    expect(stacksOnCast(result, 3, counter.id)).toBe(60)
    expect(result.rotationDuration).toBeCloseTo((60 + 60 + 30 + 90) / FPS, 10)
  })
})

describe("stacksPerDamagingHit — a counter built by direct damage", () => {
  it("grants once per cooldown and clamps at the cap", () => {
    const counter = gate({
      name: "Counter",
      durationFrames: 36000,
      maxStacks: 3,
      stacksPerDamagingHit: { cooldownFrames: 100 },
    })
    const quick = filler("Quick", 30)
    const steps = Array.from({ length: 12 }, () => makeStep({ skillId: quick.id, hitCount: 1 }))
    const result = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps }), [quick], [counter]),
    )
    const stacks = steps.map((_, index) => stacksOnCast(result, index, counter.id))
    expect(stacks).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
  })

  it("the granting hit's own triggers see the new count", () => {
    const counter = gate({
      name: "Counter",
      durationFrames: 36000,
      maxStacks: 5,
      stacksPerDamagingHit: { cooldownFrames: 1 },
    })
    const marker = gate({ name: "Marker", durationFrames: 600, maxStacks: 1 })
    const reader = filler("Reader", 60, [
      makeTrigger({
        kind: "applyBuff",
        targetId: marker.id,
        stacks: 1,
        conditions: [{ buffId: counter.id, op: "gte", stacks: 1 }],
      }),
    ])
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: reader.id, hitCount: 1 })] }),
        [reader],
        [counter, marker],
      ),
    )
    expect(stacksOnCast(result, 0, marker.id)).toBe(1)
  })
})

describe("onMaxStacks — a counter pays out at its cap", () => {
  const payout = gate({ name: "Payout", durationFrames: 900, maxStacks: 1 })
  const resource = gate({ name: "Resource", durationFrames: 36000, maxStacks: 200 })
  const timed = gate({ name: "Timed", durationFrames: 70, maxStacks: 1 })

  function counterWithPayout(): Buff {
    return gate({
      name: "Counter",
      durationFrames: 36000,
      maxStacks: 3,
      stacksPerDamagingHit: { cooldownFrames: 1 },
      onMaxStacks: [
        makeTrigger({ kind: "applyBuff", targetId: payout.id, stacks: 1 }),
        makeTrigger({ kind: "applyBuff", targetId: resource.id, stacks: 200 }),
        makeTrigger({
          kind: "applyBuff",
          targetId: timed.id,
          stacks: 1,
          extendFrames: 300,
          extendOnly: true,
        }),
      ],
    })
  }

  it("fires exactly once when the cap is reached, applies its triggers, and extends only an active window", () => {
    const counter = counterWithPayout()
    const quick = filler("Quick", 30)
    const timer = filler("Timer", 30, [
      makeTrigger({ kind: "applyBuff", targetId: timed.id, stacks: 1 }),
    ])
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: timer.id, hitCount: 1 }),
            makeStep({ skillId: quick.id, hitCount: 1 }),
            makeStep({ skillId: quick.id, hitCount: 1 }),
            makeStep({ skillId: quick.id, hitCount: 1 }),
          ],
        }),
        [quick, timer],
        [counter, payout, resource, timed],
      ),
    )
    expect(stacksOnCast(result, 1, payout.id)).toBeUndefined()
    expect(stacksOnCast(result, 1, resource.id)).toBeUndefined()
    expect(stacksOnCast(result, 2, counter.id)).toBe(3)
    expect(stacksOnCast(result, 2, resource.id)).toBe(200)
    expect(stacksOnCast(result, 2, payout.id)).toBe(1)
    expect(stacksOnCast(result, 3, payout.id)).toBe(1)
    expect(result.casts?.[3]?.buffs.find((chip) => chip.id === timed.id)).toBeDefined()
  })

  it("a self-lowering trigger clears the counter on payout without recursing", () => {
    const counter = gate({
      name: "Counter",
      durationFrames: 36000,
      maxStacks: 2,
      stacksPerDamagingHit: { cooldownFrames: 1 },
    })
    counter.onMaxStacks = [
      makeTrigger({ kind: "applyBuff", targetId: payout.id, stacks: 1 }),
      makeTrigger({ kind: "applyBuff", targetId: counter.id, stacks: -2 }),
    ]
    const quick = filler("Quick", 30)
    const steps = Array.from({ length: 5 }, () => makeStep({ skillId: quick.id, hitCount: 1 }))
    const result = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps }), [quick], [counter, payout]),
    )
    const counts = steps.map((_, index) => stacksOnCast(result, index, counter.id))
    expect(counts).toEqual([1, 0, 1, 0, 1])
    expect(stacksOnCast(result, 1, payout.id)).toBe(1)
    expect(stacksOnCast(result, 3, payout.id)).toBe(1)
  })

  it("an opening seed that lands on the cap fires the payout at the span start", () => {
    const counter = counterWithPayout()
    const quick = filler("Quick", 30)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: quick.id, hitCount: 1 })],
          openingStacks: { [counter.id]: 3 },
        }),
        [quick],
        [counter, payout, resource, timed],
      ),
    )
    expect(stacksOnCast(result, 0, resource.id)).toBe(200)
    expect(stacksOnCast(result, 0, payout.id)).toBe(1)
  })
})
