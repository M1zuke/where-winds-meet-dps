// Scoped to Bamboocut Dust (docs/TESTING.md § "Class scoping"): the class is
// registered, not validated, so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { FPS } from "../../src/engine/timeline"
import type { EffectContext } from "../../src/engine/effects/context"
import type { Effect } from "../../src/engine/effects/effect"
import { DEBUFF, SKILL, STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import { soulbreakCriticalBoost } from "../../src/data/skills/bamboocut-dust/buffs/soulbreakCriticalBoost"
import { soulbreakDamageTaken } from "../../src/data/skills/bamboocut-dust/buffs/soulbreakDamageTaken"
import { soulbreakPayoutFeed } from "../../src/data/skills/bamboocut-dust/buffs/soulbreakPayoutFeed"
import { fadingCrimsonMeter } from "../../src/data/classes/bamboocut-dust/meters"
import {
  coveredIntervals,
  damageFramesOf,
  runDust,
  stacksAfterCast,
  towlineSweepRank,
  windowFramesOf,
} from "../bamboocutDust"

const THREE_SOUL_SWEEPS = [SKILL.soulSweep, SKILL.soulSweep, SKILL.soulSweep]
const SEVEN_LIGHT_ATTACKS = Array.from({ length: 7 }, () => SKILL.ropeLightAttack)
const CONVERSION_FRAME = 227
const SOULBREAK_ROW = "Soulbreak"

function contextWith(parts: {
  active?: readonly string[]
  whiteCritRate?: number
  paramTier?: number
}): EffectContext {
  const active = new Set(parts.active ?? [])
  return {
    build: { whiteCritRate: parts.whiteCritRate ?? 0, paramTier: () => parts.paramTier ?? 0 },
    status: { isActive: (id: string) => active.has(id) },
    self: { stacks: 1, reachesEvent: true },
  } as unknown as EffectContext
}

function statAmounts(effects: Effect[]): Record<string, number> {
  const amounts: Record<string, number> = {}
  for (const effect of effects)
    if (effect.kind === "stat")
      amounts[effect.statKey] = (amounts[effect.statKey] ?? 0) + effect.amount
  return amounts
}

describe("Soul Loss converting into Soulbreak", () => {
  it("reads the ledger trigger by trigger within one hit: the seventh stack converts, the count resets, the remaining hits start again", () => {
    const result = runDust([...THREE_SOUL_SWEEPS, SKILL.soulSweep])
    expect(windowFramesOf(result, DEBUFF.soulbreak).map((window) => window.start)).toEqual([
      CONVERSION_FRAME,
    ])
    expect(stacksAfterCast(result, 3, DEBUFF.soulLoss)).toBe(2 + 3)
  })

  it("converts nothing from stacks that lapsed 5 seconds after the last application", () => {
    const rest = [SKILL.ropeLightAttack, SKILL.ropeLightAttack]
    const result = runDust([SKILL.soulSweep, ...rest, SKILL.soulSweep, ...rest, SKILL.soulSweep])
    expect(windowFramesOf(result, DEBUFF.soulbreak)).toEqual([])
  })

  it("applies nothing before the seventh stack", () => {
    const result = runDust([SKILL.soulSweep, SKILL.soulSweep])
    expect(windowFramesOf(result, DEBUFF.soulbreak)).toEqual([])
  })

  it("lasts 12 seconds, and 21 seconds with Towline Sweep through a second grant on the same frame", () => {
    const plain = runDust(THREE_SOUL_SWEEPS)
    expect(coveredIntervals(plain, DEBUFF.soulbreak)).toEqual([
      { start: CONVERSION_FRAME, end: CONVERSION_FRAME + 12 * FPS },
    ])
    const withTowline = runDust(THREE_SOUL_SWEEPS, towlineSweepRank(1))
    expect(coveredIntervals(withTowline, DEBUFF.soulbreak)).toEqual([
      { start: CONVERSION_FRAME, end: CONVERSION_FRAME + 21 * FPS },
    ])
  })
})

describe("Soul Return", () => {
  const fadingCrimsonAtStart = (result: ReturnType<typeof runDust>, castIndex: number) =>
    result.casts![castIndex].meterLevels!.find((level) => level.id === fadingCrimsonMeter.id)!
      .amount

  it("is granted by the conversion for 12 seconds, and for 21 with Towline Sweep", () => {
    expect(coveredIntervals(runDust(THREE_SOUL_SWEEPS), STATUS.soulReturn)).toEqual([
      { start: CONVERSION_FRAME, end: CONVERSION_FRAME + 12 * FPS },
    ])
    expect(
      coveredIntervals(runDust(THREE_SOUL_SWEEPS, towlineSweepRank(1)), STATUS.soulReturn),
    ).toEqual([{ start: CONVERSION_FRAME, end: CONVERSION_FRAME + 21 * FPS }])
  })

  it("halves the Fading Crimson a Scarlet Spin costs while it is up", () => {
    const withoutReturn = runDust([SKILL.scarletSpin, SKILL.dreamwroughtBubbles])
    expect(fadingCrimsonAtStart(withoutReturn, 1)).toBe(75)
    const withReturn = runDust([...THREE_SOUL_SWEEPS, SKILL.scarletSpin, SKILL.dreamwroughtBubbles])
    const dreamwroughtCast = withReturn.casts!.length - 1
    expect(fadingCrimsonAtStart(withReturn, dreamwroughtCast)).toBe(87.5)
  })

  it("is granted at most once a second: a conversion 49 frames after the last grants none", () => {
    const result = runDust([...THREE_SOUL_SWEEPS, SKILL.piercingDartIII], towlineSweepRank(1))
    const startsOf = (statusId: string) => [
      ...new Set(windowFramesOf(result, statusId).map((window) => window.start)),
    ]
    expect(startsOf(DEBUFF.soulbreak)).toEqual([227, 343, 392])
    expect(startsOf(STATUS.soulReturn)).toEqual([227, 343])
  })
})

describe("the Soulbreak payout", () => {
  const LONG_ROTATION = [...THREE_SOUL_SWEEPS, SKILL.piercingDartIII, ...SEVEN_LIGHT_ATTACKS]

  const releases = (result: ReturnType<typeof runDust>) =>
    result.timeline!.filter((event) => event.skillName === SOULBREAK_ROW && event.damage > 0)

  it("pays nothing below Towline Sweep rank 4", () => {
    expect(releases(runDust(LONG_ROTATION, towlineSweepRank(3)))).toEqual([])
  })

  it("pays once when Soulbreak finally ends, not at each refresh by a later conversion", () => {
    const result = runDust(LONG_ROTATION, towlineSweepRank(4))
    const starts = windowFramesOf(result, DEBUFF.soulbreak).map((window) => window.start)
    const lastConversion = Math.max(...starts)
    expect(lastConversion).toBeGreaterThan(CONVERSION_FRAME)
    expect(releases(result).map((event) => event.frame)).toEqual([lastConversion + 21 * FPS])
  })

  it("pays twice as much at rank 6 as at rank 4", () => {
    const rankFour = releases(runDust(LONG_ROTATION, towlineSweepRank(4)))[0].damage
    const rankSix = releases(runDust(LONG_ROTATION, towlineSweepRank(6)))[0].damage
    expect(rankSix / rankFour).toBeGreaterThan(1.9)
    expect(rankSix / rankFour).toBeLessThan(2.1)
  })

  it("releases the 10% share at a rank 6 Burn and Bury and banks again under a fresh Soulbreak", () => {
    const rotation = [...THREE_SOUL_SWEEPS, SKILL.burnAndBury, ...SEVEN_LIGHT_ATTACKS]
    const result = runDust(rotation, towlineSweepRank(6))
    const burnAndBuryFrame = damageFramesOf(result, "Burn and Bury")[0]
    expect(releases(result).map((event) => event.frame)).toEqual([
      burnAndBuryFrame,
      burnAndBuryFrame + 21 * FPS,
    ])
  })

  it("leaves the share to the natural end under a rank 5 Burn and Bury", () => {
    const rotation = [...THREE_SOUL_SWEEPS, SKILL.burnAndBury, ...SEVEN_LIGHT_ATTACKS]
    const result = runDust(rotation, towlineSweepRank(5))
    expect(releases(result).map((event) => event.frame)).toEqual([CONVERSION_FRAME + 21 * FPS])
  })

  it("feeds the 5% marker at ranks 4-5 and the 10% marker from rank 6, and only while it is up", () => {
    const markers = [DEBUFF.soulbreakPayoutFivePercent, DEBUFF.soulbreakPayoutTenPercent]
    const feed = (paramTier: number, active: readonly string[]) =>
      soulbreakPayoutFeed.effects(contextWith({ active, paramTier }))
    expect(feed(4, markers)).toEqual([{ kind: "echo", debuffId: markers[0] }])
    expect(feed(6, markers)).toEqual([{ kind: "echo", debuffId: markers[1] }])
    expect(feed(6, [])).toEqual([])
  })
})

describe("what Soulbreak does to the target", () => {
  it("adds 5% damage taken and 5% Qi damage while the target holds Soulbreak", () => {
    const withSoulbreak = soulbreakDamageTaken.effects(contextWith({ active: [DEBUFF.soulbreak] }))
    expect(statAmounts(withSoulbreak)).toEqual({ allDamageBoost: 0.05, qiDamageBoost: 0.05 })
    expect(soulbreakDamageTaken.effects(contextWith({}))).toEqual([])
  })

  it("adds 1.8% crit damage per full 4% of white crit rate against Soulbreak, capped at 27%", () => {
    const boostAt = (whiteCritRate: number) =>
      statAmounts(
        soulbreakCriticalBoost.effects(contextWith({ active: [DEBUFF.soulbreak], whiteCritRate })),
      ).critDamageBoost
    expect(boostAt(0.39)).toBeCloseTo(0.162, 6)
    expect(boostAt(0.4)).toBeCloseTo(0.18, 6)
    expect(boostAt(0.9)).toBeCloseTo(0.27, 6)
    expect(soulbreakCriticalBoost.effects(contextWith({ whiteCritRate: 0.9 }))).toEqual([])
  })

  it("keeps the crit damage boost off damage-over-time ticks", () => {
    expect(soulbreakCriticalBoost.reachesDotTicks).toBe(false)
  })

  it("raises the damage of every hit landing after the conversion", () => {
    const hitDamage = (result: ReturnType<typeof runDust>) =>
      result.timeline!.find((event) => event.skillName.startsWith("Rope Dart - Light"))!.damage
    const before = runDust([SKILL.ropeLightAttack])
    const after = runDust([...THREE_SOUL_SWEEPS, SKILL.ropeLightAttack])
    expect(hitDamage(after)).toBeGreaterThan(hitDamage(before) * 1.04)
  })
})
