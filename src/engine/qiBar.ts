import type { QiPhase } from "./effects/context"
import type { EngineRunOptions, QiTrace, Result } from "./types"

export type QiHitKind = "direct" | "dot"

export type QiDamageLog = readonly { frame: number; qi: number; kind: QiHitKind }[]

export interface QiTargetBar {
  max: number
  refill: number
  breakSec: number
  directImmunitySec: number
  takenIndex: number
}

export interface QiBreak {
  startFrame: number
  endFrame: number
  immuneUntilFrame: number
}

export interface QiReader {
  isBroken(timeSec: number): boolean
  fractionAt(timeSec: number): number
  phaseAt(timeSec: number): QiPhase
}

export interface QiSource extends QiReader {
  breakFrames(): readonly QiBreak[]
  readerAtFrame(frame: number): QiReader
  firstLowQiSpan(): { startSec: number; endSec: number } | null
}

export interface QiHitBonuses {
  qiDamageBoost: number
  targetQiDamageTaken: number
  qiRateAdd: number
  qiDamageIndexMultiplier: number
}

export const ZERO_QI_BONUSES: QiHitBonuses = {
  qiDamageBoost: 0,
  targetQiDamageTaken: 0,
  qiRateAdd: 0,
  qiDamageIndexMultiplier: 0,
}

const QI_STAT_KEY_FIELD: Readonly<Record<string, keyof QiHitBonuses>> = {
  qiDamageBoost: "qiDamageBoost",
  "target.qiDamageTaken": "targetQiDamageTaken",
  qiRateAdd: "qiRateAdd",
  qiDamageIndexMultiplier: "qiDamageIndexMultiplier",
}

export function qiBonusesFrom(
  effects: readonly { statKey: string; amount: number }[],
): QiHitBonuses {
  const out = { ...ZERO_QI_BONUSES }
  for (const { statKey, amount } of effects) {
    const field = QI_STAT_KEY_FIELD[statKey]
    if (field) out[field] += amount
  }
  return out
}

// docs/CALCULATION.md § "Qi damage" — the formula kernel.
export function qiFromDamage(params: {
  damage: number
  targetHpMax: number
  qiRate: number
  qiFlat: number
  bonuses: QiHitBonuses
  takenIndex: number
  playerQiIndex: number
}): number {
  const { damage, targetHpMax, qiRate, qiFlat, bonuses, takenIndex, playerQiIndex } = params
  const boost = 1 + bonuses.qiDamageBoost + bonuses.targetQiDamageTaken
  const percentTerm =
    targetHpMax > 0
      ? (damage / targetHpMax) *
        100 *
        playerQiIndex *
        (1 + bonuses.qiDamageIndexMultiplier) *
        takenIndex
      : 0
  return percentTerm * (qiRate + bonuses.qiRateAdd) * boost + qiFlat * boost
}

// The threshold the compatibility `below30` phase reads — chosen so it stays
// under every real gate this app used to fold into that one window (0.3 and
// 0.4 alike), so a manual-mode fixture pinned to the old phase boundary keeps
// its old reach exactly.
const COMPAT_LOW_QI_FRACTION = 0.29

function compatibilityPhase(broken: boolean, fraction: number): QiPhase {
  if (broken) return "exhausted"
  return fraction < COMPAT_LOW_QI_FRACTION ? "below30" : "normal"
}

function snapshotReader(broken: boolean, fraction: number): QiReader {
  const phase = compatibilityPhase(broken, fraction)
  return { isBroken: () => broken, fractionAt: () => fraction, phaseAt: () => phase }
}

export const BROKEN_QI_READER: QiReader = snapshotReader(true, 0)

export function qiReaderReadingFrame(
  base: QiReader,
  reference: QiReader,
  frame: number,
  fps: number,
): QiReader {
  const sourceAt = (timeSec: number): QiReader =>
    Math.round(timeSec * fps) === frame ? reference : base
  return {
    isBroken: (timeSec) => sourceAt(timeSec).isBroken(timeSec),
    fractionAt: (timeSec) => sourceAt(timeSec).fractionAt(timeSec),
    phaseAt: (timeSec) => sourceAt(timeSec).phaseAt(timeSec),
  }
}

