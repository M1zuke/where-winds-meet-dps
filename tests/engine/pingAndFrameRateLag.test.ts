import { describe, expect, it } from "vitest"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeSkill, makeHit, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import type { Inputs } from "../../src/engine/types"
import { applyDot, detonateDot } from "../../src/definitions/skills/triggers"
import { enduranceMeter } from "../../src/data/resources/enduranceMeter"

// Scoped to Bellstrike Umbra only because `buildContext` needs a registered
// class — every skill, buff and debuff below is synthetic, not an anchor.
const CLASS = "bellstrikeUmbra"

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  overrides: Partial<Inputs> & { pingMs?: number; averageFps?: number } = {},
  buffs: Buff[] = [],
  debuffs: Debuff[] = [],
): Inputs {
  const { pingMs, averageFps, ...rest } = overrides
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    customDebuffs: debuffs,
    activeCustomRotation: {
      ...rotation,
      ...(pingMs !== undefined ? { pingMs } : {}),
      ...(averageFps !== undefined ? { averageFps } : {}),
    },
    ...rest,
  }
}

describe("ping and average fps — delays every cast's start by the quantised round trip plus the server processing time plus one render frame", () => {
  it("adds the same round-trip-plus-server-processing-plus-one-frame delay before every cast in the rotation", () => {
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

    // 100 ms ping (6 f) + the calibrated server processing time (24 ms, 1.44 f)
    // + one 60 fps render frame (1 f), rounded up to the next render frame: 9 f.
    const [castA, castB] = result.casts!
    expect(castA.timeSec).toBeCloseTo(9 / FPS, 10)
    expect(castB.timeSec).toBeCloseTo(78 / FPS, 10)
    expect(result.rotationDuration).toBeCloseTo(138 / FPS, 10)
  })

  it("adds nothing at 0 ms — the app's own no-latency baseline, not a real zero-latency connection", () => {
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

describe("ping and average fps — skips the round trip and the server processing time only in dummy mode for no-wait skills, but still pays the render frame", () => {
  const skill = makeSkill(CLASS, {
    name: "NoWaitOnDummy",
    castFrames: 30,
    startLatency: "noWaitOnDummy",
    hits: [makeHit()],
  })
  const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })

  it("still pays one render frame in dummy mode", () => {
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 60, dummyMode: true }),
    )
    expect(result.casts![0].timeSec).toBeCloseTo(1 / FPS, 10)
  })

  it("still waits for the round trip plus the server processing time with dummy mode off", () => {
    const result = simulateTimeline(
      timelineInputs(rotation, [skill], { pingMs: 100, averageFps: 60, dummyMode: false }),
    )
    expect(result.casts![0].timeSec).toBeCloseTo(9 / FPS, 10)
  })
})

describe("ping and average fps — a skill's own further in-cast server waits lengthen the cast and delay its hits", () => {
  it("delays every hit and the next step's start by the round trip plus the server processing time, once per declared wait", () => {
    const waiting = makeSkill(CLASS, {
      name: "Waiting",
      castFrames: 20,
      serverWaitsInCast: 1,
      hits: [makeHit({ frame: 5, physMultiplier: 1, physFixed: 100 })],
    })
    const next = makeSkill(CLASS, { name: "Next", castFrames: 10, hits: [makeHit()] })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: waiting.id }), makeStep({ skillId: next.id })],
    })
    const result = simulateTimeline(
      timelineInputs(rotation, [waiting, next], { pingMs: 100, averageFps: 60 }),
    )

    // The cast's own start pays only the ordinary start latency (9 f); its
    // one further in-cast wait (100 ms ping + the 24 ms server processing
    // time, 8 f) then delays every hit and the cast's own end, so the next
    // step starts 8 f later than the plain 20 f cast length would give.
    const [castA, castB] = result.casts!
    expect(castA.timeSec).toBeCloseTo(9 / FPS, 10)
    expect(castB.timeSec).toBeCloseTo((9 + 20 + 8 + 9) / FPS, 10)
    const hitEvent = result.timeline!.find((event) => event.kind === "hit")!
    expect(hitEvent.frame).toBe(9 + 5 + 8)
  })

  it("does not reach a pre-pull cast", () => {
    const real = makeSkill(CLASS, {
      name: "Real",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })
    const runWith = (serverWaitsInCast: number | undefined) => {
      const prepull = makeSkill(CLASS, {
        name: "Prepull",
        prePull: true,
        castFrames: 20,
        serverWaitsInCast,
        hits: [makeHit({ frame: 5, physMultiplier: 1, physFixed: 100 })],
      })
      const rotation = makeRotation(CLASS, {
        steps: [makeStep({ skillId: prepull.id }), makeStep({ skillId: real.id })],
      })
      // divinecraft off: Fire Oil's own burn schedule spans the fight window,
      // which `serverWaitsInCast` now shifts by moving which hit is latest
      // (docs/TIMELINE.md § "Fight window") — noise unrelated to what this
      // test checks.
      return simulateTimeline(
        timelineInputs(rotation, [prepull, real], {
          pingMs: 100,
          averageFps: 60,
          divinecraft: null,
        }),
      )
    }
    const withWait = runWith(1)
    const withoutWait = runWith(undefined)
    expect(withWait.totalDamage).toBeCloseTo(withoutWait.totalDamage, 10)
    expect(withWait.casts![1].timeSec).toBeCloseTo(withoutWait.casts![1].timeSec, 10)
  })
})

