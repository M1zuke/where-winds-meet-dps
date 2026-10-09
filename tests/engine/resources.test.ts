// Fictional resource contract; these are not damage anchors for a shipped class.
import { describe, expect, it } from "vitest"
import {
  defineResource,
  resolveResourceSettings,
} from "../../src/definitions/resources/resourceDef"
import { CombatResource } from "../../src/engine/resources"
import { makeSkill, makeHit } from "../../src/engine/skill"

const definition = defineResource({
  id: "test-resource",
  name: "Test resource",
  capacity: 100,
  launchMinimum: 50,
  defaultOpening: 60,
  launchSkillId: "test-launch",
  debuffId: "test-projectiles",
  drainPerSecond: 10,
  enhancedRunCost: 5,
  recallTag: "test-weapon",
  recallExemptSkillIds: ["test-exempt"],
  endRefund: 15,
  refundCooldownSeconds: 5,
  gains: [],
})

function resource(opening = 60) {
  return new CombatResource(
    definition,
    { opening, exhaustedGainPerTick: 8 },
    {
      fps: 60,
      startFrame: 0,
      collect: true,
      buffActive: () => false,
      exhausted: (frame) => frame >= 60 && frame < 180,
      paramTier: () => 0,
    },
  )
}

function amount(simulation: CombatResource) {
  return simulation.result.samples.at(-1)!.amount
}

