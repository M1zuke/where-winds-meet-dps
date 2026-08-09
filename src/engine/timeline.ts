import type {
  BuffWindow,
  Inputs,
  Result,
  RotationCast,
  SkillTickResult,
  TimelineEvent,
} from "./types"
import type { Buff, BuffStatEffect } from "./buff"
import type { Debuff } from "./debuff"
import type { Skill, SkillHit, TriggerCondition } from "./skill"
import { isPrePullSkill, hitDealsDamage, triggerConditions } from "./skill"
import { resolveRotation, type ResolvedStep } from "./rotation"
import { StatusLedger } from "./ledger"
import { collectCastBuffs } from "./castBuffs"
import { dotTickDamage, dotTickSkill, emitDotTicks, resolveTickDot, tickSourceSkillId } from "./dot"
import { buildBehaviors, type BuildView, type HitInput } from "./behavior"
import "../data/classes/bellstrikeUmbraCrosswind"
import {
  deriveStats,
  buildContext,
  effectiveRates,
  getBreakthrough,
  henZhiActiveForInputs,
} from "./panel"
import { computeSkillDamage } from "./formula"
import { padSlots } from "./perSkillDamage"
import { applyBuffEffects } from "./statRegistry"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./builtinLibrary"
import {
  builtinBuffsForClass,
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
} from "./builtinBuffs"
import { BuffEngine } from "./buffs/buffEngine"
import { buffDefsForClass, groupBuffDefs, mechanicBuffDefsForClass } from "./buffs/data"
import { paramsFromInputs } from "./buffs/params"
import { castTagOf } from "./buffs/tags"
import {
  MORALE_MAX_STACKS,
  MORALE_PEN_PER_STACK,
  MORALE_STACK_THRESHOLD,
  YI_RIVER_INTERVAL_SEC,
  moraleDmgPerStack,
  moraleStacksAtTime,
} from "./buffs/morale"
import { innerWayAllDamageBoost } from "./buffs/innerWayBonus"
import {
  hawkwingStacksSchedule,
  HAWKWING_MAX_STACKS,
  HAWKWING_BONUS_PER_STACK,
  type HawkwingStacksSchedule,
} from "./buffs/hawkwing"
import { concentrationActiveProbSchedule } from "./buffs/concentration"
import { APP_PLAYER_LEVEL, playerLevelAttributeAttackBonus } from "./buffs/levelAttributeBonus"
import { zhongToTier } from "./buffs/paramMap"
import {
  bitterSeasonDebuffId,
  bitterSeasonEnvelopeWindows,
  bitterSeasonPoisonSchedule,
  bitterSeasonStackSchedule,
  resolveBitterSeasonTuning,
  BITTER_SEASON_INNER_WAY,
  BITTER_SEASON_MAX_STACKS,
  type BitterSeasonPoisonSchedule,
  type BitterSeasonStackSchedule,
} from "./buffs/bitterSeason"

export const FPS = 60

// Guards against a runaway cast-skill trigger chain.
const EVENT_CAP = 100_000

const LEVEL_ATTRIBUTE_BONUS_ROLES = ["role:bleedDetonation", "role:bleedTick"]

const CONCENTRATION_DOT_MULT_ROLES = ["role:bleedDetonation", "role:bleedTick", "role:combustion"]

const CONCENTRATION_DISPLAY_THRESHOLD = 0.5

const BITTER_SEASON_REMAINING_DISPLAY_THRESHOLD = 0.5

type Ctx = ReturnType<typeof buildContext>
type Derived = ReturnType<typeof deriveStats>

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

interface HitEvent {
  frame: number
  seq: number
  skill: Skill
  hit: SkillHit
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

export function simulateTimeline(inputs: Inputs): Result {
  const rotation = inputs.activeCustomRotation
  if (!rotation || rotation.classId !== inputs.classId) {
    return emptyResult(["Timeline rotation not available for this class."])
  }

  const skillsMap = new Map<string, Skill>()
  for (const s of builtinSkillsForClass(inputs.classId)) skillsMap.set(s.id, s)
  for (const s of inputs.customSkills ?? []) skillsMap.set(s.id, s)
  const skills = [...skillsMap.values()]
  const buffsMap = new Map<string, Buff>()
  for (const b of builtinBuffsForClass(inputs.classId)) buffsMap.set(b.id, b)
  for (const b of inputs.customBuffs ?? []) buffsMap.set(b.id, b)
  const buffs = [...buffsMap.values()]
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
    performedHits: SkillHit[]
  }

