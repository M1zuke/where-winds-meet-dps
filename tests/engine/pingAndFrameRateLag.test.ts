import { describe, expect, it } from "vitest"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import type { Inputs } from "../../src/engine/types"
import { applyDot, detonateDot } from "../../src/definitions/skills/triggers"

// Scoped to Bellstrike Umbra only because `buildContext` needs a registered
// class — every skill, buff and debuff below is synthetic, not an anchor.
const CLASS = "bellstrikeUmbra"

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  overrides: Partial<Inputs> = {},
  buffs: Buff[] = [],
  debuffs: Debuff[] = [],
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
    ...overrides,
  }
}

describe("ping and average fps — delays every cast's start by the quantised round trip", () => {
  it("adds the same round-trip frames before every cast in the rotation", () => {
    const firstSkill = makeSkill(CLASS, { name: "First", castFrames: 60, hits: [makeHit()] })
    const secondSkill = makeSkill(CLASS, { name: "Second", castFrames: 60, hits: [makeHit()] })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: firstSkill.id }), makeStep({ skillId: secondSkill.id })],
    })
    const inputs = timelineInputs(rotation, [firstSkill, secondSkill], {
      pingMs: 100,
      averageFps: 60,
    })
    const result = simulateTimeline(inputs)

    const [castA, castB] = result.casts!
    expect(castA.timeSec).toBeCloseTo(6 / FPS, 10)
    expect(castB.timeSec).toBeCloseTo(72 / FPS, 10)
    expect(result.rotationDuration).toBeCloseTo(132 / FPS, 10)
  })

  it("adds nothing at 0 ms", () => {
    const skill = makeSkill(CLASS, { name: "Solo", castFrames: 60, hits: [makeHit()] })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 0, averageFps: 60 }),
    )
    expect(result.casts![0].timeSec).toBe(0)
  })
})

describe("ping and average fps — quantises cast length and hit offsets to the input frame rate", () => {
  it("rounds a cast's length and its hit offset up to the next render frame", () => {
    const skill = makeSkill(CLASS, {
      name: "Odd",
      castFrames: 61,
      hits: [makeHit({ frame: 5, physMultiplier: 1, physFixed: 100 })],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 0, averageFps: 30 }),
    )

    const hitEvent = result.timeline!.find((event) => event.kind === "hit")!
    expect(hitEvent.frame).toBe(6)
    expect(result.castDuration).toBeCloseTo(62 / FPS, 10)
  })

  it("leaves every authored frame untouched at the default 60 fps", () => {
    const skill = makeSkill(CLASS, {
      name: "Odd",
      castFrames: 61,
      hits: [makeHit({ frame: 5, physMultiplier: 1, physFixed: 100 })],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 0, averageFps: 60 }),
    )

    const hitEvent = result.timeline!.find((event) => event.kind === "hit")!
    expect(hitEvent.frame).toBe(5)
    expect(result.castDuration).toBeCloseTo(61 / FPS, 10)
  })
})

describe("ping and average fps — skips the round trip only in dummy mode for no-wait skills", () => {
  const skill = makeSkill(CLASS, {
    name: "NoWaitOnDummy",
    castFrames: 30,
    startLatency: "noWaitOnDummy",
    hits: [makeHit()],
  })
  const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })

  it("skips the round trip in dummy mode", () => {
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 60, dummyMode: true }),
    )
    expect(result.casts![0].timeSec).toBe(0)
  })

  it("still waits for the round trip with dummy mode off", () => {
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 60, dummyMode: false }),
    )
    expect(result.casts![0].timeSec).toBeCloseTo(6 / FPS, 10)
  })
})

