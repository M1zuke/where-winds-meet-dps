import { describe, expect, it } from "vitest"
import type { QiTrace } from "../../src/engine/types"
import { buildQiLedger, qiBreakSpans } from "../../src/ui/features/rotation/qiLedger"

const trace: QiTrace = {
  max: 800,
  points: [
    { timeSec: 0.5, value: 700 },
    { timeSec: 1.5, value: 300 },
    { timeSec: 2, value: 0 },
    { timeSec: 12, value: 800, refill: true },
    { timeSec: 12.5, value: 780 },
    { timeSec: 13, value: 700 },
  ],
  directImmunities: [{ startSec: 12, endSec: 16 }],
}

const casts = [
  { index: 0, timeSec: 0 },
  { index: 1, timeSec: 1 },
  { index: 2, timeSec: 5 },
  { index: 3, timeSec: 12.8 },
]

describe("the Qi ledger", () => {
  const ledger = buildQiLedger(trace, casts)

  it("reads each break span with its refill and post-refill immunity", () => {
    expect(qiBreakSpans(trace)).toEqual([
      { startSec: 2, endSec: 12, refill: 800, directImmunityEndSec: 16 },
    ])
  })

  it("charges each cast with the Qi lost until the next row", () => {
    expect(ledger.castCells.get(0)).toMatchObject({ deltaQi: -100, remaining: 700 })
    expect(ledger.castCells.get(1)).toMatchObject({ deltaQi: -700, remaining: 0 })
  })

  it("leaves a cast inside the break at zero and marks it broken", () => {
    expect(ledger.castCells.get(2)).toEqual({
      deltaQi: 0,
      remaining: 0,
      status: { kind: "broken", leftSec: 7 },
    })
  })

  it("puts the refill and what lands before the next cast on the refill row", () => {
    const refill = ledger.markers.find((marker) => marker.kind === "refill")!
    expect(refill.cell).toMatchObject({ deltaQi: 780, remaining: 780 })
  })

  it("keeps the running total: each row is the previous one plus its own delta", () => {
    expect(ledger.castCells.get(3)).toMatchObject({
      deltaQi: -80,
      remaining: 700,
      status: { kind: "immune" },
    })
  })

  it("gives the hit that empties the bar to its cast, never to the break row", () => {
    const castAtDepletion = buildQiLedger(trace, [{ index: 0, timeSec: 2 }])
    expect(castAtDepletion.castCells.get(0)).toMatchObject({ deltaQi: -300, remaining: 0 })
    const breakRow = castAtDepletion.markers.find((marker) => marker.kind === "break")!
    expect(breakRow.cell).toMatchObject({ deltaQi: 0, remaining: 0 })
  })
})
