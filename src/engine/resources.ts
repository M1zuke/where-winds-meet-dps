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
  reason: "depleted" | "recalled" | "expired" | "fightEnd" | "insufficient"
  share: number
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
  particleCount: number
  buffLive(id: string, frame: number): boolean | Uint8Array
  exhausted(frame: number): boolean
  paramTier(id: string): number
}
export interface ResourceTickOutcome {
  share: number
  particles: Uint8Array | null
}

interface Branch {
  particles: Int32Array | null
  amount: number
  active: ResourceLaunch | null
  activeOwner: number | null
  lastRefund: number
  pendingRefundFrame: number | null
  armedAt: Map<string, number>
}

export class CombatResource {
  readonly result: ResourceResult
  readonly settings: ResourceSettings
  private branches: Branch[]
  private frame: number

  constructor(
    readonly definition: ResourceDef,
    settings: Partial<ResourceSettings> | undefined,
    private context: ResourceContext,
  ) {
    this.settings = resolveResourceSettings(definition, settings)
    this.frame = context.startFrame
    this.branches = [
      {
        particles: null,
        amount: this.settings.opening,
        active: null,
        activeOwner: null,
        lastRefund: -Infinity,
        pendingRefundFrame: null,
        armedAt: new Map(),
      },
    ]
    this.result = {
      id: definition.id,
      name: definition.name,
      capacity: definition.capacity,
      samples: [],
      launches: [],
    }
    this.sample()
  }

  private countOf(branch: Branch): number {
    return branch.particles ? branch.particles.length : this.context.particleCount
  }

  private maskOf(branches: readonly Branch[]): Uint8Array | null {
    const mask = new Uint8Array(this.context.particleCount)
    let covered = 0
    for (const branch of branches) {
      covered += this.countOf(branch)
      if (!branch.particles) return null
      for (const particle of branch.particles) mask[particle] = 1
    }
    return covered === this.context.particleCount ? null : mask
  }

  private sample() {
    if (!this.context.collect) return
    const amount =
      this.branches.length === 1
        ? this.branches[0].amount
        : this.branches.reduce((sum, branch) => sum + branch.amount * this.countOf(branch), 0) /
          this.context.particleCount
    this.result.samples.push({
      timeSec: this.frame / this.context.fps,
      amount,
      active: this.branches.some((branch) => branch.active !== null),
    })
  }

  private credit(branch: Branch, amount: number) {
    branch.amount = Math.min(this.definition.capacity, branch.amount + amount)
  }

  private split(branch: Branch, liveMask: Uint8Array): Branch {
    const everyParticle = branch.particles ?? Int32Array.from(liveMask, (_, index) => index)
    const liveParticles = everyParticle.filter((particle) => liveMask[particle])
    const deadParticles = everyParticle.filter((particle) => !liveMask[particle])
    const live: Branch = {
      ...branch,
      particles: liveParticles,
      armedAt: new Map(branch.armedAt),
    }
    branch.particles = deadParticles
    if (branch.active) {
      const liveLaunch = { ...branch.active, share: liveParticles.length / liveMask.length }
      branch.active.share = deadParticles.length / liveMask.length
      live.active = liveLaunch
      this.result.launches.push(liveLaunch)
    }
    return live
  }

  private mergeEquivalent() {
    if (this.branches.length < 2) return
    const survivors = new Map<string, Branch>()
    for (const branch of this.branches) {
      const launch = branch.active
      const key = [
        branch.amount,
        branch.activeOwner,
        branch.lastRefund,
        branch.pendingRefundFrame,
        launch ? `${launch.timeSec}/${launch.opening}/${launch.ticks}` : "idle",
        [...branch.armedAt].join(","),
      ].join("|")
      const survivor = survivors.get(key)
      if (!survivor) {
        survivors.set(key, branch)
        continue
      }
      survivor.particles = Int32Array.from([...survivor.particles!, ...branch.particles!]).sort()
      if (survivor.particles.length === this.context.particleCount) survivor.particles = null
      if (survivor.active && launch) {
        survivor.active.share += launch.share
        this.result.launches.splice(this.result.launches.indexOf(launch), 1)
      }
    }
    this.branches = [...survivors.values()]
  }

