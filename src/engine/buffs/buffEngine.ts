// Port of the reference site's `BuffTracker` (`ka`) class. Faithful to the
// deobfuscated source, except `calculateDamageEffects` emits this app's
// `{ statKey, amount }[]` instead of the site's own `os()` formula.
//
// Two-pass usage (see timeline.ts): pass 1 replays the rotation via
// `processSkillCast` (records into `buffHistory`); pass 2 queries
// `calculateDamageEffects` per damage event, time-indexed against that history.
import type { Skill } from "../skill"
import type { StatKey } from "../statRegistry"
import type { BuffDef, ConsumeOnMatch, BuffStatMods } from "./buffDef"
import { BONUS_TYPE_TO_STATKEY, statModsToEffects } from "./buffDef"
import { onApplyHandlers } from "./handlers"
import { matchesAnyTag, matchesScope } from "../scope"
import { castTagOf, skillTagsOf } from "./tags"

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

export type QiPhase = "normal" | "below30" | "exhausted"

export interface DamageEffectsResult {
  effects: { statKey: StatKey; amount: number }[]
  forceCrit: boolean
  breakdown: Record<string, number>
}

const DEFAULT_DURATION = 15

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

interface StackPoolState {
  stacks: number
  expiresAt: number
  lastStackTime?: number
  lastRestoreTime?: number
}

export class BuffEngine {
  params: BuffParams
  definitions = new Map<string, BuffDef>()
  private triggerMap = new Map<string, BuffDef[]>()
  private refreshDefs: BuffDef[] = []
  private perCastConsumeDefs: BuffDef[] = []
  private stackPoolDefs: BuffDef[] = []
  private activeBuffs = new Map<string, ActiveBuff>()
  private buffHistory: HistoryEntry[] = []
  private grantTimes = new Map<string, number[]>()
  private lastStackTimes = new Map<string, number>()
  private stackPools = new Map<string, StackPoolState>()
  private consumeEvents = new Set<string>()
  warnings = new Set<string>()

