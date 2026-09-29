// The target's Qi bar: a damage-driven meter with no regeneration, a timed
// break and a post-refill immunity window for direct hits. Simulated once per
// timeline pass, in frame order, from each scored event's own finished
// damage — docs/CALCULATION.md § "Qi damage" and docs/TIMELINE.md § "Qi bar".
import type { QiPhase } from "./effects/context"
import type { EngineRunOptions } from "./types"

export type QiHitKind = "direct" | "dot"

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

export interface QiSchedule {
  readonly breaks: readonly { startSec: number; endSec: number }[]
  isBroken(timeSec: number): boolean
  // A step function of the recorded trace, 0 while broken.
  fractionAt(timeSec: number): number
  // The compatibility view: `exhausted` while broken, `below30` under the
  // compatibility low-Qi threshold, `normal` otherwise.
  phaseAt(timeSec: number): QiPhase
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

function scheduleFrom(
  breaks: readonly QiBreak[],
  fps: number,
  fractionAt: (frame: number) => number,
  firstLowQiSpan: () => { startSec: number; endSec: number } | null,
): QiSchedule {
  const isBrokenAtFrame = (frame: number) =>
    breaks.some((b) => frame >= b.startFrame && frame < b.endFrame)
  return {
    breaks: breaks.map((b) => ({ startSec: b.startFrame / fps, endSec: b.endFrame / fps })),
    isBroken: (timeSec) => isBrokenAtFrame(Math.round(timeSec * fps)),
    fractionAt: (timeSec) => fractionAt(Math.round(timeSec * fps)),
    phaseAt: (timeSec) => {
      const frame = Math.round(timeSec * fps)
      if (isBrokenAtFrame(frame)) return "exhausted"
      return fractionAt(frame) < COMPAT_LOW_QI_FRACTION ? "below30" : "normal"
    },
    firstLowQiSpan,
  }
}

// The manual-mode factory: one fixed break, from the rotation's authored
// window or the encounter's own override — docs/TIMELINE.md § "Qi bar",
// "Manual mode". `clockQiPhase`-equivalent, expressed as a schedule so every
// gate reads the one interface regardless of mode.
export function manualQiSchedule(
  window: { startSec: number; durationSec: number; lowQiLeadSec: number },
  fps: number,
): QiSchedule {
  const startFrame = Math.round(window.startSec * fps)
  const endFrame = startFrame + Math.round(Math.max(0, window.durationSec) * fps)
  const breaks: QiBreak[] =
    window.durationSec > 0 ? [{ startFrame, endFrame, immuneUntilFrame: endFrame }] : []
  const lowQiStartFrame = Math.round(Math.max(0, window.startSec - window.lowQiLeadSec) * fps)
  const hasLowQiLead = window.durationSec > 0 && window.lowQiLeadSec > 0
  const fractionAt = (frame: number): number => {
    if (breaks.some((b) => frame >= b.startFrame && frame < b.endFrame)) return 0
    if (hasLowQiLead && frame >= lowQiStartFrame && frame < startFrame)
      return COMPAT_LOW_QI_FRACTION - 0.01
    return 1
  }
  return scheduleFrom(breaks, fps, fractionAt, () =>
    hasLowQiLead ? { startSec: lowQiStartFrame / fps, endSec: startFrame / fps } : null,
  )
}

// Converts a finished run's own `Result.qiBreaks` (seconds) into the frame
// breaks `EngineRunOptions.qiScheduleSeedBreaks` reads for a warm start.
// Absent means no run to seed from yet; an empty array is itself a real seed
// — "this build's own last run never broke" — and warm-starts a nearby
// candidate straight to a one-pass confirmation instead of falling back to
// the rotation's authored window.
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
  const fractionAt = (frame: number): number =>
    breaks.some((qiBreak) => frame >= qiBreak.startFrame && frame < qiBreak.endFrame) ? 0 : 1
  return scheduleFrom(breaks, fps, fractionAt, () => null)
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
// repeat without limit.
export class QiBar {
  private value: number
  private readonly breaks: QiBreak[] = []
  private readonly trace: { frame: number; value: number }[]

  constructor(
    private readonly bar: QiTargetBar,
    private readonly fps: number,
  ) {
    this.value = bar.max
    this.trace = [{ frame: Number.NEGATIVE_INFINITY, value: this.value }]
  }

  private isBrokenAtFrame(frame: number): boolean {
    return this.breaks.some((b) => frame >= b.startFrame && frame < b.endFrame)
  }

  apply(frame: number, qi: number, kind: QiHitKind): void {
    if (!qi || this.isBrokenAtFrame(frame)) return
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
      this.trace.push({ frame: endFrame, value: this.value })
    }
  }

  // Frame-exact, for the fixed-point iteration's own convergence check.
  breaksFrames(): readonly QiBreak[] {
    return this.breaks
  }

  schedule(): QiSchedule {
    const trace = this.trace
    const max = this.bar.max
    const fractionAt = (frame: number): number => {
      let value = trace[0].value
      for (const point of trace) {
        if (point.frame > frame) break
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
      fractionAt,
      firstLowQiSpan,
    )
  }
}
