import { describe, expect, it } from "vitest"
import { StatusLedger, UNOWNED, windowEndAt } from "../../src/engine/ledger"

const SPAN_START = -120
const SPAN_END = 3600

function ledger(): StatusLedger {
  return new StatusLedger(SPAN_START, SPAN_END)
}

it("constrains resource windows without changing their ownership or write order", () => {
  const led = ledger()
  led.pushWindow("resource", 0, 600, 0)
  led.pushWindow("resource", 120, 720, 120)
  const original = led.windowsOf("resource")[0]
  led.constrainWindows("resource", [{ start: 0, end: 90 }])
  expect(led.windowsOf("resource")).toEqual([{ ...original, end: 90 }])
  expect(led.throughOwner(0).isActiveAt("resource", 89)).toBe(true)
  expect(led.isActiveAt("resource", 90)).toBe(false)
})

describe("StatusLedger — stacks", () => {
  it("reads the latest value recorded at or before the frame, and 0 before any", () => {
    const led = ledger()
    led.recordStack("bleed", 100, 1)
    led.recordStack("bleed", 200, 3)
    led.recordStack("bleed", 300, 0)

    expect(led.stacksAt("bleed", 99)).toBe(0)
    expect(led.stacksAt("bleed", 100)).toBe(1)
    expect(led.stacksAt("bleed", 199)).toBe(1)
    expect(led.stacksAt("bleed", 250)).toBe(3)
    expect(led.stacksAt("bleed", 10_000)).toBe(0)
    expect(led.stacksAt("unknown", 100)).toBe(0)
  })

  it("answers by frame for an id written out of frame order", () => {
    const led = ledger()
    led.recordStack("bleed", 300, 5)
    led.recordStack("bleed", 100, 1)
    led.recordStack("bleed", 200, 3)

    expect(led.stacksAt("bleed", 99)).toBe(0)
    expect(led.stacksAt("bleed", 100)).toBe(1)
    expect(led.stacksAt("bleed", 250)).toBe(3)
    expect(led.stacksAt("bleed", 300)).toBe(5)
    expect(led.stacksAt("bleed", 10_000)).toBe(5)
  })

  it("lets the later write win when two writes share a frame", () => {
    const led = ledger()
    led.recordStack("bleed", 200, 2)
    led.recordStack("bleed", 100, 1)
    led.recordStack("bleed", 200, 4)

    expect(led.stacksAt("bleed", 200)).toBe(4)
    expect(led.asOf(led.mark()).stacksAt("bleed", 200)).toBe(4)
  })

  it("distinguishes never-recorded from recorded-as-zero", () => {
    const led = ledger()
    expect(led.hasStackHistory("bleed")).toBe(false)
    led.recordStack("bleed", 10, 0)
    expect(led.hasStackHistory("bleed")).toBe(true)
    expect(led.stacksAt("bleed", 10)).toBe(0)
  })
})

describe("StatusLedger — windows", () => {
  it("is active on [start, end) and reports the ids up at a frame", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 200)
    expect(led.isActiveAt("buff", 99)).toBe(false)
    expect(led.isActiveAt("buff", 100)).toBe(true)
    expect(led.isActiveAt("buff", 199)).toBe(true)
    expect(led.isActiveAt("buff", 200)).toBe(false)
    expect(led.activeIdsAt(150)).toEqual(["buff"])
    expect(led.activeIdsAt(250)).toEqual([])
  })

  it("opens a permanent window across the whole span, once", () => {
    const led = ledger()
    led.openPermanent("aura")
    led.openPermanent("aura")
    expect(led.windowsOf("aura")).toMatchObject([
      { start: SPAN_START, end: SPAN_END, owner: UNOWNED },
    ])
  })

  it("gates stacks on the window — the question a trigger condition asks", () => {
    const led = ledger()
    led.recordStack("bleed", 100, 4)
    led.pushWindow("bleed", 100, 200)
    expect(led.conditionStacksAt("bleed", 150)).toBe(4)
    expect(led.conditionStacksAt("bleed", 250)).toBe(0)
    expect(led.stacksAt("bleed", 250)).toBe(4)
  })

  it("picks the furthest-ending window when several overlap", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 200)
    led.pushWindow("buff", 120, 400)
    expect(led.longestActiveWindow("buff", 150)?.end).toBe(400)
    expect(led.remainingFramesAt("buff", 150)).toBe(250)
    expect(led.remainingFramesAt("buff", 500)).toBeUndefined()
  })
})

