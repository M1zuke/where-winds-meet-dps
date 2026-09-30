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
import type { Debuff, DebuffDotSpec } from "./debuff"
import type { HitTrigger, MeterCost, Skill, SkillHit, TriggerCondition } from "./skill"
import {
  breakdownNameOf,
  conditionSatisfiedByStacks,
  isPrePullSkill,
  hitConditionsHold,
  hitDealsDamage,
  resolvedHitFrame,
  selectHitVariant,
  triggerConditions,
} from "./skill"
import { unionConditionHolds } from "./buffs/conditions"
import {
  debuffBreakdownKey,
  debuffEchoKey,
  debuffKey,
  skillBreakdownKey,
  skillKey,
} from "../i18n/contentKeys"
import { resolveRotation, type ResolvedStep } from "./rotation"
import { StatusLedger, UNOWNED, type StatusView, type StatusWindow } from "./ledger"
import { collectCastBuffs } from "./castBuffs"
import {
  prepareMechanics,
  type ContextPatch,
  type MechanicEvent,
  type MechanicSetup,
} from "./mechanics"
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
import { classDefinition, grantsMinPhysCritBoostFor } from "../definitions/classes/registry"
import { CombatResource } from "./resources"
import { MeterEngine } from "./meter"
import { meterMaxParamKey, type MeterMaxContext } from "../definitions/resources/meterDef"
import { buildContext, effectiveRates } from "./panel"
import { computeSkillDamage, type HitOutcome, type RolledHit } from "./formula"
import { MECHANIC_STREAM_OFFSET, mulberry32 } from "./rng"
import { applyBuffEffects } from "./statRegistry"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./builtinLibrary"
import { builtinBuffsForClass } from "./builtinBuffs"
import { BuffEngine, TARGET_DISTANCE_STATUS, type DamageEffectsResult } from "./buffs/buffEngine"
import { distanceAtCastStart } from "./distance"
import type { ConditionalFinalCrit } from "./buffs/buffModule"
import { PROP_TO_PROPERTY, type SkillProperties } from "./effects/context"
import { buffDefsForClass, groupBuffDefs } from "./buffs/data"
import { paramNumOf, paramOnOf, paramTierOf, paramsFromInputs } from "./buffs/params"
import { DEFAULT_QI_BREAK_WINDOW } from "./qiBreak"
import {
  QiBar,
  fixedQiSchedule,
  fixedQiScheduleFromWindows,
  qiBonusesFrom,
  qiFromDamage,
  sameQiBreaks,
  warmStartQiSchedule,
  type QiBreak,
  type QiHitBonuses,
  type QiSchedule,
  type QiTargetBar,
} from "./qiBar"
import { QI_TARGETS, qiTargetHpMax } from "../data/baseStats/qiTargets"
import { PLAYER_QI_DAMAGE_INDEX, QI_BREAK_HP_DAMAGE_BONUS } from "../data/baseStats/qiConstants"
import { castTagOf, skillTagsOf, weaponTagOf, WEAPON_TAG } from "./buffs/tags"
import {
  drawnWeaponStatusId,
  expandStepsWithWeaponSwaps,
  makeDirectWeaponSwapSkill,
  weaponIdentitiesOf,
} from "./weaponSwap"
import { innerWayTier } from "../definitions/innerWays/registry"
import "../definitions/consumables/registry"
import { PROP } from "../data/skills/ids"
import {
  HEALER_BUFF_AMOUNT,
  HEALER_BUFF_PANACEA_FAN_AMOUNT,
} from "../data/skills/buffs/healerBuffAmounts"
import { resolveAverageFps, resolvePingMs } from "./pingFps"

export const FPS = 60

// In-game values as of 2026-09-28: every art's own swap-in cast shares one
// 3 s cooldown, gating every class's Dual-Weapon Skill alike.
const SWAP_COOLDOWN_FRAMES = 3 * FPS

// In-game values as of 2026-09-28: the plain weapon change (no Dual-Weapon
// Skill, no damage) never waits on a server round trip — a skill press
// during its own sheathe animation pre-empts it, so the next skill of the
// other weapon starts with no added cast time. Its own 0.5 s self-debounce
// is a separate clock from the Dual-Weapon Skill's 3 s cooldown — the two
// never share.
const DIRECT_SWAP_CAST_FRAMES = 0
const DIRECT_SWAP_COOLDOWN_FRAMES = 0.5 * FPS

// Calibrated from an in-game run at 10 ms / 250 fps, 2026-09-30: the fixed
// processing time a server-wait cast pays alongside its round trip.
const SERVER_PROCESSING_MS = 24

// A keyframe due at `value` fires on the first rendered frame at or after it,
// so it lands on the next multiple of the render period at or above `value`.
function quantiseToRenderFrame(value: number, renderPeriodFrames: number): number {
  if (renderPeriodFrames <= 0) return value
  return Math.ceil(value / renderPeriodFrames - 1e-9) * renderPeriodFrames
}

const OUTCOME_KEYS: readonly HitOutcome[] = ["abrasion", "normal", "crit", "affinity"]

// Guards against a runaway cast-skill trigger chain.
const EVENT_CAP = 100_000

type Ctx = ReturnType<typeof buildContext>
type EchoFeed = DamageEffectsResult["echoFeeds"][number]

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function resolveMaxStacksByTier(buff: Buff, buffParams: ReturnType<typeof paramsFromInputs>): Buff {
  if (!buff.maxStacksByTier) return buff
  const { param, byTier } = buff.maxStacksByTier
  const tier = paramTierOf(buffParams, param)
  const applicable = Object.entries(byTier)
    .map(([thresholdKey, cap]) => [Number(thresholdKey), cap] as const)
    .filter(([threshold]) => tier >= threshold)
    .sort((left, right) => right[0] - left[0])
  return applicable.length > 0 ? { ...buff, maxStacks: applicable[0][1] } : buff
}

