// Skills, buffs and debuffs below are placeholder content authored only for this file, except the built-in buff the declared-buff test grants.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const RECALL_TAG = "singlePassRecall"

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[],
  debuffs: Debuff[] = [],
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
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

function pulsingDebuff(patch: Partial<Debuff>): Debuff {
  return makeDebuff(CLASS, {
    name: "Pulse",
    maxStacks: 1,
    dot: {
      tickIntervalFrames: 30,
      physMultiplier: 0,
      physFixed: 1,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
    },
    ...patch,
  })
}

function tickCount(result: ReturnType<typeof simulateTimeline>, debuff: Debuff): number {
  return result.perSkill.find((row) => row.name === `${debuff.name} (DoT)`)?.count ?? 0
}

describe("a trigger declared for the end of its cast", () => {
  it("reads the statuses standing at the cast's end, not at the hit that declared it", () => {
    const ready = gate({ name: "Ready", durationFrames: 600, maxStacks: 1 })
    const marker = gate({ name: "Marker", durationFrames: 600, maxStacks: 1 })
    const grants = makeSkill(CLASS, {
      name: "Grants",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "applyBuff",
              targetId: marker.id,
              stacks: 1,
              conditions: [{ buffId: ready.id, op: "gte", stacks: 1 }],
              appliesOnCastEnd: true,
            }),
          ],
        }),
        makeHit({
          frame: 10,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: ready.id, stacks: 1 })],
        }),
      ],
    })
    const markerHeld = { buffId: marker.id, op: "gte", stacks: 1 } as const
    const next = {
      ...makeSkill(CLASS, {
        name: "Next",
        castFrames: 30,
        hits: [
          makeHit({
            frame: 0,
            physFixed: 1,
            variants: [
              {
                id: "next-boosted",
                label: "Boosted",
                conditions: [markerHeld],
                physMultiplier: 0,
                attributeMultiplier: 0,
                physFixed: 9999,
                attributeFixed: 0,
              },
            ],
          }),
        ],
      }),
      castConditions: [markerHeld],
    }
    const steps = [makeStep({ skillId: grants.id }), makeStep({ skillId: next.id })]
    const result = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps }), [grants, next], [ready, marker]),
    )
    expect(stacksOnCast(result, 1, marker.id)).toBe(1)
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(result.perSkill.find((row) => row.name === "Next")!.expectedDamage).toBeGreaterThan(9000)
  })
})

describe("a recalled debuff", () => {
  it("is gone for a condition read by the recalling step's own hits", () => {
    const target = makeDebuff(CLASS, {
      name: "Target",
      durationFrames: 600,
      recall: { tag: RECALL_TAG },
    })
    const marker = gate({ name: "Marker", durationFrames: 600, maxStacks: 1 })
    const applier = filler("Applier", 30, [
      makeTrigger({ kind: "applyDebuff", targetId: target.id, stacks: 1 }),
    ])
    const recaller = makeSkill(CLASS, {
      name: "Recaller",
      castFrames: 60,
      tags: [RECALL_TAG],
      hits: [
        makeHit({
          frame: 10,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "applyBuff",
              targetId: marker.id,
              stacks: 1,
              conditions: [{ buffId: target.id, op: "gte", stacks: 1 }],
            }),
          ],
        }),
      ],
    })
    const after = filler("After", 30)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: applier.id }),
            makeStep({ skillId: recaller.id }),
            makeStep({ skillId: after.id }),
          ],
        }),
        [applier, recaller, after],
        [marker],
        [target],
      ),
    )
    expect(stacksOnCast(result, 2, marker.id)).toBeUndefined()
  })

  it("stops pulsing at the recall, so only the pulses before it tick", () => {
    const pulse = pulsingDebuff({ durationFrames: 600, recall: { tag: RECALL_TAG } })
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 100,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: pulse.id, stacks: 1 })],
        }),
      ],
    })
    const recaller = makeSkill(CLASS, {
      name: "Recaller",
      castFrames: 301,
      tags: [RECALL_TAG],
      hits: [makeHit({ frame: 0, physFixed: 1 }), makeHit({ frame: 300, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: applier.id }), makeStep({ skillId: recaller.id })],
        }),
        [applier, recaller],
        [],
        [pulse],
      ),
    )
    expect(tickCount(result, pulse)).toBe(3)
  })
})

