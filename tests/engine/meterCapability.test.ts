// The generic meter capability (docs/TIMELINE.md § "Meters"): a build-wide
// bar advanced by the timeline's own events. `bellstrikeUmbra` already registers the
// shared Endurance meter (`src/data/resources/enduranceMeter.ts`) — every
// skill and buff below is placeholder content authored only for this file.
import { describe, expect, it, vi } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"
import { enduranceMeter, enduranceRequires } from "../../src/data/resources/enduranceMeter"
import { meterStatusId, meterMaxParamKey } from "../../src/definitions/resources/meterDef"
import type { UnclaimedOddityNodes } from "../../src/engine/types"

const { RECORDED_STATUS, SPEND_PROBE_ID } = vi.hoisted(() => ({
  RECORDED_STATUS: "recordedConversionAmount",
  SPEND_PROBE_ID: "recordedSpendProbe",
}))

vi.mock("../../src/engine/buffs/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/engine/buffs/data")>()
  const { stat: statEffect } = await import("../../src/engine/effects/effect")
  const spendProbe = {
    id: SPEND_PROBE_ID,
    name: "Spend Probe",
    alwaysActive: true,
    duration: 9999,
    summary: "test",
    effects: (context: {
      self: { reachesEvent: boolean }
      status: { stacks(id: string): number }
    }) =>
      context.self.reachesEvent
        ? [statEffect("allDamageBoost", context.status.stacks(RECORDED_STATUS))]
        : [],
  }
  return {
    ...actual,
    buffDefsForClass: (classId: string) => [...actual.buffDefsForClass(classId), spendProbe],
  }
})

const CLASS = "bellstrikeUmbra"
const METER_ID = enduranceMeter.id
const STATUS_ID = meterStatusId(METER_ID)

// `defaultInputs` assumes a fully claimed Oddity board (nothing recorded as
// unclaimed), which now carries +40 Max Endurance (8 "Max Endurance +5"
// nodes) — unclaiming exactly those nodes here isolates the plain meter
// mechanics this file is about from that separately-tested contribution.
const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
  Jiangnan: [705, 719],
}

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[] = [],
  patch: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    ...patch,
  }
}

function rotationOf(skills: Skill[]): Rotation {
  return makeRotation(CLASS, { steps: skills.map((skill) => makeStep({ skillId: skill.id })) })
}

function meterLevelsAt(result: ReturnType<typeof simulateTimeline>, index: number) {
  const cast = result.casts?.[index]
  return cast?.meterLevels?.find((level) => level.id === METER_ID)
}