function castEndFrame(
  skill: Skill,
  castFrame: number,
  holds: (condition: TriggerCondition) => boolean,
  distanceMeters?: number,
): number {
  const lastHitFrame =
    skill.hits.length > 0
      ? Math.max(...skill.hits.map((hit) => resolvedHitFrame(hit, holds, distanceMeters)))
      : -1
  return castFrame + (skill.castFrames || lastHitFrame + 1)
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

  // The Qi bar's own target — docs/TIMELINE.md § "Qi bar".
  const qiTargetId = inputs.qiTarget ?? "swordTrial"
  const qiTargetDef = QI_TARGETS[qiTargetId]
  const qiBreakExtensionBonusSec = inputs.combatSettings?.breakExtension ? 12 : 0
  const qiTargetBar: QiTargetBar = {
    max: qiTargetDef.max,
    refill: qiTargetDef.refill,
    breakSec: qiTargetDef.breakSec + qiBreakExtensionBonusSec,
    directImmunitySec: qiTargetDef.directImmunitySec,
    takenIndex: qiTargetDef.takenIndex,
  }
  const qiTargetHpMaxValue = qiTargetHpMax(qiTargetId, inputs.breakthrough)

  // The fixed-point iteration below seeds from the rotation's own authored
  // window (or a prior run's own converged breaks) and re-runs until the
  // break frames stop moving (docs/TIMELINE.md § "Qi bar").
  const qiSeedWindow = rotation.qiBreak ?? DEFAULT_QI_BREAK_WINDOW
  const qiWarmStartBreaks = options?.qiScheduleSeedBreaks
  const fixedQiBreaks = options?.fixedQiBreaks
  let qiSchedule: QiSchedule = fixedQiBreaks
    ? fixedQiScheduleFromWindows(fixedQiBreaks, FPS)
    : qiWarmStartBreaks
      ? warmStartQiSchedule(qiWarmStartBreaks, FPS)
      : fixedQiSchedule(qiSeedWindow, FPS)
  // Every built-in rotation settles within 5 runs; 6 leaves one run of margin.
  const QI_MAX_ITERATIONS = 6
  // A warm-started seed is a prior run's own converged schedule, so if this
  // build's first pass reproduces it exactly, that pass already is the fixed
  // point — docs/UI.md § "The rules", "one verifying run". The rotation's own
  // authored window seeding a cold run carries no such guarantee, and keeps
  // requiring a real second pass to confirm.
  let qiPreviousBreaksFrames: readonly QiBreak[] | null = qiWarmStartBreaks ?? null

  for (let qiIteration = 1; ; qiIteration++) {
    const qiBar = new QiBar(qiTargetBar, FPS)

    const skillsMap = new Map<string, Skill>()
    for (const s of builtinSkillsForClass(inputs.classId)) skillsMap.set(s.id, s)
    for (const s of inputs.customSkills ?? []) skillsMap.set(s.id, s)
    const skills = [...skillsMap.values()]
    const buffParams = paramsFromInputs(inputs, rotation.qiBreak)
    const buffsMap = new Map<string, Buff>()
    for (const b of builtinBuffsForClass(inputs.classId)) buffsMap.set(b.id, b)
    for (const b of inputs.customBuffs ?? []) buffsMap.set(b.id, b)
    const buffs = [...buffsMap.values()]
      .filter(
        (b) =>
          !b.requiresParam ||
          (paramOnOf(buffParams, b.requiresParam) &&
            paramTierOf(buffParams, b.requiresParam) >= (b.requiresMinTier ?? 0) &&
            paramTierOf(buffParams, b.requiresParam) <= (b.requiresMaxTier ?? Infinity)),
      )
      .map((buff) => resolveMaxStacksByTier(buff, buffParams))
    const debuffsMap = new Map<string, Debuff>()
    for (const d of builtinDebuffsForClass(inputs.classId)) debuffsMap.set(d.id, d)
    for (const d of inputs.customDebuffs ?? []) debuffsMap.set(d.id, d)
    const debuffs = [...debuffsMap.values()]
    const skillsById = new Map(skills.map((s) => [s.id, s] as const))
    const statusById = new Map<string, Buff | Debuff>()
    for (const b of buffs) statusById.set(b.id, b)
    for (const d of debuffs) statusById.set(d.id, d)
    const isDebuffStatus = (s: Buff | Debuff): s is Debuff => "dot" in s

    const { steps: rawResolvedSteps, warnings: rotationWarnings } = resolveRotation(
      rotation,
      skills,
      [...buffs, ...debuffs],
    )
    // A generated id, never `newStepId()`'s own `Date.now()`/`Math.random()` —
    // a cast's `stepId` reaches the digest `engineBaseline.test.ts` hashes, so
    // a random one would make every run's fixture unreproducible.
    let nextSwapStepIndex = 0
    const directSwapSkills = new Set<Skill>()
    const resolvedSteps = expandStepsWithWeaponSwaps(rawResolvedSteps, (weapon, prePull) => {
      const skill = makeDirectWeaponSwapSkill(
        inputs.classId,
        weapon,
        prePull,
        DIRECT_SWAP_CAST_FRAMES,
      )
      directSwapSkills.add(skill)
      return { step: { id: `swap-${skill.id}-${nextSwapStepIndex++}`, skillId: skill.id }, skill }
    })
    const warnings: string[] = [...rotationWarnings]
    const invalidStepIds: string[] = []

    interface LaidStep {
      resolved: ResolvedStep
      stepIndex: number
      prePull: boolean
      startFrame: number
      castLen: number
      performedHits: SkillHit[]
      // The layout ledger's own write mark just before this step's meter costs
      // and drains apply — what a "level at cast start" readout means.
      meterMarkAtStart: number
      // This step's own further in-cast server waits, already resolved to
      // frames — every later reader of a performed hit's frame adds it, the
      // same way `hitLandingFrame` itself is shared rather than reimplemented.
      midCastExtraFrames: number
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
      const lastFiredFrame = new Map<string, number>()
      const attemptsSinceFired = new Map<string, number>()
      const ownGroupKeys = new WeakMap<HitTrigger, string>()
      let nextOwnGroupKey = 0
      const groupKeyOf = (trigger: HitTrigger): string => {
        if (trigger.cooldownGroup !== undefined) return trigger.cooldownGroup
        const existing = ownGroupKeys.get(trigger)
        if (existing !== undefined) return existing
        const generated = `#${nextOwnGroupKey++}`
        ownGroupKeys.set(trigger, generated)
        return generated
      }
      return (trigger, frame) => {
        if (!triggerConditions(trigger).every((condition) => holds(condition, frame))) return false
        if (trigger.phase !== undefined && qiSchedule.phaseAt(frame / FPS) !== trigger.phase)
          return false
        if (
          trigger.requiresParam !== undefined &&
          !unionConditionHolds(
            { param: trigger.requiresParam, minTier: trigger.requiresMinTier },
            frame,
            buffParams,
            () => false,
          )
        )
          return false
        if (trigger.cooldownFrames === undefined) return true
        const groupKey = groupKeyOf(trigger)
        const lastFired = lastFiredFrame.get(groupKey)
        if (lastFired !== undefined) {
          const attempts = (attemptsSinceFired.get(groupKey) ?? 0) + 1
          attemptsSinceFired.set(groupKey, attempts)
          const requiredWait = Math.max(
            trigger.cooldownFloorFrames ?? 0,
            trigger.cooldownFrames - (trigger.cooldownDecayFramesPerAttempt ?? 0) * attempts,
          )
          if (frame - lastFired < requiredWait) return false
        }
        lastFiredFrame.set(groupKey, frame)
        attemptsSinceFired.set(groupKey, 0)
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

      const openWindow = (
        status: Buff | Debuff,
        frame: number,
        owner: number,
        durationFrames?: number,
      ): void => {
        if (status.activation === "permanent") target.openPermanent(status.id)
        else
          target.pushWindow(
            status.id,
            frame,
            frame + Math.max(1, durationFrames ?? status.durationFrames),
            owner,
          )
      }

      const write = (
        status: Buff | Debuff,
        frame: number,
        next: number,
        owner: number,
        timedWindow: boolean,
        fireMaxStacks: boolean,
        durationFrames?: number,
      ): void => {
        const before = target.stacksAt(status.id, frame)
        target.recordStack(status.id, frame, next, owner)
        if (timedWindow || status.activation === "permanent")
          openWindow(status, frame, owner, durationFrames)
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
        durationFrames?: number,
      ): void => {
        const next = clamp(target.stacksAt(status.id, frame) + stacks, 0, capOf(status))
        write(status, frame, next, owner, true, fireMaxStacks, durationFrames)
      }

      function applyTrigger(
        trigger: HitTrigger,
        frame: number,
        owner: number,
        fireMaxStacks: boolean,
      ): void {
        if (trigger.kind === "clearStatus") {
          if (!fires(trigger, frame)) return
          const status = statusById.get(trigger.targetId)
          if (!status) return
          const activeWindow = target.longestActiveWindow(status.id, frame)
          if (activeWindow) activeWindow.end = frame
          target.recordStack(status.id, frame, 0, owner)
          return
        }
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
        grant(status, frame, trigger.stacks, owner, fireMaxStacks, trigger.durationFrames)
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
              const requirementMet =
                !reset.requiresBuffId ||
                target.longestActiveWindow(reset.requiresBuffId, window.end)
              if (!requirementMet && reset.elseStacks === undefined) continue
              const resetTarget = statusById.get(reset.targetId)
              if (!resetTarget) continue
              const next = clamp(
                requirementMet ? reset.stacks : reset.elseStacks!,
                0,
                capOf(resetTarget),
              )
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

    const renderPeriodFrames = FPS / resolveAverageFps(rotation.averageFps)
    const oneClientFrameFrames = renderPeriodFrames
    const pingRoundTripFrames = (resolvePingMs(rotation.pingMs) * FPS) / 1000
    const serverProcessingFrames = (SERVER_PROCESSING_MS * FPS) / 1000
    // `pingMs` at 0 is the app's own "assume no latency" baseline, not a
    // literal zero-latency connection — a real server always takes some
    // processing time — so every added wait below stays a genuine no-op
    // there, exactly as the plain round trip already was, rather than
    // pinning every default run to a server processing time nothing set it
    // to.
    const hasPing = pingRoundTripFrames > 0
    // Summed before quantising, not quantised term by term (docs/TIMELINE.md
    // § "Coefficients").
    const roundTripFrames = hasPing
      ? quantiseToRenderFrame(
          pingRoundTripFrames + serverProcessingFrames + oneClientFrameFrames,
          renderPeriodFrames,
        )
      : 0
    const clientFrameOnlyFrames = hasPing
      ? quantiseToRenderFrame(oneClientFrameFrames, renderPeriodFrames)
      : 0
    // A skill's own further in-cast server wait lands mid-graph, not at a
    // fresh input, so it skips the extra client frame `roundTripFrames` pays.
    const midCastWaitFrames = hasPing
      ? quantiseToRenderFrame(pingRoundTripFrames + serverProcessingFrames, renderPeriodFrames)
      : 0
    const startLatencyFrames = (skill: Skill): number => {
      const latency = skill.startLatency ?? "serverRoundTrip"
      if (latency === "none") return 0
      if (latency === "noWaitOnDummy" && inputs.dummyMode) return clientFrameOnlyFrames
      return roundTripFrames
    }
    const hitLandingFrame = (stepStart: number, hitFrame: number): number =>
      Math.round(stepStart + quantiseToRenderFrame(hitFrame, renderPeriodFrames))

    // The largest cast length any of a step's hit variants could select.
    function upperBoundCastFrames(rs: ResolvedStep): number {
      const performedHits = rs.skill.hits
      const naturalMaxFrame =
        performedHits.length > 0 ? Math.max(...performedHits.map((h) => h.frame)) : -1
      let bound = rs.skill.castFrames || naturalMaxFrame + 1
      for (const skillHit of performedHits) {
        for (const variant of skillHit.variants ?? []) {
          if (variant.castFrames !== undefined && variant.castFrames > 0)
            bound = Math.max(bound, variant.castFrames)
          if (variant.frame !== undefined) bound = Math.max(bound, variant.frame + 1)
        }
      }
      return bound
    }

    // The largest start-wait plus in-cast-wait a step could pay — the worst
    // case a dummy-mode skip could still be waived, so every reader of this
    // bound stays a true upper bound regardless of `inputs.dummyMode`. Rounded
    // up to a whole frame: this bound also sizes the meter engine's own
    // starting frame, and a render-quantised fraction there would desync its
    // internal cursor from every (already-rounded) hit-derived frame it is
    // later compared against.
    function upperBoundLatencyFrames(rs: ResolvedStep): number {
      const start = (rs.skill.startLatency ?? "serverRoundTrip") === "none" ? 0 : roundTripFrames
      return Math.ceil(start + (rs.skill.serverWaitsInCast ?? 0) * midCastWaitFrames)
    }

    // A cast's length can't be resolved from the live status ledger, because
    // that ledger needs every cast's length to size itself first. This
    // throwaway ledger breaks the cycle: sized against the worst case up front,
    // then filled incrementally as each step is laid out, so a later step's
    // conditions see every earlier step's triggers but never its own. Prepull
    // casts take the upper bound as their real length outright — none
    // currently gate a hit or a variant's cast length on a condition. Every
    // step's own worst-case latency is added too, or a heavily lagged run can
    // land a cast past a permanent status's own bound-sized window.
    const prePullBound = resolvedSteps.reduce(
      (sum, rs) =>
        isPrePullSkill(rs.skill)
          ? sum + upperBoundCastFrames(rs) + upperBoundLatencyFrames(rs)
          : sum,
      0,
    )
    const activeUpperBound = resolvedSteps.reduce(
      (sum, rs) =>
        isPrePullSkill(rs.skill)
          ? sum
          : sum + upperBoundCastFrames(rs) + upperBoundLatencyFrames(rs),
      0,
    )
    const classDef = classDefinition(inputs.classId)
    const fixedWindowFrames =
      rotation.fixedWindowSec === undefined ? null : Math.round(rotation.fixedWindowSec * FPS)
    // The drawn weapon simulates once per layout run, replayed onto the real
    // ledger the same way a meter is — docs/TIMELINE.md § "Drawn weapon".
    // Every art a skill can draw, pure from `skills`, so it's shared rather
    // than recomputed by a discovery run and the real run alike.
    const weaponIdentities = weaponIdentitiesOf(skills)
    const runEffectiveRates = effectiveRates(inputs)

    interface LayoutRun {
      laidSteps: LaidStep[]
      layoutLedger: StatusLedger
      layoutHolds: (condition: TriggerCondition, frame: number) => boolean
      meters: MeterEngine[]
      targetDistanceAt: (frame: number) => number
      flushMeterEventsUpTo: (horizonFrame: number) => void
      damagingHitTimesSec: number[]
      weaponHitTimesSec: number[]
      discoveredFightStartFrame: number | null
      discoveredFightEndFrame: number | null
      castCursorFrames: number
    }

    // Lays out every step, its hits and its trigger cascade once, truncating
    // against `truncateAfterFrame` (null lays out everything). `warn` and
    // `markInvalid` are the reporting sinks, so a throwaway call can pass
    // no-ops instead of surfacing a warning the real run didn't make.
    function layoutRotation(
      truncateAfterFrame: number | null,
      warn: (message: string) => void,
      markInvalid: (stepId: string) => void,
    ): LayoutRun {
      const layoutLedger = new StatusLedger(Math.min(0, -prePullBound), activeUpperBound)
      const layoutHolds = (condition: TriggerCondition, frame: number): boolean =>
        unionConditionHolds(condition, frame, buffParams, (status, atFrame) =>
          conditionSatisfiedByStacks(
            status,
            layoutLedger.conditionStacksAt(status.buffId, atFrame),
          ),
        )
      const layoutWriter = statusWriter(layoutLedger, layoutHolds)
      seedOpeningState(layoutWriter, Math.min(0, -prePullBound))

      // Meters (Endurance, Blade Momentum, …) simulate once here, in the same
      // sequential cursor `castConditions` legality already reads, and are
      // replayed onto the real ledger once it exists — see docs/TIMELINE.md §
      // "Meters".
      const meterMaxContext: MeterMaxContext = {
        paramTier: (id) => paramTierOf(buffParams, id),
        paramOn: (id) => paramOnOf(buffParams, id),
        paramValue: (id) => paramNumOf(buffParams, id),
        whiteAffinityRate: inputs.affinityRate,
      }
      const meterStartFrame = Math.min(0, -prePullBound)
      const meters = (classDef?.meters ?? []).map(
        (definition) =>
          new MeterEngine(
            definition,
            meterMaxContext,
            FPS,
            layoutLedger,
            meterStartFrame,
            (frame, currentAmount, capacity) =>
              meterModifierMultiplier(
                "regen",
                definition.id,
                frame,
                undefined,
                currentAmount,
                capacity,
              ),
          ),
      )
      const meterById = new Map(meters.map((meter) => [meter.def.id, meter] as const))
      for (const meter of meters) buffParams[meterMaxParamKey(meter.def.id)] = meter.capacity

      // Ground distance to the target simulates once here too, replayed onto the
      // real ledger the same way a meter is — docs/TIMELINE.md § "Target distance".
      const preferredDistanceMeters = paramNumOf(buffParams, "distanceMeters")
      const defaultMeleeReachMeters = classDef?.defaultMeleeReachMeters ?? 0
      let currentDistanceMeters = preferredDistanceMeters
      layoutLedger.openPermanent(TARGET_DISTANCE_STATUS)
      layoutLedger.recordStack(TARGET_DISTANCE_STATUS, meterStartFrame, currentDistanceMeters)
      // A projectile hit's own landing frame reads this — the one target-distance
      // simulation every other reader of it uses, queried at whatever frame the
      // hit itself resolves from.
      const targetDistanceAt = (frame: number): number =>
        layoutLedger.stacksAt(TARGET_DISTANCE_STATUS, frame)

      for (const weapon of weaponIdentities) {
        const statusId = drawnWeaponStatusId(weapon)
        layoutLedger.openPermanent(statusId)
        layoutLedger.recordStack(statusId, meterStartFrame, 0)
      }

      // docs/TIMELINE.md § "Meters": a modifier that carries a `tag` is
      // class-scoped (only a skill carrying that tag pays it) and every other
      // one is unscoped (every spend of the meter pays it) — two different
      // in-game formulas, so their sums multiply rather than add.
      function meterModifierLayerSums(
        kind: "cost" | "chargeCost" | "regen",
        meterId: string,
        frame: number,
        skill: Skill | undefined,
        currentAmount: number | undefined,
        capacity: number | undefined,
      ): { scoped: number; unscoped: number } {
        let scoped = 0
        let unscoped = 0
        for (const status of buffs) {
          for (const modifier of status.meterModifiers ?? []) {
            if (modifier.meterId !== meterId || modifier.kind !== kind) continue
            if (modifier.tag && !(skill?.tags ?? []).includes(modifier.tag)) continue
            const active = modifier.alwaysActive
              ? true
              : modifier.belowCapacityFraction !== undefined
                ? currentAmount !== undefined &&
                  capacity !== undefined &&
                  conditionSatisfiedByStacks(
                    {
                      buffId: status.id,
                      op: "lt",
                      stacks: modifier.belowCapacityFraction * capacity,
                    },
                    currentAmount,
                  )
                : layoutLedger.isActiveAt(status.id, frame)
            if (!active) continue
            if (modifier.tag) scoped += modifier.amount
            else unscoped += modifier.amount
          }
        }
        return { scoped, unscoped }
      }

      // A charge drain also pays whatever the meter's own unscoped `cost` layer
      // currently charges, on top of its own dedicated `chargeCost` layer — the
      // unscoped cost formula is defined in-game as covering every spend,
      // continuous drains included, while the class-scoped cost layer never
      // reaches a charge at all (docs/TIMELINE.md § "Meters").
      function meterModifierMultiplier(
        kind: "cost" | "chargeCost" | "regen",
        meterId: string,
        frame: number,
        skill?: Skill,
        currentAmount?: number,
        capacity?: number,
      ): number {
        const own = meterModifierLayerSums(kind, meterId, frame, skill, currentAmount, capacity)
        let multiplier = Math.max(0, 1 + own.scoped) * Math.max(0, 1 + own.unscoped)
        if (kind === "chargeCost") {
          const costLayer = meterModifierLayerSums(
            "cost",
            meterId,
            frame,
            skill,
            currentAmount,
            capacity,
          )
          multiplier *= Math.max(0, 1 + costLayer.unscoped)
        }
        return multiplier
      }

      function advanceMeters(frame: number): void {
        for (const meter of meters) meter.advanceTo(frame)
      }

      // Untiered (the param off entirely) reads as tier 0 rather than failing the
      // check outright — a cost waived only from some tier up (`requiresMaxTier`)
      // must still apply to a build that never slotted the param at all.
      function meterCostRequirementHolds(cost: MeterCost): boolean {
        if (!cost.requiresParam) return true
        const tier = paramOnOf(buffParams, cost.requiresParam)
          ? paramTierOf(buffParams, cost.requiresParam)
          : 0
        return tier >= (cost.requiresMinTier ?? 0) && tier <= (cost.requiresMaxTier ?? Infinity)
      }

      interface PendingMeterIntervalStart {
        frame: number
        register: () => void
      }

      // Costs land immediately, at the cast's own start — paid by the skill the
      // step names, before a charge release's own projection can run against the
      // result (docs/TIMELINE.md § "Meters").
      function applyMeterCosts(skill: Skill, startFrame: number): Map<string, number> {
        const paidByMeter = new Map<string, number>()
        for (const cost of skill.meterCosts ?? []) {
          const meter = meterById.get(cost.meterId)
          if (!meter) continue
          if (!meterCostRequirementHolds(cost)) continue
          const multiplier = meterModifierMultiplier("cost", cost.meterId, startFrame, skill)
          const paid = cost.amount * multiplier
          meter.apply(startFrame, -paid)
          paidByMeter.set(cost.meterId, (paidByMeter.get(cost.meterId) ?? 0) + paid)
        }
        return paidByMeter
      }

      // A freeze or drain's own start can land after one of this same cast's own
      // hits (an early hit ahead of a later charge-drain start), so its
      // registration is handed back rather than applied here — `seedStepTriggers`
      // interleaves it with this step's own hits by frame, since registering it
      // eagerly would fast-forward the meter's forward-only cursor past a hit
      // that hasn't run yet.
      function scheduleMeterDrainsAndFreezes(
        skill: Skill,
        startFrame: number,
        castEndFrame: number,
      ): PendingMeterIntervalStart[] {
        const starts: PendingMeterIntervalStart[] = []
        // Freezes before drains: a freeze's own fromFrame is never later than the
        // drain it overlaps, so processing it first keeps the meter's own cursor
        // moving forward through this same cast.
        for (const freeze of skill.meterFreezes ?? []) {
          const meter = meterById.get(freeze.meterId)
          if (!meter) continue
          const fromFrame = hitLandingFrame(startFrame, freeze.fromFrame)
          starts.push({
            frame: fromFrame,
            register: () => meter.startDrain(fromFrame, castEndFrame, 0),
          })
        }
        for (const drain of skill.meterDrains ?? []) {
          const meter = meterById.get(drain.meterId)
          if (!meter) continue
          const fromFrame = hitLandingFrame(startFrame, drain.fromFrame)
          // Never outlives its own cast — the graph node driving it is torn down
          // the moment the cast ends, however long its own stop timer still had.
          const toFrame =
            drain.stopAfterSec !== undefined
              ? Math.min(fromFrame + Math.round(drain.stopAfterSec * FPS), castEndFrame)
              : castEndFrame
          starts.push({
            frame: fromFrame,
            register: () =>
              meter.startDrain(fromFrame, toFrame, drain.perSecond, (frame) =>
                meterModifierMultiplier("chargeCost", drain.meterId, frame, skill),
              ),
          })
        }
        return starts
      }

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

      // A summoned hit counts as a hit for every hit-driven schedule (proc
      // mechanics, the layout ledger), the same as a laid one — the frame it
      // lands at is all that distinguishes them. `detonateDot`'s own sub-cast
      // stays out of the layout ledger: chasing it needs the retained-stack
      // build param, which the buff engine alone resolves.
      const damagingHitTimesSec: number[] = []
      const weaponHitTimesSec: number[] = []

      interface PendingHitEvent {
        kind: "hit"
        skill: Skill
        hit: SkillHit
        frame: number
        owner: number
        prePull: boolean
        sequence: number
      }
      interface PendingMeterDeltaEvent {
        kind: "meterDelta"
        trigger: HitTrigger
        frame: number
        owner: number
        sequence: number
        paidByMeter: Map<string, number>
      }
      interface PendingMeterIntervalEvent {
        kind: "meterInterval"
        frame: number
        register: () => void
        sequence: number
      }
      type PendingLayoutEvent = PendingHitEvent | PendingMeterDeltaEvent | PendingMeterIntervalEvent
      let layoutHitSequence = 0

      // A cast's own meterDelta triggers — on-hit gains and `appliesOnCastEnd`
      // ones alike — join the same frame-ordered queue as this step's own hits
      // and its meter freeze/drain starts, rather than applying the moment their
      // owning hit is processed: an on-hit gain discovered after a same- or
      // earlier-frame cast-end gain in trigger-authoring order is still earlier
      // in time, and resolving it eagerly would push the meter's forward-only
      // cursor past a not-yet-processed, earlier event.
      function seedHitTriggers(
        current: PendingHitEvent,
        pending: PendingLayoutEvent[],
        paidByMeter: Map<string, number>,
      ): void {
        const { skill, hit: skillHit, frame: hitFrame, owner, prePull } = current
        const ownerHolds = (condition: TriggerCondition) => layoutHolds(condition, owner)
        layoutWriter.processExpiries(hitFrame)
        if (hitDealsDamage(skillHit)) {
          layoutWriter.onDamagingHit(hitFrame, owner)
          if (discoveredFightStartFrame === null || hitFrame < discoveredFightStartFrame)
            discoveredFightStartFrame = hitFrame
          if (discoveredFightEndFrame === null || hitFrame > discoveredFightEndFrame)
            discoveredFightEndFrame = hitFrame
          const timeSec = hitFrame / FPS
          damagingHitTimesSec.push(timeSec)
          if (skill.skillType === "weapon") weaponHitTimesSec.push(timeSec)
        }
        for (const trigger of skillHit.triggers) {
          if (trigger.kind === "detonateDot") continue
          if (trigger.kind === "applyDot") {
            if (!layoutWriter.fires(trigger, hitFrame)) continue
            const status = statusById.get(trigger.targetId)
            if (!status || !isDebuffStatus(status)) continue
            const maxStacks = Math.max(1, status.maxStacks)
            const next = clamp(layoutLedger.stacksAt(status.id, hitFrame) + 1, 0, maxStacks)
            layoutLedger.recordStack(status.id, hitFrame, next, owner)
            if (status.activation === "permanent") layoutLedger.openPermanent(status.id)
            else
              layoutLedger.pushWindow(
                status.id,
                hitFrame,
                hitFrame + Math.max(1, status.durationFrames),
                owner,
              )
            continue
          }
          if (trigger.kind === "castSkill") {
            if (!layoutWriter.fires(trigger, hitFrame)) continue
            const sub = skillsById.get(trigger.targetId)
            if (!sub) continue
            const subHolds = (condition: TriggerCondition) => layoutHolds(condition, hitFrame)
            for (const subHit of sub.hits.filter((candidate) =>
              hitConditionsHold(candidate, subHolds),
            )) {
              pending.push({
                kind: "hit",
                skill: sub,
                hit: subHit,
                frame: hitLandingFrame(
                  hitFrame,
                  resolvedHitFrame(subHit, subHolds, targetDistanceAt(hitFrame)),
                ),
                owner,
                prePull,
                sequence: layoutHitSequence++,
              })
            }
            continue
          }
          if (trigger.kind === "meterDelta") {
            if (prePull) continue
            const effectiveFrame = trigger.appliesOnCastEnd
              ? castEndFrame(skill, owner, ownerHolds, targetDistanceAt(owner))
              : hitFrame
            pending.push({
              kind: "meterDelta",
              trigger,
              frame: effectiveFrame,
              owner,
              sequence: layoutHitSequence++,
              paidByMeter,
            })
            continue
          }
          layoutWriter.applyTrigger(
            trigger,
            trigger.appliesOnCastEnd
              ? castEndFrame(skill, owner, ownerHolds, targetDistanceAt(owner))
              : hitFrame,
            owner,
          )
        }
      }

      function applyMeterDeltaEvent(event: PendingMeterDeltaEvent): void {
        const { trigger, frame, owner, paidByMeter } = event
        if (!layoutWriter.fires(trigger, frame)) return
        const meter = meterById.get(trigger.targetId)
        if (!meter) return
        const stacks =
          trigger.refundFractionOfCastCost !== undefined
            ? trigger.refundFractionOfCastCost * (paidByMeter.get(trigger.targetId) ?? 0)
            : trigger.stacks
        const applied = meter.apply(frame, stacks, trigger.meterSpendCapToCurrent)
        if (trigger.recordSpendAsStatus) {
          // Backdated to the cast's own start, not this hit's frame, so every
          // wave of the same release — including one landing before this
          // trigger's own hit — reads the same recorded amount.
          layoutLedger.openPermanent(trigger.recordSpendAsStatus)
          layoutLedger.recordStack(trigger.recordSpendAsStatus, owner, Math.abs(applied), owner)
        }
      }

      // A step's own generated chain (a `castSkill` sub-cast, a detonation) can
      // land past the next rotation step's own, chronologically earlier start —
      // draining this step's queue to completion would apply its late meter
      // event first and drag the shared cursor past that next step's own
      // cast-start cost. Only a meter-relevant event (`meterDelta`,
      // `meterInterval`) is deferred here, into a queue outliving this call; a
      // plain hit past the horizon still runs its other triggers at once, since
      // only the meter's own forward-only cursor needs global ordering
      // (docs/TIMELINE.md § "Meters").
      const deferredMeterEvents: (PendingMeterDeltaEvent | PendingMeterIntervalEvent)[] = []

      function flushMeterEventsUpTo(horizonFrame: number): void {
        deferredMeterEvents.sort(
          (left, right) => left.frame - right.frame || left.sequence - right.sequence,
        )
        while (deferredMeterEvents.length > 0 && deferredMeterEvents[0].frame <= horizonFrame) {
          const next = deferredMeterEvents.shift()!
          if (next.kind === "meterInterval") next.register()
          else applyMeterDeltaEvent(next)
        }
      }

      function seedStepTriggers(
        skill: Skill,
        hits: readonly SkillHit[],
        stepStart: number,
        prePull: boolean,
        meterIntervalStarts: PendingMeterIntervalStart[] = [],
        paidByMeter: Map<string, number> = new Map(),
        meterHorizonFrame = Infinity,
        midCastExtraFrames = 0,
      ): void {
        const pending: PendingLayoutEvent[] = [
          ...hits.map((hit): PendingHitEvent => ({
            kind: "hit",
            skill,
            hit,
            frame: hitLandingFrame(
              stepStart,
              resolvedHitFrame(
                hit,
                (condition) => layoutHolds(condition, stepStart),
                targetDistanceAt(stepStart),
              ) + midCastExtraFrames,
            ),
            owner: stepStart,
            prePull,
            sequence: layoutHitSequence++,
          })),
          ...meterIntervalStarts.map((start): PendingMeterIntervalEvent => ({
            kind: "meterInterval",
            frame: start.frame,
            register: start.register,
            sequence: layoutHitSequence++,
          })),
        ]
        let processed = 0
        while (pending.length > 0 && processed < EVENT_CAP) {
          pending.sort((left, right) => left.frame - right.frame || left.sequence - right.sequence)
          const next = pending.shift()!
          processed++
          if (next.kind !== "hit" && next.frame > meterHorizonFrame) {
            deferredMeterEvents.push(next)
            continue
          }
          if (next.kind === "meterInterval") next.register()
          else if (next.kind === "meterDelta") applyMeterDeltaEvent(next)
          else seedHitTriggers(next, pending, paidByMeter)
        }
      }

      // The frame of the first and last hit anywhere in the timeline —
      // pre-pull and summoned hits included — whose coefficients deal damage:
      // docs/TIMELINE.md § "Fight window". Tracked as running extremes in
      // `seedHitTriggers` below, over every hit this run lays out, so neither
      // depends on the order steps are authored in.
      let discoveredFightStartFrame: number | null = null
      let discoveredFightEndFrame: number | null = null

      // A charged hold's own drain, checked against the meter it names: bounded
      // so a chain of fallbacks can only ever step down, never loop.
      function resolveChargeRelease(resolvedStep: ResolvedStep, startFrame: number): ResolvedStep {
        let current = resolvedStep.skill
        for (let guard = 0; guard < skills.length + 1; guard++) {
          const drain = (current.meterDrains ?? []).find((entry) => entry.chargeRelease)
          if (!drain?.chargeRelease) return { step: resolvedStep.step, skill: current }
          const meter = meterById.get(drain.meterId)
          if (!meter) return { step: resolvedStep.step, skill: current }
          const fromFrame = hitLandingFrame(startFrame, drain.fromFrame)
          const toFrame =
            drain.stopAfterSec !== undefined
              ? fromFrame + Math.round(drain.stopAfterSec * FPS)
              : hitLandingFrame(startFrame, current.castFrames)
          const emptiedAt = meter.projectDrainEmptyAt(
            fromFrame,
            drain.perSecond,
            Math.max(0, toFrame - fromFrame),
          )
          if (emptiedAt === null) return { step: resolvedStep.step, skill: current }
          const fallback = skillsById.get(drain.chargeRelease.fallbackSkillId)
          if (!fallback) return { step: resolvedStep.step, skill: current }
          warn(
            `${current.name || current.id} at ${(startFrame / FPS).toFixed(2)}s released early onto ${fallback.name || fallback.id}: its ${meter.def.name} would empty before the held stage completes.`,
          )
          current = fallback
        }
        return { step: resolvedStep.step, skill: current }
      }

      const laidSteps: LaidStep[] = []
      let activeCursor = 0
      let preCursor = -prePullBound
      let swapReadyAtFrame = -Infinity
      let directSwapReadyAtFrame = -Infinity
      let drawnWeapon: string | null = null
      for (const [stepIndex, resolvedStep] of resolvedSteps.entries()) {
        const prePull = isPrePullSkill(resolvedStep.skill)
        const cursor = prePull ? preCursor : activeCursor
        const isWeaponSwapCast = resolvedStep.skill.isWeaponSwap === true
        const isDirectSwapCast = directSwapSkills.has(resolvedStep.skill)
        const earliestStart = cursor + startLatencyFrames(resolvedStep.skill)
        // A swap blocked by its own cooldown waits as idle time instead of being
        // flagged illegal — docs/TIMELINE.md § "Drawn weapon".
        const exactStart = isWeaponSwapCast
          ? Math.max(earliestStart, swapReadyAtFrame)
          : isDirectSwapCast
            ? Math.max(earliestStart, directSwapReadyAtFrame)
            : earliestStart
        const startFrame = Math.round(exactStart)
        if (isWeaponSwapCast) swapReadyAtFrame = startFrame + SWAP_COOLDOWN_FRAMES
        if (isDirectSwapCast) directSwapReadyAtFrame = startFrame + DIRECT_SWAP_COOLDOWN_FRAMES
        const weapon = weaponTagOf(resolvedStep.skill)
        if (weapon && weapon !== drawnWeapon) {
          if (drawnWeapon !== null)
            layoutLedger.recordStack(drawnWeaponStatusId(drawnWeapon), startFrame, 0)
          layoutLedger.recordStack(drawnWeaponStatusId(weapon), startFrame, 1)
          drawnWeapon = weapon
        }
        layoutWriter.processExpiries(startFrame)
        flushMeterEventsUpTo(startFrame)
        advanceMeters(startFrame)
        // Marked before this step's own cost lands, so a cast's reported meter
        // level is the level available when it was placed (TIMELINE.md §
        // "Meters"), never the level once its own spend already resolved it.
        const meterMarkAtStart = layoutLedger.mark()
        const holdsHere = (condition: TriggerCondition) => layoutHolds(condition, startFrame)
        if (!(resolvedStep.skill.castConditions ?? []).every(holdsHere)) {
          markInvalid(resolvedStep.step.id)
          warn(
            `${resolvedStep.skill.name || resolvedStep.skill.id} at ${(startFrame / FPS).toFixed(2)}s would be illegal in the game: its cast conditions are not met.`,
          )
        }
        // A pre-pull cast never touches a meter (TIMELINE.md § "Meters"), so its
        // cost stays unpaid and its charge drain, if any, is never in reach of an
        // early release either. The cost is paid before the release projects,
        // never the other way — see the "Meters" section on `chargeRelease`.
        const paidByMeter = prePull
          ? new Map<string, number>()
          : applyMeterCosts(resolvedStep.skill, startFrame)
        const castResolution = prePull
          ? resolvedStep
          : resolveChargeRelease(resolvedStep, startFrame)
        // A pre-pull cast never touches the target distance either — see the
        // meter-cost note above, the same real-world-gap reasoning applies.
        if (!prePull) {
          currentDistanceMeters = distanceAtCastStart(
            castResolution.skill,
            defaultMeleeReachMeters,
            preferredDistanceMeters,
            currentDistanceMeters,
          )
          layoutLedger.recordStack(TARGET_DISTANCE_STATUS, startFrame, currentDistanceMeters)
        }
        const nextStepSkillId = resolvedSteps[stepIndex + 1]?.skill.id
        const hitLandsByNextStep = (hit: SkillHit): boolean =>
          !hit.requiresNextStepSkillIds ||
          (nextStepSkillId !== undefined && hit.requiresNextStepSkillIds.includes(nextStepSkillId))
        const occurringHits = castResolution.skill.hits.filter(
          (hit) => hitConditionsHold(hit, holdsHere) && hitLandsByNextStep(hit),
        )
        // A skill's own further in-cast server waits never reach a pre-pull cast
        // — the same real-world-gap reasoning that keeps one off every other
        // frame-accurate mechanic (TIMELINE.md § "Meters").
        const midCastExtraFrames = prePull
          ? 0
          : (castResolution.skill.serverWaitsInCast ?? 0) * midCastWaitFrames
        const layoutHitFrame = (hit: SkillHit): number =>
          resolvedHitFrame(hit, holdsHere, targetDistanceAt(startFrame)) + midCastExtraFrames
        const nominalCastLen = prePull
          ? upperBoundCastFrames(castResolution)
          : (() => {
              const maxFrame =
                occurringHits.length > 0 ? Math.max(...occurringHits.map(layoutHitFrame)) : -1
              const gatedCastFrames = occurringHits.find(
                (hit) => hit.requiresNextStepSkillIds && hit.castFramesWhenGated !== undefined,
              )?.castFramesWhenGated
              return (
                (activeVariantCastFrames(occurringHits, holdsHere) ??
                  gatedCastFrames ??
                  (castResolution.skill.castFrames || maxFrame + 1)) + midCastExtraFrames
              )
            })()
        const castLen = quantiseToRenderFrame(nominalCastLen, renderPeriodFrames)
        const nextCursor = exactStart + castLen
        if (prePull) preCursor = nextCursor
        else activeCursor = nextCursor
        // A pre-pull cast never lands (TIMELINE.md § "Identity and tags") — the
        // same holds for a meter, which has no faithful frame-accurate placement
        // for a real-world gap of unknown length compressed into a few negative
        // frames.
        const meterDrainStarts = prePull
          ? undefined
          : scheduleMeterDrainsAndFreezes(castResolution.skill, startFrame, startFrame + castLen)
        // A fixed window truncates every hit past its own end, pre-pull
        // included — docs/TIMELINE.md § "Fight window". `truncateAfterFrame` is
        // the caller's own already-fixed bound: null on the discovery run (lay
        // out everything, no truncation) and `fightStart + window` on the real
        // run, so truncation never depends on the order steps happen to be
        // authored in.
        const landedHits = occurringHits
          .map((hit) => ({ hit, frame: hitLandingFrame(startFrame, layoutHitFrame(hit)) }))
          .sort((left, right) => left.frame - right.frame)
          .filter(({ frame }) => truncateAfterFrame === null || frame <= truncateAfterFrame)
          .map(({ hit }) => hit)
        seedStepTriggers(
          castResolution.skill,
          landedHits,
          startFrame,
          prePull,
          meterDrainStarts,
          paidByMeter,
          prePull ? Infinity : nextCursor,
          midCastExtraFrames,
        )
        laidSteps.push({
          resolved: castResolution,
          stepIndex,
          prePull,
          startFrame,
          castLen,
          performedHits: landedHits,
          meterMarkAtStart,
          midCastExtraFrames,
        })
      }
      const castCursorFrames = activeCursor
      damagingHitTimesSec.sort((a, b) => a - b)
      weaponHitTimesSec.sort((a, b) => a - b)
      return {
        laidSteps,
        layoutLedger,
        layoutHolds,
        meters,
        targetDistanceAt,
        flushMeterEventsUpTo,
        damagingHitTimesSec,
        weaponHitTimesSec,
        discoveredFightStartFrame,
        discoveredFightEndFrame,
        castCursorFrames,
      }
    }

    function combineEarliestFrame(a: number | null, b: number | null): number | null {
      if (a === null) return b
      if (b === null) return a
      return Math.min(a, b)
    }

    // The earliest DoT tick a run's own (untruncated) ledger would land,
    // ignoring a tick's own `requiresBuff` gate — no buff-engine instance
    // exists this early, so this over-includes a gated tick that might not
    // actually fire, an accepted approximation for finding the fight's own
    // start frame only. The real tick list built later (`plannedDotTicks`)
    // applies the gate for every reader that scores or displays a tick.
    function earliestDotTickFrame(ledger: StatusLedger): number | null {
      let earliest: number | null = null
      for (const [buffId, windows] of ledger.entries()) {
        const status = statusById.get(buffId)
        if (!status || !isDebuffStatus(status) || !status.dot || status.dot.tickIntervalFrames <= 0)
          continue
        const tickSkill = skillsById.get(tickSourceSkillId(status) ?? "")
        const dot = resolveTickDot(status, tickSkill)
        if (!dot || !hitDealsDamage(dot)) continue
        for (const plan of planDotTicks({
          debuff: status,
          dot,
          windows,
          stacksAt: (frame) => ledger.stacksAt(buffId, frame),
          inWindow: () => true,
          weightAt: () => 1,
        })) {
          if (earliest === null || plan.frame < earliest) earliest = plan.frame
        }
      }
      return earliest
    }

    const recordWarning = (message: string): void => {
      warnings.push(message)
    }
    const recordInvalidStep = (stepId: string): void => {
      invalidStepIds.push(stepId)
    }

    // docs/TIMELINE.md § "Fight window": the fight starts at the earliest
    // damaging event of any kind, pre-pull included, found by laying out the
    // whole rotation with no truncation. A fixed window's own truncation
    // bound only exists once this is known, so — only when one is set — a
    // second, real pass truncates against it; without one, truncation is a
    // no-op and the discovery run already is the real run.
    let layout: LayoutRun
    let fightStartFrame: number
    if (fixedWindowFrames === null) {
      layout = layoutRotation(null, recordWarning, recordInvalidStep)
      fightStartFrame =
        combineEarliestFrame(
          layout.discoveredFightStartFrame,
          earliestDotTickFrame(layout.layoutLedger),
        ) ?? 0
    } else {
      const discovery = layoutRotation(
        null,
        () => {},
        () => {},
      )
      fightStartFrame =
        combineEarliestFrame(
          discovery.discoveredFightStartFrame,
          earliestDotTickFrame(discovery.layoutLedger),
        ) ?? 0
      layout = layoutRotation(fightStartFrame + fixedWindowFrames, recordWarning, recordInvalidStep)
    }
    const {
      laidSteps,
      layoutLedger,
      layoutHolds,
      meters,
      targetDistanceAt,
      flushMeterEventsUpTo,
      damagingHitTimesSec,
      weaponHitTimesSec,
      discoveredFightEndFrame,
      castCursorFrames,
    } = layout

    // docs/TIMELINE.md § "Fight window": without a fixed window, the fight ends
    // at the last damaging hit, not at the last cast's own end — a DoT tick
    // past it neither extends the window nor counts. A run with no damaging
    // hit at all (every damaging event is a tick) keeps the last cast's end
    // as its boundary, same as before this rule existed.
    const windowFrames =
      fixedWindowFrames === null
        ? (discoveredFightEndFrame ?? castCursorFrames)
        : fightStartFrame + fixedWindowFrames
    // A cast beyond the window still lays out and still shows its own chip
    // state (docs/TIMELINE.md § "Fight window"), so the ledger backing that
    // display stays sized to the full laid-out run — only `inWindow` below,
    // which gates scoring, uses the tighter `windowFrames`.
    const ledgerSpanEnd = fixedWindowFrames === null ? castCursorFrames : windowFrames
    const spanStart = Math.min(0, -prePullBound)
    const rotationDurationSec = (windowFrames - fightStartFrame) / FPS

    flushMeterEventsUpTo(Infinity)
    for (const meter of meters) {
      meter.advanceTo(ledgerSpanEnd)
      for (const meterWarning of meter.warnings)
        warnings.push(
          `${meter.def.name} at ${(meterWarning.frame / FPS).toFixed(2)}s: ${meterWarning.message}.`,
        )
    }

    const inWindow = (frame: number): boolean => frame >= fightStartFrame && frame <= windowFrames

    const castCounts = new Map<string, number>()
    for (const ls of laidSteps) {
      const name = ls.resolved.skill.name
      castCounts.set(name, (castCounts.get(name) ?? 0) + 1)
    }

    // +1: a permanent status's own window is half-open, so its upper bound
    // must clear the ledger's own last frame for a status still to read as
    // active exactly there.
    const ledger = new StatusLedger(spanStart, ledgerSpanEnd + 1)
    for (const meter of meters) {
      ledger.openPermanent(meter.statusId)
      for (const sample of layoutLedger.stackHistory(meter.statusId))
        ledger.recordStack(meter.statusId, sample.frame, sample.value)
    }
    ledger.openPermanent(TARGET_DISTANCE_STATUS)
    for (const sample of layoutLedger.stackHistory(TARGET_DISTANCE_STATUS))
      ledger.recordStack(TARGET_DISTANCE_STATUS, sample.frame, sample.value)
    for (const weapon of weaponIdentities) {
      const statusId = drawnWeaponStatusId(weapon)
      ledger.openPermanent(statusId)
      for (const sample of layoutLedger.stackHistory(statusId))
        ledger.recordStack(statusId, sample.frame, sample.value)
    }
    const recordSpendStatusIds = new Set(
      skills.flatMap((candidate) =>
        candidate.hits.flatMap((skillHit) =>
          skillHit.triggers.flatMap((trigger) => trigger.recordSpendAsStatus ?? []),
        ),
      ),
    )
    for (const statusId of recordSpendStatusIds) {
      ledger.openPermanent(statusId)
      for (const sample of layoutLedger.stackHistory(statusId))
        ledger.recordStack(statusId, sample.frame, sample.value)
    }
    const recordStack = (id: string, frame: number, value: number, owner = UNOWNED) =>
      ledger.recordStack(id, frame, value, owner)
    const stacksAt = (id: string, frame: number) => ledger.stacksAt(id, frame)
    const pushWindow = (id: string, start: number, end: number, owner = UNOWNED) =>
      ledger.pushWindow(id, start, end, owner)
    const openPermanent = (id: string) => ledger.openPermanent(id)
    const conditionHolds = (c: TriggerCondition, frame: number): boolean =>
      unionConditionHolds(c, frame, buffParams, (status, atFrame) =>
        conditionSatisfiedByStacks(status, ledger.conditionStacksAt(status.buffId, atFrame)),
      )
    // A `castSkill` condition's buff-engine source reads whichever engine
    // instance the caller passes — the prepass's own in-progress one while it
    // builds, the fully-resolved one once pass 1 runs.
    const castConditionHoldsFor =
      (engineForGate: BuffEngine | null) =>
      (condition: TriggerCondition, frame: number): boolean =>
        unionConditionHolds(condition, frame, buffParams, (status, atFrame) =>
          status.source === "buffEngine"
            ? !!engineForGate &&
              conditionSatisfiedByStacks(
                status,
                engineForGate.getHistoricalBuffStacks(status.buffId, atFrame / FPS),
              )
            : conditionHolds(status, atFrame),
        )
    const liveWriter = statusWriter(ledger, conditionHolds)
    seedOpeningState(liveWriter, spanStart)

    const buildView: BuildView = {
      classId: inputs.classId,
      innerWayTier: (innerWayId) => innerWayTier(inputs.mindMethods, innerWayId),
      classSpecificAttunement: (attunementId) => inputs.classSpecificAttunement[attunementId] ?? 0,
      grantsMinPhysCritBoost: grantsMinPhysCritBoostFor(inputs.classId),
      openingStacks: openingStacksOf,
    }

    const behaviorFor = buildBehaviors(buildView)

    const hitInputAt = (
      skill: Skill,
      hit: SkillHit,
      frame: number,
      castStartFrame: number,
    ): HitInput => ({
      skill,
      hit,
      frame,
      statuses: ledger,
      build: buildView,
      holds: (condition) => conditionHolds(condition, castStartFrame),
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
      // 0 for a generated cast — a skill's own further in-cast server waits
      // never reach a hit it merely triggers (§ "Coefficients").
      midCastExtraFrames: number
    }

    // The prepass. It walks the whole cast graph — the rotation's casts and every
    // cast they generate — in frame order, so the buff history and the consume
    // ledger are both complete before the damage loop asks anything of them.
    const buffEngine: BuffEngine | null = (() => {
      try {
        const engine = new BuffEngine(buffParams, buffDefsForClass(inputs.classId), groupBuffDefs())
        engine.attachStatuses({ view: ledger, fps: FPS })
        engine.attachQiSchedule(qiSchedule)
        const castTriggerFires = triggerGate(castConditionHoldsFor(engine))
        let sequence = 0
        const pending: PendingCast[] = laidSteps.map((ls) => ({
          frame: ls.startFrame,
          sequence: sequence++,
          skill: ls.resolved.skill,
          hitCount: ls.performedHits.length,
          generated: false,
          inheritedBuffIds: [],
          midCastExtraFrames: ls.midCastExtraFrames,
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
            const grantAtSec = cast.skill.triggersBuffsAtFrame
              ? new Map(
                  Object.entries(cast.skill.triggersBuffsAtFrame).map(([id, frame]) => [
                    id,
                    frame / FPS,
                  ]),
                )
              : undefined
            const result = engine.processSkillCast(
              castTag,
              cast.frame / FPS,
              propsOfSkill(cast.skill, cast.hitCount),
              cast.generated,
              cast.skill.triggersBuffs ?? [],
              skillTagsOf(cast.skill),
              grantAtSec,
            )
            const scoped = [...new Set([...cast.inheritedBuffIds, ...result.buffIds])]
            propagated = [...new Set([...propagated, ...result.propagatedBuffIds])]
            const key = castScopedKey(cast.frame, cast.skill.id)
            castScopedBuffs.set(key, [...new Set([...(castScopedBuffs.get(key) ?? []), ...scoped])])
          }
          const castHolds = (condition: TriggerCondition) => layoutHolds(condition, cast.frame)
          const castDistanceMeters = targetDistanceAt(cast.frame)
          for (const hit of cast.skill.hits.filter((candidate) =>
            hitConditionsHold(candidate, castHolds),
          )) {
            const hitFrame = hitLandingFrame(
              cast.frame,
              resolvedHitFrame(hit, castHolds, castDistanceMeters) + cast.midCastExtraFrames,
            )
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
                midCastExtraFrames: 0,
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

    const castSkillFiresInPass1 = triggerGate(castConditionHoldsFor(buffEngine))

    const resources = (classDefinition(inputs.classId)?.resources ?? [])
      .filter((definition) =>
        laidSteps.some((step) => step.resolved.skill.id === definition.launchSkillId),
      )
      .map(
        (definition) =>
          new CombatResource(definition, inputs.resourceSettings?.[definition.id], {
            fps: FPS,
            startFrame: 0,
            collect: collectDetail,
            buffActive: (id, frame) => buffEngine?.isBuffActiveAtTime(id, frame / FPS) ?? false,
            exhausted: (frame) => qiSchedule.isBroken(frame / FPS),
            paramTier: (id) => (paramOnOf(buffParams, id) ? paramTierOf(buffParams, id) : 0),
          }),
      )
    const resourceByDebuff = new Map(
      resources.map((resource) => [resource.definition.debuffId, resource]),
    )
    const resourceByLaunch = new Map(
      resources.map((resource) => [resource.definition.launchSkillId, resource]),
    )

    const qiBreakWindow = buffEngine
      ? (() => {
          const w = buffEngine.qiBreakWindow()
          return w ? { startSec: w.start, endSec: w.end } : null
        })()
      : null

    const lowQiWindow = buffEngine
      ? (() => {
          const w = buffEngine.lowQiWindow()
          return w ? { startSec: w.start, endSec: w.end } : null
        })()
      : null

    interface PlannedDotTick {
      buffId: string
      status: Debuff
      dot: DebuffDotSpec
      tickSkill: Skill | undefined
      resource: CombatResource | undefined
      episodeStart: number
      plan: DotTickPlan
    }

    // The one walk from a ledger's windows to a DoT's tick frames, shared by the
    // layout pass's own schedule and pass 1's real tick entries — a
    // resource-owning debuff's per-window split (`resourceByDebuff`) cannot
    // drift between the two this way. `resource.tick`'s own consumption check
    // is sequential and stateful, so it only runs where pass 1 calls it, in the
    // real simulation order — a resource-gated DoT's frames from here are an
    // upper bound the layout pass cannot narrow further.
    function plannedDotTicks(
      ledgerEntries: Iterable<[string, readonly StatusWindow[]]>,
      stacksAt: (buffId: string, frame: number) => number,
      weightAt: (buffId: string, frame: number) => number,
    ): PlannedDotTick[] {
      const planned: PlannedDotTick[] = []
      for (const [buffId, arr] of ledgerEntries) {
        const status = statusById.get(buffId)
        if (!status || !isDebuffStatus(status) || !status.dot || status.dot.tickIntervalFrames <= 0)
          continue
        const tickSkill = skillsById.get(tickSourceSkillId(status) ?? "")
        const dot = resolveTickDot(status, tickSkill)
        if (!dot) continue
        const resource = resourceByDebuff.get(buffId)
        const sortedWindows = [...arr].sort((left, right) => left.start - right.start)
        const episodes = resource
          ? sortedWindows.map((window, index) => [
              {
                ...window,
                end: Math.min(
                  window.end,
                  sortedWindows[index + 1]?.start ?? windowFrames + 1,
                  windowFrames + 1,
                ),
              },
            ])
          : [arr]
        for (const episode of episodes) {
          for (const plan of planDotTicks({
            debuff: status,
            dot,
            windows: episode,
            stacksAt: (frame) => stacksAt(buffId, frame),
            inWindow: (frame) => frame <= windowFrames,
            weightAt: (frame) => weightAt(buffId, frame),
          })) {
            planned.push({
              buffId,
              status,
              dot,
              tickSkill,
              resource,
              episodeStart: episode[0].start,
              plan,
            })
          }
        }
      }
      return planned
    }

    // Weighted at 1 throughout: this schedule feeds a mechanic's own `prepare`,
    // which runs before any mechanic can weigh a tick's true uptime.
    const dotTickTimesSec: number[] = []
    for (const { plan } of plannedDotTicks(
      layoutLedger.entries(),
      (buffId, frame) => layoutLedger.stacksAt(buffId, frame),
      () => 1,
    )) {
      if (
        plan.requiresBuff &&
        !(buffEngine?.isBuffActiveAtTime(plan.requiresBuff, plan.frame / FPS) ?? false)
      )
        continue
      dotTickTimesSec.push(plan.frame / FPS)
    }
    dotTickTimesSec.sort((left, right) => left - right)

    const { precision, critRate, affinityRate } = runEffectiveRates
    const mechanicSetup: MechanicSetup = {
      inputs,
      classId: inputs.classId,
      fps: FPS,
      rotationDurationSec,
      windowStartSec: fightStartFrame / FPS,
      hitTimesSec: damagingHitTimesSec,
      weaponHitTimesSec,
      dotTickTimesSec,
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
    // `statusesView` is the ledger a hit's own damage query reads — pass 1's
    // `ledger.asOf(mark)`, taken before this hit's own triggers ran, so a status
    // its own trigger just opened cannot reach its own hit. A tick or a
    // mechanic's extra event never writes the ledger, so both default to the
    // live one.
    function resolveState(
      frame: number,
      skill?: Skill,
      override?: ResolveOverride,
      castFrame = frame,
      damageSoFar = 0,
      statusesView: StatusView = ledger,
    ): Resolved & {
      forceCrit: boolean
      forceNoAbrasion: boolean
      damageFactor: number
      conditionalFinalCrit: ConditionalFinalCrit | null
      artBonuses: Partial<Record<ArtBonusField, number>>
      echoFeeds: readonly EchoFeed[]
      qiBonuses: QiHitBonuses
    } {
      const sigParts: string[] = []
      const effects: BuffStatEffect[] = []
      for (const id of statusesView.activeIdsAt(frame)) {
        const status = statusById.get(id)
        if (!status) continue
        const perStack = (status.stackScaling ?? "flat") === "perStack"
        const count = perStack ? Math.max(0, statusesView.stacksAt(id, frame)) : 1
        sigParts.push(`${id}:${count}`)
        if (perStack) {
          for (const statEffect of status.effects)
            effects.push({ statKey: statEffect.statKey, amount: statEffect.amount * count })
        } else {
          effects.push(...status.effects)
        }
      }
      let sig = sigParts.sort().join("|")
      let forceCritFromBuff = false
      let forceNoAbrasionFromBuff = false
      let damageFactor = 1
      let conditionalFinalCrit: ConditionalFinalCrit | null = null
      let artBonuses: Partial<Record<ArtBonusField, number>> = {}
      let echoFeeds: readonly EchoFeed[] = []
      if (buffEngine && skill) {
        const scoped = castScopedBuffs.get(castScopedKey(castFrame, skill.id)) ?? []
        const site = buffEngine.calculateDamageEffects(
          skill,
          frame / FPS,
          scoped,
          damageSoFar,
          statusesView,
        )
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
        if (site.forceNoAbrasion) forceNoAbrasionFromBuff = true
        damageFactor = site.damageFactor
        conditionalFinalCrit = site.conditionalFinalCrit
        artBonuses = site.artBonuses
        echoFeeds = site.echoFeeds
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
      if (buffEngine) {
        if (buffEngine.qiBroken(frame / FPS)) {
          effects.push({ statKey: "independentDamageBoost", amount: QI_BREAK_HP_DAMAGE_BONUS })
          sig += "~qiBreakBoost"
        }
        if (combat?.healerBuff) {
          const healerAmount = combat.healerPanaceaFan
            ? HEALER_BUFF_PANACEA_FAN_AMOUNT
            : HEALER_BUFF_AMOUNT
          effects.push({ statKey: "allDamageBoost", amount: healerAmount })
          sig += `~healerBuff:${healerAmount}`
        }
      }
      const qiBonuses = qiBonusesFrom(effects)
      let r = stateMemo.get(sig)
      if (!r) {
        const { inputs: effInputs, targetOverride } = applyBuffEffects(inputs, effects)
        const ctx = buildContext(effInputs, targetOverride, contextPatch.hawkwingPhysBonus)
        if (override?.forceGuaranteedAffinity) {
          ctx.affinityPanel = 0
          ctx.directAffinityPanel = 1
        }
        r = { inputs: effInputs, ctx }
        stateMemo.set(sig, r)
      }
      return {
        ...r,
        forceCrit: forceCritFromBuff,
        forceNoAbrasion: forceNoAbrasionFromBuff,
        damageFactor,
        conditionalFinalCrit,
        artBonuses,
        echoFeeds,
        qiBonuses,
      }
    }

    interface DotTickEntry extends DotTickPlan {
      resourceOwner?: number
      debuff: Debuff
      debuffForTick: Debuff
      dotSkill: Skill
      dotName: string
      dotBreakdownName: string
      dotBreakdownKey: string
      dotType: string
    }

    // A hit, a DoT tick, a mechanic's own extra event and an echo release all
    // flow through one frame-ordered list, so `totalDamage` accumulates
    // strictly in time order and a buff module can read it mid-run. `seq`
    // breaks ties at the same frame: a hit before a tick before an extra event
    // before a release, so a release a hit's own trigger fires always scores
    // after that hit.
    type MergedEvent =
      | {
          kind: "hit"
          frame: number
          seq: number
          skill: Skill
          hit: SkillHit
          castFrame: number
          stepStart: number
          extraEffects: BuffStatEffect[]
          forceGuaranteedAffinity: boolean
          ledgerMark: number
        }
      | { kind: "tick"; frame: number; seq: number; entry: DotTickEntry }
      | { kind: "extra"; frame: number; seq: number; event: MechanicEvent }
      | { kind: "echoRelease"; frame: number; seq: number; debuffId: string }

    const MERGED_KIND_PRIORITY: Record<MergedEvent["kind"], number> = {
      hit: 0,
      tick: 1,
      extra: 2,
      echoRelease: 3,
    }
    function byMergedOrder(left: MergedEvent, right: MergedEvent): number {
      return (
        left.frame - right.frame ||
        MERGED_KIND_PRIORITY[left.kind] - MERGED_KIND_PRIORITY[right.kind] ||
        left.seq - right.seq
      )
    }

    const echoPotByDebuff = new Map<string, number>()
    const echoOf = (debuffId: string) => {
      const status = statusById.get(debuffId)
      return status && isDebuffStatus(status) ? (status.echo ?? null) : null
    }
    const bankEcho = (frame: number, feeds: readonly EchoFeed[], damage: number): void => {
      for (const feed of feeds) {
        const echo = echoOf(feed.debuffId)
        if (!echo || !ledger.isActiveAt(feed.debuffId, frame)) continue
        echoPotByDebuff.set(
          feed.debuffId,
          (echoPotByDebuff.get(feed.debuffId) ?? 0) + damage * echo.share,
        )
      }
    }

    const queue = new EventQueue()
    let seq = 0
    for (const ls of laidSteps) {
      const stepDistanceMeters = targetDistanceAt(ls.startFrame)
      for (const hit of ls.performedHits) {
        queue.push({
          frame: hitLandingFrame(
            ls.startFrame,
            resolvedHitFrame(
              hit,
              (condition) => layoutHolds(condition, ls.startFrame),
              stepDistanceMeters,
            ) + ls.midCastExtraFrames,
          ),
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
    const outcomeDamageTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const expectedShareTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const tallyRoll = (rolled: RolledHit, damage: number): void => {
      outcomeTally[rolled.outcome] += 1
      outcomeDamageTally[rolled.outcome] += damage
      for (const outcome of OUTCOME_KEYS) expectedShareTally[outcome] += rolled.chance[outcome]
    }
    // Pass 1: walks every hit — laid, and every one a trigger chain
    // generates — in frame order, firing triggers and writing the status
    // ledger exactly as a single chronological pass would. No damage is
    // scored here: a window's coverage at a fixed frame can only ever be
    // widened by a later trigger for frames after that trigger's own frame,
    // never for one before it, so the ledger this pass builds is safe to
    // query from pass 2, however later that runs. `onHit`/`claimStatEffects`
    // still run here — they can write the ledger via `setStatus` — but their
    // `stat`/`forceOutcome` output only feeds the formula, so it is captured
    // onto the hit's own merged event for pass 2 instead of reapplied there.
    const mergedEvents: MergedEvent[] = []
    let mergedSeq = 0
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
      const hitInput = hitInputAt(skill, hit, frame, castFrame)
      const extraEffects: BuffStatEffect[] = []
      let forceGuaranteedAffinity = false
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
        echo: () => {},
        finalCritAtLeast: () => {},
      }
      for (const effect of behavior.onHit?.(hitInput) ?? []) applyEffect(hitSink, effect)
      const qiPhase = buffEngine?.qiPhase(frame / FPS) ?? "normal"
      for (const effect of behavior.claimStatEffects(hitInput, qiPhase))
        applyEffect(hitSink, effect)

      const hitInWindow = inWindow(frame)
      const ledgerMark = ledger.mark()
      mergedEvents.push({
        kind: "hit",
        frame,
        seq: mergedSeq++,
        skill,
        hit,
        castFrame,
        stepStart,
        extraEffects,
        ledgerMark,
        forceGuaranteedAffinity,
      })

      if (hitDealsDamage(hit)) liveWriter.onDamagingHit(frame, stepStart)
      for (const trigger of hit.triggers) {
        if (trigger.kind === "detonateDot") continue
        if (trigger.kind === "releaseEcho") {
          if (hitInWindow && liveWriter.fires(trigger, frame))
            mergedEvents.push({
              kind: "echoRelease",
              frame,
              seq: mergedSeq++,
              debuffId: trigger.targetId,
            })
          continue
        }
        if (
          trigger.kind === "applyBuff" ||
          trigger.kind === "applyDebuff" ||
          trigger.kind === "clearStatus"
        ) {
          liveWriter.applyTrigger(
            trigger,
            trigger.appliesOnCastEnd
              ? castEndFrame(
                  skill,
                  castFrame,
                  (condition) => conditionHolds(condition, castFrame),
                  targetDistanceAt(castFrame),
                )
              : frame,
            stepStart,
          )
          continue
        }
        const triggerFires =
          trigger.kind === "castSkill"
            ? castSkillFiresInPass1(trigger, frame)
            : liveWriter.fires(trigger, frame)
        if (!triggerFires) continue
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
            if (sub) {
              const subHolds = (condition: TriggerCondition) => conditionHolds(condition, frame)
              const subDistanceMeters = targetDistanceAt(frame)
              for (const subHit of sub.hits.filter((candidate) =>
                hitConditionsHold(candidate, subHolds),
              )) {
                queue.push({
                  frame: hitLandingFrame(
                    frame,
                    resolvedHitFrame(subHit, subHolds, subDistanceMeters),
                  ),
                  seq: seq++,
                  skill: sub,
                  hit: subHit,
                  castFrame: frame,
                  stepStart,
                })
              }
            }
          }
          continue
        }
        const sub = skillsById.get(trigger.targetId)
        if (!sub) continue
        const subHolds = (condition: TriggerCondition) => conditionHolds(condition, frame)
        const subDistanceMeters = targetDistanceAt(frame)
        for (const subHit of sub.hits.filter((candidate) =>
          hitConditionsHold(candidate, subHolds),
        )) {
          queue.push({
            frame: hitLandingFrame(frame, resolvedHitFrame(subHit, subHolds, subDistanceMeters)),
            seq: seq++,
            skill: sub,
            hit: subHit,
            castFrame: frame,
            stepStart,
          })
        }
      }
    }

    liveWriter.processExpiries(windowFrames)

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
      const castsUnsorted: RotationCast[] = laidSteps.map((ls) => {
        const stepHolds = (condition: TriggerCondition) => conditionHolds(condition, ls.startFrame)
        const stepDistanceMeters = targetDistanceAt(ls.startFrame)
        const lastHitFrame =
          ls.performedHits.length > 0
            ? Math.max(
                ...ls.performedHits.map(
                  (hit) =>
                    resolvedHitFrame(hit, stepHolds, stepDistanceMeters) + ls.midCastExtraFrames,
                ),
              )
            : 0
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
          stepIndex: ls.stepIndex,
          skillName: ls.resolved.skill.name,
          timeSec: ls.startFrame / FPS,
          inWindow: inWindow(ls.startFrame),
          prePull: ls.prePull,
          buffs,
          meterLevels:
            meters.length > 0
              ? meters.map((meter) => ({
                  id: meter.def.id,
                  name: meter.def.name,
                  amount: layoutLedger
                    .asOf(ls.meterMarkAtStart)
                    .stacksAt(meter.statusId, ls.startFrame),
                  capacity: meter.capacity,
                }))
              : undefined,
          distanceMeters: layoutLedger.stacksAt(TARGET_DISTANCE_STATUS, ls.startFrame),
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

    const dotTickEntries: DotTickEntry[] = []
    for (const { status, dot, tickSkill, resource, episodeStart, plan } of plannedDotTicks(
      ledger.entries(),
      (buffId, frame) => stacksAt(buffId, frame),
      (buffId, frame) => {
        for (const { mechanic, state } of mechanics) {
          const weight = mechanic.tickWeightAt?.(state, buffId, frame, mechanicSetup)
          if (weight !== null && weight !== undefined) return weight
        }
        return 1
      },
    )) {
      const entry: DotTickEntry = {
        ...plan,
        resourceOwner: resource ? episodeStart : undefined,
        debuff: status,
        debuffForTick: { ...status, dot },
        dotBreakdownKey: status.breakdownName
          ? debuffBreakdownKey(status.id)
          : debuffKey(status.id),
        dotSkill: dotTickSkill(status, tickSkill),
        dotName: dotRowName(status),
        dotBreakdownName: breakdownNameOf(status.breakdownName, status.name),
        dotType: dot.skillType || "sustain",
      }
      dotTickEntries.push(entry)
      mergedEvents.push({ kind: "tick", frame: entry.frame, seq: mergedSeq++, entry })
    }

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
      const resolved = buildView.grantsMinPhysCritBoost(weaponType)
        ? minPhysCritBonus(smallPhys)
        : 0
      return { ...entry.debuffForTick, dot: { ...dot, extraCritDamage: resolved } }
    }

    for (const { mechanic, state } of mechanics) {
      for (const event of mechanic.extraEvents?.(state, mechanicSetup) ?? []) {
        mergedEvents.push({ kind: "extra", frame: event.frame, seq: mergedSeq++, event })
      }
    }

    function coverageEnds(windows: readonly StatusWindow[]): number[] {
      const ends: number[] = []
      let coveredUntil: number | null = null
      for (const window of [...windows].sort((left, right) => left.start - right.start)) {
        if (coveredUntil !== null && window.start > coveredUntil) {
          ends.push(coveredUntil)
          coveredUntil = null
        }
        coveredUntil = coveredUntil === null ? window.end : Math.max(coveredUntil, window.end)
      }
      if (coveredUntil !== null) ends.push(coveredUntil)
      return ends
    }

    // A pot no `releaseEcho` trigger claims is paid out when the debuff's
    // coverage lapses, and never after the rotation ends — scheduled here from
    // the final ledger, alongside every trigger-fired release pass 1 already
    // queued, so both flow through the one time-ordered pass below.
    for (const [debuffId, status] of statusById) {
      if (!isDebuffStatus(status) || !status.echo) continue
      const windows = ledger.windowsOf(debuffId)
      if (windows.length === 0) continue
      for (const frame of coverageEnds(windows).filter((end) => end <= windowFrames))
        mergedEvents.push({ kind: "echoRelease", frame, seq: mergedSeq++, debuffId })
    }

    // Pass 2: every damage event, in true time order — a hit, a tick (its
    // declared buffs applied immediately before its own damage is scored, so a
    // later event of any kind already sees them), a mechanic's extra event, and
    // an echo release, which takes whatever this debuff has banked since its
    // last release. `totalDamage` accumulates as each one is scored, so a buff
    // module's `target.remainingHealthFraction` reads the true running total.
    mergedEvents.sort(byMergedOrder)
    for (const event of mergedEvents) {
      for (const resource of resources)
        resource.advance(Math.min(windowFrames, Math.max(0, event.frame)))
      if (event.kind === "hit") {
        const { frame, skill, hit, castFrame, extraEffects, forceGuaranteedAffinity, ledgerMark } =
          event
        const launchResource = resourceByLaunch.get(skill.id)
        if (launchResource && inWindow(frame) && !launchResource.launch(frame)) {
          continue
        }
        const behavior = behaviorFor(skill)
        const hitInput = hitInputAt(skill, hit, frame, castFrame)
        const resolveOverride: ResolveOverride | undefined =
          extraEffects.length > 0 || forceGuaranteedAffinity
            ? { extraEffects, forceGuaranteedAffinity }
            : undefined
        const st = resolveState(
          frame,
          skill,
          resolveOverride,
          castFrame,
          totalDamage,
          ledger.asOf(ledgerMark),
        )
        const hitContext: HitContext = {
          phase: buffEngine?.qiPhase(frame / FPS) ?? "normal",
          smallPhys: st.ctx.smallPhys,
          isEngineBuffActive: (id) => buffEngine?.isBuffActiveAtTime(id, frame / FPS) ?? false,
        }
        const art = behavior.buildArt(hitInput, hitContext)
        if (st.forceCrit) art.guaranteedCrit = 1
        if (st.forceNoAbrasion) art.abrasionAvoidRate = 1
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
          echo: () => {},
          finalCritAtLeast: () => {},
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
        const landsInFight = inWindow(frame)
        // The target takes this damage whether or not it falls inside the DPS
        // window, so its Qi bar accrues regardless — docs/TIMELINE.md § "Qi bar".
        if (hitDealsDamage(hit))
          qiBar.apply(
            frame,
            qiFromDamage({
              damage,
              targetHpMax: qiTargetHpMaxValue,
              qiRate: hit.qiRate ?? 1,
              qiFlat: hit.qiFlat ?? 0,
              bonuses: st.qiBonuses,
              takenIndex: qiTargetBar.takenIndex,
              playerQiIndex: PLAYER_QI_DAMAGE_INDEX,
            }),
            "direct",
          )
        if (landsInFight) {
          if (hitDealsDamage(hit))
            for (const resource of resources) resource.hit(skill, frame, castFrame)
          totalDamage += damage
          if (rolled) tallyRoll(rolled, damage)
          // A hit that carries no coefficient exists to fire its triggers, and
          // counting it would put hits a player never sees in the breakdown.
          if (hitDealsDamage(hit)) {
            add(
              skill.name,
              skill.skillType,
              1,
              damage,
              breakdownNameOf(skill.breakdownName, skill.name),
              skillBreakdownRowKey(skill),
            )
          }
          bankEcho(frame, st.echoFeeds, damage)
        }
        pushEvent({
          frame,
          timeSec: frame / FPS,
          skillName: skill.name,
          type: skill.skillType,
          kind: "hit",
          damage,
          inWindow: landsInFight,
        })
      } else if (event.kind === "tick") {
        const { entry } = event
        const resource = resourceByDebuff.get(entry.debuff.id)
        if (
          entry.requiresBuff &&
          !buffEngine?.isBuffActiveAtTime(entry.requiresBuff, entry.frame / FPS)
        )
          continue
        if (resource && !resource.tick(entry.frame, entry.resourceOwner!)) continue
        if (entry.debuff.triggersBuffs && entry.debuff.triggersBuffs.length > 0) {
          buffEngine?.triggerDeclaredBuffs(
            entry.debuff.triggersBuffs,
            castTagOf(entry.dotSkill),
            entry.frame / FPS,
            propsOfSkill(entry.dotSkill, 1),
            false,
            skillTagsOf(entry.dotSkill),
          )
        }
        const st = resolveState(entry.frame, entry.dotSkill, undefined, entry.frame, totalDamage)
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
        // The target takes this tick whether or not it falls inside the DPS
        // window, so its Qi bar accrues and a debuff it declares reaches
        // still fires regardless — docs/TIMELINE.md § "Qi bar", § "Triggers".
        // Only the reported total, breakdown and echo bank stay gated to the
        // window, the same threshold a direct hit already uses.
        qiBar.apply(
          entry.frame,
          qiFromDamage({
            damage,
            targetHpMax: qiTargetHpMaxValue,
            qiRate: entry.debuffForTick.dot?.qiRate ?? 1,
            qiFlat: entry.debuffForTick.dot?.qiFlat ?? 0,
            bonuses: st.qiBonuses,
            takenIndex: qiTargetBar.takenIndex,
            playerQiIndex: PLAYER_QI_DAMAGE_INDEX,
          }),
          entry.debuffForTick.dot?.qiHitKind ??
            (entry.debuffForTick.dot?.directHit ? "direct" : "dot"),
        )
        const landsInFight = inWindow(entry.frame)
        if (landsInFight) {
          totalDamage += damage
          if (tick.rolled) tallyRoll(tick.rolled, damage)
          add(
            entry.dotName,
            entry.dotType,
            1,
            damage,
            entry.dotBreakdownName,
            entry.dotBreakdownKey,
          )
          bankEcho(entry.frame, st.echoFeeds, damage)
        }
        pushEvent({
          frame: entry.frame,
          timeSec: entry.frame / FPS,
          skillName: entry.dotName,
          type: entry.dotType,
          kind: "dot",
          damage,
          inWindow: landsInFight,
        })
      } else if (event.kind === "extra") {
        const mechEvent = event.event
        const st = resolveState(
          mechEvent.frame,
          mechEvent.skill,
          undefined,
          mechEvent.frame,
          totalDamage,
        )
        const art = { ...mechEvent.art } as Parameters<typeof computeSkillDamage>[0]
        if (st.forceCrit) art.guaranteedCrit = 1
        if (st.forceNoAbrasion) art.abrasionAvoidRate = 1
        const { expectedDamage, rolled } = computeSkillDamage(art, st.ctx, 1, hitRng)
        const damage = rolled?.damage ?? expectedDamage
        qiBar.apply(
          mechEvent.frame,
          qiFromDamage({
            damage,
            targetHpMax: qiTargetHpMaxValue,
            qiRate: mechEvent.qiRate ?? 1,
            qiFlat: mechEvent.qiFlat ?? 0,
            bonuses: st.qiBonuses,
            takenIndex: qiTargetBar.takenIndex,
            playerQiIndex: PLAYER_QI_DAMAGE_INDEX,
          }),
          mechEvent.qiHitKind ?? "direct",
        )
        const landsInFight = inWindow(mechEvent.frame)
        if (landsInFight) {
          totalDamage += damage
          if (rolled) tallyRoll(rolled, damage)
          add(
            mechEvent.name,
            mechEvent.type,
            1,
            damage,
            breakdownNameOf(mechEvent.skill.breakdownName, mechEvent.name),
            skillBreakdownRowKey(mechEvent.skill),
          )
          bankEcho(mechEvent.frame, st.echoFeeds, damage)
        }
        pushEvent({
          frame: mechEvent.frame,
          timeSec: mechEvent.frame / FPS,
          skillName: mechEvent.name,
          type: mechEvent.type,
          kind: "hit",
          damage,
          inWindow: landsInFight,
        })
      } else {
        const pot = echoPotByDebuff.get(event.debuffId) ?? 0
        echoPotByDebuff.set(event.debuffId, 0)
        if (pot <= 0) continue
        const echo = echoOf(event.debuffId)!
        const adjustment = echo.releaseAdjustment
        const paid =
          adjustment &&
          adjustment.requiresStatuses.every((id) => ledger.isActiveAt(id, event.frame))
            ? pot * adjustment.factor
            : pot
        totalDamage += paid
        add(
          echo.breakdownName,
          echo.skillType,
          1,
          paid,
          echo.breakdownName,
          debuffEchoKey(event.debuffId),
        )
        pushEvent({
          frame: event.frame,
          timeSec: event.frame / FPS,
          skillName: echo.breakdownName,
          type: echo.skillType,
          kind: "hit",
          damage: paid,
          inWindow: true,
        })
      }
    }

    const resourceResults = resources.map((resource) => resource.finish(windowFrames))
    for (const resource of resources) {
      ledger.constrainWindows(
        resource.definition.debuffId,
        resource.result.launches
          .filter((launch) => launch.reason !== "insufficient")
          .map((launch) => ({
            start: Math.round(launch.timeSec * FPS),
            end: Math.round(launch.endSec * FPS),
          })),
      )
    }

    // Only now is `buffHistory` settled by every event, ticks included, so a
    // cast chip reports what a tick applied to it.
    const casts: RotationCast[] = collectDetail ? buildCasts() : []
    const buffWindows: BuffWindow[] = collectDetail ? buildBuffWindows() : []

    timeline.sort(
      (a, b) => a.frame - b.frame || (a.kind === b.kind ? 0 : a.kind === "hit" ? -1 : 1),
    )

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

    const dps = rotationDurationSec > 0 ? totalDamage / rotationDurationSec : 0
    if (castCursorFrames <= 0)
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

    const qiComputedSchedule = qiBar.schedule()
    const qiTrace: { timeSec: number; fraction: number }[] = []
    if (collectDetail) {
      for (let sampleSec = 0; sampleSec <= windowFrames / FPS; sampleSec += 1) {
        qiTrace.push({ timeSec: sampleSec, fraction: qiComputedSchedule.fractionAt(sampleSec) })
      }
    }
    const result: Result = {
      dps,
      ...(resourceResults.length > 0 ? { resources: resourceResults } : {}),
      totalDamage,
      rotationDuration: rotationDurationSec,
      fightStartSec: fightStartFrame / FPS,
      castDuration: castCursorFrames / FPS,
      graduationRate: null,
      perSkill,
      ranking: [],
      warnings,
      ...(invalidStepIds.length > 0 ? { invalidStepIds } : {}),
      timeline,
      buffWindows,
      qiBreakWindow,
      lowQiWindow,
      casts,
      outcomeCounts: hitRng ? outcomeTally : undefined,
      outcomeDamage: hitRng ? outcomeDamageTally : undefined,
      expectedOutcomeShare: hitRng ? expectedOutcomeShare : undefined,
      qiBreaks: qiComputedSchedule.breaks,
      qiTrace,
      qiIterations: qiIteration,
    }

    if (fixedQiBreaks) return result

    const qiBreaksFrames = qiBar.breaksFrames()
    const qiConverged =
      qiPreviousBreaksFrames !== null && sameQiBreaks(qiPreviousBreaksFrames, qiBreaksFrames)
    if (qiConverged) return result
    if (qiIteration >= QI_MAX_ITERATIONS) {
      result.warnings = [
        ...result.warnings,
        `Qi break schedule did not converge within ${QI_MAX_ITERATIONS} iterations.`,
      ]
      return result
    }
    qiPreviousBreaksFrames = qiBreaksFrames
    qiSchedule = qiComputedSchedule
  }
}

function emptyResult(warnings: string[]): Result {
  return {
    dps: 0,
    totalDamage: 0,
    rotationDuration: 0,
    fightStartSec: 0,
    castDuration: 0,
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
