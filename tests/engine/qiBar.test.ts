import { describe, expect, it } from "vitest"
import {
  QiBar,
  ScriptedQiBar,
  ZERO_QI_BONUSES,
  qiBonusesFrom,
  qiFromDamage,
} from "../../src/engine/qiBar"

const FPS = 60
const BAR = { max: 800, refill: 800, breakSec: 10, directImmunitySec: 4, takenIndex: 17.28 }

// In-game values as of 2026-09-25: 1 % of the stake's HP dealt at rate 1
// empties 15.43 % of an 800 Qi bar.
const TARGET_HP_MAX = 9_674_809
const ONE_PERCENT_HP = TARGET_HP_MAX / 100

describe("the Qi formula", () => {
  it("scales a hit's Qi with the fraction of the target's HP it deals", () => {
    const qi = qiFromDamage({
      damage: ONE_PERCENT_HP,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 1,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    expect(qi).toBeCloseTo(51.84, 6)
  })

  it("a tick uses its own rate", () => {
    const qi = qiFromDamage({
      damage: ONE_PERCENT_HP,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 0.2,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    expect(qi).toBeCloseTo(51.84 * 0.2, 6)
  })

  it("a crit variant of the same hit deals proportionally more Qi", () => {
    const normal = qiFromDamage({
      damage: 1000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 1,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    const crit = qiFromDamage({
      damage: 2000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 1,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    expect(crit).toBeCloseTo(normal * 2, 9)
  })

  it("qiRateAdd and qiDamageIndexMultiplier scale the rate and the index term", () => {
    const base = qiFromDamage({
      damage: 1000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 0.2,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    const boosted = qiFromDamage({
      damage: 1000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 0.2,
      qiFlat: 0,
      bonuses: { ...ZERO_QI_BONUSES, qiRateAdd: 0.4, qiDamageIndexMultiplier: 2 },
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    // Soul-Shaken vs Bleeding: rate 0.2 -> 0.6 and the index tripled.
    expect(boosted).toBeCloseTo(base * 3 * 3, 9)
  })

  it("qiDamageBoost and targetQiDamageTaken both fold into the one boost pool", () => {
    const base = qiFromDamage({
      damage: 1000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 1,
      qiFlat: 0,
      bonuses: ZERO_QI_BONUSES,
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    const boosted = qiFromDamage({
      damage: 1000,
      targetHpMax: TARGET_HP_MAX,
      qiRate: 1,
      qiFlat: 0,
      bonuses: { ...ZERO_QI_BONUSES, qiDamageBoost: 0.1, targetQiDamageTaken: 0.1 },
      takenIndex: 17.28,
      playerQiIndex: 3,
    })
    expect(boosted).toBeCloseTo(base * 1.2, 9)
  })

  it("qiBonusesFrom sums only the four Qi stat keys, ignoring every other effect", () => {
    expect(
      qiBonusesFrom([
        { statKey: "qiDamageBoost", amount: 0.1 },
        { statKey: "qiDamageBoost", amount: 0.05 },
        { statKey: "target.qiDamageTaken", amount: 0.1 },
        { statKey: "qiRateAdd", amount: 0.4 },
        { statKey: "qiDamageIndexMultiplier", amount: 2 },
        { statKey: "allDamageBoost", amount: 0.5 },
      ]),
    ).toEqual({
      qiDamageBoost: expect.closeTo(0.15, 9),
      targetQiDamageTaken: 0.1,
      qiRateAdd: 0.4,
      qiDamageIndexMultiplier: 2,
    })
  })
})

describe("the Qi bar", () => {
  it("starts at max and a hit below max never breaks it", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 799, "direct")
    expect(bar.finish()).toEqual([])
  })

  it("breaks on the crossing event, not later", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 400, "direct")
    bar.apply(60, 400, "direct")
    expect(bar.finish()).toEqual([{ startFrame: 60, endFrame: 660, immuneUntilFrame: 900 }])
  })

  it("overflow below 0 is lost — a huge hit does not carry credit into the refill", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 5000, "direct")
    expect(bar.fractionAt(1)).toBe(0)
    expect(bar.fractionAt(660 / FPS)).toBe(1)
  })

  it("a hit during the break deals nothing", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    bar.apply(1, 500, "direct")
    expect(bar.fractionAt(1 / FPS)).toBe(0)
    expect(bar.isBroken(599 / FPS)).toBe(true)
    expect(bar.fractionAt(599 / FPS)).toBe(0)
  })

  it("refills at exactly breakSec", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    expect(bar.isBroken((10 * FPS - 1) / FPS)).toBe(true)
    expect(bar.isBroken(10)).toBe(false)
    expect(bar.fractionAt(10)).toBe(1)
  })

  it("a direct hit inside the post-refill immunity deals no Qi, a tick inside it does", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    bar.apply(600 + 30, 100, "direct")
    bar.apply(600 + 60, 50, "dot")
    expect(bar.fractionAt((600 + 30) / FPS)).toBe(1)
    expect(bar.fractionAt((600 + 60) / FPS)).toBeCloseTo(1 - 50 / 800, 9)
  })

  it("breaks repeat without limit", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    bar.apply(600 + 240, 800, "direct")
    expect(bar.finish()).toHaveLength(2)
    expect(bar.finish()[1].startFrame).toBe(600 + 240)
  })

  it("no regeneration between hits", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 100, "direct")
    expect(bar.fractionAt(1000 / FPS)).toBeCloseTo(1 - 100 / 800, 9)
  })
})

describe("the Qi bar's phase view", () => {
  it("is exhausted only inside the break windows", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    expect(bar.phaseAt(1 / FPS)).toBe("exhausted")
    expect(bar.phaseAt(9)).toBe("exhausted")
    expect(bar.phaseAt(10)).not.toBe("exhausted")
  })

  it("a qiBelow gate opens at the crossing of its own threshold", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 480, "direct")
    expect(bar.fractionAt(1 / FPS)).toBeCloseTo(0.4, 9)
    bar.apply(60, 1, "direct")
    expect(bar.fractionAt(61 / FPS)).toBeLessThan(0.4)
  })
})

