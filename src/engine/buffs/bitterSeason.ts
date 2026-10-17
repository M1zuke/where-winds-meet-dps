import { MulberryBank } from "../rng"

const SIM_RUNS = 500
const SEED_OFFSET = 40217
const CHECKPOINT_INTERVAL = 32

export const BITTER_SEASON_TICK_SLUG = "bitter-season-tick"
export const BITTER_SEASON_MAX_STACKS = 5
export const BITTER_SEASON_STACK_DURATION_SEC = 10
export const BITTER_SEASON_ZENITH_EXTENSION_SEC = 10

export function bitterSeasonDebuffId(classId: string): string {
  return `debuff-${classId}-${BITTER_SEASON_TICK_SLUG}`
}

// Resolved per tier by `bitterSeasonTuningAtTier` (`src/data/innerWays/bitterSeason.ts`).
export interface BitterSeasonTuning {
  procChance: number
  defenseReductionPerStack: number
  physPenetrationAtMaxStacks: number
}

interface StateView {
  stacks: Float64Array
  stackEndSec: Float64Array
  poisonEndSec: Float64Array
}

export class BitterSeasonTracker {
  private readonly bank: MulberryBank | null
  private readonly runRandom: (() => number) | undefined
  private readonly stacks: Float64Array
  private readonly stackEndSec: Float64Array
  private readonly poisonEndSec: Float64Array
  private readonly live: StateView
  private readonly recordSec: number[] = []
  private readonly recordChangeEnd: number[] = []
  private readonly changedSim: number[] = []
  private readonly changedStacks: number[] = []
  private readonly changedStackEndSec: number[] = []
  private readonly changedPoisonEndSec: number[] = []
  private readonly checkpoints: StateView[] = []
  private readonly replayed: StateView
  private replayedRecord = -1
  private latestChangeSec = -Infinity
  private changeCount = 0
  private cachedChangeCount = -1
  private cachedTimeSec = NaN
  private cachedExpected = 0
  private cachedAtMax = 0

  constructor(
    private readonly procChance: number,
    runRandom?: () => number,
    private readonly keepHistory = false,
  ) {
    const count = runRandom ? 1 : SIM_RUNS
    this.runRandom = runRandom
    this.bank = runRandom ? null : new MulberryBank(SEED_OFFSET, count)
    this.stacks = new Float64Array(count)
    this.stackEndSec = new Float64Array(count).fill(-Infinity)
    this.poisonEndSec = new Float64Array(count).fill(-Infinity)
    this.live = {
      stacks: this.stacks,
      stackEndSec: this.stackEndSec,
      poisonEndSec: this.poisonEndSec,
    }
    this.replayed = this.copyOfLive()
  }

  roll(timeSec: number, occurrence: number, poisonDurationSec: number): void {
    if (this.procChance <= 0 || occurrence <= 0) return
    for (let sim = 0; sim < this.stacks.length; sim++) {
      if (occurrence < 1 && !(this.draw(sim) < occurrence)) continue
      let changed = false
      if (this.stacks[sim] > 0 && timeSec >= this.stackEndSec[sim]) {
        this.stacks[sim] = 0
        changed = true
      }
      if (this.draw(sim) < this.procChance) {
        this.stacks[sim] = Math.min(this.stacks[sim] + 1, BITTER_SEASON_MAX_STACKS)
        this.stackEndSec[sim] = timeSec + BITTER_SEASON_STACK_DURATION_SEC
        if (poisonDurationSec > 0)
          this.poisonEndSec[sim] = Math.max(this.poisonEndSec[sim], timeSec + poisonDurationSec)
        changed = true
      }
      if (changed) this.noteChange(sim)
    }
    this.recordChange(timeSec)
  }

  private draw(sim: number): number {
    return this.bank ? this.bank.next(sim) : this.runRandom!()
  }

  extendPoison(timeSec: number, maxRemainingSec: number): void {
    for (let sim = 0; sim < this.poisonEndSec.length; sim++) {
      const end = this.poisonEndSec[sim]
      if (end > timeSec) {
        this.poisonEndSec[sim] = Math.max(
          end,
          Math.min(end + BITTER_SEASON_ZENITH_EXTENSION_SEC, timeSec + maxRemainingSec),
        )
        this.noteChange(sim)
      }
    }
    this.recordChange(timeSec)
  }

  expectedStacksAt(timeSec: number): number {
    return this.stackStatsAt(timeSec).expected
  }

  maxStackProbAt(timeSec: number): number {
    return this.stackStatsAt(timeSec).atMax
  }

  private stackStatsAt(timeSec: number): { expected: number; atMax: number } {
    const live = timeSec >= this.latestChangeSec || !this.keepHistory
    if (live && this.cachedChangeCount === this.changeCount && this.cachedTimeSec === timeSec)
      return { expected: this.cachedExpected, atMax: this.cachedAtMax }
    const view = this.viewAt(timeSec)
    let total = 0
    let atMax = 0
    if (view) {
      for (let sim = 0; sim < view.stacks.length; sim++) {
        if (!(view.stacks[sim] > 0 && timeSec < view.stackEndSec[sim])) continue
        total += view.stacks[sim]
        if (view.stacks[sim] === BITTER_SEASON_MAX_STACKS) atMax++
      }
      total /= view.stacks.length
      atMax /= view.stacks.length
    }
    if (live) {
      this.cachedChangeCount = this.changeCount
      this.cachedTimeSec = timeSec
      this.cachedExpected = total
      this.cachedAtMax = atMax
    }
    return { expected: total, atMax }
  }