// Every window is its own break; only the first contributes a low-Qi lead.
export class ScriptedQiBar implements QiSource {
  private readonly breaks: QiBreak[]
  private readonly hasLowQiLead: boolean
  private readonly firstBreakStartFrame: number
  private readonly lowQiStartFrame: number

  constructor(
    windows: readonly { startSec: number; durationSec: number; lowQiLeadSec: number }[],
    private readonly fps: number,
  ) {
    this.breaks = windows
      .filter((window) => window.durationSec > 0)
      .map((window) => {
        const startFrame = Math.round(window.startSec * fps)
        const endFrame = startFrame + Math.round(window.durationSec * fps)
        return { startFrame, endFrame, immuneUntilFrame: endFrame }
      })
    const [firstWindow] = windows
    this.hasLowQiLead = !!firstWindow && firstWindow.durationSec > 0 && firstWindow.lowQiLeadSec > 0
    this.firstBreakStartFrame = this.breaks[0]?.startFrame ?? 0
    this.lowQiStartFrame = this.hasLowQiLead
      ? Math.round(Math.max(0, firstWindow.startSec - firstWindow.lowQiLeadSec) * fps)
      : 0
  }

  isBroken(timeSec: number): boolean {
    return this.brokenAt(Math.round(timeSec * this.fps))
  }

  fractionAt(timeSec: number): number {
    return this.fractionAtFrame(Math.round(timeSec * this.fps))
  }

  phaseAt(timeSec: number): QiPhase {
    const frame = Math.round(timeSec * this.fps)
    return compatibilityPhase(this.brokenAt(frame), this.fractionAtFrame(frame))
  }

  breakFrames(): readonly QiBreak[] {
    return this.breaks
  }

  readerAtFrame(frame: number): QiReader {
    return snapshotReader(this.brokenAt(frame), this.fractionAtFrame(frame))
  }

  firstLowQiSpan(): { startSec: number; endSec: number } | null {
    return this.hasLowQiLead
      ? { startSec: this.lowQiStartFrame / this.fps, endSec: this.firstBreakStartFrame / this.fps }
      : null
  }

  private brokenAt(frame: number): boolean {
    return this.breaks.some((qiBreak) => frame >= qiBreak.startFrame && frame < qiBreak.endFrame)
  }

  private fractionAtFrame(frame: number): number {
    if (this.brokenAt(frame)) return 0
    if (this.hasLowQiLead && frame >= this.lowQiStartFrame && frame < this.firstBreakStartFrame)
      return COMPAT_LOW_QI_FRACTION - 0.01
    return 1
  }
}

export function engineRunOptionsSharingQiOf(run: Result): EngineRunOptions {
  return { qiDamageLog: run.qiDamageLog }
}

// In-game rules as of 2026-09-25: starts at `max`; a hit during a break is
// lost; the part below 0 is lost; the break starts on the event that reaches 0
// and lasts `breakSec`; at its end the value is `refill` and direct hits deal
// no Qi for `directImmunitySec`; ticks are never immune; no regeneration;
// breaks repeat without limit.
export class QiBar implements QiSource {
  private value: number
  private lastSpendFrame = Number.NEGATIVE_INFINITY
  private clockFrame = Number.NEGATIVE_INFINITY
  private readonly breaks: QiBreak[] = []
  private readonly trace: { frame: number; value: number; refill?: true }[]
  private readonly log: { frame: number; qi: number; kind: QiHitKind }[] = []
  private replayCursor = 0

  constructor(
    private readonly bar: QiTargetBar,
    private readonly fps: number,
    private readonly replayed?: QiDamageLog,
  ) {
    this.value = bar.max
    this.trace = [{ frame: Number.NEGATIVE_INFINITY, value: this.value }]
  }

  isBrokenAtFrame(frame: number): boolean {
    this.spendReplayedBefore(frame)
    return this.brokenAt(frame)
  }

  fractionAtFrame(frame: number): number {
    if (this.isBrokenAtFrame(frame)) return 0
    return this.fractionOf(this.valueAt(frame))
  }

  isBroken(timeSec: number): boolean {
    return this.isBrokenAtFrame(Math.round(timeSec * this.fps))
  }

  fractionAt(timeSec: number): number {
    return this.fractionAtFrame(Math.round(timeSec * this.fps))
  }

  phaseAt(timeSec: number): QiPhase {
    const frame = Math.round(timeSec * this.fps)
    return compatibilityPhase(this.isBrokenAtFrame(frame), this.fractionAtFrame(frame))
  }

