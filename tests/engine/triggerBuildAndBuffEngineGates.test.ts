import { describe, expect, it, vi } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import {
  isHitTrigger,
  isTriggerCondition,
  makeHit,
  makeSkill,
  makeTrigger,
} from "../../src/engine/skill"
import type { HitTrigger, Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

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
    steps: skills.map((skill) => makeStep({ skillId: skill.id })),
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

const { fakeClassBuffId, fakeClassBuff } = vi.hoisted(() => {
  const fakeClassBuffId = "engine-test-castskill-window"
  const fakeClassBuff: BuffModule = {
    id: fakeClassBuffId,
    name: "Test Window",
    duration: 1,
    effects: [],
  }
  return { fakeClassBuffId, fakeClassBuff }
})

vi.mock("../../src/definitions/classes/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/definitions/classes/registry")>()
  return {
    ...actual,
    classDefinition: (classId: string) => {
      const real = actual.classDefinition(classId)
      if (classId !== CLASS || !real) return real
      return { ...real, classBuffDefs: [...real.classBuffDefs, fakeClassBuff] }
    },
  }
})

describe("a castSkill trigger whose condition reads the buff engine", () => {
  it("fires only while the referenced class-buff module's window is open", () => {
    const openWindow = makeSkill(CLASS, {
      name: "OpenWindow",
      castFrames: 0,
      triggersBuffs: [fakeClassBuffId],
      hits: [makeHit()],
    })
    const sub = makeSkill(CLASS, {
      name: "Sub",
      castFrames: 0,
      triggerable: true,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 6,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({
              kind: "castSkill",
              targetId: sub.id,
              stacks: 1,
              condition: { buffId: fakeClassBuffId, op: "gte", stacks: 1, source: "buffEngine" },
            }),
          ],
        }),
      ],
    })
    const filler = makeSkill(CLASS, { name: "Filler", castFrames: 120, hits: [makeHit()] })
    const skills = [openWindow, caster, filler, caster]
    const inputs = timelineInputs(rotationOf(skills), [...skills, sub], [])
    const result = simulateTimeline(inputs)
    const subCasts = result.perSkill.filter((row) => row.name === "Sub")
    expect(subCasts).toHaveLength(1)
    expect(subCasts[0].count).toBe(1)
  })
})

describe("a trigger with requiresParam / requiresMinTier", () => {
  const param = "engineTestTriggerParam"

  function paramGatedInputs(paramState: Record<string, unknown>): { inputs: Inputs; gate: Buff } {
    const gate = makeBuff(CLASS, {
      name: "Gate",
      activation: "triggered",
      durationFrames: 6000,
      effects: [],
      maxStacks: 10,
    })
    const grant = granter(
      makeTrigger({
        kind: "applyBuff",
        targetId: gate.id,
        stacks: 1,
        requiresParam: param,
        requiresMinTier: 3,
      }),
    )
    const after = probe()
    const skills = [grant, after]
    const inputs = timelineInputs(rotationOf(skills), skills, [gate], { buffParams: paramState })
    return { inputs, gate }
  }

  it("does not fire while the param is off", () => {
    const { inputs, gate } = paramGatedInputs({})
    expect(chipStacks(inputs, 1, gate.id)).toBe(0)
  })

  it("does not fire below the required tier", () => {
    const { inputs, gate } = paramGatedInputs({ [param]: true, [`${param}Tier`]: 2 })
    expect(chipStacks(inputs, 1, gate.id)).toBe(0)
  })

  it("fires at the required tier", () => {
    const { inputs, gate } = paramGatedInputs({ [param]: true, [`${param}Tier`]: 3 })
    expect(chipStacks(inputs, 1, gate.id)).toBe(1)
  })
})

describe("isHitTrigger — the new fields", () => {
  const base = makeTrigger({ kind: "applyBuff", targetId: "target", stacks: 1 })

  it("accepts requiresParam alone and requiresParam with a finite requiresMinTier", () => {
    expect(isHitTrigger({ ...base, requiresParam: "someParam" })).toBe(true)
    expect(isHitTrigger({ ...base, requiresParam: "someParam", requiresMinTier: 3 })).toBe(true)
  })

  it("rejects requiresMinTier without requiresParam, and a non-finite requiresMinTier", () => {
    expect(isHitTrigger({ ...base, requiresMinTier: 3 })).toBe(false)
    expect(isHitTrigger({ ...base, requiresParam: "someParam", requiresMinTier: Number.NaN })).toBe(
      false,
    )
  })

  it("accepts source: buffEngine on a castSkill trigger's condition, rejects it elsewhere", () => {
    const castSkillTrigger = makeTrigger({
      kind: "castSkill",
      targetId: "sk-x",
      condition: { buffId: "bf-1", op: "gte", stacks: 1, source: "buffEngine" },
    })
    expect(isHitTrigger(castSkillTrigger)).toBe(true)
    const applyBuffTrigger = {
      ...base,
      condition: { buffId: "bf-1", op: "gte", stacks: 1, source: "buffEngine" },
    }
    expect(isHitTrigger(applyBuffTrigger)).toBe(false)
  })

  it("isTriggerCondition alone still accepts source: buffEngine — the kind check lives in isHitTrigger", () => {
    expect(isTriggerCondition({ buffId: "bf-1", op: "gte", stacks: 1, source: "buffEngine" })).toBe(
      true,
    )
  })
})

describe("a class-buff module's cooldown may be a function of the build", () => {
  const castTag = "cast:functionCooldownGranter"
  const moduleId = "engine-test-function-cooldown"

  function module(): BuffModule {
    return {
      id: moduleId,
      name: "Function Cooldown",
      duration: 5,
      cooldown: (ctx) => (ctx.build.param("longCooldown") ? 10 : 1),
      effects: [],
    }
  }

  it("blocks a regrant before the resolved cooldown has passed, so the original window still lapses on time", () => {
    const engine = new BuffEngine({ classId: CLASS, longCooldown: true }, [module()])
    engine.processSkillCast(castTag, 0, {}, false, [moduleId])
    engine.processSkillCast(castTag, 2, {}, false, [moduleId])
    expect(engine.isBuffActiveAtTime(moduleId, 6)).toBe(false)
  })

  it("allows a regrant once the resolved cooldown has passed, refreshing the window", () => {
    const engine = new BuffEngine({ classId: CLASS }, [module()])
    engine.processSkillCast(castTag, 0, {}, false, [moduleId])
    engine.processSkillCast(castTag, 2, {}, false, [moduleId])
    expect(engine.isBuffActiveAtTime(moduleId, 6)).toBe(true)
  })
})
