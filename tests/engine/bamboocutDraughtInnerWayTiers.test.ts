// Scoped to Bamboocut Draught's four slottable inner ways (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeSkill, makeHit, makeTrigger } from "../../src/engine/skill"
import { makeDebuff } from "../../src/engine/debuff"
import { DEBUFF, SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import type { StatusView } from "../../src/engine/ledger"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

function mindMethodsWith(innerWayId: string, tier: number): Inputs["mindMethods"] {
  return [
    { id: innerWayId, name: innerWayId, stacks: String(tier) },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ]
}

const UNSLOTTED: Inputs["mindMethods"] = [
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function runPeakfall(mindMethods: Inputs["mindMethods"], bingePoints = 100) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    mindMethods,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.peakfall, hitCount: 2 })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
}

function peakfallDamage(result: ReturnType<typeof runPeakfall>): number {
  return result.perSkill.find((row) => row.breakdownName === "Peakfall")!.expectedDamage
}

describe("Eonpour", () => {
  it("pays ×1.2 at tier 3 and ×1.1 at tier 2", () => {
    const atTier3 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.eonpour, 3)))
    const atTier2 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.eonpour, 2)))
    expect(atTier3 / atTier2).toBeCloseTo(1.2 / 1.1, 5)
  })
})

describe("Skyspeak", () => {
  // Hero's Blood marks and releases; Peakfall in between is the
  // Inebriate-enhanced hit that feeds the echo while the mark is up.
  function runHerosBloodMarkFeedRelease(tier: number) {
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      mindMethods: mindMethodsWith(INNER_WAY_ID.skyspeak, tier),
      activeCustomRotation: makeRotation(CLASS, {
        steps: [
          makeStep({ skillId: SKILL.herosBlood, hitCount: 2 }),
          makeStep({ skillId: SKILL.peakfall, hitCount: 2 }),
          makeStep({ skillId: SKILL.herosBlood, hitCount: 2 }),
        ],
        openingStacks: { [STATUS.bingePoints]: 100 },
      }),
    })
  }

  it("below tier 6 banks no Drunkslay echo", () => {
    const belowTier = runHerosBloodMarkFeedRelease(5)
    const atTier = runHerosBloodMarkFeedRelease(6)
    expect(belowTier.timeline!.some((event) => event.skillName === "Drunkslay State")).toBe(false)
    expect(atTier.timeline!.some((event) => event.skillName === "Drunkslay State")).toBe(true)
  })
})

describe("Mistwing", () => {
  it("keeps the rung penetration out of the derived panel stats", () => {
    const inputs = withDerivedStats({
      ...defaultInputs,
      classId: CLASS,
      mindMethods: mindMethodsWith(INNER_WAY_ID.mistwing, 6),
    })
    const unslotted = withDerivedStats({ ...defaultInputs, classId: CLASS, mindMethods: UNSLOTTED })
    expect(inputs.phys.penetration).toBe(unslotted.phys.penetration)
    expect(inputs.bamboocut.penetration).toBe(unslotted.bamboocut.penetration)
  })

  it("tier 1 raises damage over unslotted and tier 4 over tier 3, both without Inebriate", () => {
    const unslotted = peakfallDamage(runPeakfall(UNSLOTTED, 0))
    const tier1 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.mistwing, 1), 0))
    const tier3 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.mistwing, 3), 0))
    const tier4 = peakfallDamage(runPeakfall(mindMethodsWith(INNER_WAY_ID.mistwing, 4), 0))
    expect(tier1).toBeGreaterThan(unslotted)
    expect(tier4).toBeGreaterThan(tier3)
  })

  it("tier 5 adds no Inebriate penetration, tier 6 does", () => {
    // Other always-on Inebriate bonuses (unrelated to Mistwing) already
    // separate Tipsy from not-Tipsy damage at every tier, so the Mistwing-
    // specific contribution is the MARGIN Tipsy adds, not the raw damage.
    const tier5 = mindMethodsWith(INNER_WAY_ID.mistwing, 5)
    const tier6 = mindMethodsWith(INNER_WAY_ID.mistwing, 6)
    const tier5Margin =
      peakfallDamage(runPeakfall(tier5, 100)) - peakfallDamage(runPeakfall(tier5, 0))
    const tier6Margin =
      peakfallDamage(runPeakfall(tier6, 100)) - peakfallDamage(runPeakfall(tier6, 0))
    expect(tier6Margin).toBeGreaterThan(tier5Margin)
  })
})

