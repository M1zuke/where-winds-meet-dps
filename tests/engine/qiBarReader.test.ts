import { describe, expect, it } from "vitest"
import { BROKEN_QI_READER, QiBar, qiReaderReadingFrame } from "../../src/engine/qiBar"

const FPS = 60
const BAR = { max: 100, refill: 100, breakSec: 10, directImmunitySec: 0, takenIndex: 1 }

describe("QiBar as a QiReader", () => {
  it("reads the full bar as unbroken", () => {
    const bar = new QiBar(BAR, FPS)
    expect(bar.isBroken(5)).toBe(false)
    expect(bar.fractionAt(5)).toBe(1)
    expect(bar.phaseAt(5)).toBe("normal")
  })

  it("reads the partly spent bar as a fraction with the compatibility low-Qi phase", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 80, "direct")
    expect(bar.fractionAt(2)).toBeCloseTo(0.2, 9)
    expect(bar.phaseAt(2)).toBe("below30")
  })

  it("reads the break as exhausted at 0 once the emptying event has applied", () => {
    const bar = new QiBar(BAR, FPS)
    expect(bar.isBroken(1)).toBe(false)
    bar.apply(60, 100, "direct")
    expect(bar.isBroken(1)).toBe(true)
    expect(bar.fractionAt(1)).toBe(0)
    expect(bar.phaseAt(1)).toBe("exhausted")
    expect(bar.isBroken(1 + BAR.breakSec)).toBe(false)
  })

  it("matches the frame-based reads on the same frame", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 100, "direct")
    expect(bar.isBroken(2)).toBe(bar.isBrokenAtFrame(120))
    expect(bar.fractionAt(2)).toBe(bar.fractionAtFrame(120))
  })
})

describe("a reader redirected for one frame", () => {
  it("answers the redirected frame from the reference and every other frame from the base", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(60, 100, "direct")
    const redirected = qiReaderReadingFrame(bar, BROKEN_QI_READER, 600, FPS)
    expect(redirected.isBroken(600 / FPS)).toBe(true)
    expect(redirected.phaseAt(600 / FPS)).toBe("exhausted")
    expect(redirected.isBroken(660 / FPS)).toBe(bar.isBroken(660 / FPS))
  })

  it("reads an unbroken reference across the start edge of a break", () => {
    const bar = new QiBar(BAR, FPS)
    bar.apply(0, 50, "direct")
    bar.apply(60, 50, "direct")
    const beforeStart = qiReaderReadingFrame(bar, bar.readerAtFrame(59), 60, FPS)
    expect(bar.isBroken(1)).toBe(true)
    expect(beforeStart.isBroken(1)).toBe(false)
    expect(beforeStart.fractionAt(1)).toBeCloseTo(0.5, 9)
  })
})
