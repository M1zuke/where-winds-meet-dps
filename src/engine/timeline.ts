import type {
  BuffWindow,
  EngineRunOptions,
  Inputs,
  OutcomeCounts,
  Result,
  RotationCast,
  SkillTickResult,
  TimelineEvent,
} from "./types"
import type { Buff, BuffStatEffect } from "./buff"
import type { Debuff } from "./debuff"
import type { HitTrigger, Skill, SkillHit, TriggerCondition } from "./skill"
import {
  breakdownNameOf,
  conditionSatisfiedByStacks,
  isPrePullSkill,
  hitDealsDamage,
  selectHitVariant,
  triggerConditions,
} from "./skill"
import { debuffBreakdownKey, debuffKey, skillBreakdownKey, skillKey } from "../i18n/contentKeys"
import { resolveRotation, type ResolvedStep } from "./rotation"
import { StatusLedger, UNOWNED, type StatusWindow } from "./ledger"
import { collectCastBuffs } from "./castBuffs"
import { prepareMechanics, type ContextPatch, type MechanicSetup } from "./mechanics"
import {
  dotRowName,
  dotTickDamage,
  dotTickSkill,
  planDotTicks,
  resolveTickDot,
  tickSourceSkillId,
  type DotTickPlan,
} from "./dot"
import {
  buildBehaviors,
  minPhysCritBonus,
  MIN_PHYS_CRIT_BONUS_SENTINEL,
  type BuildView,
  type HitContext,
  type HitInput,
} from "./behavior"
import { applyEffect, type EffectSink } from "./effects/apply"
import type { ArtBonusField } from "./effects/effect"
import { grantsMinPhysCritBoostFor } from "../definitions/classes/registry"
import { buildContext, effectiveRates } from "./panel"
import { computeSkillDamage, type HitOutcome, type RolledHit } from "./formula"
import { MECHANIC_STREAM_OFFSET, mulberry32 } from "./rng"
import { applyBuffEffects } from "./statRegistry"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./builtinLibrary"
import { builtinBuffsForClass } from "./builtinBuffs"
import { BuffEngine } from "./buffs/buffEngine"
import type { ConditionalFinalCrit } from "./buffs/buffModule"
import { PROP_TO_PROPERTY, type SkillProperties } from "./effects/context"
import { buffDefsForClass, groupBuffDefs } from "./buffs/data"
import { clockQiPhase, paramOnOf, paramTierOf, paramsFromInputs } from "./buffs/params"
import { castTagOf, WEAPON_TAG } from "./buffs/tags"
import { innerWayAllDamageBoost } from "./buffs/innerWayBonus"
import { innerWayTier } from "../definitions/innerWays/registry"
import { PROP } from "../data/skills/ids"

export const FPS = 60

const OUTCOME_KEYS: readonly HitOutcome[] = ["abrasion", "normal", "crit", "affinity"]

// Guards against a runaway cast-skill trigger chain.
const EVENT_CAP = 100_000

type Ctx = ReturnType<typeof buildContext>

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

interface HitEvent {
  frame: number
  seq: number
  skill: Skill
  hit: SkillHit
  // The frame the CAST started, which is what cast-scoped buff ids are keyed
  // by — not this hit's own frame, which may be well after it.
  castFrame: number
  stepStart: number
}

class EventQueue {
  private heap: HitEvent[] = []

  get size(): number {
    return this.heap.length
  }

  push(e: HitEvent): void {
    this.heap.push(e)
    let i = this.heap.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.less(this.heap[i], this.heap[parent])) {
        ;[this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]]
        i = parent
      } else break
    }
  }

  pop(): HitEvent | undefined {
    const n = this.heap.length
    if (n === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let smallest = i
        if (l < this.heap.length && this.less(this.heap[l], this.heap[smallest])) smallest = l
        if (r < this.heap.length && this.less(this.heap[r], this.heap[smallest])) smallest = r
        if (smallest === i) break
        ;[this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]]
        i = smallest
      }
    }
    return top
  }

  private less(a: HitEvent, b: HitEvent): boolean {
    return a.frame !== b.frame ? a.frame < b.frame : a.seq < b.seq
  }
}

