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
import { prepareMechanics, type ContextPatch, type MechanicSetup } from "./mechanics"
import { dotTickDamage, dotTickSkill, emitDotTicks, resolveTickDot, tickSourceSkillId } from "./dot"
import { buildBehaviors, type BuildView, type HitContext, type HitInput } from "./behavior"
import { applyEffect, type EffectSink } from "./effects/apply"
import { grantsMinPhysCritBoostFor } from "../data/classes/registry"
import { buildContext, effectiveRates } from "./panel"
import { computeSkillDamage } from "./formula"
import { applyBuffEffects } from "./statRegistry"
import { builtinSkillsForClass, builtinDebuffsForClass } from "./builtinLibrary"
import { builtinBuffsForClass } from "./builtinBuffs"
import { BuffEngine } from "./buffs/buffEngine"
import { PROP_TO_PROPERTY, type SkillProperties } from "./effects/context"
import { buffDefsForClass, groupBuffDefs, mechanicBuffDefsForClass } from "./buffs/data"
import { paramsFromInputs } from "./buffs/params"
import { castTagOf } from "./buffs/tags"
import { innerWayAllDamageBoost } from "./buffs/innerWayBonus"
import { innerWayTier } from "../data/innerWays/registry"
import { PROP } from "../data/skills/ids"

export const FPS = 60

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
    innerWayTier: (innerWayId) => innerWayTier(inputs.mindMethods, innerWayId),
    dingYin: (tag) => inputs.dingYinByTag[tag] ?? 0,
    grantsMinPhysCritBoost: grantsMinPhysCritBoostFor(inputs.classId),
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
        const props: SkillProperties = {
          hitCount: ls.performedHits.length,
          castTime: (skill.castFrames || 1) / FPS,
        }
        for (const tag of skill.tags ?? []) {
          const propertyKey = PROP_TO_PROPERTY[tag as (typeof PROP)[keyof typeof PROP]]
          if (propertyKey) props[propertyKey] = true
          else if (tag.startsWith("attack:"))
            props.attackType = tag.slice(7) as SkillProperties["attackType"]
        }
        eng.processSkillCast(castTag, ls.startFrame / FPS, props)
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
  }
  const mechanics = prepareMechanics(mechanicSetup)

  const qiBreakEnabled = inputs.combatSettings?.qiBreak?.enabled ?? true

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
  ): Resolved & { forceCrit: boolean } {
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
      if (combat?.qiBreak?.enabled && qiPhaseHere === "exhausted") {
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
          pushWindow(status.id, frame, frame + Math.max(1, durationFrames ?? status.durationFrames))
        if (stacks !== undefined) recordStack(status.id, frame, stacks)
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
    const st = resolveState(frame, skill, resolveOverride)
    const hitContext: HitContext = {
      phase: qiPhase,
      qiBreakEnabled,
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
    const { expectedDamage } = computeSkillDamage(art, st.ctx, 1)
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
            const cap = trigger.maxExtendedDurationFrames
            const rawEnd = w.end + trigger.extendFrames
            const nextEnd = cap ? Math.max(w.end, Math.min(rawEnd, frame + cap)) : rawEnd
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
        for (const { mechanic, state } of mechanics) {
          const override = mechanic.remainingSecAt?.(state, id, timeSec)
          if (override) return override
        }
        return null
      },
    })
    for (const { mechanic, state } of mechanics) {
      for (const chip of mechanic.display?.(state, queryTimeSec, ls.prePull, mechanicSetup) ?? []) {
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
      weightAt: (frame) => {
        for (const { mechanic, state } of mechanics) {
          const weight = mechanic.tickWeightAt?.(state, buffId, frame, mechanicSetup)
          if (weight !== null && weight !== undefined) return weight
        }
        return 1
      },
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

  for (const { mechanic, state } of mechanics) {
    for (const event of mechanic.extraEvents?.(state, mechanicSetup) ?? []) {
      const st = resolveState(event.frame, event.skill)
      const art = { ...event.art } as Parameters<typeof computeSkillDamage>[0]
      if (st.forceCrit) art.guaranteedCrit = 1
      const { expectedDamage } = computeSkillDamage(art, st.ctx, 1)
      totalDamage += expectedDamage
      add(event.name, event.type, 1, expectedDamage)
      timeline.push({
        frame: event.frame,
        timeSec: event.frame / FPS,
        skillName: event.name,
        type: event.type,
        kind: "hit",
        damage: expectedDamage,
        inWindow: true,
      })
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
