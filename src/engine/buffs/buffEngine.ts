// Port of the reference site's `BuffTracker` (`ka`) class. Faithful to the
// deobfuscated source, except `calculateDamageEffects` emits this app's
// `{ statKey, amount }[]` instead of the site's own `os()` formula.
//
// Two-pass usage (see timeline.ts): pass 1 replays the rotation via
// `processSkillCast` (records into `buffHistory`); pass 2 queries
// `calculateDamageEffects` per damage event, time-indexed against that history.
//
// Runs on `BuffModule` only.
import type { Skill } from "../skill"
import type { StatKey } from "../statRegistry"
import type { BuffModule } from "./buffModule"
import { matchesAnyTag, matchesScope } from "../scope"
import { castTagOf, skillTagsOf } from "./tags"
import type {
  BuildView,
  EffectContext,
  EffectEvent,
  QiPhase,
  SkillProperties,
} from "../effects/context"
import type { Effect } from "../effects/effect"
import { applyEffect, type EffectSink } from "../effects/apply"

export type BuffParams = Record<string, unknown>

interface ActiveBuff {
  appliedAt: number
  expiresAt: number
  stacks?: number
}
interface HistoryEntry {
  time: number
  buffType: string
  action: "apply" | "refresh"
  expiresAt: number
  stacks?: number
}

export type { QiPhase }

export interface DamageEffectsResult {
  effects: { statKey: StatKey; amount: number }[]
  forceCrit: boolean
  // Per-source attribution, keyed by def id — read directly by
  // `tests/engine/buffEngineAdvanced.test.ts` and `mistwillow.test.ts` to pin
  // which def a contribution came from.
  breakdown: Record<string, number>
}

const DEFAULT_DURATION = 15
// `runCastEffects`'s synthetic cast context only — never `processSkillCast`'s
// default parameter, whose absent `castTime` must read back as `?? 1`, not `0`.
const EMPTY_PROPS: SkillProperties = {}

const DISPLAY_NAME_FALLBACK: Record<string, string> = {
  mistwillowHeavyBuff: "Mistwillow (Heavy)",
  mistwillowLightBuff: "Mistwillow (Light)",
}

const MISTWILLOW_HEAVY_BUFF = "mistwillowHeavyBuff"
const MISTWILLOW_LIGHT_BUFF = "mistwillowLightBuff"
const MISTWILLOW_BUFF_DURATION = 15
const MISTWILLOW_BONUS = 0.1
// Enumerated from the name prefixes these were written as ("UmbQ", "UmbDrone",
// "UmbLightCharge", "FanLightCharged" / any name containing "Pursuit"), which
// no longer match now that a cast presents an authored tag.
const MISTWILLOW_LIGHT_OVERRIDE_CASTS = new Set([
  "cast:umbQ",
  "cast:umbQPrepull",
  "cast:umbDroneLaunch12hit",
  "cast:umbDroneLaunch16hit",
  "cast:umbDroneLaunch20hit",
  "cast:umbDroneLaunch23hit",
  "cast:umbDroneLaunch26hit",
  "cast:umbLightCharge",
  "cast:fanLightCharged",
])
const MISTWILLOW_HEAVY_OVERRIDE_CASTS = new Set([
  "cast:fanHeavyPursuit3Hit",
  "cast:fanHeavyPursuit5Hit",
])

function resolveEffects(module: BuffModule, ctx: EffectContext): Effect[] {
  return Array.isArray(module.effects) ? module.effects : module.effects(ctx)
}

export class BuffEngine {
  params: BuffParams
  definitions = new Map<string, BuffModule>()
  private triggerMap = new Map<string, BuffModule[]>()
  private activeBuffs = new Map<string, ActiveBuff>()
  private buffHistory: HistoryEntry[] = []
  private grantTimes = new Map<string, number[]>()

