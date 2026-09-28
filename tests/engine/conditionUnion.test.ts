import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import {
  cloneTriggerCondition,
  isHitOrVariantCondition,
  isTriggerCondition,
  makeHit,
  makeSkill,
  makeTrigger,
  newVariantId,
  seedSkillFromBuiltin,
  type Skill,
} from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const PARAM = "conditionUnionTestParam"

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

function rotationOf(skills: Skill[]): Rotation {
  return makeRotation(CLASS, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

function damagingHitCount(result: ReturnType<typeof simulateTimeline>, skillName: string): number {
  return result.perSkill.find((row) => row.name === skillName)?.count ?? 0
}

describe("a param condition clause", () => {
  it("gates a conditional hit on the build param, and its minimum tier", () => {
    const gated = makeSkill(CLASS, {
      name: "Gated",
      castFrames: 30,
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 }),
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ param: PARAM, minTier: 3 }],
        }),
      ],
    })
    const off = simulateTimeline(timelineInputs(rotationOf([gated]), [gated], []))
    expect(damagingHitCount(off, "Gated")).toBe(1)

    const belowTier = simulateTimeline(
      timelineInputs(rotationOf([gated]), [gated], [], {
        buffParams: { [PARAM]: true, [`${PARAM}Tier`]: 2 },
      }),
    )
    expect(damagingHitCount(belowTier, "Gated")).toBe(1)

    const atTier = simulateTimeline(
      timelineInputs(rotationOf([gated]), [gated], [], {
        buffParams: { [PARAM]: true, [`${PARAM}Tier`]: 3 },
      }),
    )
    expect(damagingHitCount(atTier, "Gated")).toBe(2)
  })

  it("gates a hit variant's coefficients the same way", () => {
    const withVariant = makeSkill(CLASS, {
      name: "Variant Gated",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          variants: [
            {
              id: newVariantId(),
              label: "empowered",
              conditions: [{ param: PARAM }],
              physMultiplier: 1,
              attributeMultiplier: 0,
              physFixed: 50,
              attributeFixed: 0,
            },
          ],
        }),
      ],
    })
    const off = simulateTimeline(timelineInputs(rotationOf([withVariant]), [withVariant], []))
    const on = simulateTimeline(
      timelineInputs(rotationOf([withVariant]), [withVariant], [], {
        buffParams: { [PARAM]: true },
      }),
    )
    expect(damagingHitCount(off, "Variant Gated")).toBe(1)
    expect(damagingHitCount(on, "Variant Gated")).toBe(1)
    expect(on.totalDamage).toBeGreaterThan(off.totalDamage)
  })

  it("gates castConditions, flagging the step only while the param is off", () => {
    const skill = makeSkill(CLASS, {
      name: "Cast Gated",
      castFrames: 30,
      castConditions: [{ param: PARAM, minTier: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const off = simulateTimeline(timelineInputs(rotationOf([skill]), [skill], []))
    expect(off.invalidStepIds).toHaveLength(1)

    const on = simulateTimeline(
      timelineInputs(rotationOf([skill]), [skill], [], {
        buffParams: { [PARAM]: true, [`${PARAM}Tier`]: 1 },
      }),
    )
    expect(on.invalidStepIds ?? []).toHaveLength(0)
  })

  it("gates a trigger's own condition, on top of a status condition on the same clause list", () => {
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const opener = makeSkill(CLASS, {
      name: "Opener",
      castFrames: 30,
      hits: [makeHit({ frame: 0, triggers: [makeTrigger({ targetId: gate.id, stacks: 1 })] })],
    })
    const target = makeBuff(CLASS, {
      name: "Target",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({
              targetId: target.id,
              stacks: 1,
              conditions: [{ buffId: gate.id, op: "gte", stacks: 1 }, { param: PARAM }],
            }),
          ],
        }),
      ],
    })
    const skills = [opener, caster]
    const off = simulateTimeline(
      timelineInputs(rotationOf(skills), skills, [gate, target], {
        buffParams: {},
      }),
    )
    expect(off.buffWindows?.some((window) => window.id === target.id)).toBe(false)

    const on = simulateTimeline(
      timelineInputs(rotationOf(skills), skills, [gate, target], {
        buffParams: { [PARAM]: true },
      }),
    )
    expect(on.buffWindows?.some((window) => window.id === target.id)).toBe(true)
  })
})

