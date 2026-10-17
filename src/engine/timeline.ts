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
import type {
  ConditionFailureReason,
  HitDistance,
  HitTrigger,
  MeterCost,
  Skill,
  SkillHit,
  StatusCondition,
  TriggerCondition,
} from "./skill"
import {
  breakdownNameOf,
  conditionIds,
  conditionSatisfiedByStacks,
  hasBuffEngineSource,
  isAnyOfCondition,
  isParamCondition,
  isPrePullSkill,
  hitConditionsHold,
  hitDealsDamage,
  OP_SYMBOL,
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
  type MechanicEventInfo,
  type MechanicEventSource,
  type MechanicHost,
  type MechanicSetup,
  type PreparedMechanic,
} from "./mechanics"
import {
  dotRowName,
  dotTickDamage,
  dotPulseSchedule,
  dotTickSkill,
  mergeEpisodes,
  planDotTickLaunch,
  resolveDotTickLanding,
  resolveTickDot,
  tickSourceSkillId,
  type DotPulseQuery,
  type DotPulseSchedule,
  type DotTickLanding,
  type DotTickLaunch,
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
import { CombatResource, type ResourceTickOutcome } from "./resources"
import { MeterEngine } from "./meter"
import { settleLateMeters, lateMeterStatusIds, type LateMeterSettlement } from "./lateMeter"
import {
  inDisplayUnits,
  meterMaxParamKey,
  type MeterMaxContext,
} from "../definitions/resources/meterDef"
import { buildContext, effectiveRates } from "./panel"
import { computeSkillDamage, type HitOutcome, type RolledHit } from "./formula"
import { EXTENSION_STREAM_OFFSET, mechanicSubstream, mulberry32 } from "./rng"
import { applyBuffEffects } from "./statRegistry"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./builtinLibrary"
import { builtinBuffsForClass } from "./builtinBuffs"
import {
  BuffEngine,
  TARGET_DISTANCE_STATUS,
  type DamageEffectsResult,
  type DeferredBuffGrant,
} from "./buffs/buffEngine"
import { AFTER_HIT_SEC, SAME_FRAME_STEP_SEC } from "./buffs/frameOrder"
import { distanceReaderAtCast, type Displacement } from "./distance"
import { IN_COMBAT_STATUS } from "./combatState"
import type { ConditionalFinalCrit } from "./buffs/buffModule"
import { PROP_TO_PROPERTY, type SkillProperties } from "./effects/context"
import { buffDefsForClass, groupBuffDefs } from "./buffs/data"
import { paramNumOf, paramOnOf, paramTierOf, paramsFromInputs } from "./buffs/params"
import { DEFAULT_QI_BREAK_WINDOW } from "./qiBreak"
import { QiEdgeDependence, qiEdgeSiteOf } from "./qiBreakEdge"
import { EventQueue } from "./eventQueue"
import {
  QiBar,
  ScriptedQiBar,
  fixedQiSchedule,
  liveBarQiReader,
  qiBonusesFrom,
  qiFromDamage,
  qiReaderReadingFrame,
  sameQiBreaks,
  scheduleQiReader,
  warmStartQiSchedule,
  type QiBreak,
  type QiHitBonuses,
  type QiReader,
  type QiSchedule,
  type QiTargetBar,
} from "./qiBar"
import { QI_TARGETS, qiTargetHpMax } from "../data/baseStats/qiTargets"
import { PLAYER_QI_DAMAGE_INDEX, QI_BREAK_HP_DAMAGE_BONUS } from "../data/baseStats/qiConstants"
import { castTagOf, skillTagsOf, weaponTagOf, WEAPON_TAG } from "./buffs/tags"
import {
  DRAWN_STATUS_PREFIX,
  drawnWeaponStatusId,
  expandStepsWithWeaponSwaps,
  makeDirectWeaponSwapSkill,
  weaponIdentitiesOf,
} from "./weaponSwap"
import { deflectCancelSkillId, expandStepsWithDeflectCancels } from "./deflectCancels"
import { innerWayTier } from "../definitions/innerWays/registry"
import { paramSourceOf, type ParamSource } from "./buffs/paramSource"
import "../definitions/consumables/registry"
import { PROP } from "../data/skills/ids"
import {
  HEALER_BUFF_AMOUNT,
  HEALER_BUFF_PANACEA_FAN_AMOUNT,
} from "../data/skills/buffs/healerBuffAmounts"
import { resolveAverageFps, resolvePingMs, resolveServerProcessingMs } from "./pingFps"

export const FPS = 60
const ENGINE_READ_LEAD_SEC = 1e-9
// Frames: a grant stamped this close past a frame boundary (1e-6 s lead offsets,
// float noise) still lands on that boundary's frame.
const DEFERRED_GRANT_FRAME_SLACK = 1e-3

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

// A keyframe due at `value` fires on the first rendered frame at or after it,
// so it lands on the next multiple of the render period at or above `value`.
export function quantiseToRenderFrame(value: number, renderPeriodFrames: number): number {
  if (renderPeriodFrames <= 0) return value
  return Math.ceil(value / renderPeriodFrames - 1e-9) * renderPeriodFrames
}

const OUTCOME_KEYS: readonly HitOutcome[] = ["abrasion", "normal", "crit", "affinity"]

// Guards against a runaway cast-skill trigger chain.
const EVENT_CAP = 100_000

interface ConditionReader {
  stacksOf(condition: StatusCondition, frame: number): number
  nameOf?(buffId: string): string | undefined
}

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

function activeVariantDisplacement(
  hits: readonly SkillHit[],
  holds: (condition: TriggerCondition) => boolean,
): Displacement | undefined {
  for (const skillHit of hits) {
    const variant = selectHitVariant(skillHit, holds)
    if (variant?.displacement) return variant.displacement
  }
  return undefined
}

function activeVariantCastFrames(
  hits: readonly SkillHit[],
  holds: (condition: TriggerCondition) => boolean,
): number | null {
  for (const skillHit of hits) {
    const variant = selectHitVariant(skillHit, holds)
    if (variant?.castFrames !== undefined && variant.castFrames > 0) return variant.castFrames
  }
  return null
}

export function simulateTimeline(inputs: Inputs, options?: EngineRunOptions): Result {
  const collectDetail = options?.collect !== "totals"
  const hitRng = options?.seed === undefined ? undefined : mulberry32(options.seed)
  const extensionRng =
    options?.seed === undefined
      ? undefined
      : mulberry32((options.seed ^ EXTENSION_STREAM_OFFSET) | 0)
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

  const qiWarmStartBreaks = options?.qiScheduleSeedBreaks
  const fixedQiBreaks = options?.fixedQiBreaks
  const scriptedQiBar = fixedQiBreaks ? new ScriptedQiBar(fixedQiBreaks, FPS) : null
  let qiSchedule: QiSchedule = scriptedQiBar
    ? scriptedQiBar.schedule()
    : qiWarmStartBreaks
      ? warmStartQiSchedule(qiWarmStartBreaks, FPS)
      : fixedQiSchedule(DEFAULT_QI_BREAK_WINDOW, FPS)
  const QI_MAX_ITERATIONS = 6
  const resolvedStateAcrossPasses = new Map<
    string,
    { inputs: Inputs; ctx: ReturnType<typeof buildContext> }
  >()
  // A warm-started seed is a prior run's own converged schedule, so if this
  // build's first pass reproduces it exactly, that pass already is the fixed
  // point — docs/UI.md § "The rules", "one verifying run". The default window
  // seeding a cold run carries no such guarantee, and keeps requiring a real
  // second pass to confirm.
  let qiPreviousBreaksFrames: readonly QiBreak[] | null = qiWarmStartBreaks ?? null

  for (let qiIteration = 1; ; qiIteration++) {
    const qiBar = new QiBar(qiTargetBar, FPS, options?.qiDamageLog)
    const iterationQiReader: QiReader = scriptedQiBar ?? scheduleQiReader(qiSchedule)

    const skillsMap = new Map<string, Skill>()
    for (const s of builtinSkillsForClass(inputs.classId)) skillsMap.set(s.id, s)
    for (const s of inputs.customSkills ?? []) skillsMap.set(s.id, s)
    const skills = [...skillsMap.values()]
    const buffParams = paramsFromInputs(inputs)
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
    const deflectCancelAttachedToStepId = new Map<string, string>()
    const deflectCancelSkill = skillsById.get(deflectCancelSkillId(inputs.classId))
    const stepsWithDeflectCancels = deflectCancelSkill
      ? expandStepsWithDeflectCancels(rawResolvedSteps, deflectCancelSkill, (parentStepId) => {
          const stepId = `deflect-cancel-${parentStepId}`
          deflectCancelAttachedToStepId.set(stepId, parentStepId)
          return { step: { id: stepId, skillId: deflectCancelSkill.id }, skill: deflectCancelSkill }
        })
      : rawResolvedSteps
    let nextSwapStepIndex = 0
    const directSwapSkills = new Set<Skill>()
    const resolvedSteps = expandStepsWithWeaponSwaps(stepsWithDeflectCancels, (weapon, prePull) => {
      const skill = makeDirectWeaponSwapSkill(
        inputs.classId,
        weapon,
        prePull,
        DIRECT_SWAP_CAST_FRAMES,
      )
      directSwapSkills.add(skill)
      return { step: { id: `swap-${skill.id}-${nextSwapStepIndex++}`, skillId: skill.id }, skill }
    })
    const warnings: string[] = []
    const invalidStepIds: string[] = []
    const invalidStepReasons: Record<string, ConditionFailureReason[]> = {}

    interface CastRecord {
      resolved: ResolvedStep
      stepIndex: number
      prePull: boolean
      startFrame: number
      castLen: number
      performedHits: SkillHit[]
      // Taken before the step's own meter costs apply, so a reported meter level
      // is the one available when the cast was placed.
      meterMarkAtStart: number
      // This step's own further in-cast server waits, already resolved to
      // frames — every later reader of a performed hit's frame adds it, the
      // same way `hitLandingFrame` itself is shared rather than reimplemented.
      midCastExtraFrames: number
      hitDistanceMeters: HitDistance
    }

    const openingBuffsById = new Map(buffs.map((b) => [b.id, b] as const))
    const openingStatusIds = new Set(Object.keys(rotation.openingStacks ?? {}))
    for (const b of buffs) if (b.defaultOpeningStacks !== undefined) openingStatusIds.add(b.id)
    const openingStacksOf = (id: string): number =>
      rotation.openingStacks?.[id] ?? openingBuffsById.get(id)?.defaultOpeningStacks ?? 0

    interface StatusWriter {
      openPermanent(id: string): void
      processExpiries(upToFrame: number): void
      expireEarliest(upToFrame: number): boolean
      onDamagingHit(frame: number, owner: number): void
      fires(
        trigger: HitTrigger,
        frame: number,
        conditionHolds?: (condition: TriggerCondition, frame: number) => boolean,
      ): boolean
      applyTrigger(trigger: HitTrigger, frame: number, owner: number): void
      seedStack(status: Buff | Debuff, frame: number, stacks: number): void
    }

    interface CooldownGroup {
      firedAt: number
      members: Set<HitTrigger>
      cutFrames: number
      cooldownFrames: number
      floorFrames: number
    }

    function triggerGate(holds: (condition: TriggerCondition, frame: number) => boolean): {
      fires: (
        trigger: HitTrigger,
        frame: number,
        conditionHolds?: (condition: TriggerCondition, frame: number) => boolean,
      ) => boolean
      cut: (trigger: HitTrigger, frame: number) => void
    } {
      const cooldownGroups = new Map<string, CooldownGroup>()
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
      const guardsHold = (trigger: HitTrigger, frame: number, conditionHolds = holds): boolean => {
        if (!triggerConditions(trigger).every((condition) => conditionHolds(condition, frame)))
          return false
        if (
          trigger.phase !== undefined &&
          iterationQiReader.phaseAt(frame / FPS, "afterHit") !== trigger.phase
        )
          return false
        return (
          trigger.requiresParam === undefined ||
          unionConditionHolds(
            { param: trigger.requiresParam, minTier: trigger.requiresMinTier },
            frame,
            buffParams,
            () => false,
          )
        )
      }
      const remainingWait = (group: CooldownGroup): number =>
        Math.max(group.floorFrames, group.cooldownFrames - group.cutFrames)
      return {
        fires(trigger, frame, conditionHolds) {
          if (!guardsHold(trigger, frame, conditionHolds)) return false
          if (trigger.cooldownFrames === undefined) return true
          const groupKey = groupKeyOf(trigger)
          const group = cooldownGroups.get(groupKey)
          if (group !== undefined) {
            if (frame === group.firedAt && !group.members.has(trigger)) {
              group.members.add(trigger)
              return true
            }
            if (frame - group.firedAt < remainingWait(group)) return false
          }
          cooldownGroups.set(groupKey, {
            firedAt: frame,
            members: new Set([trigger]),
            cutFrames: 0,
            cooldownFrames: trigger.cooldownFrames,
            floorFrames: trigger.cooldownFloorFrames ?? 0,
          })
          return true
        },
        cut(trigger, frame) {
          if (!guardsHold(trigger, frame)) return
          const group = cooldownGroups.get(trigger.targetId)
          if (group === undefined || frame - group.firedAt >= remainingWait(group)) return
          group.cutFrames += trigger.stacks
        },
      }
    }

    function statusWriter(
      target: StatusLedger,
      holds: (condition: TriggerCondition, frame: number) => boolean,
    ): StatusWriter {
      const { fires, cut } = triggerGate(holds)
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
        if (status.activation === "permanent") target.openPermanent(status.id, frame)
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
        if (trigger.kind === "cooldownCut") {
          cut(trigger, frame)
          return
        }
        if (trigger.kind === "clearStatus") {
          if (!fires(trigger, frame)) return
          const status = statusById.get(trigger.targetId)
          if (!status) return
          const activeWindow = target.longestActiveWindow(status.id, frame)
          if (activeWindow) target.cutWindow(activeWindow, frame, owner)
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
            target.extendWindow(activeWindow, frame, nextEnd, owner)
          } else if (!trigger.extendOnly) grant(status, frame, trigger.stacks, owner, fireMaxStacks)
          return
        }
        grant(status, frame, trigger.stacks, owner, fireMaxStacks, trigger.durationFrames)
      }

      const expireEarliest = (upToFrame: number): boolean => {
        let earliest: { status: Buff; window: StatusWindow } | null = null
        for (const status of expiring)
          for (const window of target.windowsOf(status.id))
            if (
              !expired.has(window) &&
              window.end <= upToFrame &&
              (earliest === null || window.end < earliest.window.end)
            )
              earliest = { status, window }
        if (earliest === null) return false
        const { status, window } = earliest
        expired.add(window)
        const refreshed = target
          .windowsOf(status.id)
          .some((other) => other !== window && other.start <= window.end && window.end < other.end)
        if (refreshed) return true
        const reset = status.onExpire!
        const requirementMet =
          !reset.requiresBuffId || target.longestActiveWindow(reset.requiresBuffId, window.end)
        if (!requirementMet && reset.elseStacks === undefined) return true
        const resetTarget = statusById.get(reset.targetId)
        if (!resetTarget) return true
        const next = clamp(requirementMet ? reset.stacks : reset.elseStacks!, 0, capOf(resetTarget))
        write(resetTarget, window.end, next, window.owner ?? UNOWNED, false, true)
        return true
      }

      return {
        openPermanent: (id) => target.openPermanent(id),
        expireEarliest,
        processExpiries(upToFrame) {
          while (expireEarliest(upToFrame));
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
    const oneRenderFrameFrames = renderPeriodFrames
    const pingRoundTripFrames = (resolvePingMs(rotation.pingMs) * FPS) / 1000
    const serverProcessingFrames =
      (resolveServerProcessingMs(rotation.serverProcessingMs) * FPS) / 1000
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
          pingRoundTripFrames + serverProcessingFrames + oneRenderFrameFrames,
          renderPeriodFrames,
        )
      : 0
    // A skill's own further in-cast server wait lands mid-graph, not at a
    // fresh input, so it skips the extra render frame `roundTripFrames` pays.
    const midCastWaitFrames = hasPing
      ? quantiseToRenderFrame(pingRoundTripFrames + serverProcessingFrames, renderPeriodFrames)
      : 0
    const startLatencyFrames = (skill: Skill): number =>
      skill.startLatency === "serverRoundTrip" ? roundTripFrames : 0
    const exactHitLandingFrame = (stepStart: number, hitFrame: number): number =>
      stepStart + quantiseToRenderFrame(hitFrame, renderPeriodFrames)
    const hitLandingFrame = (stepStart: number, hitFrame: number): number =>
      Math.round(exactHitLandingFrame(stepStart, hitFrame))

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

    // Rounded up to a whole frame: this bound also sizes the meter engine's
    // own starting frame, and a render-quantised fraction there would desync
    // its internal cursor from every (already-rounded) hit-derived frame it is
    // later compared against.
    function upperBoundLatencyFrames(rs: ResolvedStep): number {
      return Math.ceil(
        startLatencyFrames(rs.skill) + (rs.skill.serverWaitsInCast ?? 0) * midCastWaitFrames,
      )
    }

    function prePullCastFrames(
      skill: Skill,
      nextStepSkillId: string | undefined,
      holds: (condition: TriggerCondition) => boolean,
    ): number {
      const occurringHits = skill.hits.filter(
        (skillHit) =>
          hitConditionsHold(skillHit, holds) &&
          (!skillHit.requiresNextStepSkillIds ||
            (nextStepSkillId !== undefined &&
              skillHit.requiresNextStepSkillIds.includes(nextStepSkillId))),
      )
      const variantCastFrames = activeVariantCastFrames(occurringHits, holds)
      if (variantCastFrames !== null) return variantCastFrames
      const lastHitFrame =
        occurringHits.length > 0
          ? Math.max(
              ...occurringHits.map(
                (skillHit) => selectHitVariant(skillHit, holds)?.frame ?? skillHit.frame,
              ),
            )
          : -1
      return skill.castFrames || lastHitFrame + 1
    }

    // A prepull cast's length is bounded against the parameters alone: a
    // variant gated on a parameter is static for the run, one gated on a status
    // falls back to the skill's own length. Every step's own worst-case latency
    // is added too, or a heavily lagged run can land a cast past a permanent
    // status's own bound-sized window.
    const parameterOnlyHolds = (condition: TriggerCondition): boolean =>
      unionConditionHolds(condition, 0, buffParams, () => false)
    const prePullBound = resolvedSteps.reduce(
      (sum, rs, stepIndex) =>
        isPrePullSkill(rs.skill)
          ? sum +
            prePullCastFrames(
              rs.skill,
              resolvedSteps[stepIndex + 1]?.skill.id,
              parameterOnlyHolds,
            ) +
            upperBoundLatencyFrames(rs)
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
    const weaponIdentities = weaponIdentitiesOf(skills)
    const runEffectiveRates = effectiveRates(inputs)

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

    const meterMaxContext: MeterMaxContext = {
      paramTier: (id) => paramTierOf(buffParams, id),
      paramOn: (id) => paramOnOf(buffParams, id),
      paramValue: (id) => paramNumOf(buffParams, id),
      whiteAffinityRate: inputs.affinityRate,
    }

    const lateMeterDefs = (classDef?.meters ?? []).filter((definition) => definition.dependsOnBuffs)
    const lateMeterIds = lateMeterStatusIds(lateMeterDefs)
    const readsLateMeter = (condition: TriggerCondition): boolean =>
      conditionIds(condition).some((id) => lateMeterIds.has(id))

    const buildView: BuildView = {
      classId: inputs.classId,
      innerWayTier: (innerWayId) => innerWayTier(inputs.mindMethods, innerWayId),
      classSpecificAttunement: (attunementId) => inputs.classSpecificAttunement[attunementId] ?? 0,
      grantsMinPhysCritBoost: grantsMinPhysCritBoostFor(inputs.classId),
      openingStacks: openingStacksOf,
    }

    const timedWarnings: { frame: number; build: (relSec: number) => string }[] = []
    const recordTimedWarning = (frame: number, build: (relSec: number) => string): void => {
      timedWarnings.push({ frame, build })
    }
    const recordInvalidStep = (stepId: string, reasons: ConditionFailureReason[]): void => {
      if (!invalidStepIds.includes(stepId)) invalidStepIds.push(stepId)
      invalidStepReasons[stepId] = reasons
    }

    const spanStart = Math.min(0, -prePullBound)
    const ledger = new StatusLedger(spanStart, Number.POSITIVE_INFINITY)
    const castRecords: CastRecord[] = []
    const paidByMeterByStepStart = new Map<number, Map<string, number>>()
    const castLaidEndByStepStart = new Map<number, number>()

    const conditionHolds = (condition: TriggerCondition, frame: number): boolean =>
      unionConditionHolds(condition, frame, buffParams, (status, atFrame) =>
        conditionSatisfiedByStacks(status, ledger.conditionStacksAt(status.buffId, atFrame)),
      )

    const meters = (classDef?.meters ?? [])
      .filter((definition) => !definition.dependsOnBuffs)
      .map(
        (definition) =>
          new MeterEngine(
            definition,
            meterMaxContext,
            FPS,
            ledger,
            spanStart,
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

    const preferredDistanceMeters = paramNumOf(buffParams, "distanceMeters")
    const defaultMeleeReachMeters = classDef?.defaultMeleeReachMeters ?? 0
    let currentDistanceMeters = preferredDistanceMeters
    ledger.openPermanent(TARGET_DISTANCE_STATUS)
    ledger.recordStack(TARGET_DISTANCE_STATUS, spanStart, currentDistanceMeters)
    const targetDistanceAt = (frame: number): number =>
      ledger.stacksAt(TARGET_DISTANCE_STATUS, frame)

    for (const weapon of weaponIdentities) {
      const statusId = drawnWeaponStatusId(weapon)
      ledger.openPermanent(statusId)
      ledger.recordStack(statusId, spanStart, 0)
    }
    ledger.openPermanent(IN_COMBAT_STATUS)
    const recordSpendStatusIdsOf = (candidate: Skill): string[] =>
      candidate.hits.flatMap((skillHit) =>
        skillHit.triggers.flatMap((trigger) => trigger.recordSpendAsStatus ?? []),
      )
    const recordSpendStatusIds = new Set(skills.flatMap(recordSpendStatusIdsOf))
    for (const statusId of recordSpendStatusIds) ledger.openPermanent(statusId)
    const ledgerAsOfForCast = (mark: number, stepStart: number): StatusView =>
      ledger.asOf(mark, { ids: recordSpendStatusIds, owner: stepStart })
    const conditionHoldsForCast = (
      condition: TriggerCondition,
      castStartFrame: number,
      stepStart: number,
    ): boolean =>
      unionConditionHolds(condition, castStartFrame, buffParams, (status, atFrame) =>
        conditionSatisfiedByStacks(
          status,
          recordSpendStatusIds.has(status.buffId)
            ? ledgerAsOfForCast(ledger.mark(), stepStart).conditionStacksAt(status.buffId, atFrame)
            : ledger.conditionStacksAt(status.buffId, atFrame),
        ),
      )

    const recordStack = (id: string, frame: number, value: number, owner = UNOWNED) =>
      ledger.recordStack(id, frame, value, owner)
    const stacksAt = (id: string, frame: number) => ledger.stacksAt(id, frame)
    const pushWindow = (id: string, start: number, end: number, owner = UNOWNED) =>
      ledger.pushWindow(id, start, end, owner)
    const openPermanent = (id: string, causedAtFrame: number) =>
      ledger.openPermanent(id, causedAtFrame)
    const liveWriter = statusWriter(ledger, conditionHolds)
    seedOpeningState(liveWriter, spanStart)

    function describeConditionFailure(
      condition: TriggerCondition,
      frame: number,
      reader: ConditionReader = {
        stacksOf: (status, atFrame) => ledger.conditionStacksAt(status.buffId, atFrame),
      },
    ): ConditionFailureReason {
      if (isAnyOfCondition(condition))
        return {
          kind: "anyOf",
          reasons: condition.anyOf.map((clause) => describeConditionFailure(clause, frame, reader)),
        }
      if (isParamCondition(condition)) {
        const on = paramOnOf(buffParams, condition.param)
        const source = paramSourceOf(condition.param)
        return {
          kind: "param",
          id: condition.param,
          name: source ? source.name : humanizedParamName(condition.param),
          source: source ? { kind: source.kind, id: source.id } : undefined,
          minTier: condition.minTier,
          actualOn: on,
          actualTier: on ? paramTierOf(buffParams, condition.param) : 0,
        }
      }
      if (condition.buffId.startsWith(DRAWN_STATUS_PREFIX)) {
        const requiredWeapon = condition.buffId.slice(DRAWN_STATUS_PREFIX.length)
        const actualWeapon =
          [...weaponIdentities].find(
            (weapon) => ledger.conditionStacksAt(drawnWeaponStatusId(weapon), frame) > 0,
          ) ?? ""
        return {
          kind: "weapon",
          id: requiredWeapon,
          name: requiredWeapon,
          actualId: actualWeapon,
          actualName: actualWeapon,
        }
      }
      const actual = reader.stacksOf(condition, frame)
      const meter = meters.find((candidate) => candidate.statusId === condition.buffId)
      if (meter)
        return {
          kind: "meter",
          id: meter.def.id,
          name: meter.def.name,
          op: condition.op,
          required: condition.stacks,
          actual,
          ...(meter.def.displayUnitSize !== undefined
            ? { unitSize: meter.def.displayUnitSize }
            : {}),
        }
      const status = statusById.get(condition.buffId)
      return {
        kind: status && isDebuffStatus(status) ? "debuff" : "buff",
        id: condition.buffId,
        name: status?.name ?? reader.nameOf?.(condition.buffId) ?? condition.buffId,
        op: condition.op,
        required: condition.stacks,
        actual,
      }
    }

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
              : ledger.isActiveAt(status.id, frame)
          if (!active) continue
          const amount = modifier.perStack
            ? modifier.amount * ledger.conditionStacksAt(status.id, frame)
            : modifier.amount
          if (modifier.tag) scoped += amount
          else unscoped += amount
        }
      }
      return { scoped, unscoped }
    }

    function meterModifierMultiplier(
      kind: "cost" | "regen",
      meterId: string,
      frame: number,
      skill?: Skill,
      currentAmount?: number,
      capacity?: number,
    ): number {
      const own = meterModifierLayerSums(kind, meterId, frame, skill, currentAmount, capacity)
      return Math.max(0, 1 + own.scoped) * Math.max(0, 1 + own.unscoped)
    }

    function chargeDrainMultiplier(
      meterId: string,
      startFrame: number,
      skill: Skill,
    ): (frame: number) => number {
      const dedicated = meterModifierLayerSums(
        "chargeCost",
        meterId,
        startFrame,
        skill,
        undefined,
        undefined,
      )
      const atStart = Math.max(0, 1 + dedicated.scoped) * Math.max(0, 1 + dedicated.unscoped)
      return (frame) => {
        const costLayer = meterModifierLayerSums(
          "cost",
          meterId,
          frame,
          skill,
          undefined,
          undefined,
        )
        return atStart * Math.max(0, 1 + costLayer.unscoped)
      }
    }

    function advanceMeters(frame: number): void {
      for (const meter of meters) meter.advanceTo(frame)
    }

    interface MeterIntervalStart {
      frame: number
      register: () => void
    }

    function applyMeterCosts(skill: Skill, startFrame: number): Map<string, number> {
      const paidByMeter = new Map<string, number>()
      for (const cost of skill.meterCosts ?? []) {
        const meter = meterById.get(cost.meterId)
        if (!meter || cost.atFrame !== undefined) continue
        if (!meterCostRequirementHolds(cost)) continue
        const multiplier = meterModifierMultiplier("cost", cost.meterId, startFrame, skill)
        const paid = cost.amount * multiplier
        meter.apply(startFrame, -paid)
        paidByMeter.set(cost.meterId, (paidByMeter.get(cost.meterId) ?? 0) + paid)
      }
      return paidByMeter
    }

    function scheduleDelayedMeterCosts(skill: Skill, startFrame: number): MeterIntervalStart[] {
      const starts: MeterIntervalStart[] = []
      for (const cost of skill.meterCosts ?? []) {
        const meter = meterById.get(cost.meterId)
        if (!meter || cost.atFrame === undefined || !meterCostRequirementHolds(cost)) continue
        const spendFrame = hitLandingFrame(startFrame, cost.atFrame)
        starts.push({
          frame: spendFrame,
          register: () =>
            meter.apply(
              spendFrame,
              -cost.amount * meterModifierMultiplier("cost", cost.meterId, spendFrame, skill),
            ),
        })
      }
      return starts
    }

    function scheduleMeterDrainsAndFreezes(
      skill: Skill,
      startFrame: number,
      castEndFrame: number,
    ): MeterIntervalStart[] {
      const starts: MeterIntervalStart[] = []
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
        const fromFrame = exactHitLandingFrame(startFrame, drain.fromFrame)
        const toFrame =
          drain.stopAfterSec !== undefined
            ? Math.min(fromFrame + drain.stopAfterSec * FPS, castEndFrame)
            : castEndFrame
        starts.push({
          frame: Math.round(fromFrame),
          register: () =>
            meter.startDrain(
              fromFrame,
              toFrame,
              drain.perSecond,
              chargeDrainMultiplier(drain.meterId, Math.round(fromFrame), skill),
            ),
        })
      }
      return starts
    }

    function holdsBeforeWrite(
      ledgerMark: number | undefined,
    ): ((condition: TriggerCondition, frame: number) => boolean) | undefined {
      if (ledgerMark === undefined) return undefined
      const view = ledger.asOf(ledgerMark)
      return (condition, frame) =>
        unionConditionHolds(condition, frame, buffParams, (status, atFrame) =>
          conditionSatisfiedByStacks(status, view.conditionStacksAt(status.buffId, atFrame)),
        )
    }

    function applyMeterDelta(
      trigger: HitTrigger,
      frame: number,
      owner: number,
      ledgerMarkBeforeHit: number | undefined,
    ): void {
      if (!liveWriter.fires(trigger, frame, holdsBeforeWrite(ledgerMarkBeforeHit))) return
      const meter = meterById.get(trigger.targetId)
      if (!meter) return
      const paidByMeter = paidByMeterByStepStart.get(owner)
      const stacks =
        trigger.refundFractionOfCastCost !== undefined
          ? trigger.refundFractionOfCastCost * (paidByMeter?.get(trigger.targetId) ?? 0)
          : trigger.stacks
      const applied = meter.apply(frame, stacks, trigger.meterSpendCapToCurrent)
      if (trigger.recordSpendAsStatus)
        ledger.recordStack(trigger.recordSpendAsStatus, frame, Math.abs(applied), owner)
    }

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
        const releasedName = current.name || current.id
        const fallbackName = fallback.name || fallback.id
        const meterName = meter.def.name
        recordTimedWarning(
          startFrame,
          (relSec) =>
            `${releasedName} at ${relSec.toFixed(2)}s released early onto ${fallbackName}: its ${meterName} would empty before the held stage completes.`,
        )
        current = fallback
      }
      return { step: resolvedStep.step, skill: current }
    }

    let fightStartFrame: number | null = null
    let lastDamagingHitFrame: number | null = null
    const windowEndFrame = (): number =>
      fixedWindowFrames === null || fightStartFrame === null
        ? Infinity
        : fightStartFrame + fixedWindowFrames
    const inFight = (frame: number): boolean =>
      fightStartFrame !== null && frame >= fightStartFrame && frame <= windowEndFrame()
    const preStartTallies: { frame: number; apply: () => void }[] = []
    const openFight = (frame: number): void => {
      if (fightStartFrame !== null) return
      fightStartFrame = frame
      for (const tally of preStartTallies.splice(0))
        if (tally.frame >= frame) settleTally(tally.frame, tally.apply)
    }

    const behaviorFor = buildBehaviors(buildView)

    const hitInputAt = (
      skill: Skill,
      hit: SkillHit,
      frame: number,
      castStartFrame: number,
      stepStart: number,
    ): HitInput => ({
      skill,
      hit,
      frame,
      statuses: ledger,
      build: buildView,
      holds: (condition) => conditionHoldsForCast(condition, castStartFrame, stepStart),
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

    const propagatedBuffIdsByCast = new Map<string, readonly string[]>()

    const damagingHitsPerFrame = new Map<number, number>()
    const sameFrameOffsetSec = (ordinal: number) => ordinal * SAME_FRAME_STEP_SEC

    const buffEngine: BuffEngine | null = (() => {
      try {
        const engine = new BuffEngine(buffParams, buffDefsForClass(inputs.classId), groupBuffDefs())
        engine.attachStatuses({ view: ledger, fps: FPS })
        engine.attachQiSchedule(qiSchedule, iterationQiReader)
        if (extensionRng) engine.attachExtensionGenerator(extensionRng)
        return engine
      } catch {
        return null
      }
    })()

    const castSkillFires = (trigger: HitTrigger, frame: number, engineReadSec: number): boolean =>
      liveWriter.fires(trigger, frame, (condition, atFrame) =>
        unionConditionHolds(condition, atFrame, buffParams, (status, statusFrame) =>
          status.source === "buffEngine"
            ? !!buffEngine &&
              conditionSatisfiedByStacks(
                status,
                buffEngine.getHistoricalBuffStacks(status.buffId, engineReadSec),
              )
            : conditionHolds(status, statusFrame),
        ),
      )

    const pendingTimedWarnings: {
      index: number
      frame: number
      build: (relSec: number) => string
    }[] = []

    function checkBuffEngineCastConditions(resolvedStep: ResolvedStep, startFrame: number): void {
      if (!buffEngine) return
      const engineStacks = (status: StatusCondition, atFrame: number): number =>
        status.source === "buffEngine"
          ? buffEngine.getHistoricalBuffStacks(status.buffId, atFrame / FPS - ENGINE_READ_LEAD_SEC)
          : ledger.conditionStacksAt(status.buffId, atFrame)
      const failed = (resolvedStep.skill.castConditions ?? []).filter(
        (condition) =>
          hasBuffEngineSource(condition) &&
          !unionConditionHolds(condition, startFrame, buffParams, (status, atFrame) =>
            conditionSatisfiedByStacks(status, engineStacks(status, atFrame)),
          ),
      )
      if (failed.length === 0) return
      const reasons = failed.map((condition) =>
        describeConditionFailure(condition, startFrame, {
          stacksOf: engineStacks,
          nameOf: (buffId) => buffEngine.moduleName(buffId),
        }),
      )
      const stepId = resolvedStep.step.id
      recordInvalidStep(stepId, [...(invalidStepReasons[stepId] ?? []), ...reasons])
      pendingTimedWarnings.push({
        index: warnings.push("") - 1,
        frame: startFrame,
        build: (relSec) =>
          `${resolvedStep.skill.name || resolvedStep.skill.id} at ${relSec.toFixed(2)}s would be illegal in the game: ${reasons.map(englishConditionFailure).join(" and ")}.`,
      })
    }

    const reachableSkillIds = new Set<string>()
    const reachSkill = (skillId: string): void => {
      if (reachableSkillIds.has(skillId)) return
      reachableSkillIds.add(skillId)
      const skill = skillsById.get(skillId)
      for (const gate of skill?.releaseGates ?? []) reachSkill(gate.fallbackSkillId)
      for (const drain of skill?.meterDrains ?? [])
        if (drain.chargeRelease) reachSkill(drain.chargeRelease.fallbackSkillId)
    }
    for (const resolvedStep of resolvedSteps) reachSkill(resolvedStep.skill.id)

    const resources = (classDefinition(inputs.classId)?.resources ?? [])
      .filter((definition) => reachableSkillIds.has(definition.launchSkillId))
      .map(
        (definition) =>
          new CombatResource(definition, inputs.resourceSettings?.[definition.id], {
            fps: FPS,
            startFrame: 0,
            collect: collectDetail,
            particleCount: buffEngine?.extensionParticleCount ?? 1,
            buffLive: (id, frame) => buffEngine?.liveParticles(id, frame / FPS) ?? false,
            exhausted: (frame) => iterationQiReader.isBroken(frame / FPS, "afterHit"),
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

    const { precision, critRate, affinityRate } = runEffectiveRates
    const mechanicSetup: MechanicSetup = {
      inputs,
      classId: inputs.classId,
      fps: FPS,
      qiPhaseAt: (timeSec) => buffEngine?.qiPhase(timeSec, "beforeHit") ?? "normal",
      paramOn: (name) => buffEngine?.paramOn(name) ?? false,
      paramTier: (name) => buffEngine?.paramTier(name) ?? 0,
      hasBuffEngine: !!buffEngine,
      effectiveRates: { precision, critRate, affinityRate },
      collectHistory: collectDetail,
    }
    const mechanics = prepareMechanics(
      mechanicSetup,
      options?.seed === undefined
        ? undefined
        : (mechanicId) => mechanicSubstream(options.seed!, mechanicId),
    )

    interface Resolved {
      inputs: Inputs
      ctx: Ctx
    }
    interface ResolveOverride {
      extraEffects?: BuffStatEffect[]
      forceGuaranteedAffinity?: boolean
    }
    interface ResolveVariant {
      engineOffsetSec?: number
      withoutMechanicId?: string
    }
    const stateMemo = new Map<string, Resolved>()
    // `statusesView` is the ledger a hit's own damage query reads —
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
      variant: ResolveVariant = {},
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
          frame / FPS + (variant.engineOffsetSec ?? 0),
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
      if (variant.withoutMechanicId) sig += `~without:${variant.withoutMechanicId}`
      for (const { mechanic, state, setup } of mechanics) {
        if (mechanic.id === variant.withoutMechanicId) continue
        const contribution = mechanic.contributeAt?.(state, frame, skill, setup)
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
        if (buffEngine.qiBroken(frame / FPS, "beforeHit")) {
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
        const exactKey =
          effects.map((effect) => `${effect.statKey}:${effect.amount}`).join(",") +
          `|${JSON.stringify(contextPatch)}` +
          (override?.forceGuaranteedAffinity ? "|forcedAffinity" : "")
        let shared = resolvedStateAcrossPasses.get(exactKey)
        if (!shared) {
          const { inputs: effInputs, targetOverride } = applyBuffEffects(inputs, effects)
          const ctx = buildContext(effInputs, targetOverride, contextPatch)
          if (override?.forceGuaranteedAffinity) {
            ctx.affinityPanel = 0
            ctx.directAffinityPanel = 1
          }
          shared = { inputs: effInputs, ctx }
          resolvedStateAcrossPasses.set(exactKey, shared)
        }
        r = shared
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

    interface DotTickDetail {
      resourceOwner?: number
      debuff: Debuff
      debuffForTick: Debuff
      dotSkill: Skill
      dotName: string
      dotBreakdownName: string
      dotBreakdownKey: string
      dotType: string
    }

    interface PendingDotTick extends DotTickLaunch, DotTickDetail {}

    interface DotTickEntry extends DotTickPlan, DotTickDetail {}

    interface DotEpisode {
      status: Debuff
      dot: DebuffDotSpec
      tickSkill: Skill | undefined
      resource: CombatResource | undefined
      query: DotPulseQuery
      schedule: DotPulseSchedule
      startFrame: number
      window: StatusWindow | null
      clippedEndFrame: number
      coverageEnd: number
      coverageStale: boolean
      nextPulse: number
      runIndex: number
      pulsePending: boolean
    }

    interface HitScoreInput {
      frame: number
      skill: Skill
      hit: SkillHit
      castFrame: number
      stepStart: number
      extraEffects: BuffStatEffect[]
      forceGuaranteedAffinity: boolean
      onHitEffectCount: number
      forcedAffinityByOnHit: boolean
      ledgerMark: number
      engineOffsetSec: number
    }

    interface TickLaunchEvent {
      kind: "tickLaunch"
      frame: number
      episode: DotEpisode
      pulse: number
      runIndex: number
      offset: number
    }

    type MergedEvent =
      | {
          kind: "hit"
          frame: number
          exactFrame?: number
          skill: Skill
          hit: SkillHit
          castFrame: number
          stepStart: number
          generated: boolean
          prePull: boolean
          meterExactFrame: number
        }
      | { kind: "castStart"; frame: number; stepIndex: number; cursor: number }
      | { kind: "gate"; frame: number; cast: PendingCast }
      | { kind: "meter"; frame: number; run: () => void }
      | { kind: "deferredGrant"; frame: number; subFrame: number; grant: DeferredBuffGrant }
      | { kind: "castEnd"; frame: number; trigger: HitTrigger; stepStart: number }
      | TickLaunchEvent
      | {
          kind: "tick"
          frame: number
          episode: DotEpisode
          pending: PendingDotTick
          landing: DotTickLanding | null
          launched: ResourceTickOutcome
        }
      | { kind: "extra"; frame: number; event: MechanicEvent; owner: PreparedMechanic }
      | { kind: "echoRelease"; frame: number; debuffId: string; coverageEnd?: true }

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

    let lateEventWarned = false
    const mergedQueue = new EventQueue<MergedEvent>((eventFrame, lastPoppedFrame) => {
      if (lateEventWarned) return
      lateEventWarned = true
      warnings.push(
        `An event scheduled for frame ${eventFrame} came after frame ${lastPoppedFrame} had already run; it was moved to ${lastPoppedFrame}.`,
      )
    })
    let pendingHitLikeEvents = 0
    const enqueue = (event: MergedEvent): void => {
      if (event.kind === "hit" || event.kind === "castStart" || event.kind === "gate")
        pendingHitLikeEvents++
      mergedQueue.push(event)
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
    let fightDamageSoFar = 0
    const outcomeTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const outcomeDamageTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const expectedShareTally: OutcomeCounts = { abrasion: 0, normal: 0, crit: 0, affinity: 0 }
    const tallyRoll = (rolled: RolledHit, damage: number): void => {
      outcomeTally[rolled.outcome] += 1
      outcomeDamageTally[rolled.outcome] += damage
      for (const outcome of OUTCOME_KEYS) expectedShareTally[outcome] += rolled.chance[outcome]
    }
    const chainEndFrameByStepStart = new Map<number, number>()
    type QueuedHit = Extract<MergedEvent, { kind: "hit" }>

    const nextDamagingOrdinal = (frame: number): number => {
      const ordinal = damagingHitsPerFrame.get(frame) ?? 0
      damagingHitsPerFrame.set(frame, ordinal + 1)
      return ordinal
    }

    const deferGrantFrom =
      (fromFrame: number) =>
      (grant: DeferredBuffGrant): void => {
        enqueue({
          kind: "deferredGrant",
          frame: Math.max(fromFrame, Math.ceil(grant.timeSec * FPS - DEFERRED_GRANT_FRAME_SLACK)),
          subFrame: grant.timeSec * FPS,
          grant,
        })
      }

    function walkCastStart(cast: {
      skill: Skill
      frame: number
      castFrame: number
      hitCount: number
      generated: boolean
      inheritedBuffIds: readonly string[]
      holds: (condition: TriggerCondition) => boolean
      distanceMeters: number
      midCastExtraFrames: number
    }): void {
      const { skill, frame, castFrame, generated, inheritedBuffIds } = cast
      const offsetFrames = frame - castFrame
      const castTag = castTagOf(skill)
      let propagated = [...inheritedBuffIds]
      if (buffEngine && castTag) {
        const performedHits = skill.hits.filter((candidate) =>
          hitConditionsHold(candidate, cast.holds),
        )
        const lastHitFrame =
          performedHits.length > 0
            ? Math.max(
                ...performedHits.map((hit) =>
                  hitLandingFrame(
                    castFrame,
                    resolvedHitFrame(hit, cast.holds, cast.distanceMeters) +
                      cast.midCastExtraFrames,
                  ),
                ),
              )
            : null
        const variantCastFrames = activeVariantCastFrames(performedHits, cast.holds)
        const grantAtSec = skill.triggersBuffsAtFrame
          ? new Map(
              Object.entries(skill.triggersBuffsAtFrame).map(([id, atFrame]) => [
                id,
                Math.max(0, atFrame - offsetFrames) / FPS,
              ]),
            )
          : undefined
        const result = buffEngine.processSkillCast(
          castTag,
          frame / FPS,
          {
            ...propsOfSkill(skill, cast.hitCount),
            castTime: ((variantCastFrames ?? (skill.castFrames || 1)) - offsetFrames) / FPS,
            ...(lastHitFrame !== null && { lastHitSec: (lastHitFrame - frame) / FPS }),
          },
          generated,
          skill.triggersBuffs ?? [],
          skillTagsOf(skill),
          grantAtSec,
          deferGrantFrom(frame),
        )
        const scoped = [...new Set([...inheritedBuffIds, ...result.buffIds])]
        propagated = [...new Set([...propagated, ...result.propagatedBuffIds])]
        const key = castScopedKey(castFrame, skill.id)
        castScopedBuffs.set(key, [...new Set([...(castScopedBuffs.get(key) ?? []), ...scoped])])
      }
      propagatedBuffIdsByCast.set(castScopedKey(castFrame, skill.id), propagated)
    }

    let loopFrame = Number.NEGATIVE_INFINITY
    let swapReadyAtFrame = -Infinity
    let directSwapReadyAtFrame = -Infinity
    let drawnWeapon: string | null = null
    let activeCursorFrames = 0
    const chainSuccessor = resolvedSteps.map((resolvedStep, stepIndex) => {
      const prePull = isPrePullSkill(resolvedStep.skill)
      for (let next = stepIndex + 1; next < resolvedSteps.length; next++)
        if (isPrePullSkill(resolvedSteps[next].skill) === prePull) return next
      return -1
    })

    interface PendingCast {
      stepIndex: number
      resolvedStep: ResolvedStep
      prePull: boolean
      startFrame: number
      exactStart: number
      meterMarkAtStart: number
      distanceBeforeCast: number
      writtenDistance: number | null
      current: Skill
      gateIndex: number
    }

    function scheduleCastStart(stepIndex: number, cursor: number): void {
      const frame = Math.max(
        loopFrame,
        Math.round(cursor + startLatencyFrames(resolvedSteps[stepIndex].skill)),
      )
      enqueue({ kind: "castStart", frame, stepIndex, cursor })
    }

    function writeCastDistance(cast: PendingCast, skill: Skill): void {
      const displacingSkill: Skill = {
        ...skill,
        displacement:
          activeVariantDisplacement(skill.hits, (condition) =>
            conditionHolds(condition, cast.startFrame),
          ) ?? skill.displacement,
      }
      const reader = distanceReaderAtCast(
        displacingSkill,
        defaultMeleeReachMeters,
        preferredDistanceMeters,
        cast.distanceBeforeCast,
      )
      const distance = reader(Infinity)
      if (cast.writtenDistance !== distance) {
        ledger.recordStack(TARGET_DISTANCE_STATUS, Math.max(cast.startFrame, loopFrame), distance)
        cast.writtenDistance = distance
      }
      currentDistanceMeters = distance
    }

    function beginCast(event: Extract<MergedEvent, { kind: "castStart" }>): void {
      const { stepIndex, cursor } = event
      const resolvedStep = resolvedSteps[stepIndex]
      const prePull = isPrePullSkill(resolvedStep.skill)
      const isWeaponSwapCast = resolvedStep.skill.isWeaponSwap === true
      const isDirectSwapCast = directSwapSkills.has(resolvedStep.skill)
      const earliestStart = cursor + startLatencyFrames(resolvedStep.skill)
      const exactStart = isWeaponSwapCast
        ? Math.max(earliestStart, swapReadyAtFrame)
        : isDirectSwapCast
          ? Math.max(earliestStart, directSwapReadyAtFrame)
          : earliestStart
      if (Math.round(exactStart) > event.frame) {
        enqueue({ ...event, frame: Math.round(exactStart) })
        return
      }
      const startFrame = event.frame
      if (isWeaponSwapCast) swapReadyAtFrame = startFrame + SWAP_COOLDOWN_FRAMES
      if (isDirectSwapCast) directSwapReadyAtFrame = startFrame + DIRECT_SWAP_COOLDOWN_FRAMES
      const weapon = weaponTagOf(resolvedStep.skill)
      if (weapon && weapon !== drawnWeapon) {
        if (drawnWeapon !== null)
          ledger.recordStack(drawnWeaponStatusId(drawnWeapon), startFrame, 0)
        ledger.recordStack(drawnWeaponStatusId(weapon), startFrame, 1)
        drawnWeapon = weapon
      }
      recallAtCastStart(resolvedStep.skill, startFrame)
      advanceMeters(startFrame)
      const meterMarkAtStart = ledger.mark()
      const holdsHere = (condition: TriggerCondition) => conditionHolds(condition, startFrame)
      const failedCastConditions = (resolvedStep.skill.castConditions ?? []).filter(
        (condition) =>
          !hasBuffEngineSource(condition) && !readsLateMeter(condition) && !holdsHere(condition),
      )
      if (failedCastConditions.length > 0) {
        const reasons = failedCastConditions.map((condition) =>
          describeConditionFailure(condition, startFrame),
        )
        recordInvalidStep(resolvedStep.step.id, reasons)
        recordTimedWarning(
          startFrame,
          (relSec) =>
            `${resolvedStep.skill.name || resolvedStep.skill.id} at ${relSec.toFixed(2)}s would be illegal in the game: ${reasons.map(englishConditionFailure).join(" and ")}.`,
        )
      }
      checkBuffEngineCastConditions(resolvedStep, startFrame)
      paidByMeterByStepStart.set(
        startFrame,
        prePull ? new Map<string, number>() : applyMeterCosts(resolvedStep.skill, startFrame),
      )
      const cast: PendingCast = {
        stepIndex,
        resolvedStep,
        prePull,
        startFrame,
        exactStart,
        meterMarkAtStart,
        distanceBeforeCast: currentDistanceMeters,
        writtenDistance: null,
        current: resolvedStep.skill,
        gateIndex: 0,
      }
      if (!prePull && (resolvedStep.skill.releaseGates?.length ?? 0) > 0) {
        writeCastDistance(cast, resolvedStep.skill)
        scheduleReleaseGate(cast)
        return
      }
      finalizeCast(cast)
    }

    function scheduleReleaseGate(cast: PendingCast): void {
      const gate = cast.current.releaseGates![cast.gateIndex]
      const frame = Math.max(
        loopFrame,
        Math.floor(exactHitLandingFrame(cast.startFrame, gate.atFrame)),
      )
      enqueue({ kind: "gate", frame, cast })
    }

    function evaluateReleaseGate(cast: PendingCast, frame: number): void {
      advanceMeters(frame)
      const gate = cast.current.releaseGates![cast.gateIndex]
      const failed = gate.requires.filter(
        (condition) => !hasBuffEngineSource(condition) && !conditionHolds(condition, frame),
      )
      if (failed.length === 0) {
        cast.gateIndex++
        if (cast.gateIndex < (cast.current.releaseGates?.length ?? 0)) scheduleReleaseGate(cast)
        else finalizeCast(cast)
        return
      }
      const fallback = skillsById.get(gate.fallbackSkillId)
      if (!fallback) {
        finalizeCast(cast)
        return
      }
      const releasedName = cast.current.name || cast.current.id
      const fallbackName = fallback.name || fallback.id
      const reasons = failed.map((condition) => describeConditionFailure(condition, frame))
      recordTimedWarning(
        cast.startFrame,
        (relSec) =>
          `${releasedName} at ${relSec.toFixed(2)}s released onto ${fallbackName}: ${reasons.map(englishConditionFailure).join(" and ")}.`,
      )
      cast.current = fallback
      cast.gateIndex = 0
      if ((fallback.releaseGates?.length ?? 0) > 0) scheduleReleaseGate(cast)
      else finalizeCast(cast)
    }

    function finalizeCast(cast: PendingCast): void {
      const { resolvedStep, prePull, startFrame, exactStart, stepIndex } = cast
      const castResolution = prePull
        ? resolvedStep
        : resolveChargeRelease({ step: resolvedStep.step, skill: cast.current }, startFrame)
      const holdsHere = (condition: TriggerCondition) => conditionHolds(condition, startFrame)
      if (!prePull) writeCastDistance(cast, castResolution.skill)
      const castDistanceReader = distanceReaderAtCast(
        {
          ...castResolution.skill,
          displacement:
            activeVariantDisplacement(castResolution.skill.hits, holdsHere) ??
            castResolution.skill.displacement,
        },
        defaultMeleeReachMeters,
        preferredDistanceMeters,
        prePull ? preferredDistanceMeters : cast.distanceBeforeCast,
      )
      const nextStepSkillId = resolvedSteps[stepIndex + 1]?.skill.id
      const hitLandsByNextStep = (hit: SkillHit): boolean =>
        !hit.requiresNextStepSkillIds ||
        (nextStepSkillId !== undefined && hit.requiresNextStepSkillIds.includes(nextStepSkillId))
      const occurringHits = castResolution.skill.hits.filter(
        (hit) => hitConditionsHold(hit, holdsHere) && hitLandsByNextStep(hit),
      )
      const midCastExtraFrames = prePull
        ? 0
        : (castResolution.skill.serverWaitsInCast ?? 0) * midCastWaitFrames
      const hitDistanceMeters: HitDistance = castDistanceReader
      const castHitFrame = (hit: SkillHit): number =>
        resolvedHitFrame(hit, holdsHere, hitDistanceMeters) + midCastExtraFrames
      const nominalCastLen = prePull
        ? prePullCastFrames(castResolution.skill, nextStepSkillId, holdsHere)
        : (() => {
            const maxFrame =
              occurringHits.length > 0 ? Math.max(...occurringHits.map(castHitFrame)) : -1
            const gatedCastFrames = occurringHits.find(
              (hit) => hit.requiresNextStepSkillIds && hit.castFramesWhenGated !== undefined,
            )?.castFramesWhenGated
            return (
              (activeVariantCastFrames(occurringHits, holdsHere) ??
                gatedCastFrames ??
                (castResolution.skill.castFrames || maxFrame + 1)) + midCastExtraFrames
            )
          })()
      const castLen = Math.max(
        0,
        quantiseToRenderFrame(nominalCastLen, renderPeriodFrames) -
          (!prePull && castResolution.skill.keyframesLeadByRenderFrame ? renderPeriodFrames : 0),
      )
      const nextCursor = exactStart + castLen
      if (!prePull) activeCursorFrames = nextCursor
      castLaidEndByStepStart.set(startFrame, nextCursor)
      if (!prePull) {
        const meterStarts = [
          ...scheduleMeterDrainsAndFreezes(castResolution.skill, startFrame, startFrame + castLen),
          ...scheduleDelayedMeterCosts(castResolution.skill, startFrame),
        ]
        for (const start of meterStarts)
          enqueue({ kind: "meter", frame: Math.max(start.frame, loopFrame), run: start.register })
      }
      const fixedBound =
        fixedWindowFrames !== null && fightStartFrame !== null
          ? fightStartFrame + fixedWindowFrames
          : Infinity
      const landedHits = occurringHits
        .map((hit) => ({ hit, frame: hitLandingFrame(startFrame, castHitFrame(hit)) }))
        .sort((left, right) => left.frame - right.frame)
        .filter(({ frame }) => frame <= fixedBound)
        .map(({ hit }) => hit)
      for (const hit of landedHits) {
        const resolvedFrame = castHitFrame(hit)
        const exactFrame = exactHitLandingFrame(startFrame, resolvedFrame)
        enqueue({
          kind: "hit",
          frame: Math.max(loopFrame, hitLandingFrame(startFrame, resolvedFrame)),
          exactFrame,
          meterExactFrame: exactFrame,
          skill: castResolution.skill,
          hit,
          castFrame: startFrame,
          stepStart: startFrame,
          generated: false,
          prePull,
        })
      }
      castRecords.push({
        resolved: castResolution,
        stepIndex,
        prePull,
        startFrame,
        castLen,
        performedHits: landedHits,
        meterMarkAtStart: cast.meterMarkAtStart,
        midCastExtraFrames,
        hitDistanceMeters,
      })
      walkCastStart({
        skill: castResolution.skill,
        frame: loopFrame,
        castFrame: startFrame,
        hitCount: landedHits.length,
        generated: false,
        inheritedBuffIds: [],
        holds: holdsHere,
        distanceMeters: prePull ? targetDistanceAt(startFrame) : castDistanceReader(Infinity),
        midCastExtraFrames,
      })
      const next = chainSuccessor[stepIndex]
      if (next >= 0) scheduleCastStart(next, nextCursor)
    }

    function recallAtCastStart(skill: Skill, startFrame: number): void {
      for (const resource of resources)
        if (resource.recalledBy(skill))
          resource.recall(Math.min(windowEndFrame(), Math.max(0, startFrame)))
      for (const status of statusById.values()) {
        if (!isDebuffStatus(status) || !status.recall || resourceByDebuff.has(status.id)) continue
        const { tag, exemptSkillIds } = status.recall
        if (skill.isDotTick || !skill.tags?.includes(tag) || exemptSkillIds?.includes(skill.id))
          continue
        ledger.cutWindowsAt(status.id, startFrame, UNOWNED)
      }
    }

    const firstPrePullStep = resolvedSteps.findIndex((resolvedStep) =>
      isPrePullSkill(resolvedStep.skill),
    )
    const firstActiveStep = resolvedSteps.findIndex(
      (resolvedStep) => !isPrePullSkill(resolvedStep.skill),
    )
    if (firstPrePullStep >= 0) scheduleCastStart(firstPrePullStep, -prePullBound)
    if (firstActiveStep >= 0) scheduleCastStart(firstActiveStep, 0)

    function prepareHit(event: QueuedHit): HitScoreInput {
      const { frame, skill, hit, castFrame, stepStart } = event
      chainEndFrameByStepStart.set(
        stepStart,
        Math.max(frame, chainEndFrameByStepStart.get(stepStart) ?? frame),
      )

      const behavior = behaviorFor(skill)
      const hitInput = hitInputAt(skill, hit, frame, castFrame, stepStart)
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
          if (permanent) openPermanent(status.id, frame)
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
      const onHitEffectCount = extraEffects.length
      const forcedAffinityByOnHit = forceGuaranteedAffinity
      const qiPhase = readingIterationQi(
        () => buffEngine?.qiPhase(frame / FPS, "beforeHit") ?? "normal",
      )
      for (const effect of behavior.claimStatEffects(hitInput, qiPhase))
        applyEffect(hitSink, effect)

      return {
        frame,
        skill,
        hit,
        castFrame,
        stepStart,
        extraEffects,
        ledgerMark: ledger.mark(),
        forceGuaranteedAffinity,
        onHitEffectCount,
        forcedAffinityByOnHit,
        engineOffsetSec: hitDealsDamage(hit) ? sameFrameOffsetSec(nextDamagingOrdinal(frame)) : 0,
      }
    }

    function fireHitTriggers(
      event: QueuedHit,
      engineOffsetSec: number,
      ledgerMarkBeforeHit: number,
    ): void {
      const { frame, skill, hit, castFrame, stepStart, prePull } = event
      const engineReadSec = frame / FPS + engineOffsetSec + AFTER_HIT_SEC
      const hitInWindow = inFight(frame)
      if (hitDealsDamage(hit)) liveWriter.onDamagingHit(frame, stepStart)
      for (const trigger of hit.triggers) {
        if (trigger.kind === "detonateDot") continue
        if (trigger.kind === "releaseEcho") {
          if (hitInWindow && liveWriter.fires(trigger, frame))
            enqueue({ kind: "echoRelease", frame, debuffId: trigger.targetId })
          continue
        }
        if (trigger.kind === "meterDelta") {
          if (prePull) continue
          const ownerHolds = (condition: TriggerCondition) => conditionHolds(condition, stepStart)
          const effectiveFrame = trigger.appliesOnCastEnd
            ? Math.max(
                frame,
                castEndFrame(skill, stepStart, ownerHolds, targetDistanceAt(stepStart)),
              )
            : trigger.delayFrames !== undefined
              ? Math.round(event.meterExactFrame + trigger.delayFrames)
              : frame
          const markBeforeHit = trigger.conditionsBeforeHit ? ledgerMarkBeforeHit : undefined
          enqueue({
            kind: "meter",
            frame: Math.max(effectiveFrame, loopFrame),
            run: () => applyMeterDelta(trigger, effectiveFrame, stepStart, markBeforeHit),
          })
          continue
        }
        if (trigger.kind === "cooldownCut" && trigger.appliesOnCastEnd && !prePull) {
          const laidEndFrame = Math.max(frame, castLaidEndByStepStart.get(stepStart) ?? frame)
          enqueue({
            kind: "meter",
            frame: Math.max(laidEndFrame, loopFrame),
            run: () => liveWriter.applyTrigger(trigger, laidEndFrame, stepStart),
          })
          continue
        }
        if (
          trigger.kind === "applyBuff" ||
          trigger.kind === "applyDebuff" ||
          trigger.kind === "clearStatus" ||
          trigger.kind === "cooldownCut"
        ) {
          if (!trigger.appliesOnCastEnd) {
            liveWriter.applyTrigger(trigger, frame, stepStart)
            continue
          }
          const endFrame = castEndFrame(
            skill,
            castFrame,
            (condition) => conditionHolds(condition, castFrame),
            targetDistanceAt(castFrame),
          )
          if (endFrame >= frame) enqueue({ kind: "castEnd", frame: endFrame, trigger, stepStart })
          else liveWriter.applyTrigger(trigger, frame, stepStart)
          continue
        }
        const triggerFires =
          trigger.kind === "castSkill"
            ? castSkillFires(trigger, frame, engineReadSec)
            : liveWriter.fires(trigger, frame)
        if (!triggerFires) continue
        if (trigger.kind === "applyDot") {
          const status = statusById.get(trigger.targetId)
          if (!status || !isDebuffStatus(status)) continue
          const maxStacks = Math.max(1, status.maxStacks)
          const next = clamp(stacksAt(status.id, frame) + 1, 0, maxStacks)
          recordStack(status.id, frame, next, stepStart)
          if (status.activation === "permanent") openPermanent(status.id, frame)
          else pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames), stepStart)
          const det = status.detonation ?? null
          const flagged =
            det &&
            hit.triggers.some((t) => t.kind === "detonateDot" && t.targetId === trigger.targetId)
          if (flagged && next >= maxStacks) {
            recordStack(status.id, frame, clamp(det.retainStacks ?? 0, 0, maxStacks), stepStart)
            const sub = skillsById.get(det.skillId)
            if (sub) {
              const subHolds = (condition: TriggerCondition) => conditionHolds(condition, frame)
              const subDistanceMeters = targetDistanceAt(frame)
              for (const subHit of sub.hits.filter((candidate) =>
                hitConditionsHold(candidate, subHolds),
              )) {
                const subHitFrame = resolvedHitFrame(subHit, subHolds, subDistanceMeters)
                enqueue({
                  kind: "hit",
                  frame: Math.max(frame, hitLandingFrame(frame, subHitFrame)),
                  skill: sub,
                  hit: subHit,
                  castFrame: frame,
                  stepStart,
                  generated: true,
                  prePull,
                  meterExactFrame: Math.max(frame, exactHitLandingFrame(frame, subHitFrame)),
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
        if (trigger.kind === "castSkill")
          walkCastStart({
            skill: sub,
            frame,
            castFrame: frame,
            hitCount: sub.hits.length,
            generated: true,
            inheritedBuffIds: propagatedBuffIdsByCast.get(castScopedKey(castFrame, skill.id)) ?? [],
            holds: subHolds,
            distanceMeters: subDistanceMeters,
            midCastExtraFrames: 0,
          })
        for (const subHit of sub.hits.filter((candidate) =>
          hitConditionsHold(candidate, subHolds),
        )) {
          const subHitFrame = resolvedHitFrame(subHit, subHolds, subDistanceMeters)
          enqueue({
            kind: "hit",
            frame: Math.max(frame, hitLandingFrame(frame, subHitFrame)),
            skill: sub,
            hit: subHit,
            castFrame: frame,
            stepStart,
            generated: true,
            prePull,
            meterExactFrame: Math.max(frame, exactHitLandingFrame(frame, subHitFrame)),
          })
        }
      }
    }

    let lateMeterSettlement: LateMeterSettlement | null = null

    function buildCasts(): RotationCast[] {
      const castsUnsorted: RotationCast[] = castRecords.map((castRecord) => {
        const stepHolds = (condition: TriggerCondition) =>
          conditionHolds(condition, castRecord.startFrame)
        const lastHitFrame =
          castRecord.performedHits.length > 0
            ? Math.max(
                ...castRecord.performedHits.map(
                  (hit) =>
                    resolvedHitFrame(hit, stepHolds, castRecord.hitDistanceMeters) +
                    castRecord.midCastExtraFrames,
                ),
              )
            : 0
        const castQueryFrame = Math.max(
          castRecord.startFrame,
          castRecord.startFrame + castRecord.castLen - 1,
          castRecord.startFrame + lastHitFrame,
        )
        const queryTimeSec = castQueryFrame / FPS
        const { buffs, seen: seenBuffIds } = collectCastBuffs({
          ledgerFrame: Math.max(
            castQueryFrame,
            chainEndFrameByStepStart.get(castRecord.startFrame) ?? castQueryFrame,
          ),
          engineTimeSec: queryTimeSec,
          fps: FPS,
          ledger: ledger.throughOwner(castRecord.startFrame, castQueryFrame),
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
        for (const { mechanic, state, setup } of mechanics) {
          for (const chip of mechanic.display?.(state, queryTimeSec, castRecord.prePull, setup) ??
            []) {
            if (seenBuffIds.has(chip.id)) continue
            seenBuffIds.add(chip.id)
            buffs.push(chip)
          }
        }

        return {
          index: 0,
          stepId: castRecord.resolved.step.id,
          stepIndex: castRecord.stepIndex,
          skillName: castRecord.resolved.skill.name,
          timeSec: castRecord.startFrame / FPS,
          inWindow: inWindow(castRecord.startFrame),
          prePull: castRecord.prePull,
          attachedToStepId: deflectCancelAttachedToStepId.get(castRecord.resolved.step.id),
          buffs,
          meterLevels:
            (classDef?.meters ?? []).length > 0
              ? (classDef?.meters ?? []).map((definition) => {
                  const meter = meterById.get(definition.id)
                  return {
                    id: definition.id,
                    name: definition.name,
                    amount: meter
                      ? ledger
                          .asOf(castRecord.meterMarkAtStart)
                          .stacksAt(meter.statusId, castRecord.startFrame)
                      : (lateMeterSettlement?.levelBeforeCast
                          .get(castRecord.resolved.step.id)
                          ?.get(definition.id) ?? 0),
                    capacity:
                      meter?.capacity ?? lateMeterSettlement?.capacities.get(definition.id) ?? 0,
                    ...(definition.displayUnitSize !== undefined
                      ? { unitSize: definition.displayUnitSize }
                      : {}),
                  }
                })
              : undefined,
          distanceMeters: ledger.stacksAt(TARGET_DISTANCE_STATUS, castRecord.startFrame),
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

    const tickWeightAt = (buffId: string, frame: number): number => {
      for (const { mechanic, state, setup } of mechanics) {
        const weight = mechanic.tickWeightAt?.(state, buffId, frame, setup)
        if (weight !== null && weight !== undefined) return weight
      }
      return 1
    }

    const dotEpisodesByDebuff = new Map<string, DotEpisode[]>()

    const episodeEndFrame = (episode: DotEpisode): number => {
      if (episode.window)
        return Math.min(episode.window.end, episode.clippedEndFrame, windowEndFrame() + 1)
      if (episode.coverageStale) {
        const covering = mergeEpisodes(
          [...ledger.windowsOf(episode.status.id)].sort((left, right) => left.start - right.start),
        ).find(
          (candidate) =>
            candidate.start <= episode.startFrame && episode.startFrame < candidate.end,
        )
        episode.coverageEnd = covering?.end ?? episode.startFrame
        episode.coverageStale = false
      }
      return episode.coverageEnd
    }

    const armDotPulse = (episode: DotEpisode): void => {
      if (episode.pulsePending) return
      if (!(episode.nextPulse < episodeEndFrame(episode))) return
      if (Math.round(episode.nextPulse) > windowEndFrame()) return
      episode.pulsePending = true
      for (const offset of episode.schedule.offsets)
        mergedQueue.push({
          kind: "tickLaunch",
          frame: Math.round(episode.nextPulse + offset),
          episode,
          pulse: episode.nextPulse,
          runIndex: episode.runIndex,
          offset,
        })
    }

    const coversWindowStart = (episode: DotEpisode, window: StatusWindow): boolean =>
      episode.startFrame <= window.start && window.start < episodeEndFrame(episode)

    const absorbWindowIntoEpisode = (episode: DotEpisode, window: StatusWindow): void => {
      episode.coverageEnd = Math.max(episodeEndFrame(episode), window.end)
      armDotPulse(episode)
    }

    const openDotEpisode = (statusId: string, window: StatusWindow): void => {
      const status = statusById.get(statusId)
      if (!status || !isDebuffStatus(status) || !status.dot || status.dot.tickIntervalFrames <= 0)
        return
      const tickSkill = skillsById.get(tickSourceSkillId(status) ?? "")
      const dot = resolveTickDot(status, tickSkill)
      if (!dot) return
      const resource = resourceByDebuff.get(statusId)
      let episodes = dotEpisodesByDebuff.get(statusId)
      if (!episodes) dotEpisodesByDebuff.set(statusId, (episodes = []))
      if (resource) {
        const previous = episodes[episodes.length - 1]
        if (previous) previous.clippedEndFrame = Math.min(previous.clippedEndFrame, window.start)
      } else {
        for (let index = episodes.length - 1; index >= 0; index--) {
          const candidate = episodes[index]
          if (coversWindowStart(candidate, window)) {
            absorbWindowIntoEpisode(candidate, window)
            return
          }
        }
      }
      const schedule = dotPulseSchedule(dot)
      const episode: DotEpisode = {
        status,
        dot,
        tickSkill,
        resource,
        query: {
          debuff: status,
          dot,
          stacksAt: (frame) => ledger.stacksAt(statusId, frame),
          distanceAt: targetDistanceAt,
          inWindow: (frame) => frame <= windowEndFrame(),
          weightAt: (frame) => tickWeightAt(statusId, frame),
        },
        schedule,
        startFrame: window.start,
        window: resource ? window : null,
        clippedEndFrame: Infinity,
        coverageEnd: window.end,
        coverageStale: false,
        nextPulse: window.start + schedule.firstOffset,
        runIndex: 0,
        pulsePending: false,
      }
      episodes.push(episode)
      armDotPulse(episode)
    }

    const rearmDotEpisodes = (statusId: string, window: StatusWindow): void => {
      for (const episode of dotEpisodesByDebuff.get(statusId) ?? []) {
        if (episode.window && episode.window !== window) continue
        if (!episode.window && coversWindowStart(episode, window))
          episode.coverageEnd = Math.max(episode.coverageEnd, window.end)
        armDotPulse(episode)
      }
    }

    const markCoverageStale = (statusId: string): void => {
      for (const episode of dotEpisodesByDebuff.get(statusId) ?? []) episode.coverageStale = true
    }

    const scheduleEchoCoverageEnd = (statusId: string, window: StatusWindow): void => {
      const status = statusById.get(statusId)
      if (!status || !isDebuffStatus(status) || !status.echo || window.end > windowEndFrame())
        return
      mergedQueue.push({
        kind: "echoRelease",
        frame: window.end,
        debuffId: statusId,
        coverageEnd: true,
      })
    }

    ledger.observeWindows({
      opened: (statusId, window) => {
        openDotEpisode(statusId, window)
        scheduleEchoCoverageEnd(statusId, window)
        for (const prepared of mechanics)
          prepared.mechanic.onWindowOpened?.(
            prepared.state,
            statusId,
            window,
            mechanicHosts.get(prepared)!,
            prepared.setup,
          )
      },
      extended: (statusId, window) => {
        rearmDotEpisodes(statusId, window)
        scheduleEchoCoverageEnd(statusId, window)
      },
      cut: (statusId, window) => {
        markCoverageStale(statusId)
        scheduleEchoCoverageEnd(statusId, window)
      },
    })
    for (const [statusId, windows] of ledger.entries())
      for (const window of [...windows].sort((left, right) => left.start - right.start)) {
        openDotEpisode(statusId, window)
        scheduleEchoCoverageEnd(statusId, window)
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

    const mechanicHosts = new Map<PreparedMechanic, MechanicHost>()
    for (const prepared of mechanics) {
      mechanicHosts.set(prepared, {
        ledger,
        hasStatus: (id) => statusById.has(id),
        statusDurationFrames: (id) => statusById.get(id)?.durationFrames ?? null,
        scheduleExtra: (event) => {
          const latestWindowEnd =
            fixedWindowFrames !== null && fightStartFrame === null
              ? activeUpperBound + fixedWindowFrames
              : windowEndFrame()
          if (event.frame > latestWindowEnd) return
          enqueue({ kind: "extra", frame: event.frame, event, owner: prepared })
        },
      })
    }
    for (const prepared of mechanics)
      prepared.mechanic.start?.(prepared.state, mechanicHosts.get(prepared)!, prepared.setup)

    interface ScoredEvent {
      damage: number
      rolled: RolledHit | undefined
      st: ReturnType<typeof resolveState>
      affinityChanceWithout: Readonly<Record<string, number>>
    }

    const observers = mechanics.filter(({ mechanic }) => mechanic.observeEvent !== undefined)
    const beforeEventMechanics = mechanics.filter(
      ({ mechanic }) => mechanic.beforeEvent !== undefined,
    )
    const affinityObservers = observers.filter(({ mechanic }) => mechanic.needsAffinityChance)
    const affinityChancesWithout = (
      forObservers: boolean,
      rng: (() => number) | undefined,
      chanceWithout: (mechanicId: string) => number,
    ): Record<string, number> =>
      forObservers && !rng
        ? Object.fromEntries(
            affinityObservers.map(({ mechanic }) => [mechanic.id, chanceWithout(mechanic.id)]),
          )
        : {}

    let scoringQiReader: QiReader = iterationQiReader

    function withQiReadAtFrame<Scored>(
      frame: number,
      readQiAtFrame: number | null,
      score: () => Scored,
    ): Scored {
      if (readQiAtFrame === null || !buffEngine) return score()
      buffEngine.attachQiReader(qiReaderReadingFrame(iterationQiReader, frame, readQiAtFrame, FPS))
      try {
        return score()
      } finally {
        buffEngine.attachQiReader(scoringQiReader)
      }
    }

    function readingLiveBarAfterHit(frame: number, read: () => void): void {
      if (!buffEngine || scoringQiReader === iterationQiReader) {
        read()
        return
      }
      buffEngine.attachQiReader(liveBarQiReader(iterationQiReader, qiBar, frame, FPS, "afterHit"))
      try {
        read()
      } finally {
        buffEngine.attachQiReader(scoringQiReader)
      }
    }

    function readingIterationQi<Read>(read: () => Read): Read {
      if (!buffEngine || scoringQiReader === iterationQiReader) return read()
      buffEngine.attachQiReader(iterationQiReader)
      try {
        return read()
      } finally {
        buffEngine.attachQiReader(scoringQiReader)
      }
    }

    function scoreHit(
      event: HitScoreInput,
      rng: (() => number) | undefined,
      readQiAtFrame: number | null,
      forObservers = false,
    ): ScoredEvent {
      return withQiReadAtFrame(event.frame, readQiAtFrame, () => {
        const { frame, skill, hit, castFrame, stepStart, ledgerMark } = event
        const behavior = behaviorFor(skill)
        const hitInput = hitInputAt(skill, hit, frame, castFrame, stepStart)
        let { extraEffects, forceGuaranteedAffinity } = event
        if (readQiAtFrame !== null) {
          extraEffects = event.extraEffects.slice(0, event.onHitEffectCount)
          forceGuaranteedAffinity = event.forcedAffinityByOnHit
          const claimSink: EffectSink = {
            stat: (statKey, amount) => extraEffects.push({ statKey, amount }),
            forceOutcome: (outcome) => {
              if (outcome === "affinity") forceGuaranteedAffinity = true
            },
            applyBuff: () => {},
            consumeStacks: () => {},
            setStatus: () => {},
            artBonus: () => {},
            damageMultiplier: () => {},
            echo: () => {},
            finalCritAtLeast: () => {},
          }
          const phase = buffEngine?.qiPhase(frame / FPS, "beforeHit") ?? "normal"
          for (const effect of behavior.claimStatEffects(hitInput, phase))
            applyEffect(claimSink, effect)
        }
        const resolveOverride: ResolveOverride | undefined =
          extraEffects.length > 0 || forceGuaranteedAffinity
            ? { extraEffects, forceGuaranteedAffinity }
            : undefined
        const st = resolveState(
          frame,
          skill,
          resolveOverride,
          castFrame,
          fightDamageSoFar,
          ledgerAsOfForCast(ledgerMark, stepStart),
          { engineOffsetSec: event.engineOffsetSec },
        )
        const hitContext: HitContext = {
          phase: buffEngine?.qiPhase(frame / FPS, "beforeHit") ?? "normal",
          smallPhys: st.ctx.smallPhys,
          isEngineBuffActive: (id) =>
            buffEngine?.isBuffActiveAtTime(id, frame / FPS + event.engineOffsetSec) ?? false,
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
        const { expectedDamage, rolled } = computeSkillDamage(art, st.ctx, 1, rng)
        return {
          damage: rolled?.damage ?? expectedDamage,
          rolled,
          st,
          affinityChanceWithout: affinityChancesWithout(forObservers, rng, (mechanicId) => {
            const without = resolveState(
              frame,
              skill,
              resolveOverride,
              castFrame,
              fightDamageSoFar,
              ledgerAsOfForCast(ledgerMark, stepStart),
              { engineOffsetSec: event.engineOffsetSec, withoutMechanicId: mechanicId },
            )
            return computeSkillDamage(art, without.ctx, 1).affinityOutcomeChance
          }),
        }
      })
    }

    function scoreTick(
      entry: DotTickEntry,
      rng: (() => number) | undefined,
      readQiAtFrame: number | null,
      share = 1,
      forObservers = false,
    ): ScoredEvent {
      return withQiReadAtFrame(entry.frame, readQiAtFrame, () => {
        const engineOffsetSec = sameFrameOffsetSec(damagingHitsPerFrame.get(entry.frame) ?? 0)
        const st = resolveState(
          entry.frame,
          entry.dotSkill,
          undefined,
          entry.frame,
          fightDamageSoFar,
          ledger,
          { engineOffsetSec },
        )
        const tick = dotTickDamage(
          tickWithResolvedMinPhysCrit(entry, st.ctx.smallPhys),
          st.ctx,
          computeSkillDamage,
          st.forceCrit,
          entry.shape,
          rng,
          st.artBonuses,
        )
        // `damageFactor` is post-formula, so a tick takes it on its finished
        // number the way a regular hit takes it on its art `correction`.
        const damage = tick.damage * (entry.scale ?? 1) * entry.weight * share * st.damageFactor
        return {
          damage,
          rolled: tick.rolled,
          st,
          affinityChanceWithout: affinityChancesWithout(forObservers, rng, (mechanicId) => {
            const without = resolveState(
              entry.frame,
              entry.dotSkill,
              undefined,
              entry.frame,
              fightDamageSoFar,
              ledger,
              { engineOffsetSec, withoutMechanicId: mechanicId },
            )
            return dotTickDamage(
              tickWithResolvedMinPhysCrit(entry, without.ctx.smallPhys),
              without.ctx,
              computeSkillDamage,
              without.forceCrit,
              entry.shape,
              undefined,
              without.artBonuses,
            ).affinityOutcomeChance
          }),
        }
      })
    }

    function scoreExtra(
      mechEvent: MechanicEvent,
      rng: (() => number) | undefined,
      readQiAtFrame: number | null,
      forObservers = false,
    ): ScoredEvent {
      return withQiReadAtFrame(mechEvent.frame, readQiAtFrame, () => {
        const engineOffsetSec = sameFrameOffsetSec(damagingHitsPerFrame.get(mechEvent.frame) ?? 0)
        const st = resolveState(
          mechEvent.frame,
          mechEvent.skill,
          undefined,
          mechEvent.frame,
          fightDamageSoFar,
          ledger,
          { engineOffsetSec },
        )
        const art = { ...mechEvent.art } as Parameters<typeof computeSkillDamage>[0]
        if (st.forceCrit) art.guaranteedCrit = 1
        if (st.forceNoAbrasion) art.abrasionAvoidRate = 1
        const { expectedDamage, rolled } = computeSkillDamage(art, st.ctx, 1, rng)
        return {
          damage: rolled?.damage ?? expectedDamage,
          rolled,
          st,
          affinityChanceWithout: affinityChancesWithout(forObservers, rng, (mechanicId) => {
            const without = resolveState(
              mechEvent.frame,
              mechEvent.skill,
              undefined,
              mechEvent.frame,
              fightDamageSoFar,
              ledger,
              { engineOffsetSec, withoutMechanicId: mechanicId },
            )
            return computeSkillDamage(art, without.ctx, 1).affinityOutcomeChance
          }),
        }
      })
    }

    function eventInfoOf(
      source: MechanicEventSource,
      timeSec: number,
      occurrence: number,
      traits: Pick<MechanicEventInfo, "direct" | "canRollAffinity">,
    ): MechanicEventInfo {
      return { source, timeSec, occurrence: clamp(occurrence, 0, 1), ...traits }
    }

    function beforeScoredEvent(info: MechanicEventInfo): void {
      for (const { mechanic, state, setup } of beforeEventMechanics)
        mechanic.beforeEvent!(state, info, setup)
    }

    function observeScoredEvent(
      info: MechanicEventInfo,
      scored: Pick<ScoredEvent, "rolled" | "affinityChanceWithout">,
    ): void {
      for (const prepared of observers)
        prepared.mechanic.observeEvent!(
          prepared.state,
          {
            ...info,
            affinityChance: clamp(scored.affinityChanceWithout[prepared.mechanic.id] ?? 0, 0, 1),
            ...(scored.rolled ? { rolledAffinity: scored.rolled.outcome === "affinity" } : {}),
          },
          prepared.setup,
          mechanicHosts.get(prepared)!,
        )
    }

    const qiBreakFrames = qiSchedule.breaks.map(({ startSec, endSec }) => ({
      startFrame: Math.round(startSec * FPS),
      endFrame: Math.round(endSec * FPS),
    }))
    const scoredInsideBreak = (frame: number): boolean =>
      scoringQiReader.isBroken(frame / FPS, "beforeHit")
    const qiEdgeDependence = new QiEdgeDependence()
    const recordQiEdgeDependence = (
      frame: number,
      skillName: string,
      rescore: (readQiAtFrame: number | null) => ScoredEvent,
    ): void => {
      if (!collectDetail || !buffEngine) return
      const site = qiEdgeSiteOf(frame, qiBreakFrames, FPS, scoredInsideBreak(frame))
      if (!site) return
      const asScored = rescore(null)
      const acrossEdge = rescore(site.referenceFrame)
      qiEdgeDependence.record(skillName, site, acrossEdge.damage - asScored.damage)
    }

    const hitEventsInOrder: (QueuedHit & { exactFrame: number })[] = []
    const windowBoundTimeline = new Set<TimelineEvent>()
    const tailTallies: { frame: number; apply: () => void }[] = []
    let combatStarted = false
    let hitsProcessed = 0

    const settleTally = (frame: number, apply: () => void): void => {
      if (fightStartFrame === null) {
        preStartTallies.push({ frame, apply })
        return
      }
      if (!inFight(frame)) return
      if (
        fixedWindowFrames === null &&
        (lastDamagingHitFrame === null || frame > lastDamagingHitFrame)
      ) {
        tailTallies.push({ frame, apply })
        return
      }
      apply()
    }
    const flushTailTallies = (): void => {
      for (const tally of tailTallies) tally.apply()
      tailTallies.length = 0
    }
    const pushWindowBoundEvent = (event: TimelineEvent): void => {
      if (!collectDetail) return
      timeline.push(event)
      windowBoundTimeline.add(event)
    }

    for (;;) {
      const nextEvent = mergedQueue.peek()
      if (nextEvent && fixedWindowFrames === null && pendingHitLikeEvents === 0) {
        const settledEnd = lastDamagingHitFrame ?? activeCursorFrames
        if (nextEvent.frame > settledEnd) break
      }
      if (liveWriter.expireEarliest(nextEvent ? nextEvent.frame - 1 : windowEndFrame())) continue
      const event = mergedQueue.pop()
      if (!event) break
      loopFrame = event.frame
      if (event.kind === "hit" || event.kind === "castStart" || event.kind === "gate")
        pendingHitLikeEvents--
      if (buffEngine && !fixedQiBreaks) {
        scoringQiReader = liveBarQiReader(iterationQiReader, qiBar, event.frame, FPS)
        buffEngine.attachQiReader(scoringQiReader)
      }
      for (const resource of resources)
        resource.advance(Math.min(windowEndFrame(), Math.max(0, event.frame)))
      if (event.kind === "castEnd") {
        liveWriter.applyTrigger(event.trigger, event.frame, event.stepStart)
      } else if (event.kind === "meter") {
        event.run()
      } else if (event.kind === "castStart") {
        beginCast(event)
      } else if (event.kind === "gate") {
        evaluateReleaseGate(event.cast, event.frame)
      } else if (event.kind === "deferredGrant") {
        event.grant.commit()
      } else if (event.kind === "hit") {
        const { frame, skill, hit } = event
        if (fightStartFrame !== null && frame > windowEndFrame()) continue
        if (hitsProcessed >= EVENT_CAP) {
          warnings.push(
            `Timeline exceeded ${EVENT_CAP} events — a trigger chain may be unbounded; simulation was truncated.`,
          )
          break
        }
        hitsProcessed++
        const exactFrame = event.exactFrame ?? frame
        hitEventsInOrder.push({ ...event, exactFrame })
        const ledgerMarkBeforeHit = ledger.mark()
        if (hitDealsDamage(hit)) {
          openFight(frame)
          lastDamagingHitFrame = frame
          flushTailTallies()
          if (!combatStarted) {
            combatStarted = true
            ledger.recordStack(IN_COMBAT_STATUS, frame, 1)
          }
        }
        const scoreInput = prepareHit(event)
        const launchResource = resourceByLaunch.get(skill.id)
        const launchShare = launchResource && inFight(frame) ? launchResource.launch(frame) : 1
        const engineTimeSec = frame / FPS + scoreInput.engineOffsetSec
        if (launchShare > 0) {
          if (hitDealsDamage(hit)) {
            buffEngine?.processDamageHitPreScore(engineTimeSec, skill)
            buffEngine?.processDamagingEvent({
              skill,
              timeSec: frame / FPS,
              stampSec: exactFrame / FPS,
            })
          }
          const hitInfo = eventInfoOf("hit", frame / FPS, launchShare, {
            direct: true,
            canRollAffinity: skill.guaranteedNormal !== true,
          })
          if (hitDealsDamage(hit)) beforeScoredEvent(hitInfo)
          const scored = scoreHit(scoreInput, hitRng, null, true)
          const landsInFight = inFight(frame)
          if (landsInFight && hitDealsDamage(hit))
            recordQiEdgeDependence(frame, skill.name, (readQiAtFrame) =>
              scoreHit(scoreInput, undefined, readQiAtFrame),
            )
          if (hitDealsDamage(hit)) observeScoredEvent(hitInfo, scored)
          const { rolled, st } = scored
          const damage = scored.damage * launchShare
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
          if (hitDealsDamage(hit))
            readingLiveBarAfterHit(frame, () =>
              buffEngine?.processDamageHitPostQi(engineTimeSec, skill, event.generated),
            )
          if (landsInFight) {
            fightDamageSoFar += damage
            if (hitDealsDamage(hit)) for (const resource of resources) resource.hit(skill, frame)
            settleTally(frame, () => {
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
            })
          }
          pushEvent({
            frame,
            timeSec: frame / FPS,
            skillName: skill.name,
            type: skill.skillType,
            kind: "hit",
            damage,
            inWindow: false,
          })
        }
        fireHitTriggers(event, scoreInput.engineOffsetSec, ledgerMarkBeforeHit)
      } else if (event.kind === "tickLaunch") {
        const { episode, pulse, runIndex, offset } = event
        if (offset === 0) {
          episode.pulsePending = false
          episode.nextPulse = pulse + episode.schedule.interval
          episode.runIndex = runIndex + 1
          armDotPulse(episode)
        }
        if (pulse + offset >= episodeEndFrame(episode)) continue
        const launch = planDotTickLaunch(episode.query, episode.schedule, pulse, runIndex, offset)
        if (!launch) continue
        const inFlight = launch.frame !== launch.launchFrame
        const landing = inFlight ? null : resolveDotTickLanding(episode.query, launch)
        if (!inFlight && !landing) continue
        const { status, dot, tickSkill } = episode
        const entry: PendingDotTick = {
          ...launch,
          resourceOwner: episode.resource ? episode.startFrame : undefined,
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
        const resource = resourceByDebuff.get(entry.debuff.id)
        if (
          entry.requiresBuff &&
          !buffEngine?.isBuffActiveAtTime(
            entry.requiresBuff,
            (entry.requiresBuffAtFrame ?? entry.launchFrame) / FPS,
          )
        )
          continue
        const resourceTick = resource?.tick(entry.launchFrame, entry.resourceOwner!)
        if (resourceTick && resourceTick.share <= 0) continue
        if (
          resource &&
          entry.enhancedBy &&
          buffEngine?.isBuffActiveAtTime(entry.enhancedBy, entry.launchFrame / FPS)
        )
          resource.chargeEnhancedRun(entry.launchFrame, entry.resourceOwner!)
        enqueue({
          kind: "tick",
          frame: entry.frame,
          episode,
          pending: entry,
          landing,
          launched: resourceTick ?? { share: 1, particles: null },
        })
      } else if (event.kind === "tick") {
        const { launched } = event
        const landing = event.landing ?? resolveDotTickLanding(event.episode.query, event.pending)
        if (!landing) continue
        const entry: DotTickEntry = { ...event.pending, ...landing }
        if (entry.debuffForTick.dot && hitDealsDamage(entry.debuffForTick.dot))
          openFight(entry.frame)
        const resource = resourceByDebuff.get(entry.debuff.id)
        const tickShare = launched.share
        resource?.creditHit(entry.frame, launched.particles)
        buffEngine?.processDamageHitPreScore(entry.frame / FPS, entry.dotSkill, "tick")
        buffEngine?.processDamagingEvent({
          skill: entry.dotSkill,
          timeSec: entry.frame / FPS,
          stampSec: (entry.frame + (entry.stampLatenessFrames ?? 0)) / FPS,
          runKey: `${entry.debuff.id}|${entry.runFrame}`,
          particles: launched.particles,
        })
        if (entry.debuff.triggersBuffs && entry.debuff.triggersBuffs.length > 0) {
          buffEngine?.triggerDeclaredBuffs(
            entry.debuff.triggersBuffs,
            castTagOf(entry.dotSkill),
            entry.frame / FPS,
            propsOfSkill(entry.dotSkill, 1),
            false,
            skillTagsOf(entry.dotSkill),
            undefined,
            deferGrantFrom(entry.frame),
          )
        }
        const tickInfo = eventInfoOf("tick", entry.frame / FPS, entry.weight * tickShare, {
          direct: entry.debuffForTick.dot?.directHit === true,
          canRollAffinity: entry.dotSkill.guaranteedNormal !== true,
        })
        beforeScoredEvent(tickInfo)
        const scoredTick = scoreTick(entry, hitRng, null, tickShare, true)
        if (inFight(entry.frame))
          recordQiEdgeDependence(entry.frame, entry.dotName, (readQiAtFrame) =>
            scoreTick(entry, undefined, readQiAtFrame, tickShare),
          )
        observeScoredEvent(tickInfo, scoredTick)
        const { damage, rolled: tickRolled, st } = scoredTick
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
        readingLiveBarAfterHit(entry.frame, () =>
          buffEngine?.processDamageHitPostQi(entry.frame / FPS, entry.dotSkill, false, "tick"),
        )
        if (inFight(entry.frame)) fightDamageSoFar += damage
        settleTally(entry.frame, () => {
          totalDamage += damage
          if (tickRolled) tallyRoll(tickRolled, damage)
          add(
            entry.dotName,
            entry.dotType,
            1,
            damage,
            entry.dotBreakdownName,
            entry.dotBreakdownKey,
          )
          bankEcho(entry.frame, st.echoFeeds, damage)
        })
        pushWindowBoundEvent({
          frame: entry.frame,
          timeSec: entry.frame / FPS,
          skillName: entry.dotName,
          type: entry.dotType,
          kind: "dot",
          damage,
          inWindow: false,
        })
      } else if (event.kind === "extra") {
        const mechEvent = event.event
        const extraInfo = eventInfoOf("extra", mechEvent.frame / FPS, 1, {
          direct: mechEvent.direct,
          canRollAffinity: mechEvent.art.guaranteedNormal !== 1,
        })
        beforeScoredEvent(extraInfo)
        const scoredExtra = scoreExtra(mechEvent, hitRng, null, true)
        if (inFight(mechEvent.frame))
          recordQiEdgeDependence(mechEvent.frame, mechEvent.name, (readQiAtFrame) =>
            scoreExtra(mechEvent, undefined, readQiAtFrame),
          )
        observeScoredEvent(extraInfo, scoredExtra)
        const { damage, rolled, st } = scoredExtra
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
        if (inFight(mechEvent.frame)) fightDamageSoFar += damage
        settleTally(mechEvent.frame, () => {
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
        })
        pushWindowBoundEvent({
          frame: mechEvent.frame,
          timeSec: mechEvent.frame / FPS,
          skillName: mechEvent.name,
          type: mechEvent.type,
          kind: "hit",
          damage,
          inWindow: false,
        })
        event.owner.mechanic.afterExtraEvent?.(
          event.owner.state,
          mechEvent,
          mechanicHosts.get(event.owner)!,
          event.owner.setup,
        )
      } else {
        if (event.coverageEnd && ledger.isActiveAt(event.debuffId, event.frame)) continue
        if (!inFight(event.frame)) continue
        const releasedFrame = event.frame
        const releasedDebuffId = event.debuffId
        settleTally(releasedFrame, () => {
          const pot = echoPotByDebuff.get(releasedDebuffId) ?? 0
          echoPotByDebuff.set(releasedDebuffId, 0)
          if (pot <= 0) return
          const echo = echoOf(releasedDebuffId)!
          const adjustment = echo.releaseAdjustment
          const paid =
            adjustment &&
            adjustment.requiresStatuses.every((id) => ledger.isActiveAt(id, releasedFrame))
              ? pot * adjustment.factor
              : pot
          totalDamage += paid
          fightDamageSoFar += paid
          add(
            echo.breakdownName,
            echo.skillType,
            1,
            paid,
            echo.breakdownName,
            debuffEchoKey(releasedDebuffId),
          )
          pushWindowBoundEvent({
            frame: releasedFrame,
            timeSec: releasedFrame / FPS,
            skillName: echo.breakdownName,
            type: echo.skillType,
            kind: "hit",
            damage: paid,
            inWindow: false,
          })
        })
      }
    }

    for (;;) {
      const trailingEvent = mergedQueue.pop()
      if (!trailingEvent) break
      liveWriter.processExpiries(trailingEvent.frame - 1)
      loopFrame = trailingEvent.frame
      if (trailingEvent.kind === "castEnd")
        liveWriter.applyTrigger(trailingEvent.trigger, trailingEvent.frame, trailingEvent.stepStart)
      else if (trailingEvent.kind === "meter") trailingEvent.run()
      else if (trailingEvent.kind === "deferredGrant") trailingEvent.grant.commit()
    }

    scoringQiReader = iterationQiReader
    buffEngine?.attachQiReader(iterationQiReader)

    const castCursorFrames = activeCursorFrames
    const fightStartFinalFrame = fightStartFrame ?? 0
    const windowFrames =
      fixedWindowFrames === null
        ? (lastDamagingHitFrame ?? castCursorFrames)
        : fightStartFinalFrame + fixedWindowFrames
    if (fightStartFrame === null)
      for (const tally of preStartTallies) if (tally.frame >= 0) tailTallies.push(tally)
    const fightNeverOpened =
      fixedWindowFrames === null ? lastDamagingHitFrame === null : fightStartFrame === null
    if (fightNeverOpened)
      for (const tally of tailTallies) if (tally.frame <= windowFrames) tally.apply()
    const inWindow = (frame: number): boolean =>
      frame >= fightStartFinalFrame && frame <= windowFrames
    const fightStartSec = fightStartFinalFrame / FPS
    const rotationDurationSec = (windowFrames - fightStartFinalFrame) / FPS
    const ledgerSpanEnd = fixedWindowFrames === null ? castCursorFrames : windowFrames
    ledger.setSpanEnd(ledgerSpanEnd + 1)
    castRecords.sort((left, right) => left.stepIndex - right.stepIndex)
    const castCounts = new Map<string, number>()
    for (const castRecord of castRecords) {
      const name = castRecord.resolved.skill.name
      castCounts.set(name, (castCounts.get(name) ?? 0) + 1)
    }
    const meterWarnings: string[] = []
    for (const meter of meters) {
      meter.advanceTo(ledgerSpanEnd)
      for (const meterWarning of meter.warnings)
        meterWarnings.push(
          `${meter.def.name} at ${(meterWarning.frame / FPS - fightStartSec).toFixed(2)}s: ${meterWarning.message}.`,
        )
    }
    for (const pending of pendingTimedWarnings)
      warnings[pending.index] = pending.build(pending.frame / FPS - fightStartSec)
    warnings.unshift(
      ...rotationWarnings,
      ...timedWarnings.map(({ frame, build }) => build(frame / FPS - fightStartSec)),
      ...meterWarnings,
    )

    ledger.observeWindows({})
    liveWriter.processExpiries(windowFrames)
    ledger.sortWindows()

    if (lateMeterDefs.length > 0) {
      const lateMeterGate = triggerGate(conditionHolds)
      lateMeterSettlement = settleLateMeters({
        defs: lateMeterDefs,
        fps: FPS,
        startFrame: spanStart,
        maxContext: meterMaxContext,
        particleCount: buffEngine?.extensionParticleCount ?? 1,
        steps: castRecords.map((castRecord) => ({
          stepId: castRecord.resolved.step.id,
          skill: castRecord.resolved.skill,
          startFrame: castRecord.startFrame,
          prePull: castRecord.prePull,
        })),
        hits: hitEventsInOrder.map((event) => ({
          skill: event.skill,
          hit: event.hit,
          stepStart: event.stepStart,
          frame: event.frame,
          exactFrame: event.exactFrame,
        })),
        costApplies: meterCostRequirementHolds,
        delayedCostFrame: (startFrame, atFrame) => hitLandingFrame(startFrame, atFrame),
        castEndFrame: (landed) =>
          castEndFrame(
            landed.skill,
            landed.stepStart,
            (condition) => conditionHolds(condition, landed.stepStart),
            targetDistanceAt(landed.stepStart),
          ),
        guardsHold: (trigger, frame) => lateMeterGate.fires(trigger, frame),
        liveParticles: (buffId, frame) =>
          buffEngine ? buffEngine.liveParticles(buffId, (frame - 1) / FPS) : false,
      })
      for (const { stepId, reasons } of lateMeterSettlement.illegalCasts) {
        const castRecord = castRecords.find((candidate) => candidate.resolved.step.id === stepId)!
        recordInvalidStep(stepId, [...(invalidStepReasons[stepId] ?? []), ...reasons])
        warnings.push(
          `${castRecord.resolved.skill.name || castRecord.resolved.skill.id} at ${(castRecord.startFrame / FPS - fightStartSec).toFixed(2)}s would be illegal in the game: ${reasons.map(englishConditionFailure).join(" and ")}.`,
        )
      }
    }

    const resourceResults = resources.map((resource) => resource.finish(windowFrames))
    for (const resource of resources) {
      const latestEndByStart = new Map<number, number>()
      for (const launch of resource.result.launches) {
        if (launch.reason === "insufficient") continue
        const start = Math.round(launch.timeSec * FPS)
        latestEndByStart.set(
          start,
          Math.max(latestEndByStart.get(start) ?? 0, Math.round(launch.endSec * FPS)),
        )
      }
      ledger.constrainWindows(
        resource.definition.debuffId,
        [...latestEndByStart].map(([start, end]) => ({ start, end })),
      )
    }

    // Only now is `buffHistory` settled by every event, ticks included, so a
    // cast chip reports what a tick applied to it.
    const casts: RotationCast[] = collectDetail ? buildCasts() : []
    const buffWindows: BuffWindow[] = collectDetail ? buildBuffWindows() : []

    for (const timelineEvent of timeline) timelineEvent.inWindow = inWindow(timelineEvent.frame)
    const reportedTimeline = timeline.filter(
      (timelineEvent) =>
        !(windowBoundTimeline.has(timelineEvent) && timelineEvent.frame > windowFrames),
    )
    reportedTimeline.sort(
      (left, right) =>
        left.frame - right.frame || (left.kind === right.kind ? 0 : left.kind === "hit" ? -1 : 1),
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
    const qiEdgeWarnings = qiEdgeDependence.warnings(totalDamage, FPS, fightStartSec)
    const result: Result = {
      dps,
      ...(resourceResults.length > 0 ? { resources: resourceResults } : {}),
      totalDamage,
      rotationDuration: rotationDurationSec,
      fightStartSec,
      castDuration: castCursorFrames / FPS,
      graduationRate: null,
      perSkill,
      ranking: [],
      warnings,
      ...(qiEdgeWarnings.length > 0 ? { qiEdgeWarnings } : {}),
      ...(invalidStepIds.length > 0 ? { invalidStepIds } : {}),
      ...(Object.keys(invalidStepReasons).length > 0 ? { invalidStepReasons } : {}),
      timeline: reportedTimeline,
      buffWindows,
      qiBreakWindow,
      lowQiWindow,
      casts,
      outcomeCounts: hitRng ? outcomeTally : undefined,
      outcomeDamage: hitRng ? outcomeDamageTally : undefined,
      expectedOutcomeShare: hitRng ? expectedOutcomeShare : undefined,
      qiBreaks: qiComputedSchedule.breaks,
      qiDamageLog: qiBar.damageLog(),
      ...(collectDetail ? { qiTrace: qiBar.displayTrace() } : {}),
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

// A build param with no owning inner way falls back to this reading of its
// bare camelCase id — not imported from the catalog module, which pulls in
// the class registry and would cycle back here through it.
function humanizedParamName(param: string): string {
  const spaced = param.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

// A param condition's failure reads as a missing build choice, not a missing
// buff — distinct wording per `ParamSource["kind"]` (docs/TIMELINE.md § "Cast
// legality"), never hand-mapped to one param's id.
const PARAM_SOURCE_LABEL: Record<ParamSource["kind"], string> = {
  innerWay: "inner way",
  set: "set",
  script: "script",
}
const PARAM_SOURCE_VERB: Record<ParamSource["kind"], string> = {
  innerWay: "equipped",
  set: "equipped",
  script: "selected",
}

// Plain-English rendering for `result.warnings`, which carries no locale of
// its own (docs/TIMELINE.md § "Cast legality"). The same structured reason
// renders through the locale catalogue wherever the UI shows it instead.
function englishConditionFailure(reason: ConditionFailureReason): string {
  switch (reason.kind) {
    case "anyOf":
      return `(${reason.reasons.map(englishConditionFailure).join(" or ")})`
    case "weapon":
      return `needs the ${reason.name} drawn (${reason.actualName || "nothing"} drawn)`
    case "param": {
      const subject = reason.source
        ? `the ${PARAM_SOURCE_LABEL[reason.source.kind]} ${reason.name}`
        : reason.name
      const verb = reason.source ? PARAM_SOURCE_VERB[reason.source.kind] : "active"
      const notVerb = `not ${verb}`
      if (reason.minTier === undefined)
        return `needs ${subject} ${verb} (${reason.actualOn ? verb : notVerb})`
      return `needs ${subject} tier ${reason.minTier}+ (has ${
        reason.actualOn ? `tier ${reason.actualTier}` : notVerb
      })`
    }
    case "meter":
      return `needs ${reason.name} ${OP_SYMBOL[reason.op]} ${inDisplayUnits(reason.required, reason.unitSize)} (has ${inDisplayUnits(reason.actual, reason.unitSize)})`
    default:
      return `needs ${reason.name} ${OP_SYMBOL[reason.op]} ${reason.required} (has ${reason.actual})`
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