  constructor(
    params: BuffParams,
    modules: readonly BuffModule[],
    groupModules: readonly BuffModule[] = [],
  ) {
    this.params = params ?? {}
    const register = (module: BuffModule) => {
      if (module.requires?.set && module.requires.set !== this.params.armorSet) return
      this.definitions.set(module.id, module)
      if (module.triggeredBy)
        for (const castTag of module.triggeredBy) {
          if (!this.triggerMap.has(castTag)) this.triggerMap.set(castTag, [])
          this.triggerMap.get(castTag)!.push(module)
        }
    }
    for (const module of modules) register(module)
    for (const module of groupModules) register(module)
    for (const [id, module] of this.definitions) {
      if (module.seedAtStart && this.gateOk(module)) this.applyBuff(id, 0)
    }
    for (const [id, module] of this.definitions) {
      if (module.alwaysActive && this.gateOk(module)) this.applyBuff(id, 0)
    }
  }

  paramOn(name: string): boolean {
    return !!this.params[name]
  }
  paramTier(name: string): number {
    const tier = this.params[name + "Tier"]
    return typeof tier === "number" ? tier : 0
  }
  paramNum(name: string): number {
    const value = this.params[name]
    return typeof value === "number" ? value : 0
  }

  private gateOk(module: BuffModule): boolean {
    const requires = module.requires
    if (!requires?.param) return true
    if (!this.paramOn(requires.param)) return false
    if (requires.minTier && this.paramTier(requires.param) < requires.minTier) return false
    return true
  }

  qiPhase(time: number): QiPhase {
    const params = this.params
    const qiBreakTime = (params.qiBreakTime as number) ?? 25
    const belowQiTime = (params.belowQiTime as number) ?? qiBreakTime
    const bossBreakDuration = (params.bossBreakDuration as number) ?? 10
    const healerExt = (params.healerBreakExtension as number) ?? 0
    const breakEnd = qiBreakTime + bossBreakDuration + healerExt
    if (time >= qiBreakTime && time < breakEnd) return "exhausted"
    if (time >= belowQiTime && time < qiBreakTime) return "below30"
    return "normal"
  }

  qiBreakWindow(): { start: number; end: number } {
    const params = this.params
    const qiBreakTime = (params.qiBreakTime as number) ?? 25
    const bossBreakDuration = (params.bossBreakDuration as number) ?? 10
    const healerExt = (params.healerBreakExtension as number) ?? 0
    return { start: qiBreakTime, end: qiBreakTime + bossBreakDuration + healerExt }
  }

  private buildContext(time: number, event: EffectEvent, selfStacks: number): EffectContext {
    const build: BuildView = {
      classId: (this.params.classId as string) ?? "",
      spec: this.params.spec as string | undefined,
      armorSet: this.params.armorSet as string | undefined,
      param: (id) => this.paramOn(id),
      paramTier: (id) => this.paramTier(id),
      paramValue: (id) => this.paramNum(id),
    }
    return {
      timeSec: time,
      phase: this.qiPhase(time),
      build,
      target: { isTrainingDummy: !!this.params.isTrainingDummy },
      status: {
        isActive: (id) => this.isBuffActiveAtTime(id, time),
        stacks: (id) => this.getHistoricalBuffStacks(id, time),
        appliedAt: (id) => this.historicalApplyAt(id, time)?.time ?? null,
        expiresAt: (id) => this.historicalApplyAt(id, time)?.expiresAt ?? null,
      },
      self: { stacks: selfStacks },
      event,
    }
  }

  private resolveDuration(
    module: BuffModule,
    time: number,
    event: EffectEvent = { kind: "display" },
  ): number {
    if (typeof module.duration === "number") return module.duration
    return module.duration(this.buildContext(time, event, 0))
  }