describe("Mistwing — target health penetration", () => {
  const TARGET_MAX_HP = 1000
  const probeSkill = makeSkill(CLASS, { name: "Probe" })

  const inebriateStatusView: StatusView = {
    activeIdsAt: () => [],
    isActiveAt: () => false,
    stacksAt: () => 0,
    conditionStacksAt: (id) => (id === STATUS.bingePoints ? 100 : 0),
    remainingFramesAt: () => undefined,
    windowsOf: () => [],
  }

  function penetrationEngine(inebriate: boolean): BuffEngine {
    const engine = new BuffEngine(
      { mistwing: true, mistwingTier: 6, targetMaxHp: TARGET_MAX_HP, classId: CLASS },
      buffDefsForClass(CLASS),
    )
    if (inebriate) engine.attachStatuses({ view: inebriateStatusView, fps: 60 })
    return engine
  }

  function penetrationAt(engine: BuffEngine, damageSoFar: number): number {
    const site = engine.calculateDamageEffects(probeSkill, 1, [], damageSoFar)
    return site.effects
      .filter((effect) => effect.statKey === "phys.penetration")
      .reduce((sum, effect) => sum + effect.amount, 0)
  }

  it("adds nothing above 90% remaining, and steps up in bands below it", () => {
    const engine = penetrationEngine(false)
    const base = penetrationAt(engine, 0)
    expect(penetrationAt(engine, 50) - base).toBeCloseTo(0, 6)
    expect(penetrationAt(engine, 150) - base).toBeCloseTo(0.01, 6)
    expect(penetrationAt(engine, 250) - base).toBeCloseTo(0.02, 6)
    expect(penetrationAt(engine, 350) - base).toBeCloseTo(0.03, 6)
    expect(penetrationAt(engine, 450) - base).toBeCloseTo(0.04, 6)
  })

  it("puts exactly 90% remaining in the second band, not the first", () => {
    const engine = penetrationEngine(false)
    const base = penetrationAt(engine, 0)
    expect(penetrationAt(engine, 100) - base).toBeCloseTo(0.01, 6)
  })

  it("is at its floor against a target large enough never to leave the top band", () => {
    const engine = penetrationEngine(false)
    const untouched = penetrationAt(engine, 0)
    expect(penetrationAt(engine, 1)).toBeCloseTo(untouched, 6)
  })

  it("follows the target's health down as damage accumulates across a run", () => {
    const engine = penetrationEngine(false)
    const steps = [0, 150, 250, 350, 450].map((damageSoFar) => penetrationAt(engine, damageSoFar))
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1])
  })

  it("doubles the step while Inebriate", () => {
    const down = penetrationEngine(false)
    const up = penetrationEngine(true)
    const downBase = penetrationAt(down, 0)
    const upBase = penetrationAt(up, 0)
    expect(penetrationAt(up, 250) - upBase).toBeCloseTo(
      (penetrationAt(down, 250) - downBase) * 2,
      6,
    )
  })
})