describe("a damage-over-time window", () => {
  it("keeps pulsing when a later extension lengthens it past the last pulse planned", () => {
    const pulse = pulsingDebuff({ durationFrames: 60 })
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 160,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: pulse.id, stacks: 1 })],
        }),
        makeHit({
          frame: 40,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "applyDebuff",
              targetId: pulse.id,
              stacks: 1,
              extendFrames: 60,
              extendOnly: true,
            }),
          ],
        }),
        makeHit({ frame: 150, physFixed: 1 }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: applier.id })] }),
        [applier],
        [],
        [pulse],
      ),
    )
    expect(tickCount(result, pulse)).toBe(3)
  })
})

describe("a damage-over-time tick that grants a declared buff", () => {
  it("is seen by a later hit deciding whether to cast a generated skill", () => {
    const pulse = pulsingDebuff({ durationFrames: 600, triggersBuffs: [BUFF.mirage] })
    const generated = makeSkill(CLASS, {
      name: "Generated",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 120,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: pulse.id, stacks: 1 })],
        }),
        makeHit({
          frame: 100,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "castSkill",
              targetId: generated.id,
              conditions: [{ buffId: BUFF.mirage, op: "gte", stacks: 1, source: "buffEngine" }],
            }),
          ],
        }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: caster.id })] }),
        [caster, generated],
        [],
        [pulse],
      ),
    )
    expect(result.perSkill.find((row) => row.name === "Generated")?.count).toBe(1)
  })
})

describe("a status expiring on the frame of a hit", () => {
  it("lets that hit read the status as it stood before the expiry's reset", () => {
    const counter = gate({ name: "Counter", durationFrames: 36000, maxStacks: 200 })
    const state = gate({
      name: "State",
      durationFrames: 80,
      maxStacks: 1,
      onExpire: { targetId: counter.id, stacks: 60 },
    })
    const marker = gate({ name: "Marker", durationFrames: 600, maxStacks: 1 })
    const opener = filler("Opener", 60, [
      makeTrigger({ kind: "applyBuff", targetId: counter.id, stacks: 200 }),
      makeTrigger({ kind: "applyBuff", targetId: state.id, stacks: 1 }),
    ])
    const reader = makeSkill(CLASS, {
      name: "Reader",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 20,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "applyBuff",
              targetId: marker.id,
              stacks: 1,
              conditions: [{ buffId: counter.id, op: "gte", stacks: 200 }],
            }),
          ],
        }),
      ],
    })
    const after = filler("After", 30)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: opener.id }),
            makeStep({ skillId: reader.id }),
            makeStep({ skillId: after.id }),
          ],
        }),
        [opener, reader, after],
        [counter, state, marker],
      ),
    )
    expect(stacksOnCast(result, 2, marker.id)).toBe(1)
    expect(stacksOnCast(result, 2, counter.id)).toBe(60)
  })
})

function dotFrames(result: ReturnType<typeof simulateTimeline>): number[] {
  return (result.timeline ?? []).filter((event) => event.kind === "dot").map((event) => event.frame)
}

function hitFrameOf(result: ReturnType<typeof simulateTimeline>, skillName: string): number {
  return (result.timeline ?? []).find((event) => event.skillName === skillName)!.frame
}

describe("a damage-over-time debuff whose windows overlap", () => {
  it("pulses once per interval on the grid of the first window", () => {
    const pulse = pulsingDebuff({ durationFrames: 100 })
    const applyPulse = [makeTrigger({ kind: "applyDebuff", targetId: pulse.id, stacks: 1 })]
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 300,
      hits: [
        makeHit({ frame: 0, physFixed: 1, triggers: applyPulse }),
        makeHit({ frame: 90, physFixed: 1, triggers: applyPulse }),
        makeHit({ frame: 250, physFixed: 1 }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: applier.id })] }),
        [applier],
        [],
        [pulse],
      ),
    )
    const castStart = hitFrameOf(result, "Applier")
    expect(dotFrames(result)).toEqual(
      [30, 60, 90, 120, 150, 180].map((offset) => castStart + offset),
    )
  })
})