  const castLens: number[] = resolvedSteps.map((rs) => {
    const hitCount = clamp(rs.step.hitCount, 0, rs.skill.hits.length)
    const performedHits = rs.skill.hits.slice(0, hitCount)
    const maxFrame = performedHits.length > 0 ? Math.max(...performedHits.map((h) => h.frame)) : -1
    return rs.skill.castFrames || maxFrame + 1
  })

  const prePullTotal = resolvedSteps.reduce(
    (sum, rs, i) => (isPrePullSkill(rs.skill) ? sum + castLens[i] : sum),
    0,
  )

  const laidSteps: LaidStep[] = []
  let activeCursor = 0
  let preCursor = -prePullTotal
  for (let i = 0; i < resolvedSteps.length; i++) {
    const rs = resolvedSteps[i]
    const prePull = isPrePullSkill(rs.skill)
    const hitCount = clamp(rs.step.hitCount, 0, rs.skill.hits.length)
    const performedHits = rs.skill.hits.slice(0, hitCount)
    const startFrame = prePull ? preCursor : activeCursor
    if (prePull) preCursor += castLens[i]
    else activeCursor += castLens[i]
    laidSteps.push({ resolved: rs, prePull, startFrame, performedHits })
  }
  const durationFrames = activeCursor
  const spanStart = Math.min(0, -prePullTotal)
  const rotationDurationSec = durationFrames / FPS

  const hawkwingStacks: HawkwingStacksSchedule | null =
    inputs.set === "Hawking"
      ? (() => {
          const hitTimesSec: number[] = []
          for (const ls of laidSteps) {
            for (const hit of ls.performedHits) {
              if (!hitDealsDamage(hit)) continue
              hitTimesSec.push((ls.startFrame + hit.frame) / FPS)
            }
          }
          hitTimesSec.sort((a, b) => a - b)
          const p = Math.min(effectiveRates(inputs).affinityRate, 0.4)
          return hawkwingStacksSchedule(hitTimesSec, p, rotationDurationSec)
        })()
      : null

  const concentrationSchedule =
    inputs.classId === "bellstrikeUmbra" &&
    inputs.mindMethods.some((m) => m.name === "Insightful Strike")
      ? (() => {
          const weaponHitTimesSec: number[] = []
          for (const ls of laidSteps) {
            if (ls.resolved.skill.skillType !== "weapon") continue
            for (const hit of ls.performedHits) {
              if (!hitDealsDamage(hit)) continue
              weaponHitTimesSec.push((ls.startFrame + hit.frame) / FPS)
            }
          }
          weaponHitTimesSec.sort((a, b) => a - b)
          const p = Math.min(effectiveRates(inputs).affinityRate, 0.4) + inputs.directAffinityRate
          return concentrationActiveProbSchedule(weaponHitTimesSec, p, rotationDurationSec)
        })()
      : null
  const concentrationTier6 =
    inputs.mindMethods.find((m) => m.name === "Insightful Strike")?.stacks === "tier 6"

  const bitterSeasonId = bitterSeasonDebuffId(inputs.classId)
  const bitterSeasonSlot =
    inputs.mindMethods.find((slot) => slot.name === BITTER_SEASON_INNER_WAY) ?? null
  const bitterSeasonTuning = bitterSeasonSlot
    ? resolveBitterSeasonTuning(zhongToTier(bitterSeasonSlot.stacks))
    : null
  const bitterSeasonHitTimesSec: number[] = []
  if (bitterSeasonTuning) {
    for (const ls of laidSteps) {
      for (const hit of ls.performedHits) {
        if (!hitDealsDamage(hit)) continue
        bitterSeasonHitTimesSec.push((ls.startFrame + hit.frame) / FPS)
      }
    }
    bitterSeasonHitTimesSec.sort((a, b) => a - b)
  }
  const bitterSeasonStacks: BitterSeasonStackSchedule | null = bitterSeasonTuning
    ? bitterSeasonStackSchedule(
        bitterSeasonHitTimesSec,
        bitterSeasonTuning.procChance,
        rotationDurationSec,
      )
    : null
  // The party-applied shared debuff (`shareDebuff5HenZhi`/Year-Long Lament T6)
  // already supplies the fully-stacked reduction.
  const bitterSeasonSuppressed = henZhiActiveForInputs(inputs)
  const bitterSeasonBaseTargetDefense = getBreakthrough(inputs.breakthrough).defense