  advance(toFrame: number) {
    while (this.frame < toFrame) {
      this.frame++
      for (const branch of this.branches) {
        const wasActive = branch.active !== null
        const drain = wasActive ? this.definition.drainPerSecond : 0
        const regen = this.definition.regenPerSecond ?? 0
        branch.amount = Math.max(
          0,
          Math.min(this.definition.capacity, branch.amount + (regen - drain) / this.context.fps),
        )
        if (branch.pendingRefundFrame !== null && this.frame >= branch.pendingRefundFrame) {
          branch.pendingRefundFrame = null
          this.credit(branch, this.definition.endRefund)
        }
        if (wasActive && branch.amount < 1e-8) {
          branch.amount = 0
          this.stop(branch, "depleted")
        } else if (
          wasActive &&
          branch.active &&
          this.definition.maxRunSeconds !== undefined &&
          this.frame - branch.activeOwner! >= this.definition.maxRunSeconds * this.context.fps
        ) {
          this.stop(branch, "expired")
        }
      }
      if (this.frame % 6 === 0) this.sample()
    }
    this.mergeEquivalent()
  }

  private stop(branch: Branch, reason: ResourceLaunch["reason"]) {
    const launch = branch.active
    if (!launch) return
    launch.endSec = this.frame / this.context.fps
    launch.reason = reason
    branch.active = null
    branch.activeOwner = null
    if (
      reason !== "fightEnd" &&
      this.frame - branch.lastRefund >= this.definition.refundCooldownSeconds * this.context.fps
    ) {
      const delayFrames = (this.definition.refundDelaySeconds ?? 0) * this.context.fps
      if (delayFrames > 0) branch.pendingRefundFrame = this.frame + delayFrames
      else this.credit(branch, this.definition.endRefund)
      branch.lastRefund = this.frame
    }
    launch.endAmount = branch.amount
    this.sample()
  }

  launch(frame: number): number {
    this.advance(frame)
    const insufficientByOpening = new Map<number, ResourceLaunch>()
    let launchedParticles = 0
    for (const branch of this.branches) {
      if (branch.active) {
        this.stop(branch, "recalled")
        continue
      }
      const count = this.countOf(branch)
      const insufficient = branch.amount + 1e-8 < this.definition.launchMinimum
      const existing = insufficient ? insufficientByOpening.get(branch.amount) : undefined
      if (existing) {
        existing.share += count / this.context.particleCount
        continue
      }
      const opening = branch.amount
      if (!insufficient)
        branch.amount = Math.max(0, branch.amount - (this.definition.launchCost ?? 0))
      const launch: ResourceLaunch = {
        timeSec: frame / this.context.fps,
        opening,
        endSec: frame / this.context.fps,
        endAmount: branch.amount,
        ticks: 0,
        reason: insufficient ? "insufficient" : "fightEnd",
        share: count / this.context.particleCount,
      }
      this.result.launches.push(launch)
      if (insufficient) {
        insufficientByOpening.set(branch.amount, launch)
        continue
      }
      branch.active = launch
      branch.activeOwner = frame
      launchedParticles += count
    }
    this.mergeEquivalent()
    this.sample()
    return launchedParticles / this.context.particleCount
  }

  hit(skill: Skill, frame: number) {
    this.advance(frame)
    if (skill.isDotTick) return
    for (const rule of this.definition.gains) {
      if (rule.tag && !skill.tags?.includes(rule.tag)) continue
      if (rule.skillIds && !rule.skillIds.includes(skill.id)) continue
      if (rule.requiresParam && this.context.paramTier(rule.requiresParam) < (rule.minTier ?? 1))
        continue
      const live = rule.requiresBuff ? this.context.buffLive(rule.requiresBuff, frame - 1) : true
      if (live === false) continue
      const divisor = rule.divideAcrossSkillHits ? Math.max(1, skill.hits.length) : 1
      this.creditRule(rule, (this.settings.gains[rule.id] ?? 0) / divisor, live, frame)
    }
    this.mergeEquivalent()
    this.sample()
  }