describe("a hit landing after the end of its own cast", () => {
  const marker = gate({
    name: "Marker",
    durationFrames: 600,
    maxStacks: 1,
  })
  const lateGrant = makeSkill(CLASS, {
    name: "Late Grant",
    castFrames: 5,
    hits: [
      makeHit({
        frame: 40,
        physFixed: 1,
        triggers: [
          makeTrigger({
            kind: "applyBuff",
            targetId: marker.id,
            stacks: 1,
            appliesOnCastEnd: true,
          }),
        ],
      }),
    ],
  })
  const markerHeld = { buffId: marker.id, op: "gte", stacks: 1 } as const
  const markerAbsent = { buffId: marker.id, op: "eq", stacks: 0 } as const

  function boostedReader(name: string, castFrames: number) {
    return makeSkill(CLASS, {
      name,
      castFrames,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          variants: [
            {
              id: `${name}-boosted`,
              label: "Boosted",
              conditions: [markerHeld],
              physMultiplier: 0,
              attributeMultiplier: 0,
              physFixed: 9999,
              attributeFixed: 0,
            },
          ],
        }),
      ],
    })
  }

  it("applies at the hit's frame for a cast legality read in the layout pass", () => {
    const early = { ...filler("Early", 10), castConditions: [markerAbsent] }
    const wait = filler("Wait", 60)
    const late = { ...filler("Late", 10), castConditions: [markerHeld] }
    const tooSoon = { ...filler("Too Soon", 10), castConditions: [markerHeld] }
    const steps = [lateGrant, early, wait, late].map((skill) => makeStep({ skillId: skill.id }))
    const result = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps }), [lateGrant, early, wait, late], [marker]),
    )
    expect(result.invalidStepIds ?? []).toEqual([])

    const eagerSteps = [lateGrant, tooSoon].map((skill) => makeStep({ skillId: skill.id }))
    const eager = simulateTimeline(
      timelineInputs(makeRotation(CLASS, { steps: eagerSteps }), [lateGrant, tooSoon], [marker]),
    )
    expect(eager.invalidStepIds).toEqual([eagerSteps[1].id])
  })

  it("applies at the hit's frame for the damage scored after it, and not before", () => {
    const before = boostedReader("Before", 60)
    const after = boostedReader("After", 10)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [lateGrant, before, after].map((skill) => makeStep({ skillId: skill.id })),
        }),
        [lateGrant, before, after],
        [marker],
      ),
    )
    const damageOf = (name: string) =>
      result.perSkill.find((row) => row.name === name)!.expectedDamage
    expect(damageOf("Before")).toBeLessThan(100)
    expect(damageOf("After")).toBeGreaterThan(9000)
  })
})

describe("a projectile damage-over-time tick", () => {
  function seekerRun(extraStackAt: number | null) {
    const seeker = makeDebuff(CLASS, {
      name: "Seeker",
      durationFrames: 400,
      maxStacks: 3,
      stackScaling: "perStack",
      dot: {
        tickIntervalFrames: 100,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
        projectile: { speedMetersPerSecond: 1000, collisionDelayFrames: 40, maxTravelFrames: 100 },
      },
    })
    const applyStack = [makeTrigger({ kind: "applyDebuff", targetId: seeker.id, stacks: 1 })]
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 300,
      hits: [
        makeHit({ frame: 0, physFixed: 1, triggers: applyStack }),
        ...(extraStackAt === null
          ? []
          : [makeHit({ frame: extraStackAt, physFixed: 1, triggers: applyStack })]),
        makeHit({ frame: 250, physFixed: 1 }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: caster.id })] }),
        [caster],
        [],
        [seeker],
      ),
    )
    return (result.timeline ?? []).find((event) => event.kind === "dot")!
  }

  it("scores at the stack count standing when it lands, not when it launched", () => {
    const single = seekerRun(null)
    const grownMidFlight = seekerRun(120)
    expect(grownMidFlight.damage).toBeCloseTo(single.damage * 2, 6)
  })
})

