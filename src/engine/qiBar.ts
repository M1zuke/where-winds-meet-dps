// The target's Qi bar: a damage-driven meter with no regeneration, a timed
// break and a post-refill immunity window for direct hits. Simulated once per
// timeline pass, in frame order, from each scored event's own finished
// damage — docs/CALCULATION.md § "Qi damage" and docs/TIMELINE.md § "Qi bar".
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

// `beforeHit` is what the event that opens a break is scored against, `afterHit`
// what a grant that event causes reads; they differ only at the break's start frame.
export type QiReading = "beforeHit" | "afterHit"

export interface QiReader {
  isBroken(timeSec: number, reading: QiReading): boolean
  fractionAt(timeSec: number, reading: QiReading): number
  phaseAt(timeSec: number, reading: QiReading): QiPhase
}

export interface QiSchedule {
  readonly breaks: readonly { startSec: number; endSec: number }[]
  isBroken(timeSec: number, reading?: QiReading): boolean
  // A step function of the recorded trace, 0 while broken.
  fractionAt(timeSec: number, reading?: QiReading): number
  // The compatibility view: `exhausted` while broken, `below30` under the
  // compatibility low-Qi threshold, `normal` otherwise.
  phaseAt(timeSec: number, reading?: QiReading): QiPhase
  // The compatibility low-Qi lead span before the first break, for the UI's
  // own lane — `null` where there is no first break, or no such lead.
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

function brokenAtFrame(
  breaks: readonly QiBreak[],
  frame: number,
  reading: QiReading,
  startsAtDepletingEvent: boolean,
): boolean {
  const excludesStart = startsAtDepletingEvent && reading === "beforeHit"
  return breaks.some(
    (qiBreak) =>
      (excludesStart ? frame > qiBreak.startFrame : frame >= qiBreak.startFrame) &&
      frame < qiBreak.endFrame,
  )
}

function compatibilityPhase(broken: boolean, fraction: number): QiPhase {
  if (broken) return "exhausted"
  return fraction < COMPAT_LOW_QI_FRACTION ? "below30" : "normal"
}

function scheduleFrom(
  breaks: readonly QiBreak[],
  fps: number,
  startsAtDepletingEvent: boolean,
  fractionAt: (frame: number, reading: QiReading) => number,
  firstLowQiSpan: () => { startSec: number; endSec: number } | null,
): QiSchedule {
  return {
    breaks: breaks.map((b) => ({ startSec: b.startFrame / fps, endSec: b.endFrame / fps })),
    isBroken: (timeSec, reading = "afterHit") =>
      brokenAtFrame(breaks, Math.round(timeSec * fps), reading, startsAtDepletingEvent),
    fractionAt: (timeSec, reading = "afterHit") => fractionAt(Math.round(timeSec * fps), reading),
    phaseAt: (timeSec, reading = "afterHit") => {
      const frame = Math.round(timeSec * fps)
      if (brokenAtFrame(breaks, frame, reading, startsAtDepletingEvent)) return "exhausted"
      return fractionAt(frame, reading) < COMPAT_LOW_QI_FRACTION ? "below30" : "normal"
    },
    firstLowQiSpan,
  }
}

// A single fixed break, from a window rather than a simulated bar —
// `clockQiPhase`-equivalent, expressed as a schedule so every gate reads the
// one interface. Seeds the fixed-point iteration's first pass and stands in
// wherever no simulated schedule has been attached yet (docs/TIMELINE.md
// § "Qi bar").
export function fixedQiSchedule(
  window: { startSec: number; durationSec: number; lowQiLeadSec: number },
  fps: number,
): QiSchedule {
  return new ScriptedQiBar([window], fps).schedule()
}

// Every window is its own break; only the first contributes a low-Qi lead.
export class ScriptedQiBar implements QiReader {
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

  schedule(): QiSchedule {
    return scheduleFrom(
      this.breaks,
      this.fps,
      false,
      (frame) => this.fractionAtFrame(frame),
      () =>
        this.hasLowQiLead
          ? {
              startSec: this.lowQiStartFrame / this.fps,
              endSec: this.firstBreakStartFrame / this.fps,
            }
          : null,
    )
  }