describe("a meter cost", () => {
  it("spends at the cast's own start, gated by an ordinary status condition against its requirement", () => {
    const costly = makeSkill(CLASS, {
      name: "Costly",
      castFrames: 30,
      meterCosts: [{ meterId: METER_ID, amount: 20 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([costly, costly, costly, costly]), [costly]),
    )
    expect(meterLevelsAt(result, 0)?.amount).toBe(80)
    expect(meterLevelsAt(result, 1)?.amount).toBe(60)
  })

  it("flags a step whose requirement the meter's current value fails, via the existing legality mechanism", () => {
    const gated = makeSkill(CLASS, {
      name: "Gated by Meter",
      castFrames: 30,
      castConditions: [enduranceRequires("gte", 200)],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([gated]), [gated]))
    expect(result.invalidStepIds?.length).toBe(1)
    expect(result.warnings.some((warning) => warning.includes("Gated by Meter"))).toBe(true)
    // A flagged step still lands every hit its skill has.
    expect(result.perSkill.find((row) => row.name === "Gated by Meter")?.count).toBe(1)
  })

  it("waives a cost above requiresMaxTier, and still applies it below that tier or with no param at all", () => {
    const param = "meterCapabilityTestParam"
    const costAt = (buffParams: Record<string, unknown>) => {
      const costly = makeSkill(CLASS, {
        name: "Costly",
        castFrames: 6,
        meterCosts: [{ meterId: METER_ID, amount: 20, requiresParam: param, requiresMaxTier: 3 }],
        hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
      })
      const observer = makeSkill(CLASS, {
        name: "Observer",
        castFrames: 6,
        hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
      })
      const result = simulateTimeline(
        timelineInputs(rotationOf([costly, observer]), [costly, observer], [], { buffParams }),
      )
      return meterLevelsAt(result, 1)?.amount
    }
    // Untiered reads as tier 0, so a cost waived only from some tier up still
    // applies to a build that never slotted the param at all.
    expect(costAt({})).toBe(60)
    expect(costAt({ [param]: true, [`${param}Tier`]: 3 })).toBe(60)
    expect(costAt({ [param]: true, [`${param}Tier`]: 4 })).toBe(80)
  })

  it("a pre-pull cast never touches a meter, whatever it declares", () => {
    const prePullCostly = makeSkill(CLASS, {
      name: "Prepull Costly",
      prePull: true,
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 999 }],
      meterDrains: [{ meterId: METER_ID, perSecond: 999, fromFrame: 0 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([prePullCostly, observer]), [prePullCostly, observer]),
    )
    const observerLevel = result.casts
      ?.find((cast) => cast.skillName === "Observer")
      ?.meterLevels?.find((level) => level.id === METER_ID)
    expect(observerLevel?.amount).toBe(80)
  })
})

describe("a meter drain", () => {
  it("replaces natural regeneration for its own interval instead of adding to it", () => {
    const holdsStill = makeSkill(CLASS, {
      name: "Holds Still",
      castFrames: 120,
      meterDrains: [{ meterId: METER_ID, perSecond: 30, fromFrame: 0, stopAfterSec: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const drainedThenIdle = makeSkill(CLASS, {
      name: "Idle",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([holdsStill, drainedThenIdle]), [holdsStill, drainedThenIdle]),
    )
    // 1 s of a 30 / s drain, no regen while it runs: 80 - 30 = 50, then 1 s
    // of natural 10 / s regen once the cast (and the drain) ends: 50 + 10 = 60.
    expect(meterLevelsAt(result, 1)?.amount).toBe(60)
  })

  it("stops on its own stop frame, letting natural regeneration resume for the rest of the cast", () => {
    const holdsThenReleases = makeSkill(CLASS, {
      name: "Holds Then Releases",
      castFrames: 120,
      meterDrains: [{ meterId: METER_ID, perSecond: 60, fromFrame: 0, stopAfterSec: 0.5 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([holdsThenReleases, observer]), [holdsThenReleases, observer]),
    )
    // 0.5 s of a 60 / s drain empties 30 (80 -> 50), then 1.5 s of regen at
    // 10 / s once the drain stops adds 15 back by the cast's own end.
    expect(meterLevelsAt(result, 1)?.amount).toBe(65)
  })
})

describe("a meter freeze", () => {
  it("holds regeneration from its own frame to the cast's own end, with no explicit drain", () => {
    const spendsThenFreezes = makeSkill(CLASS, {
      name: "Spends Then Freezes",
      castFrames: 180,
      meterCosts: [{ meterId: METER_ID, amount: 40 }],
      meterFreezes: [{ meterId: METER_ID, fromFrame: 0 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const idle = makeSkill(CLASS, {
      name: "Idle After Freeze",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([spendsThenFreezes, idle]), [spendsThenFreezes, idle]),
    )
    // 3 s frozen (180 f at 60 fps) would otherwise regenerate 30 back.
    expect(meterLevelsAt(result, 1)?.amount).toBe(40)
  })
})

describe("a meterDelta trigger", () => {
  it("gains or spends a fixed amount on its own hit, reusing the trigger gate for conditions", () => {
    const grants = makeSkill(CLASS, {
      name: "Grants",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 80 }],
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [
            {
              kind: "meterDelta",
              targetId: METER_ID,
              stacks: 15,
              condition: null,
            },
          ],
        }),
      ],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([grants, observer]), [grants, observer]),
    )
    expect(meterLevelsAt(result, 1)?.amount).toBe(15)
    expect(result.perSkill.find((row) => row.name === "Grants")?.count).toBe(1)
  })

  it("spends at most a ceiling and at most the current amount when capped", () => {
    const drainsFirst = makeSkill(CLASS, {
      name: "Drains First",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 75 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const spendsUpToCap = makeSkill(CLASS, {
      name: "Spends Up To Cap",
      castFrames: 12,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [
            {
              kind: "meterDelta",
              targetId: METER_ID,
              stacks: -20,
              condition: null,
              meterSpendCapToCurrent: 20,
            },
          ],
        }),
      ],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([drainsFirst, spendsUpToCap, observer]), [
        drainsFirst,
        spendsUpToCap,
        observer,
      ]),
    )
    // 80 - 75 = 5 remains, so the capped spend takes only 5 of it (never the
    // full 20) and the meter never goes negative.
    expect(meterLevelsAt(result, 2)?.amount).toBe(0)
  })

  it("with appliesOnCastEnd applies at the cast's own end, not the hit it is declared on", () => {
    const spendsAtCastEnd = makeSkill(CLASS, {
      name: "Spends At Cast End",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [
            {
              kind: "meterDelta",
              targetId: METER_ID,
              stacks: -10,
              condition: null,
              appliesOnCastEnd: true,
            },
          ],
        }),
      ],
    })
    const idle = makeSkill(CLASS, {
      name: "Idle",
      castFrames: 40,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([spendsAtCastEnd, idle, observer]), [
        spendsAtCastEnd,
        idle,
        observer,
      ]),
    )
    // Applied at frame 60 (the cast's own end), so the 1.2s pause it restarts
    // (`enduranceMeter.regenPauseAfterSpendSec`) still holds at frame 100 —
    // 80 - 10 = 70, with no regen yet. Applied at hit 0's own frame instead,
    // the pause would have ended 28 frames earlier and regen would already
    // show.
    expect(meterLevelsAt(result, 2)?.amount).toBe(70)
  })
})

describe("a meterDelta trigger's recordSpendAsStatus", () => {
  const recordedStatus = RECORDED_STATUS
  const WAVE_FIXED = 100
  const boostedVariant = (id: string, stacks = 1) => ({
    id,
    label: "Boosted",
    conditions: [{ buffId: recordedStatus, op: "gte" as const, stacks }],
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: WAVE_FIXED * 10,
    attributeFixed: 0,
  })
  const waveAt = (frame: number, patch: Partial<Skill["hits"][number]> = {}) =>
    makeHit({ frame, physMultiplier: 0, physFixed: WAVE_FIXED, ...patch })
  const spendHit = (conditions: Skill["hits"][number]["conditions"] = undefined, frame = 0) =>
    makeHit({
      frame,
      physMultiplier: 0,
      physFixed: 0,
      conditions,
      triggers: [
        {
          kind: "meterDelta",
          targetId: METER_ID,
          stacks: -1000,
          condition: null,
          meterSpendCapToCurrent: 1000,
          recordSpendAsStatus: recordedStatus,
        },
      ],
    })
  const damagesOf = (result: ReturnType<typeof simulateTimeline>, skillName: string) =>
    result
      .timeline!.filter((event) => event.skillName === skillName && event.damage > 0)
      .map((event) => event.damage)
  const BOOST_FLOOR = 5

  it("lets a buff effect on later waves read the spend recorded mid-cast, and hits before it read zero", () => {
    const converts = makeSkill(CLASS, {
      name: "Converts",
      castFrames: 60,
      receives: [SPEND_PROBE_ID],
      hits: [waveAt(5), spendHit(undefined, 10), waveAt(30), waveAt(40)],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([converts]), [converts]))
    const [earlyWave, firstWave, secondWave] = damagesOf(result, "Converts")
    expect(firstWave).toBeGreaterThan(earlyWave * BOOST_FLOOR)
    expect(secondWave).toBeGreaterThan(earlyWave * BOOST_FLOOR)
  })

  it("keeps a recorded spend readable by a hit landing after the cast's own length", () => {
    const converts = makeSkill(CLASS, {
      name: "Converts",
      castFrames: 60,
      receives: [SPEND_PROBE_ID],
      hits: [waveAt(5), spendHit(undefined, 10), waveAt(100)],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([converts]), [converts]))
    const [earlyWave, lateWave] = damagesOf(result, "Converts")
    expect(lateWave).toBeGreaterThan(earlyWave * BOOST_FLOOR)
  })

  it("does not carry a spend into a later cast whose spend did not fire", () => {
    const converts = makeSkill(CLASS, {
      name: "Converts",
      castFrames: 60,
      receives: [SPEND_PROBE_ID],
      hits: [waveAt(5), spendHit(undefined, 10), waveAt(30)],
    })
    const declines = makeSkill(CLASS, {
      name: "Declines",
      castFrames: 60,
      receives: [SPEND_PROBE_ID],
      hits: [spendHit([{ buffId: "neverGrantedStatus", op: "gte", stacks: 1 }], 10), waveAt(30)],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([converts, declines]), [converts, declines]),
    )
    const [earlyWave, convertsWave] = damagesOf(result, "Converts")
    const [declinesWave] = damagesOf(result, "Declines")
    expect(convertsWave).toBeGreaterThan(earlyWave * BOOST_FLOOR)
    expect(declinesWave).toBeCloseTo(earlyWave, 6)
  })

  it("lets a projectile wave landing after the next spending cast has started still read its own cast's spend", () => {
    const slowWave = {
      speedMetersPerSecond: 1,
      maxTravelFrames: 150,
    }
    const converts = makeSkill(CLASS, {
      name: "Converts Slow",
      castFrames: 30,
      receives: [SPEND_PROBE_ID],
      hits: [waveAt(5), spendHit(undefined, 10), waveAt(30, { projectile: slowWave })],
    })
    const next = makeSkill(CLASS, {
      name: "Next Spender",
      castFrames: 30,
      hits: [spendHit()],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([converts, next]), [converts, next]))
    const nextCastFrame = Math.round(result.casts![1].timeSec * 60)
    const events = result.timeline!.filter(
      (event) => event.skillName === "Converts Slow" && event.damage > 0,
    )
    const earlyWave = events[0]
    const slowEvent = events.at(-1)!
    expect(slowEvent.frame).toBeGreaterThan(nextCastFrame)
    expect(slowEvent.damage).toBeGreaterThan(earlyWave.damage * BOOST_FLOOR)
  })

  it("selects a variant at cast start, so it does not see a spend its own cast records later", () => {
    const converts = makeSkill(CLASS, {
      name: "Converts",
      castFrames: 60,
      hits: [
        waveAt(5),
        spendHit(undefined, 10),
        waveAt(30, { variants: [boostedVariant("converts-late-variant-boosted")] }),
      ],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([converts]), [converts]))
    const [earlyWave, lateWave] = damagesOf(result, "Converts")
    expect(lateWave).toBeCloseTo(earlyWave, 6)
  })

  it("applies a spend listed ahead of a gain on the same hit to the meter before the gain", () => {
    const drains = makeSkill(CLASS, {
      name: "Drains Meter",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 75 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const spendsThenGains = makeSkill(CLASS, {
      name: "Spends Then Gains",
      castFrames: 60,
      receives: [SPEND_PROBE_ID],
      hits: [
        waveAt(5),
        {
          ...spendHit(undefined, 10),
          triggers: [
            ...spendHit().triggers,
            { kind: "meterDelta", targetId: METER_ID, stacks: 20, condition: null },
          ],
        },
        waveAt(30),
      ],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([drains, spendsThenGains]), [drains, spendsThenGains]),
    )
    const [earlyWave, laterWave] = damagesOf(result, "Spends Then Gains")
    const boostRatio = laterWave / earlyWave
    expect(boostRatio).toBeGreaterThan(4)
    expect(boostRatio).toBeLessThan(10)
  })
})

describe("a meterDelta trigger's refundFractionOfCastCost", () => {
  it("refunds the fraction of what the cast actually paid after a cost modifier, not the nominal cost", () => {
    const reducesCost: Buff = makeBuff(CLASS, {
      name: "Cost Reducer",
      activation: "triggered",
      durationFrames: 600,
      meterModifiers: [{ meterId: METER_ID, kind: "cost", amount: -0.5 }],
    })
    const grantsReducer = makeSkill(CLASS, {
      name: "Grants Reducer",
      castFrames: 6,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [{ kind: "applyBuff", targetId: reducesCost.id, stacks: 1, condition: null }],
        }),
      ],
    })
    const costsAndRefunds = makeSkill(CLASS, {
      name: "Costs And Refunds",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 40 }],
      receives: [reducesCost.id],
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [
            {
              kind: "meterDelta",
              targetId: METER_ID,
              stacks: 0,
              condition: null,
              refundFractionOfCastCost: 0.5,
            },
          ],
        }),
      ],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([grantsReducer, costsAndRefunds, observer]),
        [grantsReducer, costsAndRefunds, observer],
        [reducesCost],
      ),
    )
    // 40 * 0.5 (the cost modifier) = 20 actually paid; refunded at 0.5 of
    // that = 10: 80 - 20 + 10 = 70, not 80 - 40 + 20 = 60.
    expect(meterLevelsAt(result, 2)?.amount).toBe(70)
  })
})

