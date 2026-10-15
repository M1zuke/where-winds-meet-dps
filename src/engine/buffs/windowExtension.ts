import { mulberry32 } from "../rng"

export const EXTENSION_PARTICLES = 500
const EXTENSION_SEED = 7351

export interface WindowExtensionSpec {
  buffIds: readonly string[]
  bySec: number
  maxRemainingSec: number
  lateness?: { property: string; maxSec: number }
}

export interface BaseWindow {
  start: number
  expiresAt: number
}

export type BaseWindowOf = (buffId: string, timeSec: number) => BaseWindow | null

export interface ExtensionTrigger {
  timeSec: number
  runKey: string | null
  latenessMaxSec: number
  conditionsHold: boolean
  cooldownSec: number
  requiredWindowId: string | null
}

const windowKey = (buffId: string, window: BaseWindow): string => `${buffId}|${window.start}`

export class WindowExtensionEnsemble {
  private readonly particleCount: number
  private readonly generators: readonly (() => number)[]
  private readonly cooldownEnd: Float64Array
  private readonly expiries = new Map<string, Float64Array>()
  private readonly latenessByRun = new Map<string, Float64Array>()

  constructor(
    private readonly spec: WindowExtensionSpec,
    generator?: () => number,
  ) {
    this.particleCount = generator ? 1 : EXTENSION_PARTICLES
    this.generators = generator
      ? [generator]
      : Array.from({ length: this.particleCount }, (_, index) => mulberry32(EXTENSION_SEED + index))
    this.cooldownEnd = new Float64Array(this.particleCount).fill(Number.NEGATIVE_INFINITY)
  }

  covers(buffId: string): boolean {
    return this.spec.buffIds.includes(buffId)
  }

  trigger(event: ExtensionTrigger, baseWindowOf: BaseWindowOf): void {
    const lateness = this.latenessFor(event)
    if (!event.conditionsHold) return

    const targets: { buffId: string; window: BaseWindow }[] = []
    for (const buffId of this.spec.buffIds) {
      const window = baseWindowOf(buffId, event.timeSec)
      if (window) targets.push({ buffId, window })
    }
    const required = event.requiredWindowId
      ? baseWindowOf(event.requiredWindowId, event.timeSec)
      : null
    if (event.requiredWindowId && !required) return
    const requiredExpiries =
      required && event.requiredWindowId
        ? this.expiries.get(windowKey(event.requiredWindowId, required))
        : undefined

    for (let particle = 0; particle < this.particleCount; particle++) {
      const now = event.timeSec + (lateness ? lateness[particle] : 0)
      if (this.cooldownEnd[particle] > now) continue
      if (required) {
        const requiredExpiry = requiredExpiries?.[particle] ?? required.expiresAt
        if (now >= requiredExpiry) continue
      }
      this.cooldownEnd[particle] = now + event.cooldownSec
      for (const { buffId, window } of targets) this.extend(buffId, window, particle, now)
    }
  }

  liveFraction(buffId: string, timeSec: number, baseWindowOf: BaseWindowOf): number {
    const window = baseWindowOf(buffId, timeSec)
    if (!window) return 0
    if (timeSec < window.expiresAt) return 1
    const expiries = this.expiries.get(windowKey(buffId, window))
    if (!expiries) return 0
    let live = 0
    for (let particle = 0; particle < this.particleCount; particle++)
      if (timeSec < expiries[particle]) live++
    return live / this.particleCount
  }

  expectedRemainingSec(buffId: string, timeSec: number, baseWindowOf: BaseWindowOf): number {
    const window = baseWindowOf(buffId, timeSec)
    if (!window) return 0
    const expiries = this.expiries.get(windowKey(buffId, window))
    if (!expiries) return Math.max(0, window.expiresAt - timeSec)
    let remaining = 0
    for (let particle = 0; particle < this.particleCount; particle++)
      remaining += Math.max(0, expiries[particle] - timeSec)
    return remaining / this.particleCount
  }

  private latenessFor(event: ExtensionTrigger): Float64Array | null {
    if (event.latenessMaxSec <= 0) return null
    const cached = event.runKey === null ? undefined : this.latenessByRun.get(event.runKey)
    if (cached) return cached
    const drawn = new Float64Array(this.particleCount)
    for (let particle = 0; particle < this.particleCount; particle++)
      drawn[particle] = this.generators[particle]() * event.latenessMaxSec
    if (event.runKey !== null) this.latenessByRun.set(event.runKey, drawn)
    return drawn
  }

  private extend(buffId: string, window: BaseWindow, particle: number, now: number): void {
    const key = windowKey(buffId, window)
    const current = this.expiries.get(key)?.[particle] ?? window.expiresAt
    if (now >= current) return
    const extended = Math.min(
      current + this.spec.bySec,
      Math.max(current, now + this.spec.maxRemainingSec),
    )
    if (extended <= current) return
    let expiries = this.expiries.get(key)
    if (!expiries) {
      expiries = new Float64Array(this.particleCount).fill(window.expiresAt)
      this.expiries.set(key, expiries)
    }
    expiries[particle] = extended
  }
}
