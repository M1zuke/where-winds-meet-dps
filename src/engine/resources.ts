import {
  resolveResourceSettings,
  type ResourceDef,
  type ResourceSettings,
} from "../definitions/resources/resourceDef"
import type { Skill } from "./skill"

export interface ResourceSample {
  timeSec: number
  amount: number
  active: boolean
}
export interface ResourceLaunch {
  timeSec: number
  opening: number
  endSec: number
  endAmount: number
  ticks: number
  reason: "depleted" | "recalled" | "fightEnd" | "insufficient"
}
export interface ResourceResult {
  id: string
  name: string
  capacity: number
  samples: ResourceSample[]
  launches: ResourceLaunch[]
}
export interface ResourceContext {
  fps: number
  startFrame: number
  collect: boolean
  buffActive(id: string, frame: number): boolean
  exhausted(frame: number): boolean
  paramTier(id: string): number
}

export class CombatResource {
  readonly result: ResourceResult
  readonly settings: ResourceSettings
  private amount: number
  private frame: number
  private active: ResourceLaunch | null = null
  private activeOwner: number | null = null
  private lastRefund = -Infinity
  private procCasts = new Map<string, Set<number>>()

  constructor(
    readonly definition: ResourceDef,
    settings: Partial<ResourceSettings> | undefined,
    private context: ResourceContext,
  ) {
    this.settings = resolveResourceSettings(definition, settings)
    this.amount = this.settings.opening
    this.frame = context.startFrame
    this.result = {
      id: definition.id,
      name: definition.name,
      capacity: definition.capacity,
      samples: [],
      launches: [],
    }
    this.sample()
  }

  private sample() {
    if (this.context.collect)
      this.result.samples.push({
        timeSec: this.frame / this.context.fps,
        amount: this.amount,
        active: this.active !== null,
      })
  }

  private credit(amount: number) {
    this.amount = Math.min(this.definition.capacity, this.amount + amount)
  }

  advance(toFrame: number) {
    while (this.frame < toFrame) {
      const wasActive = this.active !== null
      const drain = wasActive
        ? this.definition.drainPerSecond +
          (this.context.buffActive(this.definition.enhancedBuffId, this.frame)
            ? this.definition.enhancedExtraDrainPerSecond
            : 0)
        : 0
      this.frame++
      this.amount = Math.max(0, this.amount - drain / this.context.fps)
      if (wasActive && this.amount < 1e-8) {
        this.amount = 0
        this.stop("depleted")
      }
      if (this.frame % 6 === 0) this.sample()
    }
  }

  private stop(reason: ResourceLaunch["reason"]) {
    if (!this.active) return
    this.active.endSec = this.frame / this.context.fps
    this.active.reason = reason
    this.active = null
    this.activeOwner = null
    if (
      reason !== "fightEnd" &&
      this.frame - this.lastRefund >= this.definition.refundCooldownSeconds * this.context.fps
    ) {
      this.credit(this.definition.endRefund)
      this.lastRefund = this.frame
    }
    const launch = this.result.launches.at(-1)
    if (launch) launch.endAmount = this.amount
    this.sample()
  }

  launch(frame: number): boolean {
    this.advance(frame)
    if (this.active) {
      this.stop("recalled")
      return false
    }
    const launch: ResourceLaunch = {
      timeSec: frame / this.context.fps,
      opening: this.amount,
      endSec: frame / this.context.fps,
      endAmount: this.amount,
      ticks: 0,
      reason: this.amount + 1e-8 < this.definition.launchMinimum ? "insufficient" : "fightEnd",
    }
    this.result.launches.push(launch)
    if (launch.reason === "insufficient") {
      this.sample()
      return false
    }
    this.active = launch
    this.activeOwner = frame
    this.sample()
    return true
  }

  hit(skill: Skill, frame: number, castFrame: number) {
    this.advance(frame)
    if (skill.isDotTick) return
    for (const rule of this.definition.gains) {
      if (rule.tag && !skill.tags?.includes(rule.tag)) continue
      if (rule.skillIds && !rule.skillIds.includes(skill.id)) continue
      if (rule.requiresParam && this.context.paramTier(rule.requiresParam) < (rule.minTier ?? 1))
        continue
      if (rule.requiresBuff && !this.context.buffActive(rule.requiresBuff, frame - 1)) continue
      const casts = this.procCasts.get(rule.id) ?? new Set<number>()
      if (rule.oncePerCast && casts.has(castFrame)) continue
      casts.add(castFrame)
      this.procCasts.set(rule.id, casts)
      const divisor = rule.divideAcrossSkillHits ? Math.max(1, skill.hits.length) : 1
      this.credit((this.settings.gains[rule.id] ?? 0) / divisor)
    }
    this.sample()
  }

  tick(frame: number, owner: number): boolean {
    this.advance(frame)
    if (!this.active || this.activeOwner !== owner) return false
    this.active.ticks++
    if (this.context.exhausted(frame)) this.credit(this.settings.exhaustedGainPerTick)
    this.sample()
    return true
  }

  finish(frame: number) {
    this.advance(frame)
    this.stop("fightEnd")
    this.sample()
    return this.result
  }
}