  constructor(
    params: BuffParams,
    buffDefs: readonly BuffDef[],
    groupDefs: readonly BuffDef[] = [],
  ) {
    this.params = params ?? {}
    const register = (def: BuffDef) => {
      if (def.requiresSet && def.requiresSet !== this.params.armorSet) return
      this.definitions.set(def.id, def)
      if (def.triggeredBy)
        for (const tr of def.triggeredBy) {
          if (!this.triggerMap.has(tr)) this.triggerMap.set(tr, [])
          this.triggerMap.get(tr)!.push(def)
        }
      if (def.refreshOn) this.refreshDefs.push(def)
      if (def.consumableStackPool) this.stackPoolDefs.push(def)
      if (def.perCastConsume) this.perCastConsumeDefs.push(def)
    }
    for (const d of buffDefs) register(d)
    for (const d of groupDefs) register(d)
    for (const [id, def] of this.definitions) {
      if (def.counterMechanic && def.enabledParam && this.paramOn(def.enabledParam))
        this.applyBuff(id, 0)
    }
    for (const [id, def] of this.definitions) {
      if (def.alwaysActive && (!def.enabledParam || this.paramOn(def.enabledParam))) {
        if (def.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
          continue
        this.applyBuff(id, 0)
      }
    }
  }

  paramOn(name: string): boolean {
    return !!this.params[name]
  }
  paramTier(name: string): number {
    const v = this.params[name + "Tier"]
    return typeof v === "number" ? v : 0
  }
  paramNum(name: string): number {
    const v = this.params[name]
    return typeof v === "number" ? v : 0
  }

  qiPhase(time: number): QiPhase {
    const p = this.params
    const qiBreakTime = (p.qiBreakTime as number) ?? 25
    const belowQiTime = (p.belowQiTime as number) ?? qiBreakTime
    const bossBreakDuration = (p.bossBreakDuration as number) ?? 10
    const healerExt = (p.healerBreakExtension as number) ?? 0
    const breakEnd = qiBreakTime + bossBreakDuration + healerExt
    if (time >= qiBreakTime && time < breakEnd) return "exhausted"
    if (time >= belowQiTime && time < qiBreakTime) return "below30"
    return "normal"
  }

  qiBreakWindow(): { start: number; end: number } {
    const p = this.params
    const qiBreakTime = (p.qiBreakTime as number) ?? 25
    const bossBreakDuration = (p.bossBreakDuration as number) ?? 10
    const healerExt = (p.healerBreakExtension as number) ?? 0
    return { start: qiBreakTime, end: qiBreakTime + bossBreakDuration + healerExt }
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
    const push = (id: string, def: BuffDef | undefined, stacks: number) => {
      if (seen.has(id)) return
      seen.add(id)
      const effects = [
        ...statModsToEffects(def?.statModifiers),
        ...statModsToEffects(def?.bossStatModifiers),
      ]
      const bonus = def?.bonus
      if (bonus) {
        const value =
          bonus.value ??
          (bonus.valuePerStack != null
            ? bonus.valuePerStack * stacks
            : bonus.valueFromParam
              ? this.paramNum(bonus.valueFromParam)
              : 0)
        if (value !== 0) effects.push({ statKey: BONUS_TYPE_TO_STATKEY[bonus.type], amount: value })
      }
      out.push({
        id,
        name: def?.name ?? DISPLAY_NAME_FALLBACK[id] ?? id,
        stacks: Math.max(1, stacks),
        maxStacks: def?.maxStacks ?? 1,
        effects,
        requires: def?.requiresSet ?? def?.enabledParam,
      })
    }
    const appliedIds = new Set(this.buffHistory.map((h) => h.buffType))
    for (const id of appliedIds) {
      if (id === "crosswindSpirit") continue
      const def = this.definitions.get(id)
      if (def?.triggerOnBuffEnd) continue
      if (def?.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
        continue
      if (!this.isBuffActiveAtTime(id, time)) continue
      const stacks = def?.maxStacks ? this.getHistoricalBuffStacks(id, time) : 1
      push(id, def, stacks)
    }
    for (const [id, def] of this.definitions) {
      if (!def.triggerOnBuffEnd || id === "crosswindSpirit") continue
      if (def.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
        continue
      if (!this.isTriggerOnBuffEndActive(def, time)) continue
      push(id, def, 1)
    }
    return out
  }

  private getEffectiveMaxStacks(def: BuffDef): number {
    const tc = def.tierConditionalStacks as
      { enabledParam?: string; minTier?: number; maxStacks?: number } | undefined
    if (!tc) return def.maxStacks ?? 1
    const on = !tc.enabledParam || this.paramOn(tc.enabledParam)
    const tierOk = !tc.minTier || !tc.enabledParam || this.paramTier(tc.enabledParam) >= tc.minTier
    return on && tierOk && tc.maxStacks != null ? tc.maxStacks : (def.maxStacks ?? 1)
  }
  private getEffectiveStacksPerCast(def: BuffDef): number {
    const tc = def.tierConditionalStacks as
      { enabledParam?: string; minTier?: number; stacksPerCast?: number } | undefined
    if (tc && tc.stacksPerCast != null) {
      const on = !tc.enabledParam || this.paramOn(tc.enabledParam)
      const tierOk =
        !tc.minTier || !tc.enabledParam || this.paramTier(tc.enabledParam) >= tc.minTier
      if (on && tierOk) return tc.stacksPerCast
    }
    return def.stacksPerCast ?? 1
  }
  private canGrantStack(def: BuffDef, time: number): boolean {
    if (!def.stackRateLimit) return true
    const { count, window } = def.stackRateLimit
    const key = "stack:" + def.id
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

  applyBuff(
    id: string,
    time: number,
    durationOverride: number | null = null,
    stacksToAdd = 1,
  ): void {
    const def = this.definitions.get(id)
    const duration = durationOverride ?? def?.duration ?? DEFAULT_DURATION
    let stacks: number | undefined
    if (def?.maxStacks) {
      const max = this.getEffectiveMaxStacks(def)
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
    if (def?.onApply)
      for (const other of def.onApply) {
        const od = this.definitions.get(other)
        if (!od?.enabledParam || this.paramOn(od.enabledParam)) this.applyBuff(other, time)
      }
    if (def?.onApplyFn?.__handler) onApplyHandlers[def.onApplyFn.__handler]?.(this, time)
  }
  private refreshBuff(id: string, time: number): void {
    const cur = this.activeBuffs.get(id)
    if (!cur || time < cur.appliedAt || time >= cur.expiresAt) return
    const duration = this.definitions.get(id)?.duration ?? 12
    this.activeBuffs.set(id, {
      appliedAt: time,
      expiresAt: time + duration,
      ...(cur.stacks !== undefined && { stacks: cur.stacks }),
    })
    this.buffHistory.push({ time, buffType: id, action: "refresh", expiresAt: time + duration })
  }

  isBuffActive(id: string, time: number): boolean {
    const b = this.activeBuffs.get(id)
    return !!b && time >= b.appliedAt && time < b.expiresAt
  }
  isBuffActiveAtTime(id: string, time: number): boolean {
    for (let i = this.buffHistory.length - 1; i >= 0; i--) {
      const h = this.buffHistory[i]
      if (h.buffType === id && h.action === "apply" && h.time <= time) return time < h.expiresAt
    }
    return false
  }
  getHistoricalBuffStacks(id: string, time: number): number {
    for (let i = this.buffHistory.length - 1; i >= 0; i--) {
      const h = this.buffHistory[i]
      if (h.buffType === id && h.action === "apply" && h.time <= time)
        return time < h.expiresAt ? (h.stacks ?? 1) : 0
    }
    return 0
  }
  private consumeStack(id: string, time: number, amount = 1): boolean {
    const cur = this.activeBuffs.get(id)
    if (!cur || time < cur.appliedAt || time >= cur.expiresAt) return false
    const before = cur.stacks ?? 1
    if (before <= 0) return false
    const next = Math.max(0, before - amount)
    const entry: ActiveBuff = { ...cur, stacks: next }
    this.activeBuffs.set(id, entry)
    this.buffHistory.push({
      time,
      buffType: id,
      action: "apply",
      expiresAt: cur.expiresAt,
      stacks: next,
    })
    return true
  }
  private isTriggerOnBuffEndActive(def: BuffDef, time: number): boolean {
    const tob = def.triggerOnBuffEnd
    if (!tob) return false
    const duration = def.duration ?? DEFAULT_DURATION
    const applies = this.buffHistory
      .filter((h) => h.buffType === tob.sourceBuff && h.action === "apply" && h.time <= time)
      .sort((a, b) => a.time - b.time)
    if (applies.length === 0) return false
    if (tob.cancelledByReapply) {
      const end = applies[applies.length - 1].expiresAt
      return time >= end && time < end + duration
    }
    return applies.some((h) => time >= h.expiresAt && time < h.expiresAt + duration)
  }
  private matchesConsumeOn(
    match: ConsumeOnMatch | undefined,
    opts: Record<string, unknown>,
  ): boolean {
    if (!match) return false
    if (match.excludeProperty && opts[match.excludeProperty]) return false
    if (match.skillProperty) return !!opts[match.skillProperty]
    if (match.mistwillowCategory) return !!opts.mistwillowCategory
    return false
  }

  processSkillCast(castTag: string, time: number, opts: Record<string, unknown> = {}): void {
    if (opts.noBuffTrigger) return
    for (const [trigger, defs] of this.triggerMap) {
      if (trigger !== castTag) continue
      for (const def of defs) {
        if (def.enabledParam && !this.paramOn(def.enabledParam)) continue
        if (def.cooldown) {
          const last = this.activeBuffs.get(def.id)
          if (last && time - last.appliedAt < def.cooldown) continue
        }
        if (def.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
          continue
        const applyTime =
          def.buffAppliesOnCastEnd || opts.buffAppliesOnCastEnd
            ? time + ((opts.castTime as number) ?? 1)
            : time
        if (def.triggerPhaseGate) {
          const gate = Array.isArray(def.triggerPhaseGate)
            ? def.triggerPhaseGate
            : [def.triggerPhaseGate]
          if (!gate.includes(this.qiPhase(applyTime))) continue
        }
        if (def.rateLimit) {
          const { count, window } = def.rateLimit
          let times = this.grantTimes.get(def.id)
          if (!times) {
            times = []
            this.grantTimes.set(def.id, times)
          }
          const cutoff = applyTime - window
          while (times.length > 0 && times[0] <= cutoff) times.shift()
          if (times.length >= count) continue
          times.push(applyTime)
        }
        if (def.stacksPerHit && ((opts.hitCount as number) ?? 1) > 1) {
          const hitCount = opts.hitCount as number
          const span = (opts.duration as number) || (opts.castTime as number) || 0
          if (span > 0) {
            const step = span / hitCount
            for (let i = 0; i < hitCount; i++) {
              const t = applyTime + i * step
              if (!this.canGrantStack(def, t)) continue
              if (def.stackIcd != null) {
                const last = this.lastStackTimes.get(def.id)
                if (last != null && t - last < def.stackIcd - 1e-9) continue
                this.lastStackTimes.set(def.id, t)
              }
              this.applyBuff(def.id, t, null, 1)
            }
          } else {
            let granted = 0
            for (let i = 0; i < hitCount; i++) if (this.canGrantStack(def, applyTime)) granted++
            if (granted > 0) this.applyBuff(def.id, applyTime, null, granted)
          }
        } else if (def.conditionalTrigger) {
          const ct = def.conditionalTrigger
          const refresh = ct.refreshIfActive && this.isBuffActive(ct.refreshIfActive, applyTime)
          const upgrade = ct.upgradeFromActive && this.isBuffActive(ct.upgradeFromActive, applyTime)
          if (refresh || upgrade) this.applyBuff(def.id, applyTime, null, 1)
        } else {
          let dur = def.durationByTrigger?.[trigger] ?? null
          if (def.extendDurationToIfBuffActive) {
            const ext = def.extendDurationToIfBuffActive
            const on = !ext.enabledParam || this.paramOn(ext.enabledParam)
            const tierOk =
              !ext.minTier || !ext.enabledParam || this.paramTier(ext.enabledParam) >= ext.minTier
            if (on && tierOk && this.isBuffActive(ext.buffId, applyTime)) {
              const base = dur ?? def.duration ?? 0
              if (ext.targetDuration > base) dur = ext.targetDuration
            }
          }
          const perCast = this.getEffectiveStacksPerCast(def)
          if (def.stackRateLimit) {
            let granted = 0
            for (let i = 0; i < perCast; i++) if (this.canGrantStack(def, applyTime)) granted++
            if (granted <= 0) continue
            this.applyBuff(def.id, applyTime, dur, granted)
          } else {
            this.applyBuff(def.id, applyTime, dur, perCast)
          }
        }
      }
    }
    for (const def of this.refreshDefs) {
      const ro = def.refreshOn!
      if (ro.skillProperty && opts[ro.skillProperty]) {
        if (ro.onlyIfActive) {
          if (this.isBuffActive(def.id, time)) this.refreshBuff(def.id, time)
        } else this.refreshBuff(def.id, time)
      }
    }
    for (const [id, def] of this.definitions) {
      const cm = def.counterMechanic
      if (
        cm &&
        typeof cm === "object" &&
        cm.refreshable &&
        def.enabledParam &&
        this.paramOn(def.enabledParam) &&
        this.isBuffActive(id, time)
      ) {
        this.refreshBuff(id, time)
      }
    }
    if (this.params.armorSet === "mistwillow") this.processMistwillowBuffGrant(castTag, time, opts)
    this.processPerCastConsume(castTag, time, opts)
    this.processConsumableStackPools(castTag, time, opts)
  }

  processDroneTick(time: number): void {
    for (const def of this.refreshDefs) {
      if (
        def.refreshOn?.skillProperty === "isDrone" &&
        def.refreshOn?.onlyIfActive &&
        this.isBuffActive(def.id, time)
      ) {
        this.refreshBuff(def.id, time)
      }
    }
  }

  processDroneTickWithExternalLB(time: number): void {
    this.applyBuff("lingeringBone", time)
    this.processDroneTick(time)
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
  processMistwillowBuffGrant(
    castTag: string,
    time: number,
    opts: Record<string, unknown> = {},
  ): void {
    const attackType = (opts.attackType as string) ?? "none"
    const isExecution = !!opts.isExecution
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
    for (const t of tagSet)
      if (t.startsWith("attack:")) {
        attackType = t.slice(7)
        break
      }
    const isExecution = tagSet.has("prop:isExecution")
    const category = this.mistwillowBonusCategory(castTag, attackType, isExecution)
    if (!category) return 0
    const heavyActive = this.isBuffActiveAtTime(MISTWILLOW_HEAVY_BUFF, time)
    const lightActive = this.isBuffActiveAtTime(MISTWILLOW_LIGHT_BUFF, time)
    if (category === "both") {
      let v = 0
      if (heavyActive) v += MISTWILLOW_BONUS * 0.5
      if (lightActive) v += MISTWILLOW_BONUS * 0.5
      return v
    }
    if (category === MISTWILLOW_HEAVY_BUFF && heavyActive) return MISTWILLOW_BONUS
    if (category === MISTWILLOW_LIGHT_BUFF && lightActive) return MISTWILLOW_BONUS
    return 0
  }

  private processPerCastConsume(
    castTag: string,
    time: number,
    opts: Record<string, unknown>,
  ): void {
    for (const def of this.perCastConsumeDefs) {
      const pc = def.perCastConsume!
      if (def.enabledParam && !this.paramOn(def.enabledParam)) continue
      if (def.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
        continue
      if (!opts[pc.triggerSkillProperty]) continue
      let source: string | null = null
      for (const pref of pc.preferredSources ?? []) {
        if (pref.enabledParam && !this.paramOn(pref.enabledParam)) continue
        if (pref.minTier && pref.enabledParam && this.paramTier(pref.enabledParam) < pref.minTier)
          continue
        if (this.getHistoricalBuffStacks(pref.buffStack, time) > 0) {
          source = pref.buffStack
          break
        }
      }
      if (!source && this.getHistoricalBuffStacks(pc.consumesFromBuffStack, time) > 0)
        source = pc.consumesFromBuffStack
      if (!source) continue
      if (!this.consumeStack(source, time, 1)) continue
      this.consumeEvents.add(`${time}|${castTag}|${def.id}`)
    }
  }

  private processConsumableStackPools(
    castTag: string,
    time: number,
    opts: Record<string, unknown>,
  ): void {
    for (const def of this.stackPoolDefs) {
      const pool = def.consumableStackPool!
      if (def.enabledParam && !this.paramOn(def.enabledParam)) continue
      const state = this.stackPools.get(def.id) ?? { stacks: 0, expiresAt: -Infinity }
      const alive = time < state.expiresAt

      if (opts[pool.stackOn.skillProperty]) {
        const icdOk =
          pool.stackOn.icd == null ||
          state.lastStackTime == null ||
          time - state.lastStackTime >= pool.stackOn.icd
        if (icdOk) {
          const cur = alive ? state.stacks : 0
          const next = Math.min(pool.stackCap, cur + (pool.stackOn.stacksPerTrigger ?? 1))
          this.stackPools.set(def.id, {
            ...state,
            stacks: next,
            expiresAt: time + pool.stackLifetime,
            lastStackTime: time,
          })
        }
      }

      const restore = pool.tierStackRestore
      if (
        restore &&
        def.enabledParam &&
        this.paramTier(def.enabledParam) >= restore.minTier &&
        this.matchesConsumeOn(restore.restoreOn, opts)
      ) {
        const gate =
          restore.phaseGate == null ||
          (Array.isArray(restore.phaseGate)
            ? restore.phaseGate.includes(this.qiPhase(time))
            : restore.phaseGate === this.qiPhase(time))
        const cur = this.stackPools.get(def.id) ?? { stacks: 0, expiresAt: -Infinity }
        const stillAlive = time < cur.expiresAt
        const activeOk = !restore.requireBuffActive || stillAlive
        const icdOk =
          restore.icd == null ||
          cur.lastRestoreTime == null ||
          time - cur.lastRestoreTime >= restore.icd
        if (gate && activeOk && icdOk) {
          const next = Math.min(
            pool.stackCap,
            (stillAlive ? cur.stacks : 0) + (restore.stacksPerTrigger ?? 1),
          )
          this.stackPools.set(def.id, {
            ...cur,
            stacks: next,
            expiresAt: time + pool.stackLifetime,
            lastRestoreTime: time,
          })
        }
      }

      if (this.matchesConsumeOn(pool.consumeOn, opts)) {
        const cur = this.stackPools.get(def.id)
        if (cur && time < cur.expiresAt && cur.stacks > 0) {
          this.stackPools.set(def.id, { ...cur, stacks: 0 })
          this.consumeEvents.add(`${time}|${castTag}|${def.id}`)
        }
      }
    }
  }

  calculateDamageEffects(skill: Skill, time: number): DamageEffectsResult {
    const castTag = castTagOf(skill)
    const tagSet = skillTagsOf(skill)
    const phase = this.qiPhase(time)
    const isDummy = !!this.params.isTrainingDummy
    const effects: { statKey: StatKey; amount: number }[] = []
    const breakdown: Record<string, number> = {}
    let forceCrit = false

    const pushMods = (mods: BuffStatMods | null | undefined, stacks: number, id: string) => {
      for (const e of statModsToEffects(mods)) {
        effects.push({ statKey: e.statKey, amount: e.amount * stacks })
        breakdown[id] = (breakdown[id] ?? 0) + e.amount * stacks
      }
    }

    for (const [id, def] of this.definitions) {
      if (id === "crosswindSpirit") continue
      const active = def.triggerOnBuffEnd
        ? this.isTriggerOnBuffEndActive(def, time)
        : this.isBuffActiveAtTime(id, time)
      if (!active) continue
      if (def.minTier && def.enabledParam && this.paramTier(def.enabledParam) < def.minTier)
        continue
      if (def.excludes && matchesAnyTag(tagSet, def.excludes)) continue

      const stacks = def.maxStacks ? this.getHistoricalBuffStacks(id, time) : 1

      let mods: BuffStatMods | null | undefined = def.statModifiers
      if (def.__statModByPrefix) {
        // Scope, so it goes through the same predicate as `affects` — the cast
        // tag alone cannot see a role tag, and the Receives card has always
        // resolved this against the tag set.
        const p = def.__statModByPrefix
        mods = matchesScope(tagSet, { affects: p.prefixes }) ? p.match : p.default
      }
      pushMods(mods, stacks, id)
      if (def.bossStatModifiers && !isDummy) pushMods(def.bossStatModifiers, stacks, id)
      if (def.tier6StatModifiers && def.enabledParam && this.paramTier(def.enabledParam) >= 6)
        pushMods(def.tier6StatModifiers, 1, id)

      if (def.forceCrit && this.bonusAffects(def, tagSet)) forceCrit = true
      if (def.forceCritIfHighCrit)
        this.warnings.add(`${id}: forceCritIfHighCrit not modeled (needs post-crit gate)`)

      if (!def.bonus) continue
      if (!this.bonusAffects(def, tagSet)) continue
      if (def.overriddenBy && this.isBuffActiveAtTime(def.overriddenBy, time)) continue
      if (
        def.phaseGate &&
        def.bonus.type === "bossOnlyBuffBonus" &&
        this.qiPhase(time) !== def.phaseGate
      )
        continue

      const b = def.bonus
      const tier6 = def.enabledParam ? this.paramTier(def.enabledParam) >= 6 : false
      let value: number
      if (b.valuePerStack !== undefined) value = b.valuePerStack * stacks
      else if (b.valueFromParam) value = this.paramNum(b.valueFromParam)
      else
        value =
          def.tier6Value !== undefined &&
          def.enabledParam &&
          this.paramOn(def.enabledParam) &&
          tier6
            ? def.tier6Value
            : (b.value ?? 0)
      if (b.phaseBonus) value += b.phaseBonus[phase] ?? 0
      if (value !== 0) {
        const statKey = BONUS_TYPE_TO_STATKEY[b.type]
        effects.push({ statKey, amount: value })
        breakdown[id] = (breakdown[id] ?? 0) + value
      }
    }

    for (const def of this.perCastConsumeDefs) {
      const pc = def.perCastConsume!
      if (!pc.bonus || !this.consumeEvents.has(`${time}|${castTag}|${def.id}`)) continue
      const value = pc.bonus.value ?? 0
      if (value === 0) continue
      const statKey = BONUS_TYPE_TO_STATKEY[pc.bonus.type]
      effects.push({ statKey, amount: value })
      breakdown[def.id] = (breakdown[def.id] ?? 0) + value
    }
    for (const def of this.stackPoolDefs) {
      const pool = def.consumableStackPool!
      if (!this.consumeEvents.has(`${time}|${castTag}|${def.id}`)) continue
      const value = pool.bonus.value ?? 0
      if (value === 0) continue
      const statKey = BONUS_TYPE_TO_STATKEY[pool.bonus.type]
      effects.push({ statKey, amount: value })
      breakdown[def.id] = (breakdown[def.id] ?? 0) + value
    }

    const mistwillow = this.mistwillowBonusValue(castTag, time, tagSet)
    if (mistwillow > 0) {
      effects.push({ statKey: "allDamageBoost", amount: mistwillow })
      breakdown.mistwillow = (breakdown.mistwillow ?? 0) + mistwillow
    }
    return { effects, forceCrit, breakdown }
  }

  private bonusAffects(def: BuffDef, tagSet: Set<string>): boolean {
    return matchesScope(tagSet, def)
  }
}