export function simulateTimeline(inputs: Inputs, options?: EngineRunOptions): Result {
  const collectDetail = options?.collect !== "totals"
  const hitRng = options?.seed === undefined ? undefined : mulberry32(options.seed)
  const mechanicRng =
    options?.seed === undefined
      ? undefined
      : mulberry32((options.seed ^ MECHANIC_STREAM_OFFSET) | 0)
  const rotation = inputs.activeCustomRotation
  if (!rotation || rotation.classId !== inputs.classId) {
    return emptyResult(["Timeline rotation not available for this class."])
  }

  const skillsMap = new Map<string, Skill>()
  for (const s of builtinSkillsForClass(inputs.classId)) skillsMap.set(s.id, s)
  for (const s of inputs.customSkills ?? []) skillsMap.set(s.id, s)
  const skills = [...skillsMap.values()]
  const buffParams = paramsFromInputs(inputs, rotation.qiBreak)
  const buffsMap = new Map<string, Buff>()
  for (const b of builtinBuffsForClass(inputs.classId)) buffsMap.set(b.id, b)
  for (const b of inputs.customBuffs ?? []) buffsMap.set(b.id, b)
  const buffs = [...buffsMap.values()].filter(
    (b) =>
      !b.requiresParam ||
      (paramOnOf(buffParams, b.requiresParam) &&
        paramTierOf(buffParams, b.requiresParam) >= (b.requiresMinTier ?? 0)),
  )
  const debuffsMap = new Map<string, Debuff>()
  for (const d of builtinDebuffsForClass(inputs.classId)) debuffsMap.set(d.id, d)
  for (const d of inputs.customDebuffs ?? []) debuffsMap.set(d.id, d)
  const debuffs = [...debuffsMap.values()]
  const skillsById = new Map(skills.map((s) => [s.id, s] as const))
  const statusById = new Map<string, Buff | Debuff>()
  for (const b of buffs) statusById.set(b.id, b)
  for (const d of debuffs) statusById.set(d.id, d)
  const isDebuffStatus = (s: Buff | Debuff): s is Debuff => "dot" in s

  const { steps: resolvedSteps, warnings: rotationWarnings } = resolveRotation(rotation, skills, [
    ...buffs,
    ...debuffs,
  ])
  const warnings: string[] = [...rotationWarnings]

  interface LaidStep {
    resolved: ResolvedStep
    prePull: boolean
    startFrame: number
    castLen: number
    performedHits: SkillHit[]
  }

  const openingBuffsById = new Map(buffs.map((b) => [b.id, b] as const))
  const openingStatusIds = new Set(Object.keys(rotation.openingStacks ?? {}))
  for (const b of buffs) if (b.defaultOpeningStacks !== undefined) openingStatusIds.add(b.id)
  const openingStacksOf = (id: string): number =>
    rotation.openingStacks?.[id] ?? openingBuffsById.get(id)?.defaultOpeningStacks ?? 0

  interface StatusWriter {
    openPermanent(id: string): void
    processExpiries(upToFrame: number): void
    onDamagingHit(frame: number, owner: number): void
    fires(trigger: HitTrigger, frame: number): boolean
    applyTrigger(trigger: HitTrigger, frame: number, owner: number): void
    seedStack(status: Buff | Debuff, frame: number, stacks: number): void
  }

  function triggerGate(
    holds: (condition: TriggerCondition, frame: number) => boolean,
  ): (trigger: HitTrigger, frame: number) => boolean {
    const lastFiredFrame = new Map<HitTrigger, number>()
    return (trigger, frame) => {
      if (!triggerConditions(trigger).every((condition) => holds(condition, frame))) return false
      if (trigger.phase !== undefined && clockQiPhase(buffParams, frame / FPS) !== trigger.phase)
        return false
      if (trigger.cooldownFrames === undefined) return true
      const lastFired = lastFiredFrame.get(trigger)
      if (lastFired !== undefined && frame - lastFired < trigger.cooldownFrames) return false
      lastFiredFrame.set(trigger, frame)
      return true
    }
  }

  function statusWriter(
    target: StatusLedger,
    holds: (condition: TriggerCondition, frame: number) => boolean,
  ): StatusWriter {
    const fires = triggerGate(holds)
    const expiring = buffs.filter((b) => b.onExpire && b.activation !== "permanent")
    const stackingOnDamage = buffs.filter((b) => b.stacksPerDamagingHit)
    const expired = new WeakSet<StatusWindow>()
    const lastDamageStackFrame = new Map<string, number>()

    const capOf = (status: Buff | Debuff): number => Math.max(1, status.maxStacks)

    const openWindow = (status: Buff | Debuff, frame: number, owner: number): void => {
      if (status.activation === "permanent") target.openPermanent(status.id)
      else target.pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames), owner)
    }

    const write = (
      status: Buff | Debuff,
      frame: number,
      next: number,
      owner: number,
      timedWindow: boolean,
      fireMaxStacks: boolean,
    ): void => {
      const before = target.stacksAt(status.id, frame)
      target.recordStack(status.id, frame, next, owner)
      if (timedWindow || status.activation === "permanent") openWindow(status, frame, owner)
      if (!fireMaxStacks || isDebuffStatus(status) || !status.onMaxStacks) return
      if (before >= capOf(status) || next < capOf(status)) return
      for (const trigger of status.onMaxStacks) applyTrigger(trigger, frame, owner, false)
    }

    const grant = (
      status: Buff | Debuff,
      frame: number,
      stacks: number,
      owner: number,
      fireMaxStacks: boolean,
    ): void => {
      const next = clamp(target.stacksAt(status.id, frame) + stacks, 0, capOf(status))
      write(status, frame, next, owner, true, fireMaxStacks)
    }

    function applyTrigger(
      trigger: HitTrigger,
      frame: number,
      owner: number,
      fireMaxStacks: boolean,
    ): void {
      if (trigger.kind !== "applyBuff" && trigger.kind !== "applyDebuff") return
      if (!fires(trigger, frame)) return
      const status = statusById.get(trigger.targetId)
      if (!status) return
      if (trigger.transferFrom !== undefined) {
        const source = statusById.get(trigger.transferFrom)
        if (!source) return
        const moved = target.conditionStacksAt(source.id, frame)
        target.recordStack(source.id, frame, 0, owner)
        grant(status, frame, moved, owner, fireMaxStacks)
        return
      }
      if (trigger.extendFrames != null) {
        const activeWindow = target.longestActiveWindow(status.id, frame)
        if (activeWindow) {
          const cap = trigger.maxExtendedDurationFrames
          const rawEnd = activeWindow.end + trigger.extendFrames
          const nextEnd = cap ? Math.max(activeWindow.end, Math.min(rawEnd, frame + cap)) : rawEnd
          const applied = nextEnd - activeWindow.end
          activeWindow.end = nextEnd
          if (applied > 0) (activeWindow.extensions ??= []).push({ frame, amount: applied })
        } else if (!trigger.extendOnly) grant(status, frame, trigger.stacks, owner, fireMaxStacks)
        return
      }
      grant(status, frame, trigger.stacks, owner, fireMaxStacks)
    }

    return {
      openPermanent: (id) => target.openPermanent(id),
      processExpiries(upToFrame) {
        for (const status of expiring) {
          const windows = target.windowsOf(status.id)
          const lapsed = windows
            .filter((window) => !expired.has(window) && window.end <= upToFrame)
            .sort((left, right) => left.end - right.end)
          for (const window of lapsed) {
            expired.add(window)
            const refreshed = windows.some(
              (other) => other !== window && other.start <= window.end && window.end < other.end,
            )
            if (refreshed) continue
            const reset = status.onExpire!
            const resetTarget = statusById.get(reset.targetId)
            if (!resetTarget) continue
            const next = clamp(reset.stacks, 0, capOf(resetTarget))
            write(resetTarget, window.end, next, UNOWNED, false, true)
          }
        }
      },
      onDamagingHit(frame, owner) {
        for (const status of stackingOnDamage) {
          const last = lastDamageStackFrame.get(status.id)
          if (last !== undefined && frame - last < status.stacksPerDamagingHit!.cooldownFrames)
            continue
          lastDamageStackFrame.set(status.id, frame)
          grant(status, frame, 1, owner, true)
        }
      },
      fires,
      applyTrigger: (trigger, frame, owner) => applyTrigger(trigger, frame, owner, true),
      seedStack(status, frame, stacks) {
        target.openPermanent(status.id)
        write(status, frame, Math.min(stacks, status.maxStacks), UNOWNED, false, true)
      },
    }
  }

  const seedOpeningState = (writer: StatusWriter, atFrame: number): void => {
    for (const id of rotation.permanentBuffIds) if (statusById.has(id)) writer.openPermanent(id)
    for (const id of openingStatusIds) {
      const status = statusById.get(id)
      if (!status) continue
      const stacks = openingStacksOf(id)
      if (stacks <= 0) continue
      writer.seedStack(status, atFrame, stacks)
    }
  }

  // The largest cast length any of a step's hit variants could select.
  function upperBoundCastFrames(rs: ResolvedStep): number {
    const hitCount = clamp(rs.step.hitCount, 0, rs.skill.hits.length)
    const performedHits = rs.skill.hits.slice(0, hitCount)
    const naturalMaxFrame =
      performedHits.length > 0 ? Math.max(...performedHits.map((h) => h.frame)) : -1
    let bound = rs.skill.castFrames || naturalMaxFrame + 1
    for (const skillHit of performedHits) {
      for (const variant of skillHit.variants ?? []) {
        if (variant.castFrames !== undefined && variant.castFrames > 0)
          bound = Math.max(bound, variant.castFrames)
      }
    }
    return bound
  }

  // A cast's length can't be resolved from the live status ledger, because
  // that ledger needs every cast's length to size itself first. This
  // throwaway ledger breaks the cycle: sized against the worst case up front,
  // then filled incrementally as each step is laid out, so a later step's
  // conditions see every earlier step's triggers but never its own. Prepull
  // casts take the upper bound as their real length outright — none
  // currently gate a hit or a variant's cast length on a condition.
  const prePullBound = resolvedSteps.reduce(
    (sum, rs) => (isPrePullSkill(rs.skill) ? sum + upperBoundCastFrames(rs) : sum),
    0,
  )
  const activeUpperBound = resolvedSteps.reduce(
    (sum, rs) => (isPrePullSkill(rs.skill) ? sum : sum + upperBoundCastFrames(rs)),
    0,
  )
  const layoutLedger = new StatusLedger(Math.min(0, -prePullBound), activeUpperBound)
  const layoutHolds = (condition: TriggerCondition, frame: number): boolean =>
    conditionSatisfiedByStacks(condition, layoutLedger.conditionStacksAt(condition.buffId, frame))
  const layoutWriter = statusWriter(layoutLedger, layoutHolds)
  seedOpeningState(layoutWriter, Math.min(0, -prePullBound))

  const activeVariantCastFrames = (
    hits: readonly SkillHit[],
    holds: (condition: TriggerCondition) => boolean,
  ): number | null => {
    for (const skillHit of hits) {
      const variant = selectHitVariant(skillHit, holds)
      if (variant?.castFrames !== undefined && variant.castFrames > 0) return variant.castFrames
    }
    return null
  }

  // `castSkill` and a DoT's detonation are skipped here and left to the real
  // event loop below — chasing a generated sub-cast would need the buff
  // engine, which itself can only be built once the whole layout is known.
  function seedStepTriggers(hits: readonly SkillHit[], stepStart: number): void {
    for (const skillHit of hits) {
      const hitFrame = stepStart + skillHit.frame
      layoutWriter.processExpiries(hitFrame)
      if (hitDealsDamage(skillHit)) layoutWriter.onDamagingHit(hitFrame, stepStart)
      for (const trigger of skillHit.triggers) {
        if (trigger.kind === "castSkill" || trigger.kind === "detonateDot") continue
        if (trigger.kind === "applyDot") {
          if (!layoutWriter.fires(trigger, hitFrame)) continue
          const status = statusById.get(trigger.targetId)
          if (!status || !isDebuffStatus(status)) continue
          const maxStacks = Math.max(1, status.maxStacks)
          const next = clamp(layoutLedger.stacksAt(status.id, hitFrame) + 1, 0, maxStacks)
          layoutLedger.recordStack(status.id, hitFrame, next, stepStart)
          if (status.activation === "permanent") layoutLedger.openPermanent(status.id)
          else
            layoutLedger.pushWindow(
              status.id,
              hitFrame,
              hitFrame + Math.max(1, status.durationFrames),
              stepStart,
            )
          continue
        }
        layoutWriter.applyTrigger(trigger, hitFrame, stepStart)
      }
    }
  }

  const laidSteps: LaidStep[] = []
  let activeCursor = 0
  let preCursor = -prePullBound
  for (const rs of resolvedSteps) {
    const prePull = isPrePullSkill(rs.skill)
    const startFrame = prePull ? preCursor : activeCursor
    layoutWriter.processExpiries(startFrame)
    const holdsHere = (condition: TriggerCondition) => layoutHolds(condition, startFrame)
    const hitCount = clamp(rs.step.hitCount, 0, rs.skill.hits.length)
    const performedHits = rs.skill.hits.slice(0, hitCount)
    const occurringHits = performedHits.filter((h) => (h.conditions ?? []).every(holdsHere))
    const castLen = prePull
      ? upperBoundCastFrames(rs)
      : (() => {
          const maxFrame =
            occurringHits.length > 0 ? Math.max(...occurringHits.map((h) => h.frame)) : -1
          return (
            activeVariantCastFrames(occurringHits, holdsHere) ??
            (rs.skill.castFrames || maxFrame + 1)
          )
        })()
    if (prePull) preCursor += castLen
    else activeCursor += castLen
    seedStepTriggers(occurringHits, startFrame)
    laidSteps.push({ resolved: rs, prePull, startFrame, castLen, performedHits: occurringHits })
  }
  const durationFrames = activeCursor
  const spanStart = Math.min(0, -prePullBound)
  const rotationDurationSec = durationFrames / FPS

  const damagingHitTimesSec: number[] = []
  const weaponHitTimesSec: number[] = []
  for (const ls of laidSteps) {
    for (const hit of ls.performedHits) {
      if (!hitDealsDamage(hit)) continue
      const timeSec = (ls.startFrame + hit.frame) / FPS
      damagingHitTimesSec.push(timeSec)
      if (ls.resolved.skill.skillType === "weapon") weaponHitTimesSec.push(timeSec)
    }
  }
  damagingHitTimesSec.sort((a, b) => a - b)
  weaponHitTimesSec.sort((a, b) => a - b)

  const inWindow = (frame: number): boolean => frame <= durationFrames

  const castCounts = new Map<string, number>()
  for (const ls of laidSteps) {
    const name = ls.resolved.skill.name
    castCounts.set(name, (castCounts.get(name) ?? 0) + 1)
  }

  const ledger = new StatusLedger(spanStart, durationFrames)
  const recordStack = (id: string, frame: number, value: number, owner = UNOWNED) =>
    ledger.recordStack(id, frame, value, owner)
  const stacksAt = (id: string, frame: number) => ledger.stacksAt(id, frame)
  const pushWindow = (id: string, start: number, end: number, owner = UNOWNED) =>
    ledger.pushWindow(id, start, end, owner)
  const openPermanent = (id: string) => ledger.openPermanent(id)
  const conditionHolds = (c: TriggerCondition, frame: number): boolean =>
    conditionSatisfiedByStacks(c, ledger.conditionStacksAt(c.buffId, frame))
  const liveWriter = statusWriter(ledger, conditionHolds)
  seedOpeningState(liveWriter, spanStart)

  function activeBuffsAt(frame: number): (Buff | Debuff)[] {
    const out: (Buff | Debuff)[] = []
    for (const id of ledger.activeIdsAt(frame)) {
      const status = statusById.get(id)
      if (status) out.push(status)
    }
    return out
  }

  const buildView: BuildView = {
    classId: inputs.classId,
    innerWayTier: (innerWayId) => innerWayTier(inputs.mindMethods, innerWayId),
    classSpecificAttunement: (attunementId) => inputs.classSpecificAttunement[attunementId] ?? 0,
    grantsMinPhysCritBoost: grantsMinPhysCritBoostFor(inputs.classId),
    openingStacks: openingStacksOf,
  }

  const behaviorFor = buildBehaviors(buildView)

  const hitInputAt = (skill: Skill, hit: SkillHit, frame: number): HitInput => ({
    skill,
    hit,
    frame,
    statuses: ledger,
    build: buildView,
    holds: (condition) => conditionHolds(condition, frame),
  })

  const propsOfSkill = (skill: Skill, hitCount = skill.hits.length): SkillProperties => {
    const props: SkillProperties = { hitCount, castTime: (skill.castFrames || 1) / FPS }
    for (const tag of skill.tags ?? []) {
      const propertyKey = PROP_TO_PROPERTY[tag as (typeof PROP)[keyof typeof PROP]]
      if (propertyKey) props[propertyKey] = true
      else if (tag.startsWith("attack:"))
        props.attackType = tag.slice(7) as SkillProperties["attackType"]
    }
    return props
  }

  // Ids that count as active for one cast only, keyed by the cast that earned
  // them — a per-cast consume never opens a timed window, so nothing in the
  // buff history can carry it.
  const castScopedBuffs = new Map<string, string[]>()
  const castScopedKey = (frame: number, skillId: string) => `${frame}|${skillId}`

  interface PendingCast {
    frame: number
    sequence: number
    skill: Skill
    hitCount: number
    generated: boolean
    inheritedBuffIds: readonly string[]
  }

  // The prepass. It walks the whole cast graph — the rotation's casts and every
  // cast they generate — in frame order, so the buff history and the consume
  // ledger are both complete before the damage loop asks anything of them.
  const buffEngine: BuffEngine | null = (() => {
    try {
      const engine = new BuffEngine(buffParams, buffDefsForClass(inputs.classId), groupBuffDefs())
      engine.attachStatuses({ view: ledger, fps: FPS })
      const castTriggerFires = triggerGate(conditionHolds)
      let sequence = 0
      const pending: PendingCast[] = laidSteps.map((ls) => ({
        frame: ls.startFrame,
        sequence: sequence++,
        skill: ls.resolved.skill,
        hitCount: ls.performedHits.length,
        generated: false,
        inheritedBuffIds: [],
      }))
      const damageHits: { frame: number; skill: Skill }[] = []

      let processed = 0
      while (pending.length > 0 && processed < EVENT_CAP) {
        pending.sort((left, right) => left.frame - right.frame || left.sequence - right.sequence)
        const cast = pending.shift()!
        processed++
        const castTag = castTagOf(cast.skill)
        let propagated = [...cast.inheritedBuffIds]
        if (castTag) {
          const result = engine.processSkillCast(
            castTag,
            cast.frame / FPS,
            propsOfSkill(cast.skill, cast.hitCount),
            cast.generated,
            cast.skill.triggersBuffs ?? [],
          )
          const scoped = [...new Set([...cast.inheritedBuffIds, ...result.buffIds])]
          propagated = [...new Set([...propagated, ...result.propagatedBuffIds])]
          const key = castScopedKey(cast.frame, cast.skill.id)
          castScopedBuffs.set(key, [...new Set([...(castScopedBuffs.get(key) ?? []), ...scoped])])
        }
        for (const hit of cast.skill.hits) {
          const hitFrame = cast.frame + hit.frame
          if (hitDealsDamage(hit)) damageHits.push({ frame: hitFrame, skill: cast.skill })
          for (const trigger of hit.triggers) {
            if (trigger.kind !== "castSkill") continue
            if (!castTriggerFires(trigger, hitFrame)) continue
            const generatedSkill = skillsById.get(trigger.targetId)
            if (!generatedSkill) continue
            pending.push({
              frame: hitFrame,
              sequence: sequence++,
              skill: generatedSkill,
              hitCount: generatedSkill.hits.length,
              generated: true,
              inheritedBuffIds: propagated,
            })
          }
        }
      }

      damageHits.sort((left, right) => left.frame - right.frame)
      for (const { frame, skill } of damageHits) engine.processDamageHit(frame / FPS, skill)
      return engine
    } catch {
      return null
    }
  })()

  const qiBreakWindow = buffEngine
    ? (() => {
        const w = buffEngine.qiBreakWindow()
        return { startSec: w.start, endSec: w.end }
      })()
    : null

  const lowQiWindow = buffEngine
    ? (() => {
        const w = buffEngine.lowQiWindow()
        return w ? { startSec: w.start, endSec: w.end } : null
      })()
    : null

  const { precision, critRate, affinityRate } = effectiveRates(inputs)
  const mechanicSetup: MechanicSetup = {
    inputs,
    classId: inputs.classId,
    fps: FPS,
    rotationDurationSec,
    hitTimesSec: damagingHitTimesSec,
    weaponHitTimesSec,
    qiPhaseAt: (timeSec) => buffEngine?.qiPhase(timeSec) ?? "normal",
    paramOn: (name) => buffEngine?.paramOn(name) ?? false,
    paramTier: (name) => buffEngine?.paramTier(name) ?? 0,
    hasBuffEngine: !!buffEngine,
    effectiveRates: { precision, critRate, affinityRate },
    rng: mechanicRng,
  }
  const mechanics = prepareMechanics(mechanicSetup)

  interface Resolved {
    inputs: Inputs
    ctx: Ctx
  }
  interface ResolveOverride {
    extraEffects?: BuffStatEffect[]
    forceGuaranteedAffinity?: boolean
  }
  const stateMemo = new Map<string, Resolved>()
  function resolveState(
    frame: number,
    skill?: Skill,
    override?: ResolveOverride,
    castFrame = frame,
  ): Resolved & {
    forceCrit: boolean
    damageFactor: number
    conditionalFinalCrit: ConditionalFinalCrit | null
    artBonuses: Partial<Record<ArtBonusField, number>>
  } {
    const active = activeBuffsAt(frame)
    const sigParts: string[] = []
    const effects: BuffStatEffect[] = []
    for (const b of active) {
      const perStack = (b.stackScaling ?? "flat") === "perStack"
      const count = perStack ? Math.max(0, stacksAt(b.id, frame)) : 1
      sigParts.push(`${b.id}:${count}`)
      if (perStack) {
        for (const e of b.effects) effects.push({ statKey: e.statKey, amount: e.amount * count })
      } else {
        effects.push(...b.effects)
      }
    }
    let sig = sigParts.sort().join("|")
    let forceCritFromBuff = false
    let damageFactor = 1
    let conditionalFinalCrit: ConditionalFinalCrit | null = null
    let artBonuses: Partial<Record<ArtBonusField, number>> = {}
    if (buffEngine && skill) {
      const scoped = castScopedBuffs.get(castScopedKey(castFrame, skill.id)) ?? []
      const site = buffEngine.calculateDamageEffects(skill, frame / FPS, scoped)
      if (site.effects.length > 0) {
        for (const e of site.effects) effects.push(e)
        sig +=
          `#${skill.id}#` +
          site.effects
            .map((e) => `${e.statKey}:${e.amount}`)
            .sort()
            .join(",")
      }
      if (site.forceCrit) forceCritFromBuff = true
      damageFactor = site.damageFactor
      conditionalFinalCrit = site.conditionalFinalCrit
      artBonuses = site.artBonuses
      for (const [field, amount] of Object.entries(artBonuses)) sig += `~${field}:${amount}`
      if (damageFactor !== 1) sig += `~x${damageFactor}`
      if (conditionalFinalCrit)
        sig += `~cfc${conditionalFinalCrit.threshold}:${conditionalFinalCrit.bonusBelowThreshold}`
    }
    if (override?.extraEffects && override.extraEffects.length > 0) {
      for (const e of override.extraEffects) effects.push(e)
      sig +=
        "~" +
        override.extraEffects
          .map((e) => `${e.statKey}:${e.amount}`)
          .sort()
          .join(",")
    }
    if (override?.forceGuaranteedAffinity) sig += "~forcedAffinity"
    let contextPatch: ContextPatch = {}
    for (const { mechanic, state } of mechanics) {
      const contribution = mechanic.contributeAt?.(state, frame, skill, mechanicSetup)
      if (!contribution) continue
      for (const effect of contribution.effects ?? []) effects.push(effect)
      if (contribution.context) contextPatch = { ...contextPatch, ...contribution.context }
      sig +=
        "~" +
        mechanic.id +
        ":" +
        (contribution.effects ?? []).map((e) => e.statKey + "=" + e.amount).join(",") +
        (contribution.context
          ? "|" +
            Object.entries(contribution.context)
              .map(([k, v]) => k + "=" + v)
              .join(",")
          : "")
    }
    const combat = inputs.combatSettings
    if (combat?.revelryScript) {
      effects.push({ statKey: "allDamageBoost", amount: 0.3 })
      sig += "~revelryScript"
    }
    if (buffEngine) {
      const qiPhaseHere = buffEngine.qiPhase(frame / FPS)
      if (qiPhaseHere === "exhausted") {
        effects.push({ statKey: "allDamageBoost", amount: 0.1 })
        sig += "~qiBreakBoost"
      }
      if (combat?.healerBuff) {
        const healerAmount = 0.2 + (qiPhaseHere === "exhausted" ? 0.05 : 0)
        effects.push({ statKey: "allDamageBoost", amount: healerAmount })
        sig += `~healerBuff:${healerAmount}`
      }
      const innerWayBonus = innerWayAllDamageBoost(inputs.mindMethods)
      if (innerWayBonus !== 0) {
        effects.push({ statKey: "allDamageBoost", amount: innerWayBonus })
        sig += `~innerWay:${innerWayBonus}`
      }
    }
    let r = stateMemo.get(sig)
    if (!r) {
      const { inputs: effInputs, targetOverride } = applyBuffEffects(inputs, effects)
      const ctx = buildContext(
        effInputs,
        targetOverride,
        contextPatch.hawkwingPhysBonus,
        contextPatch.dotDamageMultiplier,
      )
      if (override?.forceGuaranteedAffinity) {
        ctx.affinityPanel = 0
        ctx.directAffinityPanel = 1
      }
      r = { inputs: effInputs, ctx }
      stateMemo.set(sig, r)
    }
    return { ...r, forceCrit: forceCritFromBuff, damageFactor, conditionalFinalCrit, artBonuses }
  }

  const queue = new EventQueue()
  let seq = 0
  for (const ls of laidSteps) {
    for (const hit of ls.performedHits) {
      queue.push({
        frame: ls.startFrame + hit.frame,
        seq: seq++,
        skill: ls.resolved.skill,
        hit,
        castFrame: ls.startFrame,
        stepStart: ls.startFrame,
      })
    }
  }

  const skillBreakdownRowKey = (skill: Skill): string =>
    skill.breakdownName ? skillBreakdownKey(skill) : skillKey(skill)

  const byName = new Map<
    string,
    { breakdownName: string; breakdownKey: string; type: string; count: number; damage: number }
  >()
  function add(
    name: string,
    type: string,
    count: number,
    damage: number,
    breakdownName: string,
    breakdownKey: string,
  ): void {
    if (!collectDetail) return
    const tallied = byName.get(name)
    if (tallied) {
      tallied.count += count
      tallied.damage += damage
    } else byName.set(name, { breakdownName, breakdownKey, type, count, damage })
  }

  const timeline: TimelineEvent[] = []
  const pushEvent = (event: TimelineEvent): void => {
    if (collectDetail) timeline.push(event)
  }

  let totalDamage = 0
  const outcomeTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
  const expectedShareTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
  const tallyRoll = (rolled: RolledHit): void => {
    outcomeTally[rolled.outcome] += 1
    for (const outcome of OUTCOME_KEYS) expectedShareTally[outcome] += rolled.chance[outcome]
  }
  let processed = 0
  while (queue.size > 0) {
    if (processed >= EVENT_CAP) {
      warnings.push(
        `Timeline exceeded ${EVENT_CAP} events — a trigger chain may be unbounded; simulation was truncated.`,
      )
      break
    }
    const ev = queue.pop()!
    processed++
    const { frame, skill, hit, castFrame, stepStart } = ev
    liveWriter.processExpiries(frame)

    const behavior = behaviorFor(skill)
    const hitInput = hitInputAt(skill, hit, frame)
    const extraEffects: BuffStatEffect[] = []
    let forceGuaranteedAffinity = false
    // `onHit`/`claimStatEffects` run BEFORE the formula context is built, so
    // only the effect kinds that can change that context are live here.
    const hitSink: EffectSink = {
      stat: (statKey, amount) => extraEffects.push({ statKey, amount }),
      forceOutcome: (outcome) => {
        if (outcome === "affinity") forceGuaranteedAffinity = true
      },
      setStatus: (id, stacks, permanent, durationFrames) => {
        const status = statusById.get(id)
        if (!status) return
        if (permanent) openPermanent(status.id)
        else
          pushWindow(
            status.id,
            frame,
            frame + Math.max(1, durationFrames ?? status.durationFrames),
            stepStart,
          )
        if (stacks !== undefined) recordStack(status.id, frame, stacks, stepStart)
      },
      applyBuff: () => {},
      consumeStacks: () => {},
      artBonus: () => {},
      damageMultiplier: () => {},
    }
    for (const effect of behavior.onHit?.(hitInput) ?? []) applyEffect(hitSink, effect)
    const qiPhase = buffEngine?.qiPhase(frame / FPS) ?? "normal"
    for (const effect of behavior.claimStatEffects(hitInput, qiPhase)) applyEffect(hitSink, effect)
    const resolveOverride: ResolveOverride | undefined =
      extraEffects.length > 0 || forceGuaranteedAffinity
        ? { extraEffects, forceGuaranteedAffinity }
        : undefined
    const st = resolveState(frame, skill, resolveOverride, castFrame)
    const hitContext: HitContext = {
      phase: qiPhase,
      smallPhys: st.ctx.smallPhys,
      isEngineBuffActive: (id) => buffEngine?.isBuffActiveAtTime(id, frame / FPS) ?? false,
    }
    const art = behavior.buildArt(hitInput, hitContext)
    if (st.forceCrit) art.guaranteedCrit = 1
    // `patchArt` runs AFTER the formula context is built and may read it.
    const artSink: EffectSink = {
      stat: () => {},
      forceOutcome: () => {},
      applyBuff: () => {},
      consumeStacks: () => {},
      setStatus: () => {},
      artBonus: (field, amount) => {
        art[field] = (art[field] ?? 0) + amount
      },
      damageMultiplier: (factor) => {
        art.correction = (art.correction ?? 1) * factor
      },
    }
    for (const effect of behavior.patchArt(hitInput, hitContext)) applyEffect(artSink, effect)
    for (const [field, amount] of Object.entries(st.artBonuses)) {
      const key = field as ArtBonusField
      art[key] = (art[key] ?? 0) + amount
    }
    if (st.damageFactor !== 1) art.correction = (art.correction ?? 1) * st.damageFactor
    if (st.conditionalFinalCrit) art.conditionalFinalCrit = st.conditionalFinalCrit
    const { expectedDamage, rolled } = computeSkillDamage(art, st.ctx, 1, hitRng)
    const damage = rolled?.damage ?? expectedDamage
    const hitInWindow = inWindow(frame)
    if (hitInWindow) {
      totalDamage += damage
      if (rolled) tallyRoll(rolled)
      add(
        skill.name,
        skill.skillType,
        1,
        damage,
        breakdownNameOf(skill.breakdownName, skill.name),
        skillBreakdownRowKey(skill),
      )
    }
    pushEvent({
      frame,
      timeSec: frame / FPS,
      skillName: skill.name,
      type: skill.skillType,
      kind: "hit",
      damage,
      inWindow: hitInWindow,
    })

    if (hitDealsDamage(hit)) liveWriter.onDamagingHit(frame, stepStart)
    for (const trigger of hit.triggers) {
      if (trigger.kind === "detonateDot") continue
      if (trigger.kind === "applyBuff" || trigger.kind === "applyDebuff") {
        liveWriter.applyTrigger(trigger, frame, stepStart)
        continue
      }
      if (!liveWriter.fires(trigger, frame)) continue
      if (trigger.kind === "applyDot") {
        const status = statusById.get(trigger.targetId)
        if (!status || !isDebuffStatus(status)) continue
        const maxStacks = Math.max(1, status.maxStacks)
        const next = clamp(stacksAt(status.id, frame) + 1, 0, maxStacks)
        recordStack(status.id, frame, next, stepStart)
        if (status.activation === "permanent") openPermanent(status.id)
        else pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames), stepStart)
        const det = status.detonation ?? null
        const flagged =
          det &&
          hit.triggers.some((t) => t.kind === "detonateDot" && t.targetId === trigger.targetId)
        if (flagged && next >= maxStacks) {
          const retained =
            det.retainParam &&
            buffEngine &&
            buffEngine.paramTier(det.retainParam) >= (det.retainMinTier ?? 6)
              ? (det.retainParamStacks ?? det.retainStacks ?? 0)
              : (det.retainStacks ?? 0)
          recordStack(status.id, frame, clamp(retained, 0, maxStacks), stepStart)
          const sub = skillsById.get(det.skillId)
          if (sub)
            for (const subHit of sub.hits) {
              queue.push({
                frame: frame + subHit.frame,
                seq: seq++,
                skill: sub,
                hit: subHit,
                castFrame: frame,
                stepStart,
              })
            }
        }
        continue
      }
      const sub = skillsById.get(trigger.targetId)
      if (!sub) continue
      for (const subHit of sub.hits) {
        queue.push({
          frame: frame + subHit.frame,
          seq: seq++,
          skill: sub,
          hit: subHit,
          castFrame: frame,
          stepStart,
        })
      }
    }
  }

  liveWriter.processExpiries(durationFrames)

  // Zenith extension events only exist for a Sword Horizon build (the only
  // build whose crosswind tracker pushes ZENITH_DETONATION_BUFF_ID windows),
  // so this list is empty for every other build without a class check.
  for (const { mechanic, state } of mechanics) {
    mechanic.seedStatuses?.(
      state,
      {
        ledger,
        hasStatus: (id) => statusById.has(id),
        statusDurationFrames: (id) => statusById.get(id)?.durationFrames ?? null,
      },
      mechanicSetup,
    )
  }

  ledger.sortWindows()

  function buildCasts(): RotationCast[] {
    const castsUnsorted: RotationCast[] = laidSteps.map((ls, i) => {
      const lastHitFrame =
        ls.performedHits.length > 0 ? Math.max(...ls.performedHits.map((h) => h.frame)) : 0
      const queryFrame = Math.max(
        ls.startFrame,
        ls.startFrame + ls.castLen - 1,
        ls.startFrame + lastHitFrame,
      )
      const queryTimeSec = queryFrame / FPS
      const { buffs, seen: seenBuffIds } = collectCastBuffs({
        frame: queryFrame,
        timeSec: queryTimeSec,
        fps: FPS,
        ledger: ledger.throughOwner(ls.startFrame),
        statusById,
        buffEngine,
        // Below the display threshold there's a real chance no poison has
        // procced yet at all (e.g. right after the very first eligible hits),
        // so the expected-remaining number alone would understate that and
        // read as an oddly short "duration" — withhold it until more likely
        // than not to be up, same convention as Concentration's own gate.
        overrideRemainingSec: (id, timeSec) => {
          for (const { mechanic, state } of mechanics) {
            const override = mechanic.remainingSecAt?.(state, id, timeSec)
            if (override) return override
          }
          return null
        },
      })
      for (const { mechanic, state } of mechanics) {
        for (const chip of mechanic.display?.(state, queryTimeSec, ls.prePull, mechanicSetup) ??
          []) {
          if (seenBuffIds.has(chip.id)) continue
          seenBuffIds.add(chip.id)
          buffs.push(chip)
        }
      }

      return {
        index: 0,
        stepId: ls.resolved.step.id,
        stepIndex: i,
        skillName: ls.resolved.skill.name,
        timeSec: ls.startFrame / FPS,
        inWindow: inWindow(ls.startFrame),
        prePull: ls.prePull,
        buffs,
      }
    })
    castsUnsorted.sort((a, b) => a.timeSec - b.timeSec)
    return castsUnsorted.map((c, i) => ({ ...c, index: i + 1 }))
  }

  function buildBuffWindows(): BuffWindow[] {
    const windows: BuffWindow[] = []
    for (const [id, arr] of ledger.entries()) {
      const status = statusById.get(id)
      if (!status) continue
      for (const w of arr) {
        windows.push({ id, name: status.name, startSec: w.start / FPS, endSec: w.end / FPS })
      }
    }
    return windows
  }

  interface DotTickEntry extends DotTickPlan {
    seq: number
    debuff: Debuff
    debuffForTick: Debuff
    dotSkill: Skill
    dotName: string
    dotBreakdownName: string
    dotBreakdownKey: string
    dotType: string
  }

  const dotTickEntries: DotTickEntry[] = []
  let dotTickSeq = 0
  for (const [buffId, arr] of ledger.entries()) {
    const status = statusById.get(buffId)
    if (!status || !isDebuffStatus(status) || !status.dot || status.dot.tickIntervalFrames <= 0)
      continue
    const tickSkill = skillsById.get(tickSourceSkillId(status) ?? "")
    const dot = resolveTickDot(status, tickSkill)
    if (!dot) continue
    const dotSkill = dotTickSkill(status, tickSkill)
    const debuffForTick: Debuff = { ...status, dot }
    const dotName = dotRowName(status)
    const dotBreakdownName = breakdownNameOf(status.breakdownName, status.name)
    const dotBreakdownKey = status.breakdownName
      ? debuffBreakdownKey(status.id)
      : debuffKey(status.id)
    const dotType = dot.skillType || "sustain"

    for (const plan of planDotTicks({
      debuff: status,
      dot,
      windows: arr,
      stacksAt: (frame) => stacksAt(buffId, frame),
      inWindow,
      weightAt: (frame) => {
        for (const { mechanic, state } of mechanics) {
          const weight = mechanic.tickWeightAt?.(state, buffId, frame, mechanicSetup)
          if (weight !== null && weight !== undefined) return weight
        }
        return 1
      },
    })) {
      dotTickEntries.push({
        ...plan,
        seq: dotTickSeq++,
        debuff: status,
        debuffForTick,
        dotBreakdownKey,
        dotSkill,
        dotName,
        dotBreakdownName,
        dotType,
      })
    }
  }

  // A tick's declared buffs must reach `buffHistory` before ANY tick's damage
  // is queried, in real chronological order across every debuff — not in the
  // per-debuff batches `dotTickEntries` was built in above, or a tick from a
  // debuff visited later in `ledger.entries()` could be evaluated as if an
  // earlier-in-time tick from a different debuff hadn't triggered yet.
  const byTriggerTime = [...dotTickEntries].sort(
    (left, right) => left.frame - right.frame || left.seq - right.seq,
  )
  for (const entry of byTriggerTime) {
    if (entry.debuff.triggersBuffs && entry.debuff.triggersBuffs.length > 0) {
      buffEngine?.triggerDeclaredBuffs(
        entry.debuff.triggersBuffs,
        castTagOf(entry.dotSkill),
        entry.frame / FPS,
        propsOfSkill(entry.dotSkill, 1),
      )
    }
  }

  // After the tick pass, never before it: a cast chip reports what is live once
  // the cast resolves, and a buff a tick applies or extends only reaches
  // `buffHistory` once every tick has been walked.
  const casts: RotationCast[] = collectDetail ? buildCasts() : []
  const buffWindows: BuffWindow[] = collectDetail ? buildBuffWindows() : []

  // A tick carries the same `extraCritDamage` sentinel a regular hit does, but
  // never reaches `buildArt`, where a hit's is resolved. Resolved here against
  // the same weapon-type gate and the same per-state min phys, so the two
  // paths cannot drift.
  function tickWithResolvedMinPhysCrit(entry: DotTickEntry, smallPhys: number): Debuff {
    const dot = entry.debuffForTick.dot
    if (!dot || dot.extraCritDamage !== MIN_PHYS_CRIT_BONUS_SENTINEL) return entry.debuffForTick
    const weaponType = (entry.dotSkill.tags ?? [])
      .find((tag) => tag.startsWith(WEAPON_TAG))
      ?.slice(WEAPON_TAG.length)
    const resolved = buildView.grantsMinPhysCritBoost(weaponType) ? minPhysCritBonus(smallPhys) : 0
    return { ...entry.debuffForTick, dot: { ...dot, extraCritDamage: resolved } }
  }

  for (const entry of dotTickEntries) {
    const st = resolveState(entry.frame, entry.dotSkill)
    const tick = dotTickDamage(
      tickWithResolvedMinPhysCrit(entry, st.ctx.smallPhys),
      st.ctx,
      computeSkillDamage,
      st.forceCrit,
      entry.shape,
      hitRng,
      st.artBonuses,
    )
    // `damageFactor` is post-formula, so a tick takes it on its finished
    // number the way a regular hit takes it on its art `correction`.
    const damage = tick.damage * (entry.scale ?? 1) * entry.weight * st.damageFactor
    totalDamage += damage
    if (tick.rolled) tallyRoll(tick.rolled)
    add(entry.dotName, entry.dotType, 1, damage, entry.dotBreakdownName, entry.dotBreakdownKey)
    pushEvent({
      frame: entry.frame,
      timeSec: entry.frame / FPS,
      skillName: entry.dotName,
      type: entry.dotType,
      kind: "dot",
      damage,
      inWindow: true,
    })
  }

  for (const { mechanic, state } of mechanics) {
    for (const event of mechanic.extraEvents?.(state, mechanicSetup) ?? []) {
      const st = resolveState(event.frame, event.skill)
      const art = { ...event.art } as Parameters<typeof computeSkillDamage>[0]
      if (st.forceCrit) art.guaranteedCrit = 1
      const { expectedDamage, rolled } = computeSkillDamage(art, st.ctx, 1, hitRng)
      const damage = rolled?.damage ?? expectedDamage
      totalDamage += damage
      if (rolled) tallyRoll(rolled)
      add(
        event.name,
        event.type,
        1,
        damage,
        breakdownNameOf(event.skill.breakdownName, event.name),
        skillBreakdownRowKey(event.skill),
      )
      pushEvent({
        frame: event.frame,
        timeSec: event.frame / FPS,
        skillName: event.name,
        type: event.type,
        kind: "hit",
        damage,
        inWindow: true,
      })
    }
  }

  timeline.sort((a, b) => a.frame - b.frame || (a.kind === b.kind ? 0 : a.kind === "hit" ? -1 : 1))

  const perSkill: SkillTickResult[] = [...byName.entries()].map(([name, tallied]) => ({
    name,
    breakdownName: tallied.breakdownName,
    breakdownKey: tallied.breakdownKey,
    type: tallied.type,
    count: tallied.count,
    expectedDamage: tallied.damage,
    percentOfTotal: totalDamage > 0 ? tallied.damage / totalDamage : 0,
    castCount: castCounts.get(name) ?? 0,
  }))

  const durationSeconds = durationFrames / FPS
  const dps = durationSeconds > 0 ? totalDamage / durationSeconds : 0
  if (durationFrames <= 0)
    warnings.push("Timeline has no in-window skills — duration and DPS are 0.")

  const rolledHits = OUTCOME_KEYS.reduce((sum, outcome) => sum + outcomeTally[outcome], 0)
  const expectedOutcomeShare: OutcomeCounts = {
    abrasion: 0,
    normal: 0,
    crit: 0,
    affinity: 0,
  }
  if (rolledHits > 0) {
    for (const outcome of OUTCOME_KEYS)
      expectedOutcomeShare[outcome] = expectedShareTally[outcome] / rolledHits
  }

  return {
    dps,
    totalDamage,
    rotationDuration: durationSeconds,
    graduationRate: null,
    perSkill,
    ranking: [],
    warnings,
    timeline,
    buffWindows,
    qiBreakWindow,
    lowQiWindow,
    casts,
    outcomeCounts: hitRng ? outcomeTally : undefined,
    expectedOutcomeShare: hitRng ? expectedOutcomeShare : undefined,
  }
}

function emptyResult(warnings: string[]): Result {
  return {
    dps: 0,
    totalDamage: 0,
    rotationDuration: 0,
    graduationRate: null,
    perSkill: [],
    ranking: [],
    warnings,
    timeline: [],
    buffWindows: [],
    qiBreakWindow: null,
    lowQiWindow: null,
    casts: [],
  }
}