describe("resource refund on exhausted-target projectile hits", () => {
  it("distributes a combo's resource total across actual hits without crediting skipped hits", () => {
    const simulation = new CombatResource(
      {
        ...definition,
        gains: [
          {
            id: "combo",
            name: "Combo",
            defaultAmount: 36,
            skillIds: ["fictional-combo"],
            divideAcrossSkillHits: true,
          },
        ],
      },
      { opening: 0 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        buffActive: () => false,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    const skill = makeSkill("fictional", {
      id: "fictional-combo",
      hits: [makeHit(), makeHit(), makeHit()],
    })
    simulation.hit(skill, 0, 0)
    expect(amount(simulation)).toBe(12)
    simulation.hit(skill, 20, 0)
    expect(amount(simulation)).toBe(24)
    simulation.advance(60)
    expect(amount(simulation)).toBe(24)
    simulation.hit(skill, 80, 80)
    simulation.hit(skill, 100, 80)
    simulation.hit(skill, 120, 80)
    expect(amount(simulation)).toBe(60)
  })
  it("adds per-hit base gains separately from a gated once-per-cast refund", () => {
    const simulation = new CombatResource(
      {
        ...definition,
        gains: [
          { id: "base", name: "Base", defaultAmount: 8, skillIds: ["fictional-builder"] },
          {
            id: "bonus",
            name: "Bonus",
            defaultAmount: 20,
            skillIds: ["fictional-builder"],
            oncePerCast: true,
            requiresBuff: "fictional-mark",
          },
        ],
      },
      { opening: 0 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        buffActive: (_id, frame) => frame >= 60,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    const skill = makeSkill("fictional", { id: "fictional-builder" })
    simulation.hit(skill, 0, 0)
    simulation.hit(skill, 20, 0)
    expect(amount(simulation)).toBe(16)
    simulation.hit(skill, 80, 80)
    simulation.hit(skill, 100, 80)
    simulation.hit(skill, 120, 80)
    expect(amount(simulation)).toBe(60)
    simulation.hit({ ...skill, isDotTick: true }, 130, 130)
    simulation.hit({ ...skill, id: "fictional-other" }, 140, 140)
    expect(amount(simulation)).toBe(60)
    simulation.hit(skill, 160, 160)
    simulation.hit(skill, 180, 160)
    simulation.hit(skill, 200, 160)
    expect(amount(simulation)).toBe(100)
  })
  it("gates cast gains by tier and own mark, gives one proc per cast and excludes DoT", () => {
    let tier = 5
    let marked = true
    const simulation = new CombatResource(
      {
        ...definition,
        gains: [
          {
            id: "cast",
            name: "Cast",
            defaultAmount: 25,
            skillIds: ["fictional-hit"],
            oncePerCast: true,
            requiresParam: "test-param",
            minTier: 6,
            requiresBuff: "test-mark",
          },
        ],
      },
      { opening: 0 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        buffActive: () => marked,
        exhausted: () => false,
        paramTier: () => tier,
      },
    )
    const skill = makeSkill("fictional", { id: "fictional-hit" })
    simulation.hit(skill, 0, 0)
    expect(amount(simulation)).toBe(0)
    tier = 6
    marked = false
    simulation.hit(skill, 60, 60)
    expect(amount(simulation)).toBe(0)
    marked = true
    simulation.hit({ ...skill, id: "unrelated-hit" }, 90, 90)
    expect(amount(simulation)).toBe(0)
    simulation.hit(skill, 120, 120)
    simulation.hit(skill, 130, 120)
    expect(amount(simulation)).toBe(25)
    simulation.hit({ ...skill, isDotTick: true }, 140, 140)
    expect(amount(simulation)).toBe(25)
    simulation.hit(skill, 180, 180)
    expect(amount(simulation)).toBe(50)
  })
  it("credits only accepted projectile ticks within the half-open exhausted phase", () => {
    const simulation = resource()
    simulation.launch(0)
    expect(simulation.tick(30, 0)).toBe(true)
    expect(amount(simulation)).toBeCloseTo(55)
    expect(simulation.tick(60, 0)).toBe(true)
    expect(amount(simulation)).toBeCloseTo(58)
    expect(simulation.tick(120, 0)).toBe(true)
    expect(amount(simulation)).toBeCloseTo(56)
    expect(simulation.tick(180, 0)).toBe(true)
    expect(amount(simulation)).toBeCloseTo(46)
  })

  it("does not refill merely because time passes during exhaustion", () => {
    const simulation = resource()
    simulation.launch(0)
    simulation.advance(120)
    expect(amount(simulation)).toBeCloseTo(40)
  })

  it("charges an enhanced run's cost once, on top of the drain and the hit refund", () => {
    const simulation = resource(100)
    simulation.launch(0)
    simulation.tick(60, 0)
    simulation.chargeEnhancedRun(60)
    expect(amount(simulation)).toBeCloseTo(93)
  })

  it("ends the launch when an enhanced run's cost empties the bar", () => {
    const simulation = resource(50)
    simulation.launch(0)
    simulation.chargeEnhancedRun(270)
    expect(simulation.result.launches[0].reason).toBe("depleted")
  })

  it("is recalled by a tagged cast, but not by an exempt one, the launch or a tick", () => {
    const simulation = resource()
    const tagged = makeSkill("fictional", { id: "test-tagged", tags: ["test-weapon"] })
    expect(simulation.recalledBy(tagged)).toBe(true)
    expect(simulation.recalledBy({ ...tagged, id: "test-exempt" })).toBe(false)
    expect(simulation.recalledBy({ ...tagged, id: "test-launch" })).toBe(false)
    expect(simulation.recalledBy({ ...tagged, isDotTick: true })).toBe(false)
    expect(simulation.recalledBy(makeSkill("fictional", { id: "test-untagged" }))).toBe(false)
  })

  it("does not refill from stale ticks after recall or a rejected launch", () => {
    const simulation = resource()
    simulation.launch(0)
    expect(simulation.launch(60)).toBe(false)
    expect(simulation.tick(120, 0)).toBe(false)
    expect(amount(simulation)).toBeCloseTo(65)
    const rejected = resource(49)
    expect(rejected.launch(0)).toBe(false)
    expect(rejected.tick(120, 0)).toBe(false)
    expect(amount(rejected)).toBe(49)
  })

  it("caps refunds and does not revive a depleted launch", () => {
    const simulation = resource(100)
    simulation.settings.exhaustedGainPerTick = 100
    simulation.launch(0)
    simulation.tick(60, 0)
    expect(amount(simulation)).toBe(100)
    simulation.advance(660)
    expect(simulation.tick(660, 0)).toBe(false)
    expect(amount(simulation)).toBe(15)
    expect(simulation.result.launches[0].reason).toBe("depleted")
  })

  it("regenerates at a flat per-second rate, capped at capacity", () => {
    const simulation = new CombatResource(
      { ...definition, regenPerSecond: 6 },
      { opening: 40 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        buffActive: () => false,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    simulation.advance(60)
    expect(amount(simulation)).toBeCloseTo(46)
    simulation.advance(660)
    expect(amount(simulation)).toBe(100)
  })

  it("regenerates against the drain while a launch is active", () => {
    const simulation = new CombatResource(
      { ...definition, regenPerSecond: 4 },
      { opening: 60 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        buffActive: () => false,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    simulation.launch(0)
    simulation.advance(60)
    expect(amount(simulation)).toBeCloseTo(54)
  })

  it("defaults unknown refill to zero and sanitizes invalid saved settings", () => {
    expect(resolveResourceSettings(definition).exhaustedGainPerTick).toBe(0)
    expect(
      resolveResourceSettings(definition, { exhaustedGainPerTick: NaN }).exhaustedGainPerTick,
    ).toBe(0)
    expect(
      resolveResourceSettings(definition, { exhaustedGainPerTick: -3 }).exhaustedGainPerTick,
    ).toBe(0)
    expect(
      resolveResourceSettings(definition, { exhaustedGainPerTick: 900 }).exhaustedGainPerTick,
    ).toBe(100)
  })
})