describe("StatusLedger — framesSinceLastEnd", () => {
  it("is undefined before any window has ever closed", () => {
    const led = ledger()
    expect(led.framesSinceLastEnd("buff", 100)).toBeUndefined()
    led.pushWindow("buff", 100, 200)
    expect(led.framesSinceLastEnd("buff", 150)).toBeUndefined()
  })

  it("counts from the frame a window closed, not from when it opened", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 200)
    expect(led.framesSinceLastEnd("buff", 200)).toBe(0)
    expect(led.framesSinceLastEnd("buff", 250)).toBe(50)
  })

  it("picks the latest of several closed windows, ignoring one still open", () => {
    const led = ledger()
    led.pushWindow("buff", 0, 100)
    led.pushWindow("buff", 150, 300)
    led.pushWindow("buff", 500, 900)
    expect(led.framesSinceLastEnd("buff", 400)).toBe(100)
  })

  it("hides a window pushed at or after the mark, through asOf", () => {
    const led = ledger()
    led.pushWindow("buff", 0, 100)
    const mark = led.mark()
    led.pushWindow("buff", 110, 150)
    expect(led.asOf(mark).framesSinceLastEnd("buff", 200)).toBe(100)
    expect(led.framesSinceLastEnd("buff", 200)).toBe(50)
  })
})

describe("StatusLedger — framesSinceStacksBelowThreshold", () => {
  it("is undefined for a status with no recorded stack history", () => {
    const led = ledger()
    expect(led.framesSinceStacksBelowThreshold("points", 100, 60)).toBeUndefined()
  })

  it("is undefined while the stacks have never crossed the threshold", () => {
    const led = ledger()
    led.recordStack("points", 0, 60)
    led.recordStack("points", 100, 80)
    expect(led.framesSinceStacksBelowThreshold("points", 150, 60)).toBeUndefined()
  })

  it("counts from the frame the stacks fell below the threshold, not from when they rose to it", () => {
    const led = ledger()
    led.recordStack("points", 0, 60)
    led.recordStack("points", 100, 40)
    expect(led.framesSinceStacksBelowThreshold("points", 100, 60)).toBe(0)
    expect(led.framesSinceStacksBelowThreshold("points", 150, 60)).toBe(50)
  })

  it("picks the latest of several drops, even while currently back above the threshold", () => {
    const led = ledger()
    led.recordStack("points", 0, 60)
    led.recordStack("points", 100, 40)
    led.recordStack("points", 200, 60)
    led.recordStack("points", 300, 20)
    led.recordStack("points", 400, 60)
    expect(led.framesSinceStacksBelowThreshold("points", 500, 60)).toBe(200)
  })

  it("hides a drop recorded at or after the mark, through asOf", () => {
    const led = ledger()
    led.recordStack("points", 0, 60)
    led.recordStack("points", 100, 40)
    const mark = led.mark()
    led.recordStack("points", 200, 60)
    led.recordStack("points", 300, 20)
    expect(led.asOf(mark).framesSinceStacksBelowThreshold("points", 400, 60)).toBe(300)
    expect(led.framesSinceStacksBelowThreshold("points", 400, 60)).toBe(100)
  })
})