describe("reading the Qi bar at a past frame", () => {
  const bar = new QiBar(BAR, FPS)
  bar.apply(0, 200, "direct")
  bar.apply(60, 600, "direct")

  it("answers a frame before a later event with the value that event had not yet changed", () => {
    expect(bar.fractionAtFrame(59)).toBeCloseTo(0.75, 9)
    expect(bar.readerAtFrame(59).fractionAt(0)).toBeCloseTo(0.75, 9)
    expect(bar.readerAtFrame(59).isBroken(0)).toBe(false)
  })

  it("answers the frame that opened the break, and every frame inside it, as broken", () => {
    expect(bar.readerAtFrame(60).isBroken(0)).toBe(true)
    expect(bar.readerAtFrame(60 + 599).phaseAt(0)).toBe("exhausted")
  })

  it("answers the frame the break ends on with the refilled bar", () => {
    const reader = bar.readerAtFrame(60 + 600)
    expect(reader.isBroken(0)).toBe(false)
    expect(reader.fractionAt(0)).toBe(1)
  })

  it("does not move the bar it reads", () => {
    bar.readerAtFrame(30)
    expect(bar.breakFrames()).toHaveLength(1)
    expect(bar.fractionAtFrame(60 + 600)).toBe(1)
  })
})

describe("the low-Qi lead", () => {
  it("spans from the first crossing under the compatibility threshold to the first break", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(30, 600, "direct")
    bar.apply(90, 200, "direct")
    expect(bar.firstLowQiSpan()).toEqual({ startSec: 30 / FPS, endSec: 90 / FPS })
  })

  it("is absent without a break", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(30, 600, "direct")
    expect(bar.firstLowQiSpan()).toBeNull()
  })
})

describe("the scripted Qi bar", () => {
  it("reproduces the clock-driven phase exactly", () => {
    const scripted = new ScriptedQiBar([{ startSec: 25, durationSec: 10, lowQiLeadSec: 5 }], FPS)
    expect(scripted.phaseAt(19.9)).toBe("normal")
    expect(scripted.phaseAt(20)).toBe("below30")
    expect(scripted.phaseAt(24.9)).toBe("below30")
    expect(scripted.phaseAt(25)).toBe("exhausted")
    expect(scripted.phaseAt(34.9)).toBe("exhausted")
    expect(scripted.phaseAt(35)).toBe("normal")
  })

  it("reports the lead span before its first break", () => {
    const scripted = new ScriptedQiBar([{ startSec: 25, durationSec: 10, lowQiLeadSec: 5 }], FPS)
    expect(scripted.firstLowQiSpan()).toEqual({ startSec: 20, endSec: 25 })
  })

  it("reports no lead span without a configured lead", () => {
    const scripted = new ScriptedQiBar([{ startSec: 25, durationSec: 10, lowQiLeadSec: 0 }], FPS)
    expect(scripted.firstLowQiSpan()).toBeNull()
  })

  it("a zero-length window leaves no break at all", () => {
    const scripted = new ScriptedQiBar([{ startSec: 25, durationSec: 0, lowQiLeadSec: 5 }], FPS)
    expect(scripted.breakFrames()).toEqual([])
    expect(scripted.isBroken(25)).toBe(false)
  })

  it("reads the whole start frame as broken, whichever event asks first", () => {
    const scripted = new ScriptedQiBar([{ startSec: 1, durationSec: 10, lowQiLeadSec: 0 }], FPS)
    expect(scripted.isBroken(1)).toBe(true)
    expect(scripted.readerAtFrame(FPS - 1).isBroken(0)).toBe(false)
  })
})