  activeBuffsForDisplay(time: number): {
    id: string
    name: string
    stacks: number
    maxStacks: number
    effects: { statKey: StatKey; amount: number }[]
    requires?: string
  }[] {
    const out: {
      id: string
      name: string
      stacks: number
      maxStacks: number
      effects: { statKey: StatKey; amount: number }[]
      requires?: string
    }[] = []
    const seen = new Set<string>()
    const push = (id: string, module: BuffModule | undefined, stacks: number) => {
      if (seen.has(id)) return
      seen.add(id)
      const ctx = this.buildContext(time, { kind: "display" }, stacks)
      const effects: { statKey: StatKey; amount: number }[] = module
        ? resolveEffects(module, ctx).flatMap((effect) =>
            effect.kind === "stat" ? [{ statKey: effect.statKey, amount: effect.amount }] : [],
          )
        : []
      out.push({
        id,
        name: module?.name ?? DISPLAY_NAME_FALLBACK[id] ?? id,
        stacks: Math.max(1, stacks),
        maxStacks: module?.maxStacks ?? 1,
        effects,
        requires: module?.requires?.set ?? module?.requires?.param,
      })
    }
    const appliedIds = new Set(this.buffHistory.map((historyEntry) => historyEntry.buffType))
    for (const id of appliedIds) {
      const module = this.definitions.get(id)
      if (module?.activeAfterBuffEnds) continue
      if (module && !this.gateOk(module)) continue
      if (!this.isBuffActiveAtTime(id, time)) continue
      const stacks = module?.maxStacks !== undefined ? this.getHistoricalBuffStacks(id, time) : 1
      push(id, module, stacks)
    }
    for (const [id, module] of this.definitions) {
      if (!module.activeAfterBuffEnds) continue
      if (!this.gateOk(module)) continue
      if (!this.isActiveAfterBuffEndsActive(module, time)) continue
      push(id, module, 1)
    }
    return out
  }

  private canGrantStack(module: BuffModule, time: number): boolean {
    if (!module.stackRateLimit) return true
    const { count, window } = module.stackRateLimit
    const key = "stack:" + module.id
    let times = this.grantTimes.get(key)
    if (!times) {
      times = []
      this.grantTimes.set(key, times)
    }
    const cutoff = time - window
    while (times.length > 0 && times[0] <= cutoff) times.shift()
    if (times.length >= count) return false
    times.push(time)
    return true
  }

  // `rateLimit` caps how many times the WHOLE trigger may grant per window
  // (as opposed to `stackRateLimit`, which caps individual stack grants within
  // one trigger) — keyed on the bare module id so it never collides with
  // `canGrantStack`'s `"stack:"`-prefixed key.
  private canGrantTrigger(module: BuffModule, applyTime: number): boolean {
    if (!module.rateLimit) return true
    const { count, window } = module.rateLimit
    let times = this.grantTimes.get(module.id)
    if (!times) {
      times = []
      this.grantTimes.set(module.id, times)
    }
    const cutoff = applyTime - window
    while (times.length > 0 && times[0] <= cutoff) times.shift()
    if (times.length >= count) return false
    times.push(applyTime)
    return true
  }

  applyBuff(
    id: string,
    time: number,
    durationOverride: number | null = null,
    stacksToAdd = 1,
  ): void {
    const module = this.definitions.get(id)
    const duration =
      durationOverride ?? (module ? this.resolveDuration(module, time) : DEFAULT_DURATION)
    let stacks: number | undefined
    if (module?.maxStacks !== undefined) {
      const max = module.maxStacks
      const cur = this.activeBuffs.get(id)
      if (cur && time >= cur.appliedAt && time < cur.expiresAt)
        stacks = Math.min((cur.stacks || 1) + stacksToAdd, max)
      else stacks = Math.min(stacksToAdd, max)
    }
    const entry: ActiveBuff = {
      appliedAt: time,
      expiresAt: time + duration,
      ...(stacks !== undefined && { stacks }),
    }
    this.activeBuffs.set(id, entry)
    this.buffHistory.push({
      time,
      buffType: id,
      action: "apply",
      expiresAt: time + duration,
      ...(stacks !== undefined && { stacks }),
    })
    if (module) this.runCastEffects(module, time, stacks ?? 1)
  }

