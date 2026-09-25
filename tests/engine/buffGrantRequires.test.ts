import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

function taggedSkill(name: string, tags: string[] = []) {
  return makeSkill("test", { name, tags })
}

const module: BuffModule = {
  id: "shared-pool",
  name: "Shared Pool",
  grantRequires: {
    "cast:ungated": {},
    "cast:gated": { param: "someParam", minTier: 6 },
  },
  duration: 100,
  maxStacks: 5,
  stacksPerHit: true,
  affectsAll: true,
  summary: "test",
  effects: (ctx) => [stat("allDamageBoost", 0.1 * ctx.self.stacks)],
}

function stacksAt(engine: BuffEngine, time: number): number {
  return (
    (engine
      .calculateDamageEffects(taggedSkill("AnySkill"), time)
      .effects.find((effect) => effect.statKey === "allDamageBoost")?.amount ?? 0) / 0.1
  )
}

describe("a buff module's grantRequires", () => {
  it("grants from a cast tag mapped to an empty requirement with no gate at all", () => {
    const engine = new BuffEngine({}, [], [module])
    engine.processSkillCast("cast:ungated", 0, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })

  it("blocks a cast tag mapped to its own requirement while that requirement is unmet", () => {
    const engine = new BuffEngine({}, [], [module])
    engine.processSkillCast("cast:gated", 0, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(0, 6)
  })

  it("grants from a cast tag mapped to its own requirement once that requirement is met", () => {
    const engine = new BuffEngine({ someParam: true, someParamTier: 6 }, [], [module])
    engine.processSkillCast("cast:gated", 0, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })

  it("an unmapped cast tag grants with no gate at all — a grantRequires module carries no requires", () => {
    const engine = new BuffEngine({}, [], [module])
    engine.processSkillCast("cast:unmapped", 0, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })

  it("a gated source is blocked while another source still writes the shared pool", () => {
    const engine = new BuffEngine({}, [], [module])
    engine.processSkillCast("cast:ungated", 0, {}, false, ["shared-pool"])
    engine.processSkillCast("cast:gated", 1, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 1.1)).toBeCloseTo(1, 6)
  })

  it("several ungated sources still write into the one shared stack pool", () => {
    const engine = new BuffEngine({ someParam: true, someParamTier: 6 }, [], [module])
    engine.processSkillCast("cast:ungated", 0, {}, false, ["shared-pool"])
    engine.processSkillCast("cast:gated", 1, {}, false, ["shared-pool"])
    expect(stacksAt(engine, 1.1)).toBeCloseTo(2, 6)
  })

  it("requires and grantRequires cannot both be declared on one module", () => {
    // @ts-expect-error requires and grantRequires are mutually exclusive
    const invalid: BuffModule = { ...module, requires: { param: "someParam" } }
    expect(invalid).toBeTruthy()
  })
})