  private brokenAt(frame: number): boolean {
    return brokenAtFrame(this.breaks, frame, "afterHit", false)
  }

  private fractionAtFrame(frame: number): number {
    if (this.brokenAt(frame)) return 0
    if (this.hasLowQiLead && frame >= this.lowQiStartFrame && frame < this.firstBreakStartFrame)
      return COMPAT_LOW_QI_FRACTION - 0.01
    return 1
  }
}

// Converts a finished run's own `Result.qiBreaks` (seconds) into the frame
// breaks `EngineRunOptions.qiScheduleSeedBreaks` reads for a warm start.
// Absent means no run to seed from yet; an empty array is itself a real seed
// — "this build's own last run never broke" — and warm-starts a nearby
// candidate straight to a one-pass confirmation instead of falling back to
// the default window.
export function qiScheduleSeedBreaksFrom(
  qiBreaks: readonly { startSec: number; endSec: number }[] | undefined,
  fps: number,
): readonly QiBreak[] | undefined {
  if (!qiBreaks) return undefined
  return qiBreaks.map((qiBreak) => {
    const endFrame = Math.round(qiBreak.endSec * fps)
    return { startFrame: Math.round(qiBreak.startSec * fps), endFrame, immuneUntilFrame: endFrame }
  })
}

export function engineRunOptionsSharingQiOf(run: Result, fps: number): EngineRunOptions {
  return {
    qiScheduleSeedBreaks: qiScheduleSeedBreaksFrom(run.qiBreaks, fps),
    qiDamageLog: run.qiDamageLog,
  }
}

// docs/UI.md § "The rules", "warm-start" — every repeated-sweep caller builds
// its options this way, whether the seed is an outer baseline or a nearby
// call's own already-converged schedule.
export function engineRunOptionsFrom(
  qiBreaks: readonly { startSec: number; endSec: number }[] | undefined,
  fps: number,
): EngineRunOptions {
  return { qiScheduleSeedBreaks: qiScheduleSeedBreaksFrom(qiBreaks, fps) }
}

// A warm start from a previous run's own converged breaks (docs/UI.md § "The
// rules", "warm-start"): frame-exact, no low-Qi-lead approximation — it seeds
// only the first pass of a fresh iteration, which replaces it as soon as that
// pass's own damage disagrees.
export function warmStartQiSchedule(breaks: readonly QiBreak[], fps: number): QiSchedule {
  const fractionAt = (frame: number, reading: QiReading): number =>
    brokenAtFrame(breaks, frame, reading, true) ? 0 : 1
  return scheduleFrom(breaks, fps, true, fractionAt, () => null)
}

export function scheduleQiReader(schedule: QiSchedule): QiReader {
  return {
    isBroken: (timeSec, reading) => schedule.isBroken(timeSec, reading),
    fractionAt: (timeSec, reading) => schedule.fractionAt(timeSec, reading),
    phaseAt: (timeSec, reading) => schedule.phaseAt(timeSec, reading),
  }
}

export function qiReaderReadingFrame(
  base: QiReader,
  frame: number,
  referenceFrame: number,
  fps: number,
): QiReader {
  const redirected = (timeSec: number): number =>
    Math.round(timeSec * fps) === frame ? referenceFrame / fps : timeSec
  return {
    isBroken: (timeSec, reading) => base.isBroken(redirected(timeSec), reading),
    fractionAt: (timeSec, reading) => base.fractionAt(redirected(timeSec), reading),
    phaseAt: (timeSec, reading) => base.phaseAt(redirected(timeSec), reading),
  }
}

export function liveBarQiReader(
  base: QiReader,
  bar: QiBar,
  frame: number,
  fps: number,
  servedReading: QiReading = "beforeHit",
): QiReader {
  const readsLiveBar = (timeSec: number, reading: QiReading): boolean =>
    reading === servedReading && Math.round(timeSec * fps) === frame
  return {
    isBroken: (timeSec, reading) =>
      readsLiveBar(timeSec, reading)
        ? bar.isBroken(timeSec, reading)
        : base.isBroken(timeSec, reading),
    fractionAt: (timeSec, reading) =>
      readsLiveBar(timeSec, reading)
        ? bar.fractionAt(timeSec, reading)
        : base.fractionAt(timeSec, reading),
    phaseAt: (timeSec, reading) =>
      readsLiveBar(timeSec, reading)
        ? bar.phaseAt(timeSec, reading)
        : base.phaseAt(timeSec, reading),
  }
}

export function sameQiBreaks(left: readonly QiBreak[], right: readonly QiBreak[]): boolean {
  if (left.length !== right.length) return false
  return left.every(
    (b, i) => b.startFrame === right[i].startFrame && b.endFrame === right[i].endFrame,
  )
}

// One per timeline pass, owned by the pass that scores damage. In-game rules
// as of 2026-09-25: starts at `max`; a hit during a break is lost; the part
// below 0 is lost; the break starts on the event that reaches 0 and lasts
// `breakSec`; at its end the value is `refill` and direct hits deal no Qi
// for `directImmunitySec`; ticks are never immune; no regeneration; breaks
// repeat without limit. The event that reaches 0 is itself scored against the
// bar as it stood before it, so a reader asks `isBrokenAtFrame` /
// `fractionAtFrame` before `apply`. The `QiReader` methods answer from that
// live state for either reading: ordering the read against `apply` is what
// separates `beforeHit` from `afterHit`.
export class QiBar implements QiReader {
  private value: number
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
    return this.bar.max > 0 ? Math.max(0, Math.min(1, this.value / this.bar.max)) : 0
  }

