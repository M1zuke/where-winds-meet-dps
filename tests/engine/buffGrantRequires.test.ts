import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GRANT_REQUIRES_DEFAULT, type BuffModule } from "../../src/engine/buffs/buffModule"
import { buffGateSatisfied, requiresLabel } from "../../src/engine/buffs/catalog"
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

describe("a grantRequires default entry — the fallback for every source the map does not name", () => {
  const defaultedModule: BuffModule = {
    id: "defaulted-pool",
    name: "Defaulted Pool",
    grantRequires: {
      "cast:gated": { param: "someParam", minTier: 6 },
      [GRANT_REQUIRES_DEFAULT]: { param: "someParam" },
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

  it("blocks an unmapped source while the default's own requirement is unmet", () => {
    const engine = new BuffEngine({}, [], [defaultedModule])
    engine.processSkillCast("cast:unmapped", 0, {}, false, ["defaulted-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(0, 6)
  })

  it("grants an unmapped source once the default's own requirement is met", () => {
    const engine = new BuffEngine({ someParam: true }, [], [defaultedModule])
    engine.processSkillCast("cast:unmapped", 0, {}, false, ["defaulted-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })

  it("prefers a named source's own entry over the default", () => {
    const engine = new BuffEngine({ someParam: true }, [], [defaultedModule])
    engine.processSkillCast("cast:gated", 0, {}, false, ["defaulted-pool"])
    expect(stacksAt(engine, 0.1)).toBeCloseTo(0, 6)
  })

  it("requiresLabel and buffGateSatisfied read the default entry when the module carries no requires", () => {
    expect(requiresLabel(defaultedModule)).toBe("Some Param")
    expect(buffGateSatisfied(defaultedModule, { someParam: true })).toBe(true)
    expect(buffGateSatisfied(defaultedModule, {})).toBe(false)
  })
})

describe("grantRequires keyed by a tag family instead of one skill's own cast tag", () => {
  const familyModule: BuffModule = {
    id: "family-pool",
    name: "Family Pool",
    grantRequires: { "family:strong": {}, "family:weak": { param: "someParam", minTier: 6 } },
    duration: 100,
    maxStacks: 5,
    stacksPerHit: true,
    affectsAll: true,
    summary: "test",
    effects: (ctx) => [stat("allDamageBoost", 0.1 * ctx.self.stacks)],
  }

  it("matches a tag the granting skill carries once its own cast tag finds no entry", () => {
    const engine = new BuffEngine({}, [], [familyModule])
    const skill = taggedSkill("StrongMember", ["family:strong"])
    engine.processSkillCast(
      "cast:strong-member",
      0,
      {},
      false,
      ["family-pool"],
      new Set(skill.tags),
    )
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })

  it("blocks a tag-matched source while its own requirement is unmet", () => {
    const engine = new BuffEngine({}, [], [familyModule])
    const skill = taggedSkill("WeakMember", ["family:weak"])
    engine.processSkillCast("cast:weak-member", 0, {}, false, ["family-pool"], new Set(skill.tags))
    expect(stacksAt(engine, 0.1)).toBeCloseTo(0, 6)
  })

  it("prefers an exact cast-tag entry over a tag-family match", () => {
    const engine = new BuffEngine({}, [], [familyModule])
    const skill = taggedSkill("ExactMatch", ["family:weak"])
    engine.processSkillCast("family:strong", 0, {}, false, ["family-pool"], new Set(skill.tags))
    expect(stacksAt(engine, 0.1)).toBeCloseTo(1, 6)
  })
})

describe("a buff module's function-valued maxStacks", () => {
  const tieredModule: BuffModule = {
    id: "tiered-cap",
    name: "Tiered Cap",
    duration: 100,
    maxStacks: (params) =>
      typeof params.someParamTier === "number" && params.someParamTier >= 6 ? 10 : 3,
    stacksPerHit: true,
    affectsAll: true,
    summary: "test",
    effects: (ctx) => [stat("allDamageBoost", 0.1 * ctx.self.stacks)],
  }

  it("resolves once at registration against the run's own params", () => {
    const below = new BuffEngine({ someParam: true, someParamTier: 3 }, [], [tieredModule])
    for (let hitIndex = 0; hitIndex < 5; hitIndex++)
      below.processSkillCast(`hit-${hitIndex}`, hitIndex, {}, false, ["tiered-cap"])
    expect(stacksAt(below, 4.5)).toBeCloseTo(3, 6)

    const above = new BuffEngine({ someParam: true, someParamTier: 6 }, [], [tieredModule])
    for (let hitIndex = 0; hitIndex < 12; hitIndex++)
      above.processSkillCast(`hit-${hitIndex}`, hitIndex, {}, false, ["tiered-cap"])
    expect(stacksAt(above, 11.5)).toBeCloseTo(10, 6)
  })

  it("does not re-read the build's params after registration", () => {
    const engine = new BuffEngine({ someParam: true, someParamTier: 3 }, [], [tieredModule])
    engine.params.someParamTier = 6
    for (let hitIndex = 0; hitIndex < 12; hitIndex++)
      engine.processSkillCast(`hit-${hitIndex}`, hitIndex, {}, false, ["tiered-cap"])
    expect(stacksAt(engine, 11.5)).toBeCloseTo(3, 6)
  })
})