  private runCastEffects(module: BuffModule, time: number, selfStacks: number): void {
    const ctx = this.buildContext(
      time,
      { kind: "cast", castTag: "", props: EMPTY_PROPS },
      selfStacks,
    )
    const sink: EffectSink = {
      stat: () => {},
      forceOutcome: () => {},
      consumeStacks: () => {},
      artBonus: () => {},
      damageMultiplier: () => {},
      setStatus: () => {},
      applyBuff: (id, stacks, durationSec) => {
        const target = this.definitions.get(id)
        if (target && !this.gateOk(target)) return
        this.applyBuff(id, time, durationSec ?? null, stacks ?? 1)
      },
    }
    for (const effect of resolveEffects(module, ctx)) applyEffect(sink, effect)
  }

  private refreshBuff(id: string, time: number): void {
    const cur = this.activeBuffs.get(id)
    if (!cur || time < cur.appliedAt || time >= cur.expiresAt) return
    const module = this.definitions.get(id)
    const duration = module ? this.resolveDuration(module, time) : 12
    this.activeBuffs.set(id, {
      appliedAt: time,
      expiresAt: time + duration,
      ...(cur.stacks !== undefined && { stacks: cur.stacks }),
    })
    this.buffHistory.push({ time, buffType: id, action: "refresh", expiresAt: time + duration })
  }

  isBuffActive(id: string, time: number): boolean {
    const active = this.activeBuffs.get(id)
    return !!active && time >= active.appliedAt && time < active.expiresAt
  }
  isBuffActiveAtTime(id: string, time: number): boolean {
    return this.historicalApplyAt(id, time) !== null
  }
  private historicalApplyAt(id: string, time: number): { time: number; expiresAt: number } | null {
    for (let i = this.buffHistory.length - 1; i >= 0; i--) {
      const historyEntry = this.buffHistory[i]
      if (
        historyEntry.buffType === id &&
        historyEntry.action === "apply" &&
        historyEntry.time <= time
      )
        return time < historyEntry.expiresAt
          ? { time: historyEntry.time, expiresAt: historyEntry.expiresAt }
          : null
    }
    return null
  }
  getHistoricalBuffStacks(id: string, time: number): number {
    for (let i = this.buffHistory.length - 1; i >= 0; i--) {
      const historyEntry = this.buffHistory[i]
      if (
        historyEntry.buffType === id &&
        historyEntry.action === "apply" &&
        historyEntry.time <= time
      )
        return time < historyEntry.expiresAt ? (historyEntry.stacks ?? 1) : 0
    }
    return 0
  }
  private isActiveAfterBuffEndsActive(module: BuffModule, time: number): boolean {
    const rule = module.activeAfterBuffEnds
    if (!rule) return false
    const duration = this.resolveDuration(module, time)
    const applies = this.buffHistory
      .filter(
        (historyEntry) =>
          historyEntry.buffType === rule.buffId &&
          historyEntry.action === "apply" &&
          historyEntry.time <= time,
      )
      .sort((a, b) => a.time - b.time)
    if (applies.length === 0) return false
    if (rule.cancelledByReapply) {
      const end = applies[applies.length - 1].expiresAt
      return time >= end && time < end + duration
    }
    return applies.some(
      (historyEntry) => time >= historyEntry.expiresAt && time < historyEntry.expiresAt + duration,
    )
  }
  private requiresBuffActiveGate(module: BuffModule, applyTime: number): boolean | null {
    if (module.requiresBuffActive) return this.isBuffActive(module.requiresBuffActive, applyTime)
    return null
  }

