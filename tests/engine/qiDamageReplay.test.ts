import { describe, expect, it } from "vitest"
import { QiBar, type QiDamageLog } from "../../src/engine/qiBar"

const FPS = 60
const BAR = { max: 800, refill: 800, breakSec: 10, directImmunitySec: 4, takenIndex: 17.28 }
const BREAK_FRAMES = BAR.breakSec * FPS

describe("a Qi bar replaying another run's Qi damage", () => {
  it("breaks on that run's frames whatever this run deals", () => {
    const replayed: QiDamageLog = [
      { frame: 10, qi: 500, kind: "direct" },
      { frame: 20, qi: 500, kind: "direct" },
    ]
    const bar = new QiBar(BAR, FPS, replayed)
    bar.apply(10, 1, "direct")
    bar.apply(15, 700, "direct")
    bar.apply(20, 1, "direct")

    expect(bar.finish()).toMatchObject([{ startFrame: 20, endFrame: 20 + BREAK_FRAMES }])
    expect(bar.damageLog()).toEqual([
      { frame: 10, qi: 1, kind: "direct" },
      { frame: 15, qi: 700, kind: "direct" },
      { frame: 20, qi: 1, kind: "direct" },
    ])
  })

  it("scores the hit that empties the bar outside its break and a later hit on the same frame inside", () => {
    const bar = new QiBar(BAR, FPS, [
      { frame: 30, qi: 800, kind: "direct" },
      { frame: 30, qi: 50, kind: "direct" },
    ])

    expect(bar.isBrokenAtFrame(30)).toBe(false)
    bar.apply(30, 0, "direct")
    expect(bar.isBrokenAtFrame(30)).toBe(true)
  })

  it("spends a replayed entry no hit of this run lands on at its own frame", () => {
    const bar = new QiBar(BAR, FPS, [{ frame: 40, qi: 800, kind: "direct" }])

    bar.setClockFrame(40)
    expect(bar.isBrokenAtFrame(40)).toBe(false)
    bar.setClockFrame(41)
    expect(bar.isBrokenAtFrame(41)).toBe(true)
    expect(bar.finish()).toMatchObject([{ startFrame: 40 }])
  })

  it("spends the entries a run never reaches before reporting its breaks", () => {
    const bar = new QiBar(BAR, FPS, [{ frame: 50, qi: 800, kind: "direct" }])

    expect(bar.finish()).toMatchObject([{ startFrame: 50, endFrame: 50 + BREAK_FRAMES }])
  })

  it("spends no replayed entry past the frame the run has reached, whatever frame a read asks about", () => {
    const bar = new QiBar(BAR, FPS, [{ frame: 70, qi: 300, kind: "direct" }])
    bar.setClockFrame(60)

    expect(bar.fractionAtFrame(500)).toBe(1)
    bar.setClockFrame(70)
    expect(bar.fractionAtFrame(70)).toBe(1)
    bar.apply(70, 1, "direct")
    expect(bar.fractionAtFrame(71)).toBeCloseTo(500 / 800, 10)
  })

  it("ignores the hits of this run beyond the entries replayed on a frame", () => {
    const bar = new QiBar(BAR, FPS, [{ frame: 60, qi: 100, kind: "direct" }])
    bar.apply(60, 800, "direct")
    bar.apply(60, 800, "direct")

    expect(bar.finish()).toEqual([])
    expect(bar.fractionAtFrame(61)).toBeCloseTo(700 / 800, 10)
  })
})