  function bitterSeasonEffectsAt(tSec: number): BuffStatEffect[] {
    if (!bitterSeasonStacks || !bitterSeasonTuning) return []
    const out: BuffStatEffect[] = []
    const stacks = bitterSeasonStacks.expectedStacksAtTime(tSec)
    if (stacks > 0) {
      out.push({
        statKey: "target.defense",
        amount:
          -stacks * bitterSeasonTuning.defenseReductionPerStack * bitterSeasonBaseTargetDefense,
      })
    }
    if (bitterSeasonTuning.physPenetrationAtMaxStacks > 0) {
      const maxStackProb = bitterSeasonStacks.maxStackProbAtTime(tSec)
      if (maxStackProb > 0) {
        out.push({
          statKey: "phys.penetration",
          amount: bitterSeasonTuning.physPenetrationAtMaxStacks * maxStackProb,
        })
      }
    }
    return out
  }

  const prePullHitsCount = rotation.prePullHitsCount ?? false
  const inWindow = (frame: number): boolean =>
    frame >= 0 ? frame <= durationFrames : prePullHitsCount

  const castMetrics = new Map<string, { castCount: number; castFrames: number }>()
  for (let i = 0; i < laidSteps.length; i++) {
    const ls = laidSteps[i]
    if (ls.prePull && !prePullHitsCount) continue
    const name = ls.resolved.skill.name
    const e = castMetrics.get(name)
    if (e) {
      e.castCount += 1
      e.castFrames += castLens[i]
    } else castMetrics.set(name, { castCount: 1, castFrames: castLens[i] })
  }

  const ledger = new StatusLedger(spanStart, durationFrames)
  const recordStack = (id: string, frame: number, value: number) =>
    ledger.recordStack(id, frame, value)
  const stacksAt = (id: string, frame: number) => ledger.stacksAt(id, frame)
  const pushWindow = (id: string, start: number, end: number) => ledger.pushWindow(id, start, end)
  const openPermanent = (id: string) => ledger.openPermanent(id)

  for (const id of rotation.permanentBuffIds) {
    if (statusById.has(id)) openPermanent(id)
  }

  function activeBuffsAt(frame: number): (Buff | Debuff)[] {
    const out: (Buff | Debuff)[] = []
    for (const id of ledger.activeIdsAt(frame)) {
      const status = statusById.get(id)
      if (status) out.push(status)
    }
    return out
  }

  const conditionHolds = (c: TriggerCondition, frame: number): boolean => {
    const cur = ledger.conditionStacksAt(c.buffId, frame)
    return c.op === "gte" ? cur >= c.stacks : c.op === "gt" ? cur > c.stacks : cur === c.stacks
  }