describe("Mistwing — the target's health follows every damage event, not just hits", () => {
  const BREAKTHROUGH = 17
  const probeHit = makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })
  const probeSkill = makeSkill(CLASS, { name: "HealthProbe", castFrames: 60, hits: [probeHit] })

  function probeDamage(result: ReturnType<typeof runEngine>): number {
    return result.perSkill.find((row) => row.name === "HealthProbe")!.expectedDamage
  }

  function runRotation(
    mindMethods: Inputs["mindMethods"],
    customSkills: ReturnType<typeof makeSkill>[],
    customDebuffs: ReturnType<typeof makeDebuff>[],
    rotation: Rotation,
  ) {
    return runEngine({
      ...defaultInputs,
      classId: CLASS,
      set: null,
      breakthrough: BREAKTHROUGH,
      mindMethods,
      customSkills,
      customDebuffs,
      activeCustomRotation: rotation,
    })
  }

  it("a DoT tick's damage before a hit raises the mistwing bonus that hit receives", () => {
    function run(mindMethods: Inputs["mindMethods"], tickPhysFixed: number) {
      const bigTick = makeDebuff(CLASS, {
        name: "Health Probe DoT",
        activation: "triggered",
        durationFrames: 120,
        maxStacks: 1,
        stackScaling: "flat",
        dot: {
          tickIntervalFrames: 60,
          physMultiplier: 0,
          physFixed: tickPhysFixed,
          attributeMultiplier: 0,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
        },
      })
      const applySkill = makeSkill(CLASS, {
        name: "Apply Big Tick",
        castFrames: 70,
        hits: [
          makeHit({
            frame: 0,
            triggers: [makeTrigger({ kind: "applyDebuff", targetId: bigTick.id, stacks: 1 })],
          }),
        ],
      })
      return runRotation(
        mindMethods,
        [applySkill, probeSkill],
        [bigTick],
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: applySkill.id, hitCount: 1 }),
            makeStep({ skillId: probeSkill.id, hitCount: 1 }),
          ],
        }),
      )
    }

    const tier6 = mindMethodsWith(INNER_WAY_ID.mistwing, 6)
    const marginWithBigTick =
      probeDamage(run(tier6, 50_000_000)) - probeDamage(run(UNSLOTTED, 50_000_000))
    const marginWithoutTick = probeDamage(run(tier6, 0)) - probeDamage(run(UNSLOTTED, 0))
    expect(marginWithBigTick).toBeGreaterThan(marginWithoutTick)
  })

  it("a released echo before a hit raises the mistwing bonus that hit receives", () => {
    // Drunkslay's echo is fed by any Inebriate-enhanced skill while the mark
    // is up (`skyspeakBuffs.ts`) — marking and releasing it directly here
    // skips the Skyspeak talent that normally grants the mark itself.
    const markSkill = makeSkill(CLASS, {
      name: "Mark",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: DEBUFF.drunkslay, stacks: 1 })],
        }),
      ],
    })
    // Calibrated so the feed alone leaves the target inside the top health
    // band, and the released 20% share alone pushes it into the next one.
    const feedSkill = makeSkill(CLASS, {
      name: "Feed",
      castFrames: 10,
      receives: [BUFF.drunkslayEcho],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 800_000 })],
    })
    const releaseSkill = makeSkill(CLASS, {
      name: "Release",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "releaseEcho", targetId: DEBUFF.drunkslay })],
        }),
      ],
    })

    function run(mindMethods: Inputs["mindMethods"], includeRelease: boolean) {
      const steps = [
        makeStep({ skillId: markSkill.id, hitCount: 1 }),
        makeStep({ skillId: feedSkill.id, hitCount: 1 }),
      ]
      if (includeRelease) steps.push(makeStep({ skillId: releaseSkill.id, hitCount: 1 }))
      steps.push(makeStep({ skillId: probeSkill.id, hitCount: 1 }))
      return runRotation(
        mindMethods,
        [markSkill, feedSkill, releaseSkill, probeSkill],
        [],
        makeRotation(CLASS, { steps, openingStacks: { [STATUS.bingePoints]: 100 } }),
      )
    }

    const tier6 = mindMethodsWith(INNER_WAY_ID.mistwing, 6)
    const marginWithRelease = probeDamage(run(tier6, true)) - probeDamage(run(UNSLOTTED, true))
    const marginWithoutRelease = probeDamage(run(tier6, false)) - probeDamage(run(UNSLOTTED, false))
    expect(marginWithRelease).toBeGreaterThan(marginWithoutRelease)
  })

  it("a pre-pull cast's damage does not move the target's health", () => {
    function run(mindMethods: Inputs["mindMethods"], includePrePull: boolean) {
      const bigPrePullHit = makeHit({ frame: 0, physMultiplier: 1, physFixed: 50_000_000 })
      const prePullSkill = makeSkill(CLASS, {
        name: "Setup Prepull",
        prePull: true,
        castFrames: 10,
        hits: [bigPrePullHit],
      })
      const steps = includePrePull ? [makeStep({ skillId: prePullSkill.id, hitCount: 1 })] : []
      steps.push(makeStep({ skillId: probeSkill.id, hitCount: 1 }))
      return runRotation(
        mindMethods,
        [prePullSkill, probeSkill],
        [],
        makeRotation(CLASS, { steps }),
      )
    }

    const tier6 = mindMethodsWith(INNER_WAY_ID.mistwing, 6)
    const marginWithPrePull = probeDamage(run(tier6, true)) - probeDamage(run(UNSLOTTED, true))
    const marginWithoutPrePull = probeDamage(run(tier6, false)) - probeDamage(run(UNSLOTTED, false))
    expect(marginWithPrePull).toBeCloseTo(marginWithoutPrePull, 6)
  })
})

