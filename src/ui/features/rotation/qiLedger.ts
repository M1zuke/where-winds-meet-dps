import type { QiTrace } from "../../../engine/types"

export interface QiBreakSpan {
  startSec: number
  endSec: number
  refill: number
  directImmunityEndSec: number | null
}

export type QiCastStatus = { kind: "broken" | "immune"; leftSec: number }

export interface QiLedgerCell {
  deltaQi: number
  remaining: number
  status: QiCastStatus | null
}

export type QiLedgerMarker =
  | { kind: "break"; timeSec: number; span: QiBreakSpan; cell: QiLedgerCell }
  | { kind: "refill"; timeSec: number; span: QiBreakSpan; cell: QiLedgerCell }

export interface QiLedger {
  max: number
  castCells: ReadonlyMap<number, QiLedgerCell>
  markers: readonly QiLedgerMarker[]
}

export function formatQiDelta(deltaQi: number): string {
  const rounded = Math.round(deltaQi)
  if (rounded === 0) return "±0"
  return rounded > 0 ? `+${rounded}` : `−${-rounded}`
}

export function qiBreakSpans(trace: QiTrace): QiBreakSpan[] {
  const spans: QiBreakSpan[] = []
  trace.points.forEach((point, index) => {
    const depleting = trace.points[index - 1]
    if (!point.refill || !depleting) return
    const immunity = trace.directImmunities.find(
      (window) => Math.abs(window.startSec - point.timeSec) < 1e-9,
    )
    spans.push({
      startSec: depleting.timeSec,
      endSec: point.timeSec,
      refill: point.value,
      directImmunityEndSec: immunity?.endSec ?? null,
    })
  })
  return spans
}

const RANK_REFILL = -1
const RANK_CAST = 0
const RANK_BREAK = 1

type LedgerRow =
  | { kind: "cast"; castIndex: number; timeSec: number; rank: number }
  | { kind: "break" | "refill"; span: QiBreakSpan; timeSec: number; rank: number }

function inOrder(left: { timeSec: number; rank: number }, right: typeof left): number {
  return left.timeSec - right.timeSec || left.rank - right.rank
}

function statusAt(spans: readonly QiBreakSpan[], timeSec: number): QiCastStatus | null {
  for (const span of spans) {
    if (timeSec >= span.startSec && timeSec < span.endSec)
      return { kind: "broken", leftSec: span.endSec - timeSec }
    if (
      span.directImmunityEndSec !== null &&
      timeSec >= span.endSec &&
      timeSec < span.directImmunityEndSec
    )
      return { kind: "immune", leftSec: span.directImmunityEndSec - timeSec }
  }
  return null
}

export function buildQiLedger(
  trace: QiTrace,
  casts: readonly { index: number; timeSec: number }[],
): QiLedger {
  const spans = qiBreakSpans(trace)
  const rows: LedgerRow[] = [
    ...casts.map((cast): LedgerRow => ({
      kind: "cast",
      castIndex: cast.index,
      timeSec: cast.timeSec,
      rank: RANK_CAST,
    })),
    ...spans.flatMap((span): LedgerRow[] => [
      { kind: "break", span, timeSec: span.startSec, rank: RANK_BREAK },
      { kind: "refill", span, timeSec: span.endSec, rank: RANK_REFILL },
    ]),
  ].sort(inOrder)

  const cells = rows.map(() => ({ deltaQi: 0, remaining: trace.max }))
  let value = trace.max
  let pointIndex = 0
  let owner = -1
  const takePointsUpTo = (limit: { timeSec: number; rank: number } | null) => {
    while (pointIndex < trace.points.length) {
      const point = trace.points[pointIndex]
      const pointKey = { timeSec: point.timeSec, rank: point.refill ? RANK_REFILL : RANK_CAST }
      if (limit && inOrder(pointKey, limit) >= 0) return
      if (owner >= 0) cells[owner].deltaQi += point.value - value
      value = point.value
      pointIndex++
    }
  }
  rows.forEach((row, rowIndex) => {
    takePointsUpTo(row)
    if (owner >= 0) cells[owner].remaining = value
    if (row.kind !== "break") owner = rowIndex
    cells[rowIndex].remaining = value
  })
  takePointsUpTo(null)
  if (owner >= 0) cells[owner].remaining = value

  const castCells = new Map<number, QiLedgerCell>()
  const markers: QiLedgerMarker[] = []
  rows.forEach((row, rowIndex) => {
    const cell = { ...cells[rowIndex], status: null }
    if (row.kind === "cast")
      castCells.set(row.castIndex, { ...cell, status: statusAt(spans, row.timeSec) })
    else markers.push({ kind: row.kind, timeSec: row.timeSec, span: row.span, cell })
  })
  return { max: trace.max, castCells, markers }
}