describe("a buff's meter modifier", () => {
  it("scales a cost while its window is active, additive with every other active modifier", () => {
    const reducesCost: Buff = makeBuff(CLASS, {
      name: "Cost Reducer",
      activation: "triggered",
      durationFrames: 600,
      meterModifiers: [{ meterId: METER_ID, kind: "cost", amount: -0.5 }],
    })
    const grantsReducer = makeSkill(CLASS, {
      name: "Grants Reducer",
      castFrames: 6,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [{ kind: "applyBuff", targetId: reducesCost.id, stacks: 1, condition: null }],
        }),
      ],
    })
    const costly = makeSkill(CLASS, {
      name: "Costly While Reduced",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 40 }],
      receives: [reducesCost.id],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([grantsReducer, costly, observer]),
        [grantsReducer, costly, observer],
        [reducesCost],
      ),
    )
    // 80 - (40 * 0.5) = 60, not 80 - 40 = 40.
    expect(meterLevelsAt(result, 2)?.amount).toBe(60)
  })

  it("an alwaysActive modifier applies with no window and no grant trigger at all", () => {
    const alwaysReducesCost: Buff = makeBuff(CLASS, {
      name: "Always Cost Reducer",
      meterModifiers: [{ meterId: METER_ID, kind: "cost", amount: -0.5, alwaysActive: true }],
    })
    const costly = makeSkill(CLASS, {
      name: "Costly",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 40 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([costly, observer]), [costly, observer], [alwaysReducesCost]),
    )
    expect(meterLevelsAt(result, 1)?.amount).toBe(60)
  })

  it("a belowCapacityFraction modifier scales regeneration only under that live fraction", () => {
    const boostsLowRegen: Buff = makeBuff(CLASS, {
      name: "Low Regen Boost",
      meterModifiers: [{ meterId: METER_ID, kind: "regen", amount: 2, belowCapacityFraction: 0.5 }],
    })
    const costly = makeSkill(CLASS, {
      name: "Costly",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 70 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    // Long enough to run past the meter's own 1.2s post-spend regen pause
    // (`enduranceMeter.regenPauseAfterSpendSec`) and still land the rest of
    // its own duration inside the boosted regime.
    const idle = makeSkill(CLASS, {
      name: "Idle",
      castFrames: 96,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([costly, idle, observer]),
        [costly, idle, observer],
        [boostsLowRegen],
      ),
    )
    // 10 (below 40 = 0.5 x 80) stays flat through the 1.2s pause, then climbs
    // at the tripled 30/s for the remaining 0.5s: 10 + 15 = 25, not the
    // plain-rate 10 + (96/60 - 1.2) x 10 = 14.
    expect(meterLevelsAt(result, 2)?.amount).toBe(25)
  })

  it("a chargeCost modifier scales a running drain's rate, distinct from a cost modifier", () => {
    const reducesChargeCost: Buff = makeBuff(CLASS, {
      name: "Charge Cost Reducer",
      meterModifiers: [{ meterId: METER_ID, kind: "chargeCost", amount: -0.5, alwaysActive: true }],
    })
    const holdsStill = makeSkill(CLASS, {
      name: "Holds Still",
      castFrames: 120,
      meterDrains: [{ meterId: METER_ID, perSecond: 40, fromFrame: 0, stopAfterSec: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([holdsStill, observer]),
        [holdsStill, observer],
        [reducesChargeCost],
      ),
    )
    // 1s of a 40/s drain halved to 20/s: 80 - 20 = 60, then 1s of natural
    // 10/s regen for the cast's remaining second: 60 + 10 = 70.
    expect(meterLevelsAt(result, 1)?.amount).toBe(70)
  })

  it("multiplies a class-scoped cost modifier with an unscoped one instead of summing them into one factor", () => {
    const TAG = "meterCapabilityTestTag"
    const scopedAndUnscoped: Buff = makeBuff(CLASS, {
      name: "Scoped And Unscoped Cost Reducer",
      meterModifiers: [
        { meterId: METER_ID, kind: "cost", amount: -0.4, tag: TAG, alwaysActive: true },
        { meterId: METER_ID, kind: "cost", amount: -0.1, alwaysActive: true },
      ],
    })
    const taggedCostly = makeSkill(CLASS, {
      name: "Tagged Costly",
      tags: [TAG],
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 50 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const untaggedCostly = makeSkill(CLASS, {
      name: "Untagged Costly",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 50 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([taggedCostly, untaggedCostly, observer]),
        [taggedCostly, untaggedCostly, observer],
        [scopedAndUnscoped],
      ),
    )
    // 50 x 0.6 x 0.9 = 27 paid, not 50 x (1 - 0.4 - 0.1) = 25.
    expect(meterLevelsAt(result, 1)?.amount).toBe(53)
    // The untagged cast never pays the scoped -40%, only the unscoped -10%:
    // 50 x 0.9 = 45 paid, not 50 x 0.5 = 25.
    expect(meterLevelsAt(result, 2)?.amount).toBe(8)
  })

  it("multiplies a chargeCost modifier with the meter's own unscoped cost layer for a running drain", () => {
    const reducesCost: Buff = makeBuff(CLASS, {
      name: "Unscoped Cost Reducer",
      meterModifiers: [{ meterId: METER_ID, kind: "cost", amount: -0.2, alwaysActive: true }],
    })
    const reducesChargeCost: Buff = makeBuff(CLASS, {
      name: "Charge Cost Reducer",
      meterModifiers: [{ meterId: METER_ID, kind: "chargeCost", amount: -0.1, alwaysActive: true }],
    })
    const holdsStill = makeSkill(CLASS, {
      name: "Holds Still",
      castFrames: 120,
      meterDrains: [{ meterId: METER_ID, perSecond: 100, fromFrame: 0, stopAfterSec: 1 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(
        rotationOf([holdsStill, observer]),
        [holdsStill, observer],
        [reducesCost, reducesChargeCost],
      ),
    )
    // 1s of a 100/s drain cut to 0.9 x 0.8 = 0.72: 100 x 0.72 = 72 spent
    // (80 - 72 = 8), then 1s of natural 10/s regen once the drain stops:
    // 8 + 10 = 18, not the 100 x (1 - 0.2 - 0.1) = 70 an additive combination
    // would spend.
    expect(meterLevelsAt(result, 1)?.amount).toBe(18)
  })
})

describe("a meter's value on the ledger", () => {
  it("a build module reading the live value and the resolved max sees exactly what the legality check gated on", () => {
    const spendsHalf = makeSkill(CLASS, {
      name: "Spends Half",
      castFrames: 12,
      meterCosts: [{ meterId: METER_ID, amount: 40 }],
      castConditions: [enduranceRequires("gte", 1)],
      triggersBuffs: [],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([spendsHalf, observer]), [spendsHalf, observer]),
    )
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(meterLevelsAt(result, 1)?.amount).toBe(40)
    expect(meterLevelsAt(result, 1)?.capacity).toBe(80)
  })

  it("exposes the resolved capacity through the same generic build-param accessor every other build-level number uses", () => {
    const noop = makeSkill(CLASS, {
      name: "Noop",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(timelineInputs(rotationOf([noop]), [noop]))
    expect(meterLevelsAt(result, 0)?.capacity).toBe(80)
    expect(meterMaxParamKey(METER_ID)).toBe(`meterMax:${METER_ID}`)
    expect(STATUS_ID).toBe(`meter:${METER_ID}`)
  })

  it("adds the Oddity board's own learned Max Endurance total, flat and additive with every other bonus", () => {
    const noop = makeSkill(CLASS, {
      name: "Noop",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    // Claim only two of the eight "Max Endurance +5" melodies (+10), leaving
    // the rest of the board exactly as `NO_ODDITY_ENDURANCE` leaves it.
    const result = simulateTimeline(
      timelineInputs(rotationOf([noop]), [noop], [], {
        unclaimedOddityNodes: { ...NO_ODDITY_ENDURANCE, Qinghe: [126, 139] },
      }),
    )
    expect(meterLevelsAt(result, 0)?.capacity).toBe(90)
  })

  it("raises the capacity by exactly 20 while the Fragrant Orchid Bath Bean toggle is on", () => {
    const noop = makeSkill(CLASS, {
      name: "Noop",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const off = simulateTimeline(timelineInputs(rotationOf([noop]), [noop]))
    const on = simulateTimeline(
      timelineInputs(rotationOf([noop]), [noop], [], {
        combatSettings: { ...defaultCombatSettings(), fragrantOrchidBathBean: true },
      }),
    )
    expect(meterLevelsAt(off, 0)?.capacity).toBe(80)
    expect(meterLevelsAt(on, 0)?.capacity).toBe(100)
  })
})

describe("a function-valued meter capacity", () => {
  const SPLENDOR = "bellstrikeSplendor"

  const capacityAt = (affinityRate: number) => {
    const noop = makeSkill(SPLENDOR, {
      name: "Noop",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const rotation = makeRotation(SPLENDOR, { steps: [makeStep({ skillId: noop.id })] })
    const result = simulateTimeline({
      ...defaultInputs,
      classId: SPLENDOR,
      customSkills: [noop],
      customBuffs: [],
      activeCustomRotation: rotation,
      unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
      affinityRate,
    })
    return result.casts?.[0]?.meterLevels?.find((level) => level.id === METER_ID)?.capacity
  }

  it("stays at the flat 90 below the 12% Affinity Rate step", () => {
    expect(capacityAt(0.05)).toBe(90)
    expect(capacityAt(0.1)).toBe(90)
  })

  it("raises the cap by one 2%-wide step past every threshold, not a linear ramp", () => {
    expect(capacityAt(0.12)).toBe(91)
    expect(capacityAt(0.14)).toBe(92)
    expect(capacityAt(0.16)).toBe(93)
  })

  it("caps at +20 from 30% Affinity Rate on", () => {
    expect(capacityAt(0.3)).toBe(100)
    expect(capacityAt(0.66)).toBe(100)
  })
})

describe("a previous step's late sub-cast hit does not delay the next step's cast-start cost", () => {
  it("keeps the meter cursor from being dragged past the following step's own start", () => {
    const echoed = makeSkill(CLASS, {
      name: "Echoed",
      castFrames: 6,
      hits: [makeHit({ frame: 200, physMultiplier: 1, physFixed: 1 })],
    })
    const triggersLateEcho = makeSkill(CLASS, {
      name: "Triggers Late Echo",
      castFrames: 6,
      hits: [
        makeHit({
          frame: 0,
          physMultiplier: 1,
          physFixed: 1,
          triggers: [{ kind: "castSkill", targetId: echoed.id, stacks: 1, condition: null }],
        }),
      ],
    })
    const costsAtStart = makeSkill(CLASS, {
      name: "Costs At Start",
      castFrames: 6,
      meterCosts: [{ meterId: METER_ID, amount: 20 }],
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const observer = makeSkill(CLASS, {
      name: "Observer",
      castFrames: 6,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const result = simulateTimeline(
      timelineInputs(rotationOf([triggersLateEcho, costsAtStart, observer]), [
        triggersLateEcho,
        costsAtStart,
        observer,
        echoed,
      ]),
    )
    expect(result.warnings.some((warning) => warning.includes("before the cursor"))).toBe(false)
    expect(meterLevelsAt(result, 2)?.amount).toBe(60)
  })
})