describe("ping and average fps — a permanent status stays readable through a heavily lagged rotation", () => {
  it("keeps a gated cast legal at the end of a long, high-ping chain", () => {
    const gate = makeBuff(CLASS, { name: "AlwaysUp", activation: "permanent", maxStacks: 1 })
    const gated = makeSkill(CLASS, {
      name: "Gated",
      castFrames: 1,
      castConditions: [{ buffId: gate.id, op: "gte", stacks: 1 }],
      hits: [makeHit()],
    })
    const rotation = makeRotation(CLASS, {
      steps: Array.from({ length: 50 }, () => makeStep({ skillId: gated.id })),
      openingStacks: { [gate.id]: 1 },
    })
    const result = simulateTimeline(
      timelineInputs(rotation, [gated], { pingMs: 200, averageFps: 60 }, [gate]),
    )
    expect(result.invalidStepIds ?? []).toEqual([])
  })
})

describe("ping and average fps — the free direct weapon swap never waits on a round trip", () => {
  it("starts the inserted swap the instant the previous cast ends, round trip and all", () => {
    const swordSkill = makeSkill(CLASS, {
      name: "SwordHit",
      tags: ["weapon:Sword"],
      castFrames: 10,
      hits: [makeHit()],
    })
    const spearSkill = makeSkill(CLASS, {
      name: "SpearHit",
      tags: ["weapon:Spear"],
      castFrames: 10,
      hits: [makeHit()],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: swordSkill.id }), makeStep({ skillId: spearSkill.id })],
    })
    const result = simulateTimeline(
      timelineInputs(rotation, [swordSkill, spearSkill], { pingMs: 100, averageFps: 60 }),
    )

    const swap = result.casts!.find((cast) => cast.skillName.startsWith("Weapon Swap"))!
    const sword = result.casts!.find((cast) => cast.skillName === "SwordHit")!
    expect(swap.timeSec).toBeCloseTo(sword.timeSec + 10 / FPS, 10)
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

describe("ping and average fps — a meter's own cursor stays a clean integer frame through a lagged pre-pull step", () => {
  it("costs a meter on its own computed frame with no clamp warning at a non-integer render period", () => {
    const prepull = makeSkill(CLASS, {
      name: "Prepull",
      prePull: true,
      castFrames: 30,
      hits: [makeHit({ frame: 10, physMultiplier: 1, physFixed: 1 })],
    })
    const costly = makeSkill(CLASS, {
      name: "Costly",
      castFrames: 12,
      meterCosts: [{ meterId: enduranceMeter.id, amount: 20 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: prepull.id }), makeStep({ skillId: costly.id })],
    })
    const result = simulateTimeline(
      timelineInputs(rotation, [prepull, costly], { pingMs: 10, averageFps: 250 }),
    )
    expect(result.warnings.some((warning) => warning.includes("before the cursor"))).toBe(false)
    const costlyCast = result.casts!.find((cast) => cast.skillName === "Costly")!
    expect(Math.round(costlyCast.timeSec * FPS)).toBe(2)
    const meterLevel = costlyCast.meterLevels?.find((level) => level.id === enduranceMeter.id)
    expect(meterLevel?.amount).toBe(meterLevel?.capacity)
  })
})

describe("ping and average fps — drops hits pushed past a fixed window", () => {
  it("a hit the round trip pushes past the window scores nothing, while the earlier hit anchoring the window still counts", () => {
    // An early damaging hit anchors the window's own start; the hit under
    // test only ever gets pushed past that window's end, never absorbed into
    // anchoring a fresh one of its own — docs/TIMELINE.md § "Fight window".
    const anchor = makeSkill(CLASS, {
      name: "Anchor",
      castFrames: 1,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const skill = makeSkill(CLASS, {
      name: "Solo",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 100 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: anchor.id }), makeStep({ skillId: skill.id })],
      fixedWindowSec: 5 / FPS,
    })
    const baseline = simulateTimeline(
      timelineInputs(rotation, [anchor, skill], { pingMs: 0, averageFps: 60 }),
    )
    const lagged = simulateTimeline(
      timelineInputs(rotation, [anchor, skill], { pingMs: 100, averageFps: 60 }),
    )

    expect(baseline.perSkill.find((row) => row.name === "Solo")?.expectedDamage).toBeGreaterThan(0)
    expect(lagged.perSkill.find((row) => row.name === "Solo")).toBeUndefined()
    expect(lagged.totalDamage).toBe(
      lagged.perSkill.find((row) => row.name === "Anchor")?.expectedDamage,
    )
  })
})