describe("a status condition's lt/lte comparison", () => {
  it("holds a conditional hit open below the threshold and closes it at or above it", () => {
    const counter = makeBuff(CLASS, {
      name: "Counter",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 10,
    })
    const grants = (stacks: number) =>
      makeSkill(CLASS, {
        name: "Grants",
        castFrames: 6,
        hits: [makeHit({ frame: 0, triggers: [makeTrigger({ targetId: counter.id, stacks })] })],
      })
    const readsBelow = makeSkill(CLASS, {
      name: "Reads Below",
      castFrames: 30,
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 }),
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ buffId: counter.id, op: "lt", stacks: 3 }],
        }),
      ],
    })
    const grantsThree = grants(3)
    const withThree = simulateTimeline(
      timelineInputs(rotationOf([grantsThree, readsBelow]), [grantsThree, readsBelow], [counter]),
    )
    expect(damagingHitCount(withThree, "Reads Below")).toBe(1)

    const grantsTwo = grants(2)
    const withTwo = simulateTimeline(
      timelineInputs(rotationOf([grantsTwo, readsBelow]), [grantsTwo, readsBelow], [counter]),
    )
    expect(damagingHitCount(withTwo, "Reads Below")).toBe(2)
  })

  it("holds a conditional hit open at or below the threshold and closes it above it", () => {
    const counter = makeBuff(CLASS, {
      name: "Counter",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 10,
    })
    const grants = (stacks: number) =>
      makeSkill(CLASS, {
        name: "Grants",
        castFrames: 6,
        hits: [makeHit({ frame: 0, triggers: [makeTrigger({ targetId: counter.id, stacks })] })],
      })
    const readsAtOrBelow = makeSkill(CLASS, {
      name: "Reads At Or Below",
      castFrames: 30,
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 }),
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ buffId: counter.id, op: "lte", stacks: 3 }],
        }),
      ],
    })
    const grantsThree = grants(3)
    const withThree = simulateTimeline(
      timelineInputs(
        rotationOf([grantsThree, readsAtOrBelow]),
        [grantsThree, readsAtOrBelow],
        [counter],
      ),
    )
    expect(damagingHitCount(withThree, "Reads At Or Below")).toBe(2)

    const grantsFour = grants(4)
    const withFour = simulateTimeline(
      timelineInputs(
        rotationOf([grantsFour, readsAtOrBelow]),
        [grantsFour, readsAtOrBelow],
        [counter],
      ),
    )
    expect(damagingHitCount(withFour, "Reads At Or Below")).toBe(1)
  })
})

describe("an anyOf condition clause", () => {
  it("holds a conditional hit open when any one member holds, and closes it when none do", () => {
    const gate = makeBuff(CLASS, {
      name: "OrGate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 1,
    })
    const gated = makeSkill(CLASS, {
      name: "Or Gated",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ anyOf: [{ buffId: gate.id, op: "gte", stacks: 1 }, { param: PARAM }] }],
        }),
      ],
    })
    const neither = simulateTimeline(timelineInputs(rotationOf([gated]), [gated], [gate]))
    expect(damagingHitCount(neither, "Or Gated")).toBe(0)

    const byParam = simulateTimeline(
      timelineInputs(rotationOf([gated]), [gated], [gate], { buffParams: { [PARAM]: true } }),
    )
    expect(damagingHitCount(byParam, "Or Gated")).toBe(1)

    const granter = makeSkill(CLASS, {
      name: "Granter",
      castFrames: 30,
      hits: [makeHit({ frame: 0, triggers: [makeTrigger({ targetId: gate.id, stacks: 1 })] })],
    })
    const byStatus = simulateTimeline(
      timelineInputs(rotationOf([granter, gated]), [granter, gated], [gate]),
    )
    expect(damagingHitCount(byStatus, "Or Gated")).toBe(1)
  })

  it("recurses through a nested anyOf", () => {
    const gated = makeSkill(CLASS, {
      name: "Nested Or",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 100,
          conditions: [{ anyOf: [{ anyOf: [{ param: PARAM }] }] }],
        }),
      ],
    })
    const off = simulateTimeline(timelineInputs(rotationOf([gated]), [gated], []))
    expect(damagingHitCount(off, "Nested Or")).toBe(0)

    const on = simulateTimeline(
      timelineInputs(rotationOf([gated]), [gated], [], { buffParams: { [PARAM]: true } }),
    )
    expect(damagingHitCount(on, "Nested Or")).toBe(1)
  })
})

describe("validating a condition of any of the three shapes", () => {
  it("accepts a status condition, a param condition and an anyOf of both", () => {
    expect(isTriggerCondition({ buffId: "bf-1", op: "gte", stacks: 1 })).toBe(true)
    expect(isTriggerCondition({ param: PARAM })).toBe(true)
    expect(isTriggerCondition({ param: PARAM, minTier: 2 })).toBe(true)
    expect(
      isTriggerCondition({ anyOf: [{ buffId: "bf-1", op: "gte", stacks: 1 }, { param: PARAM }] }),
    ).toBe(true)
  })

  it("rejects an anyOf with no members, and a param with a non-numeric minTier", () => {
    expect(isTriggerCondition({ anyOf: [] })).toBe(false)
    expect(isTriggerCondition({ param: PARAM, minTier: "high" })).toBe(false)
  })

  it("rejects a buffEngine source nested inside an anyOf on a hit-or-variant condition", () => {
    const nested = { anyOf: [{ buffId: "bf-1", op: "gte", stacks: 1, source: "buffEngine" }] }
    expect(isTriggerCondition(nested)).toBe(true)
    expect(isHitOrVariantCondition(nested)).toBe(false)
  })
})

describe("cloning a condition detaches it from its source, anyOf included", () => {
  it("cloneTriggerCondition deep-clones a nested anyOf array", () => {
    const source = { anyOf: [{ param: PARAM }, { buffId: "bf-1", op: "gte" as const, stacks: 1 }] }
    const cloned = cloneTriggerCondition(source)
    expect(cloned).toEqual(source)
    expect(cloned).not.toBe(source)
    if ("anyOf" in cloned && "anyOf" in source) expect(cloned.anyOf).not.toBe(source.anyOf)
  })

  it("seedSkillFromBuiltin copies an anyOf castCondition detached from the built-in", () => {
    const src = makeSkill(CLASS, {
      name: "Built-in",
      castConditions: [{ anyOf: [{ param: PARAM }, { buffId: "bf-1", op: "gte", stacks: 1 }] }],
    })
    const seeded = seedSkillFromBuiltin(CLASS, src)
    expect(seeded.castConditions).toEqual(src.castConditions)
    expect(seeded.castConditions![0]).not.toBe(src.castConditions![0])
  })
})
