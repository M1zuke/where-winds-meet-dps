import { describe, expect, it, vi } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import {
  buffGateSatisfied,
  alwaysActiveClassBuffs,
  requiresLabel,
} from "../../src/engine/buffs/catalog"
import { stat } from "../../src/engine/effects/effect"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { makeSkill } from "../../src/engine/skill"
import { defaultInputs } from "../../src/engine/defaults"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

const gatedModule: BuffModule = {
  id: "gated-additional-attack",
  name: "Gated Additional Attack",
  requires: { minBreakthrough: 18 },
  alwaysActive: true,
  affectsAll: true,
  duration: 9999,
  effects: [stat("allDamageBoost", 0.2)],
}

describe("requires.minBreakthrough — engine gate", () => {
  it("a module below its minimum is not seeded and contributes nothing", () => {
    const engine = new BuffEngine({ breakthrough: 17 }, [gatedModule])
    expect(engine.calculateDamageEffects(taggedSkill("Y"), 0).effects).toHaveLength(0)
  })

  it("a module at or above its minimum is seeded and contributes", () => {
    const engine = new BuffEngine({ breakthrough: 18 }, [gatedModule])
    expect(engine.calculateDamageEffects(taggedSkill("Y"), 0).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.2,
    })
  })
})

describe("buffGateSatisfied — breakthrough gate", () => {
  it("returns false below the minimum and true at or above it", () => {
    expect(buffGateSatisfied(gatedModule, { breakthrough: 17 })).toBe(false)
    expect(buffGateSatisfied(gatedModule, { breakthrough: 18 })).toBe(true)
    expect(buffGateSatisfied(gatedModule, { breakthrough: 21 })).toBe(true)
  })

  it("stacks with a param gate rather than replacing it", () => {
    const withParam: BuffModule = {
      ...gatedModule,
      requires: { minBreakthrough: 18, param: "someParam" },
    }
    expect(buffGateSatisfied(withParam, { breakthrough: 18, someParam: true })).toBe(true)
    expect(buffGateSatisfied(withParam, { breakthrough: 17, someParam: true })).toBe(false)
    expect(buffGateSatisfied(withParam, { breakthrough: 18 })).toBe(false)
  })
})

describe("requiresLabel — breakthrough gate", () => {
  it("produces a label for a minBreakthrough-only module", () => {
    expect(requiresLabel(gatedModule)).toBe("breakthrough 18+")
  })

  it("combines the breakthrough label with a param gate's label", () => {
    const withParam: BuffModule = {
      ...gatedModule,
      requires: { minBreakthrough: 18, param: "someParam" },
    }
    expect(requiresLabel(withParam)).toBe("Some Param, breakthrough 18+")
  })
})

describe("paramsFromInputs — breakthrough", () => {
  it("carries inputs.breakthrough into the params", () => {
    const params = paramsFromInputs({ ...defaultInputs, breakthrough: 19 })
    expect(params.breakthrough).toBe(19)
  })
})

describe("a module's effects(ctx) reads ctx.build.breakthrough", () => {
  it("reflects the build's breakthrough inside the effect callback", () => {
    let seenBreakthrough = -1
    const module: BuffModule = {
      id: "reads-breakthrough",
      name: "Reads Breakthrough",
      alwaysActive: true,
      affectsAll: true,
      duration: 9999,
      summary: "test",
      effects: (ctx) => {
        seenBreakthrough = ctx.build.breakthrough
        return []
      },
    }
    const engine = new BuffEngine({ breakthrough: 21 }, [module])
    engine.calculateDamageEffects(taggedSkill("Y"), 0)
    expect(seenBreakthrough).toBe(21)
  })
})

const { fakeClassId, fakeGatedClassBuffId, fakeGatedClassBuff } = vi.hoisted(() => {
  const fakeClassId = "engine-test-fake-class"
  const fakeGatedClassBuffId = "engine-test-gated-class-buff"
  const fakeGatedClassBuff = {
    id: fakeGatedClassBuffId,
    name: "Gated Class Buff",
    requires: { minBreakthrough: 18 },
    alwaysActive: true,
    affectsAll: true,
    duration: 9999,
    effects: [],
  }
  return { fakeClassId, fakeGatedClassBuffId, fakeGatedClassBuff }
})

vi.mock("../../src/definitions/classes/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/definitions/classes/registry")>()
  return {
    ...actual,
    classDefinition: (classId: string) =>
      classId === fakeClassId
        ? { classBuffDefs: [fakeGatedClassBuff] }
        : actual.classDefinition(classId),
  }
})

describe("alwaysActiveClassBuffs — breakthrough gate", () => {
  it("omits a class buff below its minimum breakthrough and lists it at or above", () => {
    const below = alwaysActiveClassBuffs({
      ...defaultInputs,
      classId: fakeClassId,
      breakthrough: 17,
    })
    const above = alwaysActiveClassBuffs({
      ...defaultInputs,
      classId: fakeClassId,
      breakthrough: 18,
    })
    expect(below.some((row) => row.id === fakeGatedClassBuffId)).toBe(false)
    expect(above.some((row) => row.id === fakeGatedClassBuffId)).toBe(true)
  })
})