  breakFrames(): readonly QiBreak[] {
    return this.breaks
  }

  readerAtFrame(frame: number): QiReader {
    const broken = this.brokenAt(frame)
    return snapshotReader(broken, broken ? 0 : this.fractionOf(this.valueAt(frame)))
  }

  damageLog(): QiDamageLog {
    return this.log
  }

  setClockFrame(frame: number): void {
    this.clockFrame = frame
  }

  apply(frame: number, qi: number, kind: QiHitKind): void {
    this.log.push({ frame, qi, kind })
    if (!this.replayed) {
      this.spend(frame, qi, kind)
      return
    }
    this.spendReplayedBefore(frame)
    if (this.replayed[this.replayCursor]?.frame === frame) this.spendNextReplayed()
  }

  finish(): readonly QiBreak[] {
    this.spendRemainingReplayed()
    return this.breaks
  }

  displayTrace(): QiTrace {
    this.spendRemainingReplayed()
    return {
      max: this.bar.max,
      points: this.trace.slice(1).map((point) => ({
        timeSec: point.frame / this.fps,
        value: point.value,
        ...(point.refill ? { refill: true as const } : {}),
      })),
      directImmunities: this.breaks
        .filter((qiBreak) => qiBreak.immuneUntilFrame > qiBreak.endFrame)
        .map((qiBreak) => ({
          startSec: qiBreak.endFrame / this.fps,
          endSec: qiBreak.immuneUntilFrame / this.fps,
        })),
    }
  }

  firstLowQiSpan(): { startSec: number; endSec: number } | null {
    this.spendRemainingReplayed()
    const firstBreak = this.breaks[0]
    if (!firstBreak) return null
    const max = this.bar.max
    let crossFrame: number | null = null
    for (let index = this.trace.length - 1; index >= 0; index--) {
      const point = this.trace[index]
      if (point.frame > firstBreak.startFrame) continue
      if (max > 0 && point.value / max < COMPAT_LOW_QI_FRACTION) crossFrame = point.frame
      else break
    }
    return crossFrame === null
      ? null
      : { startSec: crossFrame / this.fps, endSec: firstBreak.startFrame / this.fps }
  }

  private fractionOf(value: number): number {
    return this.bar.max > 0 ? Math.max(0, Math.min(1, value / this.bar.max)) : 0
  }

  private valueAt(frame: number): number {
    if (frame >= this.lastSpendFrame) return this.value
    let value = this.trace[0].value
    for (const point of this.trace) {
      if (point.frame > frame) break
      value = point.value
    }
    return value
  }

  private spendReplayedBefore(frame: number): void {
    const upToFrame = Math.min(frame, this.clockFrame)
    while (this.replayed && this.replayCursor < this.replayed.length) {
      if (this.replayed[this.replayCursor].frame >= upToFrame) return
      this.spendNextReplayed()
    }
  }

  private brokenAt(frame: number): boolean {
    return this.breaks.some((qiBreak) => frame >= qiBreak.startFrame && frame < qiBreak.endFrame)
  }

  private spendRemainingReplayed(): void {
    while (this.replayed && this.replayCursor < this.replayed.length) this.spendNextReplayed()
  }

  private spendNextReplayed(): void {
    const entry = this.replayed![this.replayCursor++]
    this.spend(entry.frame, entry.qi, entry.kind)
  }

  private spend(frame: number, qi: number, kind: QiHitKind): void {
    if (!qi || this.brokenAt(frame)) return
    const lastBreak = this.breaks[this.breaks.length - 1]
    if (kind === "direct" && lastBreak && frame < lastBreak.immuneUntilFrame) return
    const next = Math.max(0, this.value - qi)
    this.value = next
    this.lastSpendFrame = frame
    this.trace.push({ frame, value: next })
    if (next <= 0) {
      const startFrame = frame
      const endFrame = startFrame + Math.round(this.bar.breakSec * this.fps)
      const immuneUntilFrame = endFrame + Math.round(this.bar.directImmunitySec * this.fps)
      this.breaks.push({ startFrame, endFrame, immuneUntilFrame })
      this.value = this.bar.refill
      this.trace.push({ frame: endFrame, value: this.value, refill: true })
    }
  }
}
