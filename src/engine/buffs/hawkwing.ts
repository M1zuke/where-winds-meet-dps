// Hawkwing 4-piece stack-probability `p = min(effectiveAffinityRate, 0.4)` is
// `.tmp/site/deobfuscated.js` ~L22956. The site resolves the stacking bonus
// via a seeded 500-run Monte-Carlo (`to()`, ~L20754-20813; PRNG `fr()`,
// ~L20653-20661) and applies the resulting TIME-AVERAGE bonus as a flat phys
// multiplier for the whole fight. This engine deliberately diverges: it
// tracks the same simulation online and reads the expectation at each event
// (`HawkwingTracker` below), rather than collapsing it to one average.
import { MulberryBank } from "../rng"

const DECAY_SEC = 5
const MAX_STACKS = 5
const BONUS_PER_STACK = 0.018
const SIM_RUNS = 500
const SEED_OFFSET = 314
const QUEUE_COMPACT_THRESHOLD = 4096

export const HAWKWING_MAX_STACKS = MAX_STACKS
export const HAWKWING_BONUS_PER_STACK = BONUS_PER_STACK

export class HawkwingTracker {
  private readonly bank: MulberryBank | null
  private readonly runRandom: (() => number) | undefined
  private readonly stacks: Float64Array
  private readonly lastStackSec: Float64Array
  private readonly countedStacks: Float64Array
  private readonly generation: Uint32Array
  private queueSim: number[] = []
  private queueLastSec: number[] = []
  private queueGeneration: number[] = []
  private queueHead = 0
  private totalStacks = 0
  private readonly breakpointSec: number[] = []
  private readonly breakpointIsDecay: boolean[] = []
  private readonly breakpointTotal: number[] = []
  private latestRollSec = -Infinity
  private rollCount = 0
  private cachedRollCount = -1
  private cachedTimeSec = NaN
  private cachedStacks = 0

  constructor(
    private readonly procChance: number,
    runRandom?: () => number,
    private readonly keepHistory = false,
  ) {
    const count = runRandom ? 1 : SIM_RUNS
    this.runRandom = runRandom
    this.bank = runRandom ? null : new MulberryBank(SEED_OFFSET, count)
    this.stacks = new Float64Array(count)
    this.lastStackSec = new Float64Array(count).fill(-Infinity)
    this.countedStacks = new Float64Array(count)
    this.generation = new Uint32Array(count)
  }

  roll(timeSec: number, occurrence: number): void {
    if (this.procChance <= 0 || occurrence <= 0) return
    this.expireThrough(timeSec)
    for (let sim = 0; sim < this.stacks.length; sim++) {
      if (occurrence < 1 && !(this.draw(sim) < occurrence)) continue
      if (this.stacks[sim] > 0 && timeSec - this.lastStackSec[sim] > DECAY_SEC) this.stacks[sim] = 0
      if (this.draw(sim) < this.procChance) {
        const stacked = Math.min(this.stacks[sim] + 1, MAX_STACKS)
        this.stacks[sim] = stacked
        this.lastStackSec[sim] = timeSec
        this.totalStacks += stacked - this.countedStacks[sim]
        this.countedStacks[sim] = stacked
        this.queueSim.push(sim)
        this.queueLastSec.push(timeSec)
        this.queueGeneration.push(++this.generation[sim])
      }
    }
    this.latestRollSec = timeSec
    this.rollCount++
    if (this.keepHistory) this.pushBreakpoint(timeSec, false)
  }

  private draw(sim: number): number {
    return this.bank ? this.bank.next(sim) : this.runRandom!()
  }

  private isExpired(timeSec: number, lastStackSec: number): boolean {
    return timeSec - lastStackSec > DECAY_SEC
  }

  private isCurrent(index: number): boolean {
    return this.queueGeneration[index] === this.generation[this.queueSim[index]]
  }

  private expireThrough(timeSec: number): void {
    const queueLength = this.queueSim.length
    while (
      this.queueHead < queueLength &&
      this.isExpired(timeSec, this.queueLastSec[this.queueHead])
    ) {
      const index = this.queueHead++
      if (!this.isCurrent(index)) continue
      const sim = this.queueSim[index]
      this.totalStacks -= this.countedStacks[sim]
      this.countedStacks[sim] = 0
      if (this.keepHistory) this.pushBreakpoint(this.queueLastSec[index], true)
    }
    if (this.queueHead >= QUEUE_COMPACT_THRESHOLD && this.queueHead * 2 >= queueLength) {
      this.queueSim = this.queueSim.slice(this.queueHead)
      this.queueLastSec = this.queueLastSec.slice(this.queueHead)
      this.queueGeneration = this.queueGeneration.slice(this.queueHead)
      this.queueHead = 0
    }
  }

  private pushBreakpoint(sec: number, isDecay: boolean): void {
    const last = this.breakpointSec.length - 1
    if (isDecay && last >= 0 && this.breakpointIsDecay[last] && this.breakpointSec[last] === sec) {
      this.breakpointTotal[last] = this.totalStacks
      return
    }
    this.breakpointSec.push(sec)
    this.breakpointIsDecay.push(isDecay)
    this.breakpointTotal.push(this.totalStacks)
  }

  expectedStacksAt(timeSec: number): number {
    if (timeSec >= this.latestRollSec) {
      if (this.cachedRollCount !== this.rollCount || this.cachedTimeSec !== timeSec) {
        this.cachedStacks = this.expectedAfterLatestRoll(timeSec)
        this.cachedRollCount = this.rollCount
        this.cachedTimeSec = timeSec
      }
      return this.cachedStacks
    }
    return this.keepHistory ? this.expectedFromHistory(timeSec) : this.expectedFromLive(timeSec)
  }

  private expectedAfterLatestRoll(timeSec: number): number {
    let total = this.totalStacks
    const queueLength = this.queueSim.length
    for (let index = this.queueHead; index < queueLength; index++) {
      if (!this.isExpired(timeSec, this.queueLastSec[index])) break
      if (this.isCurrent(index)) total -= this.countedStacks[this.queueSim[index]]
    }
    return total / this.stacks.length
  }

  private expectedFromHistory(timeSec: number): number {
    let low = 0
    let high = this.breakpointSec.length - 1
    let found = -1
    while (low <= high) {
      const middle = (low + high) >> 1
      const reached = this.breakpointIsDecay[middle]
        ? this.isExpired(timeSec, this.breakpointSec[middle])
        : this.breakpointSec[middle] <= timeSec
      if (reached) {
        found = middle
        low = middle + 1
      } else high = middle - 1
    }
    return found < 0 ? 0 : this.breakpointTotal[found] / this.stacks.length
  }

  private expectedFromLive(timeSec: number): number {
    let total = 0
    for (let sim = 0; sim < this.stacks.length; sim++)
      if (this.stacks[sim] > 0 && !this.isExpired(timeSec, this.lastStackSec[sim]))
        total += this.stacks[sim]
    return total / this.stacks.length
  }
}