describe("a write caused by a hit", () => {
  const applyTo = (debuff: Debuff, kind: "applyDebuff" | "applyDot") =>
    makeTrigger({ kind, targetId: debuff.id, stacks: 1 })

  function permanentRun(kind: "applyDebuff" | "applyDot") {
    const pulse = pulsingDebuff({ activation: "permanent", durationFrames: 0 })
    const opener = filler("Opener", 120)
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 400,
      hits: [
        makeHit({ frame: 0, physFixed: 1, triggers: [applyTo(pulse, kind)] }),
        makeHit({ frame: 350, physFixed: 1 }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: opener.id }), makeStep({ skillId: applier.id })],
        }),
        [opener, applier],
        [],
        [pulse],
      ),
    )
    return { result, appliedAt: hitFrameOf(result, "Applier") }
  }

  it.each(["applyDebuff", "applyDot"] as const)(
    "ticks a permanent DoT opened mid-fight by %s from the opening frame",
    (kind) => {
      const { result, appliedAt } = permanentRun(kind)
      const frames = dotFrames(result)
      expect(frames.length).toBeGreaterThan(3)
      expect(frames[0]).toBe(appliedAt + 30)
      expect(frames.every((frame) => frame >= appliedAt)).toBe(true)
    },
  )

  it("ticks a negative first-tick offset at the window start", () => {
    const pulse = pulsingDebuff({
      durationFrames: 300,
      dot: { ...pulsingDebuff({}).dot!, firstTickOffsetFrames: -20 },
    })
    const opener = filler("Opener", 60)
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 400,
      hits: [
        makeHit({ frame: 0, physFixed: 1, triggers: [applyTo(pulse, "applyDebuff")] }),
        makeHit({ frame: 350, physFixed: 1 }),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: opener.id }), makeStep({ skillId: applier.id })],
        }),
        [opener, applier],
        [],
        [pulse],
      ),
    )
    const frames = dotFrames(result)
    expect(frames[0]).toBe(hitFrameOf(result, "Applier"))
    expect(frames[1] - frames[0]).toBe(30)
  })

  it("lands a saved sub-skill's negative hit frame no earlier than the hit that cast it", () => {
    const sub = makeSkill(CLASS, {
      name: "Sub",
      castFrames: 10,
      hits: [makeHit({ frame: -30, physFixed: 1 })],
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 120,
      hits: [
        makeHit({
          frame: 60,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "castSkill", targetId: sub.id })],
        }),
      ],
    })
    const tail = filler("Tail", 60)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: caster.id }), makeStep({ skillId: tail.id })],
        }),
        [caster, tail, sub],
        [],
      ),
    )
    expect(result.perSkill.find((row) => row.name === "Sub")?.count).toBe(1)
    const frameOf = (skillName: string) =>
      (result.timeline ?? []).find((event) => event.skillName === skillName)!.frame
    expect(frameOf("Sub")).toBe(frameOf("Caster"))
  })

  it("lands a detonation sub-skill's negative hit frame no earlier than the detonating hit", () => {
    const burst = makeSkill(CLASS, {
      name: "Burst",
      castFrames: 10,
      hits: [makeHit({ frame: -30, physFixed: 1 })],
    })
    const bleed = pulsingDebuff({
      durationFrames: 300,
      maxStacks: 1,
      detonation: { skillId: burst.id },
    })
    const detonator = makeSkill(CLASS, {
      name: "Detonator",
      castFrames: 120,
      hits: [
        makeHit({
          frame: 60,
          physFixed: 1,
          triggers: [
            applyTo(bleed, "applyDot"),
            makeTrigger({ kind: "detonateDot", targetId: bleed.id }),
          ],
        }),
      ],
    })
    const tail = filler("Tail", 60)
    const result = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [makeStep({ skillId: detonator.id }), makeStep({ skillId: tail.id })],
        }),
        [detonator, tail, burst],
        [],
        [bleed],
      ),
    )
    expect(result.perSkill.find((row) => row.name === "Burst")?.count).toBe(1)
    const frameOf = (skillName: string) =>
      (result.timeline ?? []).find((event) => event.skillName === skillName)!.frame
    expect(frameOf("Burst")).toBeGreaterThanOrEqual(frameOf("Detonator"))
  })
})