describe("Volutefit", () => {
  it("tier 1 raises an Inebriate-enhanced skill by 5%", () => {
    function runHerosBlood(mindMethods: Inputs["mindMethods"]) {
      return runEngine({
        ...defaultInputs,
        classId: CLASS,
        set: null,
        mindMethods,
        activeCustomRotation: makeRotation(CLASS, {
          steps: [makeStep({ skillId: SKILL.herosBlood, hitCount: 2 })],
          openingStacks: { [STATUS.bingePoints]: 100 },
        }),
      })
    }
    const herosBloodDamage = (result: ReturnType<typeof runHerosBlood>) =>
      result.perSkill.find((row) => row.breakdownName === "Hero's Blood")!.expectedDamage

    const tier1 = mindMethodsWith(INNER_WAY_ID.volutefit, 1)
    const peakfallRatio =
      peakfallDamage(runPeakfall(tier1)) / peakfallDamage(runPeakfall(UNSLOTTED))
    const herosBloodRatio =
      herosBloodDamage(runHerosBlood(tier1)) / herosBloodDamage(runHerosBlood(UNSLOTTED))
    expect(herosBloodRatio).toBeCloseTo(1, 6)
    expect(peakfallRatio).toBeGreaterThan(herosBloodRatio)
  })

  it("lands its two panel lines on the path's own attribute, from tiers 2 and 5", () => {
    const derived = (mindMethods: Inputs["mindMethods"]) =>
      withDerivedStats({ ...defaultInputs, classId: CLASS, breakthrough: 17, mindMethods })
    const unslotted = derived(UNSLOTTED)
    const at = (tier: number) => derived(mindMethodsWith(INNER_WAY_ID.volutefit, tier))

    expect(at(1).bamboocut.max).toBeCloseTo(unslotted.bamboocut.max, 6)
    expect(at(2).bamboocut.max - unslotted.bamboocut.max).toBeCloseTo(29.5, 6)
    expect(at(2).bamboocut.min - unslotted.bamboocut.min).toBeCloseTo(14.7, 6)

    expect(at(4).bamboocut.penetration).toBeCloseTo(unslotted.bamboocut.penetration, 6)
    expect(at(5).bamboocut.penetration - unslotted.bamboocut.penetration).toBeCloseTo(0.06, 6)
  })
})