  isBroken(timeSec: number, _reading: QiReading): boolean {
    return this.isBrokenAtFrame(Math.round(timeSec * this.fps))
  }

  fractionAt(timeSec: number, _reading: QiReading): number {
    return this.fractionAtFrame(Math.round(timeSec * this.fps))
  }

  phaseAt(timeSec: number, _reading: QiReading): QiPhase {
    const frame = Math.round(timeSec * this.fps)
    return compatibilityPhase(this.isBrokenAtFrame(frame), this.fractionAtFrame(frame))
  }

  damageLog(): QiDamageLog {
    return this.log
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

  private spendReplayedBefore(frame: number): void {
    while (this.replayed && this.replayCursor < this.replayed.length) {
      if (this.replayed[this.replayCursor].frame >= frame) return
      this.spendNextReplayed()
    }
  }

  private brokenAt(frame: number): boolean {
    return this.breaks.some((b) => frame >= b.startFrame && frame < b.endFrame)
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

  // Frame-exact, for the fixed-point iteration's own convergence check.
  breaksFrames(): readonly QiBreak[] {
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

  schedule(): QiSchedule {
    this.spendRemainingReplayed()
    const trace = this.trace
    const max = this.bar.max
    const fractionAt = (frame: number, reading: QiReading): number => {
      let value = trace[0].value
      for (const point of trace) {
        if (point.frame > frame) break
        if (reading === "beforeHit" && point.frame === frame && !point.refill) continue
        value = point.value
      }
      return max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
    }
    const breaks = this.breaks
    const firstLowQiSpan = (): { startSec: number; endSec: number } | null => {
      const firstBreak = breaks[0]
      if (!firstBreak) return null
      let crossFrame: number | null = null
      for (let i = trace.length - 1; i >= 0; i--) {
        const point = trace[i]
        if (point.frame > firstBreak.startFrame) continue
        if (max > 0 && point.value / max < COMPAT_LOW_QI_FRACTION) crossFrame = point.frame
        else break
      }
      return crossFrame === null
        ? null
        : { startSec: crossFrame / this.fps, endSec: firstBreak.startFrame / this.fps }
    }
    return scheduleFrom(
      breaks.map((b) => ({ ...b })),
      this.fps,
      true,
      fractionAt,
      firstLowQiSpan,
    )
  }
}
