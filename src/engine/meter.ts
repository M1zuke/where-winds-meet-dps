import {
  meterStatusId,
  resolveMeterCapacity,
  resolveMeterStart,
  type MeterDef,
  type MeterMaxContext,
} from "../definitions/resources/meterDef"
import type { StatusLedger } from "./ledger"

export interface MeterWarning {
  frame: number
  meterId: string
  message: string
}

interface MeterInterval {
  fromFrame: number
  toFrame: number | null
  baseRate: number
  multiplierAt: (frame: number) => number
}

export class MeterEngine {
  readonly statusId: string
  readonly capacity: number
  readonly warnings: MeterWarning[] = []
  private amount: number
  private frame: number
  private pauseUntilFrame = -Infinity
  private readonly intervals: MeterInterval[] = []

  constructor(
    readonly def: MeterDef,
    maxContext: MeterMaxContext,
    private readonly fps: number,
    private readonly ledger: StatusLedger,
    startFrame = 0,
    private readonly regenMultiplierAt: (
      frame: number,
      currentAmount: number,
      capacity: number,
    ) => number = () => 1,
  ) {
    this.statusId = meterStatusId(def.id)
    this.capacity = resolveMeterCapacity(def, maxContext)
    this.amount = resolveMeterStart(def, this.capacity)
    this.frame = startFrame
    this.ledger.openPermanent(this.statusId)
    this.record()
  }

  value(): number {
    return this.amount
  }

  // A cross-step interleaving (a generated sub-cast reaching further ahead
  // than the next laid step's own start) can request a frame the cursor
  // already passed — processed at the cursor's own frame instead of
  // rewinding it, with a warning, rather than corrupting the recorded
  // history's frame order.
  private clampToCursor(frame: number): number {
    if (frame >= this.frame) return frame
    this.warnings.push({
      frame: this.frame,
      meterId: this.def.id,
      message: `requested at frame ${frame}, before the cursor — applied at ${this.frame} instead`,
    })
    return this.frame
  }

  private record(): void {
    this.ledger.recordStack(this.statusId, this.frame, Math.round(this.amount * 100) / 100)
  }

  private drainAt(frame: number): { rate: number; active: boolean } {
    let total = 0
    let active = false
    for (const interval of this.intervals) {
      if (frame < interval.fromFrame) continue
      if (interval.toFrame !== null && frame >= interval.toFrame) continue
      total += interval.baseRate * interval.multiplierAt(frame)
      active = true
    }
    return { rate: total, active }
  }

  advanceTo(toFrame: number): void {
    if (toFrame <= this.frame) return
    while (this.frame < toFrame) {
      const { rate: drainRate, active } = this.drainAt(this.frame)
      const regenPerSecond =
        active || this.frame < this.pauseUntilFrame
          ? 0
          : this.def.regenPerSecond * this.regenMultiplierAt(this.frame, this.amount, this.capacity)
      const wasDepleted = this.amount <= 1e-9
      this.frame++
      this.amount = Math.max(
        0,
        Math.min(this.capacity, this.amount + (regenPerSecond - drainRate) / this.fps),
      )
      if (drainRate > 0 && !wasDepleted && this.amount <= 1e-9)
        this.warnings.push({
          frame: this.frame,
          meterId: this.def.id,
          message: "emptied mid-drain: the in-game release would be cut short",
        })
    }
    this.record()
  }

  // A discrete cost (negative) or an on-hit gain (positive). Only a spend
  // restarts the post-spend regeneration pause — a gain never does (in-game
  // values as of 2026-09-25).
  apply(frame: number, delta: number, capToCurrent?: number): number {
    const appliedFrame = this.clampToCursor(frame)
    this.advanceTo(appliedFrame)
    const amount =
      delta < 0 && capToCurrent !== undefined
        ? -Math.min(capToCurrent, this.amount)
        : delta < 0
          ? -Math.min(-delta, this.amount)
          : delta
    this.amount = Math.max(0, Math.min(this.capacity, this.amount + amount))
    if (amount < 0 && this.def.regenPauseAfterSpendSec)
      this.pauseUntilFrame = appliedFrame + this.def.regenPauseAfterSpendSec * this.fps
    this.record()
    return amount
  }

  startDrain(
    fromFrame: number,
    toFrame: number | null,
    baseRate: number,
    multiplierAt: (frame: number) => number = () => 1,
  ): void {
    const appliedFrom = this.clampToCursor(fromFrame)
    this.advanceTo(appliedFrom)
    this.intervals.push({ fromFrame: appliedFrom, toFrame, baseRate, multiplierAt })
  }
}