  private creditRule(
    rule: ResourceDef["gains"][number],
    amount: number,
    live: true | Uint8Array,
    frame: number,
  ) {
    const cooldownFrames = (rule.cooldownSeconds ?? 0) * this.context.fps
    const next: Branch[] = []
    for (const branch of this.branches) {
      const armedAt = branch.armedAt.get(rule.id)
      if (armedAt !== undefined && frame < armedAt + cooldownFrames) {
        next.push(branch)
        continue
      }
      const credited = live === true ? branch : this.creditedPart(branch, live, next)
      if (!credited) continue
      this.credit(credited, amount)
      if (rule.cooldownSeconds !== undefined) credited.armedAt.set(rule.id, frame)
      next.push(credited)
    }
    this.branches = next
  }

  private creditedPart(branch: Branch, live: Uint8Array, kept: Branch[]): Branch | null {
    const everyParticle = branch.particles ?? Int32Array.from(live, (_, index) => index)
    const liveCount = everyParticle.filter((particle) => live[particle]).length
    if (liveCount === 0) {
      kept.push(branch)
      return null
    }
    if (liveCount === everyParticle.length) return branch
    const liveBranch = this.split(branch, live)
    kept.push(branch)
    return liveBranch
  }

  tick(frame: number, owner: number): ResourceTickOutcome {
    this.advance(frame)
    const ticked = this.branches.filter(
      (branch) => branch.active !== null && branch.activeOwner === owner,
    )
    if (ticked.length === 0) return { share: 0, particles: null }
    let tickedParticles = 0
    for (const branch of ticked) {
      branch.active!.ticks++
      tickedParticles += this.countOf(branch)
    }
    const particles = this.maskOf(ticked)
    this.mergeEquivalent()
    this.sample()
    return { share: tickedParticles / this.context.particleCount, particles }
  }

  creditHit(frame: number, launched: Uint8Array | null) {
    this.advance(frame)
    if (!this.context.exhausted(frame)) return
    const gain = this.settings.exhaustedGainPerTick
    if (launched === null) {
      for (const branch of this.branches) this.credit(branch, gain)
    } else {
      const next: Branch[] = []
      for (const branch of this.branches) {
        const credited = this.creditedPart(branch, launched, next)
        if (!credited) continue
        this.credit(credited, gain)
        next.push(credited)
      }
      this.branches = next
    }
    this.mergeEquivalent()
    this.sample()
  }

  chargeEnhancedRun(frame: number, owner: number) {
    this.advance(frame)
    const charged = this.branches.filter(
      (branch) => branch.active !== null && branch.activeOwner === owner,
    )
    if (charged.length === 0) return
    for (const branch of charged) {
      branch.amount = Math.max(0, branch.amount - this.definition.enhancedRunCost)
      if (branch.amount < 1e-8) this.stop(branch, "depleted")
    }
    this.mergeEquivalent()
    this.sample()
  }

  recall(frame: number) {
    this.advance(frame)
    for (const branch of this.branches) this.stop(branch, "recalled")
    this.mergeEquivalent()
  }

  recalledBy(skill: Skill): boolean {
    const { recallTag, recallExemptSkillIds, launchSkillId } = this.definition
    if (!recallTag || skill.isDotTick || skill.id === launchSkillId) return false
    if (recallExemptSkillIds?.includes(skill.id)) return false
    return skill.tags?.includes(recallTag) ?? false
  }

  finish(frame: number) {
    this.advance(frame)
    for (const branch of this.branches) this.stop(branch, "fightEnd")
    this.sample()
    this.result.launches.sort((earlier, later) => earlier.timeSec - later.timeSec)
    return this.result
  }
}