  processSkillCast(castTag: string, time: number, props: SkillProperties = {}): void {
    if (props.noBuffTrigger) return
    for (const [trigger, modules] of this.triggerMap) {
      if (trigger !== castTag) continue
      for (const module of modules) {
        if (!this.gateOk(module)) continue
        if (module.cooldown) {
          const last = this.activeBuffs.get(module.id)
          if (last && time - last.appliedAt < module.cooldown) continue
        }
        const applyTime =
          module.buffAppliesOnCastEnd || props.buffAppliesOnCastEnd
            ? time + (props.castTime ?? 1)
            : time

        if (!this.canGrantTrigger(module, applyTime)) continue

        if (module.stacksPerHit && (props.hitCount ?? 1) > 1) {
          const hitCount = props.hitCount ?? 1
          const span = props.duration || props.castTime || 0
          if (span > 0) {
            const step = span / hitCount
            for (let i = 0; i < hitCount; i++) {
              const hitTime = applyTime + i * step
              if (!this.canGrantStack(module, hitTime)) continue
              this.applyBuff(module.id, hitTime, null, 1)
            }
          } else {
            let granted = 0
            for (let i = 0; i < hitCount; i++) if (this.canGrantStack(module, applyTime)) granted++
            if (granted > 0) this.applyBuff(module.id, applyTime, null, granted)
          }
          continue
        }

        const requiresActive = this.requiresBuffActiveGate(module, applyTime)
        if (requiresActive !== null) {
          if (requiresActive) this.applyBuff(module.id, applyTime, null, 1)
          continue
        }

        const castEvent: EffectEvent = { kind: "cast", castTag, props }
        const duration = this.resolveDuration(module, applyTime, castEvent)
        const perCast = module.stacks
          ? module.stacks(this.buildContext(applyTime, castEvent, 0))
          : 1
        if (module.stackRateLimit) {
          let granted = 0
          for (let i = 0; i < perCast; i++) if (this.canGrantStack(module, applyTime)) granted++
          if (granted <= 0) continue
          this.applyBuff(module.id, applyTime, duration, granted)
        } else {
          this.applyBuff(module.id, applyTime, duration, perCast)
        }
      }
    }
    for (const [id, module] of this.definitions) {
      if (module.refreshOnAnyCast && this.gateOk(module) && this.isBuffActive(id, time)) {
        this.refreshBuff(id, time)
      }
    }
    if (this.params.armorSet === "mistwillow") this.processMistwillowBuffGrant(castTag, time, props)
  }

