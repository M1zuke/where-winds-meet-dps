import { describe, expect, it } from "vitest"
import {
  QiBar,
  ZERO_QI_BONUSES,
  fixedQiSchedule,
  qiBonusesFrom,
  qiFromDamage,
  sameQiBreaks,
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
    expect(bar.breaksFrames()).toEqual([])
  })

  it("breaks on the crossing event, not later", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 400, "direct")
    bar.apply(60, 400, "direct")
    expect(bar.breaksFrames()).toEqual([{ startFrame: 60, endFrame: 660, immuneUntilFrame: 900 }])
  })

  it("overflow below 0 is lost — a huge hit does not carry credit into the refill", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 5000, "direct")
    const schedule = bar.schedule()
    expect(schedule.fractionAt(1)).toBe(0)
    expect(schedule.fractionAt(660 / FPS)).toBe(1)
  })

  it("a hit during the break deals nothing", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    bar.apply(1, 500, "direct")
    const schedule = bar.schedule()
    expect(schedule.fractionAt(1 / FPS)).toBe(0)
    expect(schedule.isBroken(599 / FPS)).toBe(true)
    expect(schedule.fractionAt(599 / FPS)).toBe(0)
  })

  it("refills at exactly breakSec", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    const schedule = bar.schedule()
    expect(schedule.isBroken((10 * FPS - 1) / FPS)).toBe(true)
    expect(schedule.isBroken(10)).toBe(false)
    expect(schedule.fractionAt(10)).toBe(1)
  })

  it("a direct hit inside the post-refill immunity deals no Qi, a tick inside it does", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    // Refill at frame 600 (10 s); immunity runs to frame 840 (14 s).
    bar.apply(600 + 30, 100, "direct")
    bar.apply(600 + 60, 50, "dot")
    const schedule = bar.schedule()
    expect(schedule.fractionAt((600 + 30) / FPS)).toBe(1)
    expect(schedule.fractionAt((600 + 60) / FPS)).toBeCloseTo(1 - 50 / 800, 9)
  })

  it("breaks repeat without limit", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    bar.apply(600 + 240, 800, "direct")
    expect(bar.breaksFrames()).toHaveLength(2)
    expect(bar.breaksFrames()[1].startFrame).toBe(600 + 240)
  })

  it("no regeneration between hits", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 100, "direct")
    const schedule = bar.schedule()
    expect(schedule.fractionAt(1000 / FPS)).toBeCloseTo(1 - 100 / 800, 9)
  })
})

describe("the compatibility schedule view", () => {
  it("the phase view equals the break windows: exhausted only inside them", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 800, "direct")
    const schedule = bar.schedule()
    expect(schedule.phaseAt(1 / FPS)).toBe("exhausted")
    expect(schedule.phaseAt(9)).toBe("exhausted")
    expect(schedule.phaseAt(10)).not.toBe("exhausted")
  })

  it("a qiBelow gate opens at the crossing of its own threshold", () => {
    const bar = new QiBar(BAR, FPS)
    // 60 % of the bar gone — above the 0.4 threshold, so not yet below it.
    bar.apply(0, 480, "direct")
    const schedule = bar.schedule()
    expect(schedule.fractionAt(1 / FPS)).toBeCloseTo(0.4, 9)
    bar.apply(60, 1, "direct")
    const next = bar.schedule()
    expect(next.fractionAt(61 / FPS)).toBeLessThan(0.4)
  })
})

describe("the fixed-window schedule factory", () => {
  it("reproduces the clock-driven phase exactly", () => {
    const schedule = fixedQiSchedule({ startSec: 25, durationSec: 10, lowQiLeadSec: 5 }, FPS)
    expect(schedule.phaseAt(19.9)).toBe("normal")
    expect(schedule.phaseAt(20)).toBe("below30")
    expect(schedule.phaseAt(24.9)).toBe("below30")
    expect(schedule.phaseAt(25)).toBe("exhausted")
    expect(schedule.phaseAt(34.9)).toBe("exhausted")
    expect(schedule.phaseAt(35)).toBe("normal")
  })

  it("a zero-length window leaves no break at all", () => {
    const schedule = fixedQiSchedule({ startSec: 25, durationSec: 0, lowQiLeadSec: 5 }, FPS)
    expect(schedule.breaks).toEqual([])
    expect(schedule.isBroken(25)).toBe(false)
  })
})

describe("the fixed-point iteration's own convergence check", () => {
  it("frame-exact breaks compare equal regardless of array identity", () => {
    const left = [{ startFrame: 100, endFrame: 700, immuneUntilFrame: 940 }]
    const right = [{ startFrame: 100, endFrame: 700, immuneUntilFrame: 940 }]
    expect(sameQiBreaks(left, right)).toBe(true)
  })

  it("a one-frame difference does not compare equal", () => {
    const left = [{ startFrame: 100, endFrame: 700, immuneUntilFrame: 940 }]
    const right = [{ startFrame: 101, endFrame: 700, immuneUntilFrame: 940 }]
    expect(sameQiBreaks(left, right)).toBe(false)
  })

  it("a different break count does not compare equal", () => {
    expect(sameQiBreaks([], [{ startFrame: 0, endFrame: 600, immuneUntilFrame: 840 }])).toBe(false)
  })
})