  poisonActiveProbAt(timeSec: number): number {
    const view = this.viewAt(timeSec)
    if (!view) return 0
    let active = 0
    for (let sim = 0; sim < view.poisonEndSec.length; sim++)
      if (timeSec < view.poisonEndSec[sim]) active++
    return active / view.poisonEndSec.length
  }

  // Expected remaining active time ASSUMING NO FURTHER HITS from that moment
  // on — `max(0, poisonEnd - now)` per trajectory, averaged. Unlike
  // `poisonActiveProbAt` it decays to 0 the moment hits stop landing, which is
  // the number the "Remaining" display wants.
  poisonRemainingSecAt(timeSec: number): number {
    const view = this.viewAt(timeSec)
    if (!view) return 0
    let total = 0
    for (let sim = 0; sim < view.poisonEndSec.length; sim++)
      total += Math.max(0, view.poisonEndSec[sim] - timeSec)
    return total / view.poisonEndSec.length
  }

  private copyOfLive(): StateView {
    return {
      stacks: this.stacks.slice(),
      stackEndSec: this.stackEndSec.slice(),
      poisonEndSec: this.poisonEndSec.slice(),
    }
  }

  private noteChange(sim: number): void {
    if (!this.keepHistory) return
    this.changedSim.push(sim)
    this.changedStacks.push(this.stacks[sim])
    this.changedStackEndSec.push(this.stackEndSec[sim])
    this.changedPoisonEndSec.push(this.poisonEndSec[sim])
  }

  private recordChange(timeSec: number): void {
    this.latestChangeSec = timeSec
    this.changeCount++
    if (!this.keepHistory) return
    if (this.recordSec.length % CHECKPOINT_INTERVAL === 0) this.checkpoints.push(this.copyOfLive())
    this.recordSec.push(timeSec)
    this.recordChangeEnd.push(this.changedSim.length)
  }

  private viewAt(timeSec: number): StateView | null {
    if (timeSec >= this.latestChangeSec || !this.keepHistory) return this.live
    let low = 0
    let high = this.recordSec.length - 1
    let found = -1
    while (low <= high) {
      const middle = (low + high) >> 1
      if (this.recordSec[middle] <= timeSec) {
        found = middle
        low = middle + 1
      } else high = middle - 1
    }
    return found < 0 ? null : this.replayTo(found)
  }

  private replayTo(record: number): StateView {
    const checkpointRecord = record - (record % CHECKPOINT_INTERVAL)
    let nextRecord = this.replayedRecord + 1
    if (this.replayedRecord < checkpointRecord || this.replayedRecord > record) {
      const checkpoint = this.checkpoints[checkpointRecord / CHECKPOINT_INTERVAL]
      this.replayed.stacks.set(checkpoint.stacks)
      this.replayed.stackEndSec.set(checkpoint.stackEndSec)
      this.replayed.poisonEndSec.set(checkpoint.poisonEndSec)
      nextRecord = checkpointRecord + 1
    }
    for (; nextRecord <= record; nextRecord++) {
      const end = this.recordChangeEnd[nextRecord]
      for (let change = this.recordChangeEnd[nextRecord - 1]; change < end; change++) {
        const sim = this.changedSim[change]
        this.replayed.stacks[sim] = this.changedStacks[change]
        this.replayed.stackEndSec[sim] = this.changedStackEndSec[change]
        this.replayed.poisonEndSec[sim] = this.changedPoisonEndSec[change]
      }
    }
    this.replayedRecord = record
    return this.replayed
  }
}

export interface BitterSeasonEnvelopeWindow {
  startSec: number
  endSec: number
}

// The guaranteed-proc (procChance = 1) envelope of the poison, deterministically.
// Because a real proc chance can only end a run earlier than this, the poison's
// active probability is provably 0 outside these windows — so they bound tick
// emission without dropping any expected damage.
export class BitterSeasonEnvelope {
  private readonly closed: BitterSeasonEnvelopeWindow[] = []
  private currentStart: number | null = null
  private currentEnd = -Infinity

  constructor(
    private readonly poisonDurationSec: number,
    private readonly maxRemainingSec: number,
  ) {}

  hit(timeSec: number): void {
    if (this.poisonDurationSec <= 0) return
    if (this.currentStart === null || timeSec > this.currentEnd) {
      if (this.currentStart !== null)
        this.closed.push({ startSec: this.currentStart, endSec: this.currentEnd })
      this.currentStart = timeSec
      this.currentEnd = timeSec + this.poisonDurationSec
    } else {
      this.currentEnd = Math.max(this.currentEnd, timeSec + this.poisonDurationSec)
    }
  }

  extension(timeSec: number): void {
    if (this.currentStart === null || this.currentEnd <= timeSec) return
    this.currentEnd = Math.max(
      this.currentEnd,
      Math.min(
        this.currentEnd + BITTER_SEASON_ZENITH_EXTENSION_SEC,
        timeSec + this.maxRemainingSec,
      ),
    )
  }

  windowsSoFar(): BitterSeasonEnvelopeWindow[] {
    return this.currentStart === null
      ? [...this.closed]
      : [...this.closed, { startSec: this.currentStart, endSec: this.currentEnd }]
  }
}