describe("ping and average fps — adds no round trip to idle delay steps or generated sub-casts", () => {
  it("a step whose skill declares no start latency requirement starts at once", () => {
    const idle = makeSkill(CLASS, { name: "Idle", castFrames: 10, startLatency: "none", hits: [] })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: idle.id })] })
    const result = simulateTimeline(
      timelineInputs(rotation, [idle], { pingMs: 100, averageFps: 60 }),
    )
    expect(result.casts![0].timeSec).toBe(0)
  })

  it("keeps a generated sub-cast's offset from its trigger untouched by the round trip", () => {
    const generatedSkill = makeSkill(CLASS, {
      name: "Generated",
      castFrames: 10,
      triggerable: true,
      hits: [makeHit({ frame: 3, physMultiplier: 1, physFixed: 50 })],
    })
    const casterSkill = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 50,
          triggers: [makeTrigger({ kind: "castSkill", targetId: generatedSkill.id })],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: casterSkill.id })] })

    const spacingBetweenHits = (pingMs: number): number => {
      const result = simulateTimeline(
        timelineInputs(rotation, [casterSkill, generatedSkill], { pingMs, averageFps: 60 }),
      )
      const hitFrames = result
        .timeline!.filter((event) => event.kind === "hit")
        .map((event) => event.frame)
      return hitFrames[1] - hitFrames[0]
    }

    expect(spacingBetweenHits(0)).toBe(3)
    expect(spacingBetweenHits(100)).toBe(3)
  })

  it("still quantises a detonation's own offset from its detonating hit to the input frame rate", () => {
    const detonationSkill = makeSkill(CLASS, {
      name: "Detonation",
      castFrames: 10,
      triggerable: true,
      hits: [makeHit({ frame: 5, physMultiplier: 1, physFixed: 50 })],
    })
    const stacker = makeDebuff(CLASS, {
      name: "Stacker",
      maxStacks: 1,
      detonation: { skillId: detonationSkill.id },
    })
    const detonatingSkill = makeSkill(CLASS, {
      name: "Detonating",
      castFrames: 10,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 50,
          triggers: [
            applyDot({ target: stacker.id, stacks: 1, condition: null }),
            detonateDot({ target: stacker.id, stacks: 0, condition: null }),
          ],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: detonatingSkill.id })] })

    const spacingBetweenHits = (averageFps: number): number => {
      const result = simulateTimeline(
        timelineInputs(
          rotation,
          [detonatingSkill, detonationSkill],
          { pingMs: 0, averageFps },
          [],
          [stacker],
        ),
      )
      const hitFrames = result
        .timeline!.filter((event) => event.kind === "hit")
        .map((event) => event.frame)
      return hitFrames[1] - hitFrames[0]
    }

    expect(spacingBetweenHits(60)).toBe(5)
    expect(spacingBetweenHits(30)).toBe(6)
  })
})

describe("ping and average fps — keeps buff durations and DoT cadence unchanged under lag", () => {
  it("shifts only the opening frame, never the window length or the tick spacing", () => {
    const debuff = makeDebuff(CLASS, {
      name: "Bleed",
      durationFrames: 90,
      dot: {
        tickIntervalFrames: 30,
        firstTickOffsetFrames: 0,
        physMultiplier: 1,
        physFixed: 10,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 3,
      },
    })
    const buff = makeBuff(CLASS, { name: "Stance", durationFrames: 90 })
    const skill = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 20,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({ kind: "applyDot", targetId: debuff.id }),
            makeTrigger({ kind: "applyBuff", targetId: buff.id }),
          ],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      // Long enough that every tick lands inside it regardless of the
      // round-trip-shifted cast start — the window under test is the DoT's
      // own, not the rotation's.
      fixedWindowSec: 200 / FPS,
    })
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 30 }, [buff], [debuff]),
    )

    const dotTickFrames = result
      .timeline!.filter((event) => event.kind === "dot")
      .map((event) => event.frame)
    expect(dotTickFrames.length).toBe(3)
    expect(dotTickFrames[1] - dotTickFrames[0]).toBe(30)
    expect(dotTickFrames[2] - dotTickFrames[1]).toBe(30)

    const buffWindow = result.buffWindows!.find((window) => window.id === buff.id)!
    expect(Math.round((buffWindow.endSec - buffWindow.startSec) * FPS)).toBe(90)
  })
})

describe("ping and average fps — drops hits pushed past a fixed window", () => {
  it("a hit the round trip pushes past the window scores nothing", () => {
    const skill = makeSkill(CLASS, {
      name: "Solo",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      fixedWindowSec: 5 / FPS,
    })
    const baseline = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 0, averageFps: 60 }),
    )
    const lagged = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 60 }),
    )

    expect(baseline.totalDamage).toBeGreaterThan(0)
    expect(lagged.totalDamage).toBe(0)
  })
})
