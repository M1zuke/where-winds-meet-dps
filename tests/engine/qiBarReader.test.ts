import { describe, expect, it } from "vitest"
import { QiBar, liveBarQiReader, scheduleQiReader } from "../../src/engine/qiBar"

const FPS = 60
const BAR = { max: 100, refill: 100, breakSec: 10, directImmunitySec: 0, takenIndex: 1 }

describe("QiBar as a QiReader", () => {
  it("reads the bar before the emptying event applies as unbroken at full Qi", () => {
    const bar = new QiBar(BAR, FPS)
    expect(bar.isBroken(5, "beforeHit")).toBe(false)
    expect(bar.fractionAt(5, "beforeHit")).toBe(1)
    expect(bar.phaseAt(5, "beforeHit")).toBe("normal")
  })

  it("reads the partly spent bar as a fraction with the compatibility low-Qi phase", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 80, "direct")
    expect(bar.fractionAt(2, "beforeHit")).toBeCloseTo(0.2, 9)
    expect(bar.phaseAt(2, "beforeHit")).toBe("below30")
  })

  it("reads the break as exhausted at 0 once the emptying event has applied", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 100, "direct")
    expect(bar.isBroken(1, "afterHit")).toBe(true)
    expect(bar.fractionAt(1, "afterHit")).toBe(0)
    expect(bar.phaseAt(1, "afterHit")).toBe("exhausted")
    expect(bar.isBroken(1 + BAR.breakSec, "afterHit")).toBe(false)
  })

  it("matches the frame-based reads on the same frame", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 100, "direct")
    expect(bar.isBroken(2, "beforeHit")).toBe(bar.isBrokenAtFrame(120))
    expect(bar.fractionAt(2, "beforeHit")).toBe(bar.fractionAtFrame(120))
  })

  it("is what the live-bar reader answers for the current frame before the hit applies", () => {
    const bar = new QiBar(BAR, FPS)
    const base = scheduleQiReader(bar.schedule())
    const live = liveBarQiReader(base, bar, 60, FPS)
    expect(live.isBroken(1, "beforeHit")).toBe(false)
    bar.apply(60, 100, "direct")
    expect(live.isBroken(1, "beforeHit")).toBe(bar.isBroken(1, "beforeHit"))
    expect(live.phaseAt(1, "beforeHit")).toBe(bar.phaseAt(1, "beforeHit"))
  })
})
