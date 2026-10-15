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
      particleCount: 1,
      buffLive: () => false,
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
        particleCount: 1,
        buffLive: () => false,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    const skill = makeSkill("fictional", {
      id: "fictional-combo",
      hits: [makeHit(), makeHit(), makeHit()],
    })
    simulation.hit(skill, 0)
    expect(amount(simulation)).toBe(12)
    simulation.hit(skill, 20)
    expect(amount(simulation)).toBe(24)
    simulation.advance(60)
    expect(amount(simulation)).toBe(24)
    simulation.hit(skill, 80)
    simulation.hit(skill, 100)
    simulation.hit(skill, 120)
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
            cooldownSeconds: 1,
            requiresBuff: "fictional-mark",
          },
        ],
      },
      { opening: 0 },
      {
        fps: 60,
        startFrame: 0,
        collect: true,
        particleCount: 1,
        buffLive: (_id: string, frame: number) => frame >= 60,
        exhausted: () => false,
        paramTier: () => 0,
      },
    )
    const skill = makeSkill("fictional", { id: "fictional-builder" })
    simulation.hit(skill, 0)
    simulation.hit(skill, 20)
    expect(amount(simulation)).toBe(16)
    simulation.hit(skill, 80)
    simulation.hit(skill, 100)
    simulation.hit(skill, 120)
    expect(amount(simulation)).toBe(60)
    simulation.hit({ ...skill, isDotTick: true }, 130)
    simulation.hit({ ...skill, id: "fictional-other" }, 140)
    expect(amount(simulation)).toBe(60)
    simulation.hit(skill, 160)
    simulation.hit(skill, 180)
    simulation.hit(skill, 200)
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
            cooldownSeconds: 1,
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
        particleCount: 1,
        buffLive: () => marked,
        exhausted: () => false,
        paramTier: () => tier,
      },
    )
    const skill = makeSkill("fictional", { id: "fictional-hit" })
    simulation.hit(skill, 0)
    expect(amount(simulation)).toBe(0)
    tier = 6
    marked = false
    simulation.hit(skill, 60)
    expect(amount(simulation)).toBe(0)
    marked = true
    simulation.hit({ ...skill, id: "unrelated-hit" }, 90)
    expect(amount(simulation)).toBe(0)
    simulation.hit(skill, 120)
    simulation.hit(skill, 130)
    expect(amount(simulation)).toBe(25)
    simulation.hit({ ...skill, isDotTick: true }, 140)
    expect(amount(simulation)).toBe(25)
    simulation.hit(skill, 180)
    expect(amount(simulation)).toBe(50)
  })
  describe("when a gain gate holds in only some trajectories", () => {
    const PARTICLES = 10
    const LIVE_PARTICLES = 4
    const liveMask = Uint8Array.from({ length: PARTICLES }, (_, index) =>
      index < LIVE_PARTICLES ? 1 : 0,
    )
    const gatedGain = {
      id: "cast",
      name: "Cast",
      defaultAmount: 25,
      skillIds: ["fictional-hit"],
      requiresBuff: "test-mark",
      cooldownSeconds: 1,
    }
    const castSkill = makeSkill("fictional", { id: "fictional-hit" })

    function branched(
      opening: number,
      gain: typeof gatedGain | Omit<typeof gatedGain, "cooldownSeconds"> = gatedGain,
    ) {
      return new CombatResource(
        { ...definition, gains: [gain] },
        { opening, exhaustedGainPerTick: 0 },
        {
          fps: 60,
          startFrame: 0,
          collect: true,
          particleCount: PARTICLES,
          buffLive: () => liveMask,
          exhausted: () => false,
          paramTier: () => 0,
        },
      )
    }

    it("credits the gain in the live trajectories only and reports the mean", () => {
      const simulation = branched(0)
      simulation.hit(castSkill, 0)
      expect(amount(simulation)).toBeCloseTo(10)
    })

    it("decides the launch minimum per trajectory", () => {
      const simulation = branched(30)
      simulation.hit(castSkill, 0)
      expect(simulation.launch(10)).toBeCloseTo(0.4)
      const launches = simulation.result.launches
      expect(launches).toHaveLength(2)
      expect(launches).toContainEqual(
        expect.objectContaining({ reason: "fightEnd", share: 0.4, opening: 55 }),
      )
      expect(launches).toContainEqual(
        expect.objectContaining({ reason: "insufficient", share: 0.6, opening: 30 }),
      )
    })

    it("scales a tick by the share of trajectories whose launch is active and names them", () => {
      const simulation = branched(30)
      simulation.hit(castSkill, 0)
      simulation.launch(10)
      const outcome = simulation.tick(20, 10)
      expect(outcome.share).toBeCloseTo(0.4)
      expect([...outcome.particles!]).toEqual([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
    })

    it("merges trajectories whose state became identical", () => {
      const { cooldownSeconds: _cooldown, ...uncooledGain } = gatedGain
      const simulation = branched(100, uncooledGain)
      simulation.hit(castSkill, 0)
      expect(simulation.launch(10)).toBe(1)
      expect(simulation.result.launches).toHaveLength(1)
      expect(simulation.result.launches[0].share).toBe(1)
    })

    it("arms the cooldown only in the trajectories that were credited", () => {
      const simulation = branched(0)
      simulation.hit(castSkill, 0)
      simulation.hit(castSkill, 30)
      expect(amount(simulation)).toBeCloseTo(10)
      simulation.hit(castSkill, 60)
      expect(amount(simulation)).toBeCloseTo(10 + 0.4 * 25 + 0.6 * 0 + 0)
    })
  })
  it("credits only accepted projectile ticks within the half-open exhausted phase", () => {
    const simulation = resource()
    simulation.launch(0)
    expect(simulation.tick(30, 0).share).toBe(1)
    expect(amount(simulation)).toBeCloseTo(55)
    expect(simulation.tick(60, 0).share).toBe(1)
    expect(amount(simulation)).toBeCloseTo(58)
    expect(simulation.tick(120, 0).share).toBe(1)
    expect(amount(simulation)).toBeCloseTo(56)
    expect(simulation.tick(180, 0).share).toBe(1)
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
    simulation.chargeEnhancedRun(60, 0)
    expect(amount(simulation)).toBeCloseTo(93)
  })

  it("ends the launch when an enhanced run's cost empties the bar", () => {
    const simulation = resource(50)
    simulation.launch(0)
    simulation.chargeEnhancedRun(270, 0)
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
    expect(simulation.launch(60)).toBe(0)
    expect(simulation.tick(120, 0).share).toBe(0)
    expect(amount(simulation)).toBeCloseTo(65)
    const rejected = resource(49)
    expect(rejected.launch(0)).toBe(0)
    expect(rejected.tick(120, 0).share).toBe(0)
    expect(amount(rejected)).toBe(49)
  })

  it("caps refunds and does not revive a depleted launch", () => {
    const simulation = resource(100)
    simulation.settings.exhaustedGainPerTick = 100
    simulation.launch(0)
    simulation.tick(60, 0)
    expect(amount(simulation)).toBe(100)
    simulation.advance(660)
    expect(simulation.tick(660, 0).share).toBe(0)
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
        particleCount: 1,
        buffLive: () => false,
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
        particleCount: 1,
        buffLive: () => false,
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
