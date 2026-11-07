import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { SAME_FRAME_STEP_SEC } from "../../src/engine/buffs/frameOrder"
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

describe("the start-edge warning of a break nobody knew about yet", () => {
  const inputs = inputsFor(EMPTYING_QI)

  it("is computed on detail runs only", () => {
    expect(simulateTimeline(inputs, {}).qiEdgeWarnings).toBeDefined()
    expect(simulateTimeline(inputs, { collect: "totals" }).qiEdgeWarnings).toBeUndefined()
  })

  it("leaves a seeded run's roll stream and figures untouched", () => {
    const detail = simulateTimeline(inputs, { seed: 7 })
    const totals = simulateTimeline(inputs, { seed: 7, collect: "totals" })
    expect(detail.qiEdgeWarnings).toBeDefined()
    expect(detail.totalDamage).toBe(totals.totalDamage)
    expect(detail.outcomeCounts).toEqual(totals.outcomeCounts)
    expect(detail.qiBreaks).toEqual(totals.qiBreaks)
  })
})

describe("the Qi bar's readings at the frame that empties it", () => {
  const bar = new QiBar(BAR, FPS)
  bar.apply(0, 400, "direct")
  const preHitFraction = bar.fractionAtFrame(60)
  const preHitBroken = bar.isBrokenAtFrame(60)
  bar.apply(60, 400, "direct")

  it("reads the bar as it stood before the emptying event", () => {
    expect(preHitBroken).toBe(false)
    expect(preHitFraction).toBeCloseTo(0.5, 9)
  })

  it("reads the break for every later event on the same frame", () => {
    expect(bar.isBrokenAtFrame(60)).toBe(true)
    expect(bar.fractionAtFrame(60)).toBe(0)
  })

  it("still reads the frame before the break as it stood", () => {
    expect(bar.readerAtFrame(59).isBroken(0)).toBe(false)
    expect(bar.readerAtFrame(59).fractionAt(0)).toBeCloseTo(0.5, 9)
  })

  it("keeps the break end exclusive", () => {
    const endFrame = 60 + 10 * FPS
    expect(bar.isBrokenAtFrame(endFrame - 1)).toBe(true)
    expect(bar.isBrokenAtFrame(endFrame)).toBe(false)
    expect(bar.fractionAtFrame(endFrame)).toBe(1)
  })
})

const POST_QI_STACK = "placeholderPostQiStack"
const postQiStack: BuffModule = {
  id: POST_QI_STACK,
  name: "Placeholder Post-Qi Stack",
  affectsAll: true,
  duration: 5,
  maxStacks: 3,
  stackOnDamage: true,
  damageGrantTiming: "postQi",
  stackOnDamagePhase: "exhausted",
  effects: [],
}

describe("a grant decided around the event that empties the bar", () => {
  const emptyingFrame = 60
  const emptyingSec = emptyingFrame / FPS
  const sameFrameLaterSec = emptyingSec + SAME_FRAME_STEP_SEC

  function halfSpentBar(): QiBar {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 400, "direct")
    return bar
  }

  function engineOver(bar: QiBar, ...modules: BuffModule[]): BuffEngine {
    return new BuffEngine({}, bar, modules, [])
  }

  it("is decided against the bar before the event's Qi when it counts for that event", () => {
    const bar = halfSpentBar()
    const engine = new BuffEngine(
      { breakingPoint: true, breakingPointTier: 5 },
      bar,
      [],
      [disintegrationBuffDef()],
    )
    engine.processDamageHitPreScore(emptyingSec)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, emptyingSec)).toBe(0)
    bar.apply(emptyingFrame, 400, "direct")
    engine.processDamageHitPreScore(sameFrameLaterSec)
    expect(engine.getHistoricalBuffStacks(BUFF.disintegration, sameFrameLaterSec)).toBe(1)
  })

  it("sees the break when it is decided after the event's Qi", () => {
    const bar = halfSpentBar()
    const engine = engineOver(bar, postQiStack)
    bar.apply(emptyingFrame, 400, "direct")
    engine.processDamageHitPostQi(emptyingSec)
    expect(engine.getHistoricalBuffStacks(POST_QI_STACK, sameFrameLaterSec)).toBe(1)
  })

  it("misses the break when it is decided before the event's Qi", () => {
    const bar = halfSpentBar()
    const engine = engineOver(bar, postQiStack)
    engine.processDamageHitPostQi(emptyingSec)
    expect(engine.getHistoricalBuffStacks(POST_QI_STACK, sameFrameLaterSec)).toBe(0)
  })

  it("does not reach the event it was decided after, only the next one on its frame", () => {
    const bar = halfSpentBar()
    const engine = engineOver(bar, postQiStack)
    bar.apply(emptyingFrame, 400, "direct")
    engine.processDamageHitPostQi(emptyingSec)
    expect(engine.getHistoricalBuffStacks(POST_QI_STACK, emptyingSec)).toBe(0)
    expect(engine.getHistoricalBuffStacks(POST_QI_STACK, sameFrameLaterSec)).toBe(1)
  })

  it("reads the break from the moment the event's Qi has applied", () => {
    const bar = halfSpentBar()
    const engine = engineOver(bar)
    expect(engine.qiBroken(emptyingSec)).toBe(false)
    bar.apply(emptyingFrame, 400, "direct")
    expect(engine.qiBroken(emptyingSec)).toBe(true)
  })
})