  private isMistwillowLightOverride(castTag: string): boolean {
    return MISTWILLOW_LIGHT_OVERRIDE_CASTS.has(castTag)
  }
  private isMistwillowHeavyOverride(castTag: string, isExecution: boolean): boolean {
    return isExecution || MISTWILLOW_HEAVY_OVERRIDE_CASTS.has(castTag)
  }
  private mistwillowGrantCategory(
    castTag: string,
    attackType: string,
    isExecution: boolean,
  ): string | null {
    if (attackType === "heavy" || this.isMistwillowHeavyOverride(castTag, isExecution))
      return MISTWILLOW_HEAVY_BUFF
    if (attackType === "light" || this.isMistwillowLightOverride(castTag))
      return MISTWILLOW_LIGHT_BUFF
    if (attackType === "mixed") return "both"
    return null
  }
  // Deliberately INVERTED from the grant category (site's `Nl`) — the
  // cross-stance synergy: a light hit reads the HEAVY buff's bonus and vice
  // versa. Do not "fix" this to mirror mistwillowGrantCategory.
  private mistwillowBonusCategory(
    castTag: string,
    attackType: string,
    isExecution: boolean,
  ): string | null {
    if (attackType === "light" || this.isMistwillowLightOverride(castTag))
      return MISTWILLOW_HEAVY_BUFF
    if (attackType === "heavy" || this.isMistwillowHeavyOverride(castTag, isExecution))
      return MISTWILLOW_LIGHT_BUFF
    if (attackType === "mixed") return "both"
    return null
  }
  processMistwillowBuffGrant(castTag: string, time: number, props: SkillProperties): void {
    const attackType = props.attackType ?? "none"
    const isExecution = !!props.isExecution
    const category = this.mistwillowGrantCategory(castTag, attackType, isExecution)
    if (!category) return
    const heavyActive = this.isBuffActive(MISTWILLOW_HEAVY_BUFF, time)
    const lightActive = this.isBuffActive(MISTWILLOW_LIGHT_BUFF, time)
    if (category === "both" || (heavyActive && lightActive)) {
      this.applyBuff(MISTWILLOW_HEAVY_BUFF, time, MISTWILLOW_BUFF_DURATION)
      this.applyBuff(MISTWILLOW_LIGHT_BUFF, time, MISTWILLOW_BUFF_DURATION)
    } else {
      this.applyBuff(category, time, MISTWILLOW_BUFF_DURATION)
    }
  }
  private mistwillowBonusValue(castTag: string, time: number, tagSet: Set<string>): number {
    if (this.params.armorSet !== "mistwillow") return 0
    let attackType = "none"
    for (const tag of tagSet)
      if (tag.startsWith("attack:")) {
        attackType = tag.slice(7)
        break
      }
    const isExecution = tagSet.has("prop:isExecution")
    const category = this.mistwillowBonusCategory(castTag, attackType, isExecution)
    if (!category) return 0
    const heavyActive = this.isBuffActiveAtTime(MISTWILLOW_HEAVY_BUFF, time)
    const lightActive = this.isBuffActiveAtTime(MISTWILLOW_LIGHT_BUFF, time)
    if (category === "both") {
      let bonus = 0
      if (heavyActive) bonus += MISTWILLOW_BONUS * 0.5
      if (lightActive) bonus += MISTWILLOW_BONUS * 0.5
      return bonus
    }
    if (category === MISTWILLOW_HEAVY_BUFF && heavyActive) return MISTWILLOW_BONUS
    if (category === MISTWILLOW_LIGHT_BUFF && lightActive) return MISTWILLOW_BONUS
    return 0
  }

  calculateDamageEffects(skill: Skill, time: number): DamageEffectsResult {
    const castTag = castTagOf(skill)
    const tagSet = skillTagsOf(skill)
    const effects: { statKey: StatKey; amount: number }[] = []
    const breakdown: Record<string, number> = {}
    let forceCrit = false
    let currentId = ""

    const sink: EffectSink = {
      stat(statKey, amount) {
        effects.push({ statKey, amount })
        breakdown[currentId] = (breakdown[currentId] ?? 0) + amount
      },
      forceOutcome(outcome) {
        if (outcome === "crit") forceCrit = true
      },
      applyBuff: () => {},
      consumeStacks: () => {},
      artBonus: () => {},
      damageMultiplier: () => {},
      setStatus: () => {},
    }

    for (const [id, module] of this.definitions) {
      const active = module.activeAfterBuffEnds
        ? this.isActiveAfterBuffEndsActive(module, time)
        : this.isBuffActiveAtTime(id, time)
      if (!active) continue
      if (
        module.requires?.minTier &&
        module.requires.param &&
        this.paramTier(module.requires.param) < module.requires.minTier
      )
        continue
      if (module.excludes && matchesAnyTag(tagSet, module.excludes)) continue
      if (!matchesScope(tagSet, module)) continue

      const stacks = module.maxStacks !== undefined ? this.getHistoricalBuffStacks(id, time) : 1
      const ctx = this.buildContext(time, { kind: "damage", castTag, tags: tagSet }, stacks)
      currentId = id
      for (const effect of resolveEffects(module, ctx)) applyEffect(sink, effect)
    }

    const mistwillow = this.mistwillowBonusValue(castTag, time, tagSet)
    if (mistwillow > 0) {
      effects.push({ statKey: "allDamageBoost", amount: mistwillow })
      breakdown.mistwillow = (breakdown.mistwillow ?? 0) + mistwillow
    }

    return { effects, forceCrit, breakdown }
  }
}
