import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { QiBar } from "../../src/engine/qiBar"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { QI_BREAK_HP_DAMAGE_BONUS } from "../../src/data/baseStats/qiConstants"
import { disintegrationBuffDef } from "../../src/data/innerWays/breakingPointBuffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import type { Inputs } from "../../src/engine/types"
import { testRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"
const FPS = 60
const BAR = { max: 800, refill: 800, breakSec: 10, directImmunitySec: 4, takenIndex: 17.28 }
const EMPTYING_QI = 1_000_000

function inputsFor(firstHitQiFlat: number): Inputs {
  const probe = makeSkill(CLASS, {
    name: "Probe Pair",
    castFrames: 30,
    tags: [PROP.hasQiBreakDoubleDamage],
    hits: [
      makeHit({ frame: 0, physMultiplier: 1, qiFlat: firstHitQiFlat }),
      makeHit({ frame: 0, physMultiplier: 1, qiFlat: 0 }),
    ],
  })
  return {
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [probe],
    activeCustomRotation: testRotation(CLASS, { steps: [makeStep({ skillId: probe.id })] }),
  }
}

describe("the event that empties the Qi bar", () => {
  const unbroken = simulateTimeline(inputsFor(0), {})
  const emptied = simulateTimeline(inputsFor(EMPTYING_QI), {})
  const hitDamages = (result: typeof unbroken) =>
    result.timeline!.filter((event) => event.kind === "hit").map((event) => event.damage)
  const [unbrokenFirst] = hitDamages(unbroken)
  const [emptyingHit, nextHit] = hitDamages(emptied)

  it("opens a break", () => {
    expect(unbroken.qiBreaks).toEqual([])
    expect(emptied.qiBreaks).toHaveLength(1)
  })

  it("is scored without the broken-target bonus and without the Qi-empty double", () => {
    expect(emptyingHit).toBeCloseTo(unbrokenFirst, 6)
  })

  it("leaves the next event on the same frame inside the break, with both", () => {
    expect(nextHit / unbrokenFirst).toBeCloseTo(2 * (1 + QI_BREAK_HP_DAMAGE_BONUS), 6)
  })

  it("keeps the break end at the depleting frame plus the break length", () => {
    const [qiBreak] = emptied.qiBreaks!
    expect(qiBreak.endSec - qiBreak.startSec).toBeCloseTo(10, 9)
  })

  it("is reported at the break start edge as landing before it", () => {
    const [warning] = emptied.qiEdgeWarnings!
    expect(warning.edge).toBe("start")
    expect(warning.side).toBe("before")
    expect(warning.offsetSec).toBe(0)
  })
})

describe("the Qi bar's readings at the frame that empties it", () => {
  const bar = new QiBar(BAR, FPS)
  bar.apply(0, 400, "direct")
  const preHitFraction = bar.fractionAtFrame(60)
  const preHitBroken = bar.isBrokenAtFrame(60)
  bar.apply(60, 400, "direct")
  const schedule = bar.schedule()

  it("reads the bar as it stood before the emptying event", () => {
    expect(preHitBroken).toBe(false)
    expect(preHitFraction).toBeCloseTo(0.5, 9)
  })

  it("reads the break for every later event on the same frame", () => {
    expect(bar.isBrokenAtFrame(60)).toBe(true)
    expect(bar.fractionAtFrame(60)).toBe(0)
  })

  it("schedules the start frame outside the break before the hit and inside it after", () => {
    expect(schedule.isBroken(60 / FPS, "beforeHit")).toBe(false)
    expect(schedule.isBroken(61 / FPS, "beforeHit")).toBe(true)
    expect(schedule.isBroken(60 / FPS, "afterHit")).toBe(true)
    expect(schedule.phaseAt(60 / FPS, "beforeHit")).not.toBe("exhausted")
    expect(schedule.fractionAt(60 / FPS, "beforeHit")).toBeCloseTo(0.5, 9)
    expect(schedule.fractionAt(60 / FPS, "afterHit")).toBe(0)
  })

  it("keeps the break end exclusive under both readings", () => {
    const endFrame = 60 + 10 * FPS
    for (const reading of ["beforeHit", "afterHit"] as const) {
      expect(schedule.isBroken((endFrame - 1) / FPS, reading)).toBe(true)
      expect(schedule.isBroken(endFrame / FPS, reading)).toBe(false)
      expect(schedule.fractionAt(endFrame / FPS, reading)).toBe(1)
    }
  })
})

describe("a grant caused by the event that empties the bar", () => {
  const emptyingFrame = 60
  const bar = new QiBar(BAR, FPS)
  bar.apply(emptyingFrame, 800, "direct")
  const engine = new BuffEngine(
    { breakingPoint: true, breakingPointTier: 5 },
    [],
    [disintegrationBuffDef()],
  )
  engine.attachQiSchedule(bar.schedule())
  const emptyingSec = emptyingFrame / FPS

  it("sees the break", () => {
    engine.processDamageHit(emptyingSec)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, emptyingSec)).toBe(1)
  })

  it("is not itself gated on the break by a damage-time read", () => {
    expect(engine.qiBroken(emptyingSec)).toBe(false)
    expect(engine.qiBroken(emptyingSec + 1 / FPS)).toBe(true)
  })
})