  const buildView: BuildView = {
    classId: inputs.classId,
    set: inputs.set,
    innerWayTier: (name) => {
      const slot = inputs.mindMethods.find((candidate) => candidate.name === name)
      return slot ? zhongToTier(slot.stacks) : null
    },
    dingYin: (tag) => inputs.dingYinByTag[tag] ?? 0,
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

  const buffEngine: BuffEngine | null = (() => {
    try {
      const eng = new BuffEngine(paramsFromInputs(inputs), buffDefsForClass(inputs.classId), [
        ...groupBuffDefs(),
        ...mechanicBuffDefsForClass(inputs.classId),
      ])
      for (const ls of laidSteps) {
        const skill = ls.resolved.skill
        const castTag = castTagOf(skill)
        if (!castTag) continue
        const opts: Record<string, unknown> = {
          hitCount: ls.performedHits.length,
          castTime: (skill.castFrames || 1) / FPS,
        }
        for (const tag of skill.tags ?? []) {
          if (tag.startsWith("prop:")) opts[tag.slice(5)] = true
          else if (tag.startsWith("attack:")) opts.attackType = tag.slice(7)
        }
        eng.processSkillCast(castTag, ls.startFrame / FPS, opts)
        if (opts.isDrone && ls.performedHits.length > 1) {
          const useExternalLB = !!eng.params.starReacher
          for (let i = 1; i < ls.performedHits.length; i++) {
            const t = (ls.startFrame + ls.performedHits[i].frame) / FPS
            if (useExternalLB) eng.processDroneTickWithExternalLB(t)
            else eng.processDroneTick(t)
          }
        }
      }
      return eng
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

  const qiBreakEnabled = inputs.combatSettings?.qiBreak?.enabled ?? true

  interface Resolved {
    inputs: Inputs
    ctx: Ctx
    derived: Derived
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
  ): Resolved & { forceCrit: boolean } {
    const active = activeBuffsAt(frame)
    const sigParts: string[] = []
    const effects: BuffStatEffect[] = []
    let dotDamageMultiplier: number | undefined
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
    if (buffEngine && skill) {
      const site = buffEngine.calculateDamageEffects(skill, frame / FPS)
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
    if (buffEngine && buffEngine.paramOn("moraleChant")) {
      const tSec = frame / FPS
      const moraleQiBreak = buffEngine.qiPhase(tSec) === "exhausted"
      const stacks = moraleStacksAtTime(tSec, moraleQiBreak)
      if (stacks > 0) {
        effects.push({
          statKey: "allDamageBoost",
          amount: stacks * moraleDmgPerStack(moraleQiBreak),
        })
        effects.push({ statKey: "phys.penetration", amount: stacks * MORALE_PEN_PER_STACK })
        sig += `~morale:${stacks}${moraleQiBreak ? "q" : ""}`
      }
    }
    if (buffEngine && inputs.classId === "bellstrikeUmbra") {
      if (skill) {
        if (LEVEL_ATTRIBUTE_BONUS_ROLES.some((role) => skill.tags?.includes(role))) {
          const levelBonus = playerLevelAttributeAttackBonus(APP_PLAYER_LEVEL)
          if (levelBonus !== 0) {
            effects.push({ statKey: "bellstrike.min", amount: levelBonus })
            effects.push({ statKey: "bellstrike.max", amount: levelBonus })
            sig += `~juLevelBonus:${levelBonus}`
          }
        }
      }
      if (concentrationSchedule) {
        const activeProb = concentrationSchedule.getActiveProbAtTime(frame / FPS)
        if (activeProb > 0) {
          effects.push({ statKey: "affinityDamageBoost", amount: 0.1 * activeProb })
          effects.push({ statKey: "directAffinityRate", amount: 0.03 * activeProb })
          effects.push({ statKey: "allDamageBoost", amount: 0.015 * activeProb })
          sig += `~concentration:${activeProb.toFixed(4)}`
        }
        if (
          concentrationTier6 &&
          skill &&
          CONCENTRATION_DOT_MULT_ROLES.some((role) => skill.tags?.includes(role))
        ) {
          dotDamageMultiplier = 1 + 0.1 * activeProb
          sig += `~dotMult:${dotDamageMultiplier.toFixed(4)}`
        }
      }
    }
    let hawkwingPhysBonus: number | undefined
    if (hawkwingStacks) {
      const stacks = Math.round(hawkwingStacks.getExpectedStacksAtTime(frame / FPS))
      hawkwingPhysBonus = stacks * HAWKWING_BONUS_PER_STACK
      sig += `~hawkwing:${stacks}`
    }
    if (bitterSeasonTuning && !bitterSeasonSuppressed) {
      const bitterSeasonEffects = bitterSeasonEffectsAt(frame / FPS)
      if (bitterSeasonEffects.length > 0) {
        effects.push(...bitterSeasonEffects)
        sig +=
          "~bitterSeason:" +
          bitterSeasonEffects
            .map((effect) => `${effect.statKey}:${effect.amount.toFixed(6)}`)
            .join(",")
      }
    }
    const combat = inputs.combatSettings
    if (combat?.revelryScript) {
      effects.push({ statKey: "allDamageBoost", amount: 0.3 })
      sig += "~revelryScript"
    }
    if (buffEngine) {
      const qiPhaseHere = buffEngine.qiPhase(frame / FPS)
      if (combat?.qiBreak?.enabled && qiPhaseHere === "exhausted") {
        effects.push({ statKey: "allDamageBoost", amount: 0.1 })
        sig += "~qiBreakBoost"
      }
      if (combat?.healerBuff) {
        const healerAmount = 0.2 + (qiPhaseHere === "exhausted" ? 0.05 : 0)
        effects.push({ statKey: "allDamageBoost", amount: healerAmount })
        sig += `~healerBuff:${healerAmount}`
      }
      const innerWayBonus = innerWayAllDamageBoost(buffEngine, inputs.mindMethods)
      if (innerWayBonus !== 0) {
        effects.push({ statKey: "allDamageBoost", amount: innerWayBonus })
        sig += `~innerWay:${innerWayBonus}`
      }
    }
    let r = stateMemo.get(sig)
    if (!r) {
      const { inputs: effInputs, targetOverride } = applyBuffEffects(inputs, effects)
      const ctx = buildContext(effInputs, targetOverride, hawkwingPhysBonus, dotDamageMultiplier)
      if (override?.forceGuaranteedAffinity) {
        ctx.affinityPanel = 0
        ctx.directAffinityPanel = 1
      }
      const derived = deriveStats(effInputs)
      r = { inputs: effInputs, ctx, derived }
      stateMemo.set(sig, r)
    }
    return { ...r, forceCrit: forceCritFromBuff }
  }

  const queue = new EventQueue()
  let seq = 0
  for (const ls of laidSteps) {
    for (const hit of ls.performedHits) {
      queue.push({ frame: ls.startFrame + hit.frame, seq: seq++, skill: ls.resolved.skill, hit })
    }
  }

  const byName = new Map<string, { type: string; count: number; damage: number }>()
  function add(name: string, type: string, count: number, damage: number): void {
    const e = byName.get(name)
    if (e) {
      e.count += count
      e.damage += damage
    } else byName.set(name, { type, count, damage })
  }

  const timeline: TimelineEvent[] = []

  let totalDamage = 0
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
    const { frame, skill, hit } = ev

    const behavior = behaviorFor(skill)
    const hitInput = hitInputAt(skill, hit, frame)
    const extraEffects: BuffStatEffect[] = []
    let forceGuaranteedAffinity = false
    const outcome = behavior.onHit?.(hitInput)
    if (outcome) {
      extraEffects.push(...(outcome.statEffects ?? []))
      forceGuaranteedAffinity = !!outcome.forceGuaranteedAffinity
      for (const write of outcome.statuses ?? []) {
        const status = statusById.get(write.id)
        if (!status) continue
        if (write.permanent) openPermanent(status.id)
        else
          pushWindow(
            status.id,
            frame,
            frame + Math.max(1, write.durationFrames ?? status.durationFrames),
          )
        if (write.stacks !== undefined) recordStack(status.id, frame, write.stacks)
      }
    }
    const qiPhase = buffEngine?.qiPhase(frame / FPS) ?? "normal"
    extraEffects.push(...behavior.claimStatEffects(hitInput, qiPhase))
    const resolveOverride: ResolveOverride | undefined =
      extraEffects.length > 0 || forceGuaranteedAffinity
        ? { extraEffects, forceGuaranteedAffinity }
        : undefined
    const st = resolveState(frame, skill, resolveOverride)
    const art = behavior.buildArt(hitInput)
    if (st.forceCrit) art.guaranteedCrit = 1
    const artPatch = behavior.patchArt(hitInput, {
      phase: qiPhase,
      qiBreakEnabled,
      smallPhys: st.ctx.smallPhys,
      isEngineBuffActive: (id) => buffEngine?.isBuffActiveAtTime(id, frame / FPS) ?? false,
    })
    if (artPatch) Object.assign(art, artPatch)
    const { expectedDamage } = computeSkillDamage(art, padSlots([]), st.ctx, 1)
    const hitInWindow = inWindow(frame)
    if (hitInWindow) {
      totalDamage += expectedDamage
      add(skill.name, skill.skillType, 1, expectedDamage)
    }
    timeline.push({
      frame,
      timeSec: frame / FPS,
      skillName: skill.name,
      type: skill.skillType,
      kind: "hit",
      damage: expectedDamage,
      inWindow: hitInWindow,
    })

    for (const trigger of hit.triggers) {
      if (!triggerConditions(trigger).every((c) => conditionHolds(c, frame))) continue
      if (trigger.kind === "detonateDot") continue
      if (trigger.kind === "applyDot") {
        const status = statusById.get(trigger.targetId)
        if (!status || !isDebuffStatus(status)) continue
        const maxStacks = Math.max(1, status.maxStacks)
        const next = clamp(stacksAt(status.id, frame) + 1, 0, maxStacks)
        recordStack(status.id, frame, next)
        if (status.activation === "permanent") openPermanent(status.id)
        else pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames))
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
          recordStack(status.id, frame, clamp(retained, 0, maxStacks))
          const sub = skillsById.get(det.skillId)
          if (sub)
            for (const subHit of sub.hits) {
              queue.push({ frame: frame + subHit.frame, seq: seq++, skill: sub, hit: subHit })
            }
        }
        continue
      }
      if (trigger.kind === "applyBuff" || trigger.kind === "applyDebuff") {
        const status = statusById.get(trigger.targetId)
        if (!status) continue
        if (trigger.extendFrames != null) {
          const w = ledger.longestActiveWindow(status.id, frame)
          if (w) {
            // See `ZENITH_MAX_EXTENDED_DURATION_FRAMES` (builtinBuffs.ts).
            const isZenithExtension = trigger.condition?.buffId === ZENITH_DETONATION_BUFF_ID
            const rawEnd = w.end + trigger.extendFrames
            const nextEnd = isZenithExtension
              ? Math.max(w.end, Math.min(rawEnd, frame + ZENITH_MAX_EXTENDED_DURATION_FRAMES))
              : rawEnd
            const appliedAmount = nextEnd - w.end
            w.end = nextEnd
            if (appliedAmount > 0) (w.extensions ??= []).push({ frame, amount: appliedAmount })
          } else if (!trigger.extendOnly) {
            const next = clamp(
              stacksAt(status.id, frame) + trigger.stacks,
              0,
              Math.max(1, status.maxStacks),
            )
            recordStack(status.id, frame, next)
            if (status.activation === "permanent") openPermanent(status.id)
            else pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames))
          }
          continue
        }
        const cur = stacksAt(status.id, frame)
        const next = clamp(cur + trigger.stacks, 0, Math.max(1, status.maxStacks))
        recordStack(status.id, frame, next)
        if (status.activation === "permanent") openPermanent(status.id)
        else pushWindow(status.id, frame, frame + Math.max(1, status.durationFrames))
      } else {
        const sub = skillsById.get(trigger.targetId)
        if (!sub) continue
        for (const subHit of sub.hits) {
          queue.push({ frame: frame + subHit.frame, seq: seq++, skill: sub, hit: subHit })
        }
      }
    }
  }

  // Zenith extension events only exist for a Sword Horizon build (the only
  // build whose crosswind tracker pushes ZENITH_DETONATION_BUFF_ID windows),
  // so this list is empty for every other build without a class check.
  let bitterSeasonPoison: BitterSeasonPoisonSchedule | null = null
  if (bitterSeasonTuning && durationFrames > 0 && bitterSeasonHitTimesSec.length > 0) {
    const bitterSeasonDebuff = statusById.get(bitterSeasonId)
    if (bitterSeasonDebuff && isDebuffStatus(bitterSeasonDebuff) && bitterSeasonDebuff.dot) {
      const zenithExtensionTimesSec = ledger
        .windowsOf(ZENITH_DETONATION_BUFF_ID)
        .map((zenithWindow) => zenithWindow.start / FPS)
        .sort((a, b) => a - b)
      const poisonDurationSec = bitterSeasonDebuff.durationFrames / FPS
      bitterSeasonPoison = bitterSeasonPoisonSchedule(
        bitterSeasonHitTimesSec,
        bitterSeasonTuning.procChance,
        poisonDurationSec,
        rotationDurationSec,
        zenithExtensionTimesSec,
      )
      // Bounds tick emission to the guaranteed-proc envelope instead of one
      // span covering the whole rotation — activeProbAtTime is 0 outside it,
      // so no expected damage is lost by not ticking there.
      for (const envelopeWindow of bitterSeasonEnvelopeWindows(
        bitterSeasonHitTimesSec,
        poisonDurationSec,
        zenithExtensionTimesSec,
      )) {
        pushWindow(
          bitterSeasonDebuff.id,
          Math.round(envelopeWindow.startSec * FPS),
          Math.round(envelopeWindow.endSec * FPS),
        )
      }
      recordStack(
        bitterSeasonDebuff.id,
        Math.max(0, Math.round(bitterSeasonHitTimesSec[0] * FPS)),
        1,
      )
    }
  }

  ledger.sortWindows()

  const castsUnsorted: RotationCast[] = laidSteps.map((ls, i) => {
    const lastHitFrame =
      ls.performedHits.length > 0 ? Math.max(...ls.performedHits.map((h) => h.frame)) : 0
    const queryFrame = Math.max(
      ls.startFrame,
      ls.startFrame + castLens[i] - 1,
      ls.startFrame + lastHitFrame,
    )
    const queryTimeSec = queryFrame / FPS
    const { buffs, seen: seenBuffIds } = collectCastBuffs({
      frame: queryFrame,
      timeSec: queryTimeSec,
      fps: FPS,
      ledger,
      statusById,
      buffEngine,
      // Below the display threshold there's a real chance no poison has
      // procced yet at all (e.g. right after the very first eligible hits),
      // so the expected-remaining number alone would understate that and
      // read as an oddly short "duration" — withhold it until more likely
      // than not to be up, same convention as Concentration's own gate.
      overrideRemainingSec: (id, timeSec) => {
        if (id !== bitterSeasonId || !bitterSeasonPoison) return null
        const isLikelyActive =
          bitterSeasonPoison.activeProbAtTime(timeSec) >= BITTER_SEASON_REMAINING_DISPLAY_THRESHOLD
        const activeSec = isLikelyActive ? bitterSeasonPoison.remainingActiveSecAtTime(timeSec) : 0
        return { seconds: activeSec > 0 ? activeSec : undefined }
      },
    })
    if (buffEngine) {
      if (buffEngine.paramOn("moraleChant") && !seenBuffIds.has("moraleChant")) {
        const moraleQiBreak = buffEngine.qiPhase(queryTimeSec) === "exhausted"
        const ms = moraleStacksAtTime(queryTimeSec, moraleQiBreak)
        if (ms > 0) {
          seenBuffIds.add("moraleChant")
          buffs.push({
            id: "moraleChant",
            name: "Morale Chant",
            stacks: ms,
            maxStacks: MORALE_MAX_STACKS,
            effects: [
              { statKey: "allDamageBoost", amount: ms * moraleDmgPerStack(moraleQiBreak) },
              { statKey: "phys.penetration", amount: ms * MORALE_PEN_PER_STACK },
            ],
          })
        }
      }
    }
    if (!ls.prePull) {
      if (concentrationSchedule && !seenBuffIds.has("concentration")) {
        const prob = concentrationSchedule.getActiveProbAtTime(queryTimeSec)
        if (prob >= CONCENTRATION_DISPLAY_THRESHOLD) {
          seenBuffIds.add("concentration")
          buffs.push({
            id: "concentration",
            name: "Concentration",
            stacks: 1,
            maxStacks: 1,
            effects: [
              { statKey: "affinityDamageBoost", amount: 0.1 },
              { statKey: "directAffinityRate", amount: 0.03 },
              { statKey: "allDamageBoost", amount: 0.015 },
            ],
            description: `≈${Math.round(prob * 100)}% active`,
          })
        }
      }
      if (hawkwingStacks && !seenBuffIds.has("hawkwing")) {
        const shown = Math.round(hawkwingStacks.getExpectedStacksAtTime(queryTimeSec))
        if (shown >= 1) {
          seenBuffIds.add("hawkwing")
          buffs.push({
            id: "hawkwing",
            name: "Hawkwing (4-pc)",
            stacks: shown,
            maxStacks: HAWKWING_MAX_STACKS,
            effects: [],
            requires: "Hawking",
            description:
              "expected stacks (avg of 500 sims, rounded) · +2% phys attack/stack, 5s decay",
          })
        }
      }
      if (bitterSeasonTuning && !seenBuffIds.has("bitterSeasonPoison")) {
        const shown = bitterSeasonSuppressed
          ? BITTER_SEASON_MAX_STACKS
          : Math.round(bitterSeasonStacks?.expectedStacksAtTime(queryTimeSec) ?? 0)
        if (shown >= 1) {
          seenBuffIds.add("bitterSeasonPoison")
          const uptimePct = Math.round(
            (bitterSeasonPoison?.activeProbAtTime(queryTimeSec) ?? 0) * 100,
          )
          // The mechanic's own numbers (both worded as a target physical
          // defense reduction, per the in-game hint, even though the tier-6
          // node is implemented through `phys.penetration` — see
          // `bitterSeasonEffectsAt`), stated plainly rather than surfacing
          // that internal stat-key vehicle, and scaled to the shown stack
          // count rather than always quoting the 5-stack cap.
          const currentDefensePct = Math.round(
            bitterSeasonTuning.defenseReductionPerStack * shown * 100,
          )
          const tier6DefenseFlatAmount = bitterSeasonTuning.physPenetrationAtMaxStacks * 100
          const mechanicText =
            `at ${shown}/${BITTER_SEASON_MAX_STACKS} stacks: -${currentDefensePct}% target physical defense` +
            (tier6DefenseFlatAmount > 0
              ? ` · -${tier6DefenseFlatAmount} target physical defense at ${BITTER_SEASON_MAX_STACKS}/${BITTER_SEASON_MAX_STACKS} stacks (tier 6)`
              : "")
          buffs.push({
            id: "bitterSeasonPoison",
            name: "Bitter Season Poison",
            stacks: shown,
            maxStacks: BITTER_SEASON_MAX_STACKS,
            effects: [],
            description: bitterSeasonSuppressed
              ? "party-applied Bitter Season debuff already caps the reduction — the inner way adds none"
              : `expected stacks (avg of 500 sims, rounded) · ${mechanicText} · ≈${uptimePct}% poison uptime`,
          })
        }
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
  const casts: RotationCast[] = castsUnsorted.map((c, i) => ({ ...c, index: i + 1 }))

  const buffWindows: BuffWindow[] = []
  for (const [id, arr] of ledger.entries()) {
    const status = statusById.get(id)
    if (!status) continue
    for (const w of arr) {
      buffWindows.push({ id, name: status.name, startSec: w.start / FPS, endSec: w.end / FPS })
    }
  }

  for (const [buffId, arr] of ledger.entries()) {
    const status = statusById.get(buffId)
    if (!status || !isDebuffStatus(status) || !status.dot || status.dot.tickIntervalFrames <= 0)
      continue
    const tickSkill = skillsById.get(tickSourceSkillId(status) ?? "")
    const dot = resolveTickDot(status, tickSkill)
    if (!dot) continue
    const debuffForTick: Debuff = { ...status, dot }
    const dotSkill = dotTickSkill(status, tickSkill)
    const dotName = `${status.name} (DoT)`
    const dotType = dot.skillType || "sustain"

    for (const tick of emitDotTicks({
      debuff: status,
      dot,
      windows: arr,
      stacksAt: (frame) => stacksAt(buffId, frame),
      inWindow,
      weightAt: (frame) =>
        bitterSeasonPoison && buffId === bitterSeasonId
          ? bitterSeasonPoison.activeProbAtTime(frame / FPS)
          : 1,
      damageAt: (frame, shape, scale) => {
        const st = resolveState(frame, dotSkill)
        return (
          dotTickDamage(debuffForTick, st.ctx, computeSkillDamage, st.forceCrit, shape) *
          (scale ?? 1)
        )
      },
    })) {
      totalDamage += tick.damage
      add(dotName, dotType, 1, tick.damage)
      timeline.push({
        frame: tick.frame,
        timeSec: tick.frame / FPS,
        skillName: dotName,
        type: dotType,
        kind: "dot",
        damage: tick.damage,
        inWindow: true,
      })
    }
  }

  // Morale Chant's Yi River (`.tmp/site/deobfuscated.js` `yiRiver.calculate`
  // ~L21287-21409): no weapon/mystic boosts apply.
  if (buffEngine && buffEngine.paramOn("moraleChant") && buffEngine.paramTier("moraleChant") >= 6) {
    const durationSec = durationFrames / FPS
    let tFirst = 0
    while (
      tFirst < durationSec &&
      moraleStacksAtTime(tFirst, buffEngine.qiPhase(tFirst) === "exhausted") <
        MORALE_STACK_THRESHOLD
    ) {
      tFirst += 0.5
    }
    if (tFirst <= durationSec) {
      const yiRiverSkill: Skill = {
        id: "yi-river",
        classId: inputs.classId,
        name: "Yi River",
        skillType: "mindMethod",
        weaponOrAttribute: "",
        attributeAttack: "",
        hits: [],
        castFrames: 0,
        triggerable: false,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
      }
      for (let t = tFirst; t <= durationSec; t += YI_RIVER_INTERVAL_SEC) {
        const f = Math.round(t * FPS)
        const st = resolveState(f, yiRiverSkill)
        const art = {
          name: "Yi River",
          physMultiplier: 1,
          attributeMultiplier: 1,
          skillType: "mindMethod",
        } as Parameters<typeof computeSkillDamage>[0]
        if (st.forceCrit) art.guaranteedCrit = 1
        const { expectedDamage } = computeSkillDamage(art, padSlots([]), st.ctx, 1)
        totalDamage += expectedDamage
        add("Yi River", "mindMethod", 1, expectedDamage)
        timeline.push({
          frame: f,
          timeSec: t,
          skillName: "Yi River",
          type: "mindMethod",
          kind: "hit",
          damage: expectedDamage,
          inWindow: true,
        })
      }
    }
  }

  timeline.sort((a, b) => a.frame - b.frame || (a.kind === b.kind ? 0 : a.kind === "hit" ? -1 : 1))

  const perSkill: SkillTickResult[] = [...byName.entries()].map(([name, e]) => {
    const cast = castMetrics.get(name)
    const castCount = cast?.castCount ?? 0
    const castTimeSec = cast ? cast.castFrames / FPS : 0
    const dpsOfCastTime = castTimeSec > 0 ? e.damage / castTimeSec : 0
    return {
      name,
      type: e.type,
      count: e.count,
      expectedDamage: e.damage,
      percentOfTotal: totalDamage > 0 ? e.damage / totalDamage : 0,
      castCount,
      castTimeSec,
      dpsOfCastTime,
    }
  })

  const durationSeconds = durationFrames / FPS
  const dps = durationSeconds > 0 ? totalDamage / durationSeconds : 0
  if (durationFrames <= 0)
    warnings.push("Timeline has no in-window skills — duration and DPS are 0.")

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
    casts,
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
    casts: [],
  }
}