describe("StatusLedger — asOf hides writes at or after a mark", () => {
  it("hides a window pushed at or after the mark, keeps one pushed before it", () => {
    const led = ledger()
    led.pushWindow("early", 0, 100)
    const mark = led.mark()
    led.pushWindow("late", 0, 100)
    const view = led.asOf(mark)
    expect(view.isActiveAt("early", 50)).toBe(true)
    expect(view.isActiveAt("late", 50)).toBe(false)
    expect(led.isActiveAt("late", 50)).toBe(true)
  })

  it("hides a stack recorded at or after the mark", () => {
    const led = ledger()
    led.recordStack("bleed", 0, 1)
    const mark = led.mark()
    led.recordStack("bleed", 0, 5)
    expect(led.asOf(mark).stacksAt("bleed", 0)).toBe(1)
    expect(led.stacksAt("bleed", 0)).toBe(5)
  })

  it("advances the mark by one write, and shares it across window and stack writes", () => {
    const led = ledger()
    const before = led.mark()
    led.pushWindow("a", 0, 10)
    led.recordStack("a", 0, 1)
    expect(led.mark()).toBe(before + 2)
  })
})

describe("StatusLedger — extensions are invisible before they happen", () => {
  it("subtracts an extension applied after the queried frame", () => {
    const window = { start: 0, end: 400, extensions: [{ frame: 300, amount: 100, owner: UNOWNED }] }
    expect(windowEndAt(window, 200)).toBe(300)
    expect(windowEndAt(window, 300)).toBe(400)
    expect(windowEndAt(window, 350)).toBe(400)
  })

  it("feeds that back through remainingFramesAt", () => {
    const led = ledger()
    led.pushWindow("dot", 0, 400)
    led.extendWindow(led.longestActiveWindow("dot", 0)!, 300, 500, UNOWNED)
    expect(led.remainingFramesAt("dot", 200)).toBe(200)
    expect(led.remainingFramesAt("dot", 400)).toBe(100)
  })
})

describe("StatusLedger — a view through an owner", () => {
  it("hides the windows and stacks a later owner wrote", () => {
    const led = ledger()
    led.pushWindow("buff", 100, 400, 100)
    led.recordStack("buff", 100, 2, 100)
    led.recordStack("buff", 250, 3, 200)
    const view = led.throughOwner(100)
    expect(view.isActiveAt("buff", 300)).toBe(true)
    expect(view.stacksAt("buff", 300)).toBe(2)
    expect(led.throughOwner(50).isActiveAt("buff", 300)).toBe(false)
  })

  it("hides an unowned write past the cut-off frame, but keeps one before it", () => {
    const led = ledger()
    led.openPermanent("weapon")
    led.recordStack("weapon", 50, 1)
    led.recordStack("weapon", 200, 2)
    const view = led.throughOwner(100, 150)
    expect(view.isActiveAt("weapon", 250)).toBe(true)
    expect(view.stacksAt("weapon", 250)).toBe(1)
    expect(led.throughOwner(100).stacksAt("weapon", 250)).toBe(2)
  })

  it("rolls back an extension a later owner applied to an earlier window", () => {
    const led = ledger()
    led.pushWindow("dot", 0, 400, 0)
    led.extendWindow(led.longestActiveWindow("dot", 0)!, 300, 600, 300)
    expect(led.throughOwner(0).remainingFramesAt("dot", 350)).toBe(50)
    expect(led.throughOwner(300).remainingFramesAt("dot", 350)).toBe(250)
  })

  it("rolls back a cut a later owner applied to an earlier window", () => {
    const led = ledger()
    led.pushWindow("buff", 0, 400, 0)
    led.cutWindow(led.longestActiveWindow("buff", 0)!, 200, 200)
    expect(led.isActiveAt("buff", 250)).toBe(false)
    expect(led.throughOwner(0).isActiveAt("buff", 250)).toBe(true)
    expect(led.throughOwner(200).isActiveAt("buff", 250)).toBe(false)
  })
})
