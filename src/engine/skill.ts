import type { computeSkillDamage } from "./formula"
import type { QiPhase } from "./effects/context"
import { attuneTagOf, mysticCategoryOf } from "./buffs/tags"

type ArtRow = Parameters<typeof computeSkillDamage>[0]

export type TriggerKind =
  | "applyBuff"
  | "applyDebuff"
  | "castSkill"
  | "applyDot"
  | "detonateDot"
  | "releaseEcho"
  | "clearStatus"
  | "meterDelta"
export type TriggerOp = "gte" | "gt" | "eq" | "lte" | "lt"

export type StartLatency = "serverRoundTrip" | "noWaitOnDummy" | "none"

export interface StatusCondition {
  buffId: string
  op: TriggerOp
  stacks: number
  source?: "buffEngine"
}

export interface ParamCondition {
  param: string
  minTier?: number
}

export interface AnyOfCondition {
  anyOf: TriggerCondition[]
}

export type TriggerCondition = StatusCondition | ParamCondition | AnyOfCondition

export interface HitVariant {
  id: string
  label: string
  conditions: TriggerCondition[]
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
  castFrames?: number
}

export interface HitTrigger {
  kind: TriggerKind
  targetId: string
  stacks: number
  condition: TriggerCondition | null
  conditions?: TriggerCondition[]
  extendFrames?: number
  extendOnly?: boolean
  // A ceiling on the REMAINING duration this extension may leave, measured from
  // the extending frame and re-evaluated per extension — not a lifetime cap on
  // the window. An extension always adds its full amount; if the window is
  // already longer than the ceiling it is left alone, never truncated down.
  maxExtendedDurationFrames?: number
  // The ledger-side counterpart of a buff module's `buffAppliesOnCastEnd`: the
  // window opens where the granting cast ends, not at this hit's frame.
  appliesOnCastEnd?: boolean
  transferFrom?: string
  phase?: QiPhase
  cooldownFrames?: number
  cooldownDecayFramesPerAttempt?: number
  cooldownFloorFrames?: number
  cooldownGroup?: string
  // Opens the granted window at this length instead of the target status's
  // own `durationFrames`.
  durationFrames?: number
  requiresParam?: string
  requiresMinTier?: number
  // `meterDelta` only (docs/TIMELINE.md § "Meters").
  meterSpendCapToCurrent?: number
  recordSpendAsStatus?: string
  // `meterDelta` only: refunds this fraction of what the owning cast actually
  // paid to `targetId`, after cost modifiers — `stacks` is ignored when set.
  refundFractionOfCastCost?: number
}

export interface SkillHit {
  id: string
  frame: number
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
  extraCritDamage: number
  variants?: HitVariant[]
  conditions?: TriggerCondition[]
  triggers: HitTrigger[]
}

export interface MeterCost {
  meterId: string
  amount: number
  // docs/TIMELINE.md § "Meters".
  requiresParam?: string
  requiresMinTier?: number
  requiresMaxTier?: number
}

export interface MeterDrain {
  meterId: string
  perSecond: number
  fromFrame: number
  // Absent: the drain runs to the cast's own end.
  stopAfterSec?: number
}

export interface MeterFreeze {
  meterId: string
  fromFrame: number
}

export interface Skill {
  id: string
  classId: string
  name: string
  skillType: string
  weaponOrAttribute: string
  attributeAttack: string
  tags?: string[]
  breakdownName?: string
  // At the cast's own start, after this step's cast conditions are checked
  // against the value the cost is about to spend — a threshold requirement is
  // authored as a `castConditions` entry against `meter:<id>` instead
  // (docs/TIMELINE.md § "Meters").
  meterCosts?: MeterCost[]
  meterDrains?: MeterDrain[]
  meterFreezes?: MeterFreeze[]
  // The identity this cast presents to the buff engine and to the migration
  // that backfills `receives`/`triggersBuffs` on an old save. Authored, so a
  // rename is only a rename; falls back to `name` for user-authored skills.
  castTag?: string
  receives?: string[]
  triggersBuffs?: string[]
  hits: SkillHit[]
  castConditions?: TriggerCondition[]
  castFrames: number
  triggerable: boolean
  elevatedAttributeMultiplier?: boolean
  neverAbrades?: boolean
  guaranteedNormal?: boolean
  prePull?: boolean
  isDotTick?: boolean
  startLatency?: StartLatency
  createdAt: string
  updatedAt: string
}

export const MYSTIC_ARTS_CLASS_ID = "mystic"

export function belongsToClass(entity: { classId: string }, classId: string): boolean {
  return entity.classId === classId || entity.classId === MYSTIC_ARTS_CLASS_ID
}

let counter = 0
function nextId(prefix: string): string {
  counter = (counter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${t}-${r}-${counter.toString(36)}`
}
export function newSkillId(): string {
  return nextId("sk")
}
export function newHitId(): string {
  return nextId("hit")
}
export function newVariantId(): string {
  return nextId("hv")
}

export function makeTrigger(patch: Partial<HitTrigger> = {}): HitTrigger {
  return {
    kind: "applyBuff",
    targetId: "",
    stacks: 1,
    condition: null,
    ...patch,
  }
}

export function makeHit(patch: Partial<SkillHit> = {}): SkillHit {
  return {
    id: newHitId(),
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [],
    ...patch,
  }
}

export function makeSkill(classId: string, patch: Partial<Skill> = {}): Skill {
  const now = new Date().toISOString()
  return {
    id: newSkillId(),
    classId,
    name: "",
    skillType: "weapon",
    weaponOrAttribute: "",
    attributeAttack: "",
    tags: [],
    hits: [makeHit()],
    castFrames: 0,
    triggerable: true,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export function isStatusCondition(value: unknown): value is StatusCondition {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (typeof record.buffId !== "string") return false
  if (
    record.op !== "gte" &&
    record.op !== "gt" &&
    record.op !== "eq" &&
    record.op !== "lte" &&
    record.op !== "lt"
  )
    return false
  if (typeof record.stacks !== "number" || !Number.isFinite(record.stacks)) return false
  if (record.source !== undefined && record.source !== "buffEngine") return false
  return true
}

export function isParamCondition(value: unknown): value is ParamCondition {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (typeof record.param !== "string" || !record.param) return false
  if (
    record.minTier !== undefined &&
    (typeof record.minTier !== "number" || !Number.isFinite(record.minTier))
  )
    return false
  return true
}

export function isAnyOfCondition(value: unknown): value is AnyOfCondition {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    Array.isArray(record.anyOf) &&
    record.anyOf.length > 0 &&
    record.anyOf.every((clause) => isTriggerCondition(clause))
  )
}

export function isTriggerCondition(value: unknown): value is TriggerCondition {
  return isStatusCondition(value) || isParamCondition(value) || isAnyOfCondition(value)
}

// `source: "buffEngine"` is only meaningful on a `castSkill` trigger's own
// condition — a hit's or a variant's condition never gates a generated cast.
function hasBuffEngineSource(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (record.source === "buffEngine") return true
  return Array.isArray(record.anyOf) && record.anyOf.some(hasBuffEngineSource)
}

export function isHitOrVariantCondition(value: unknown): value is TriggerCondition {
  return isTriggerCondition(value) && !hasBuffEngineSource(value)
}

export function conditionSatisfiedByStacks(condition: StatusCondition, stacks: number): boolean {
  switch (condition.op) {
    case "gte":
      return stacks >= condition.stacks
    case "gt":
      return stacks > condition.stacks
    case "lte":
      return stacks <= condition.stacks
    case "lt":
      return stacks < condition.stacks
    default:
      return stacks === condition.stacks
  }
}

export function conditionIds(condition: TriggerCondition): string[] {
  if (isAnyOfCondition(condition)) return condition.anyOf.flatMap(conditionIds)
  if (isParamCondition(condition)) return [condition.param]
  return [condition.buffId]
}

export function cloneTriggerCondition(condition: TriggerCondition): TriggerCondition {
  return isAnyOfCondition(condition)
    ? { anyOf: condition.anyOf.map(cloneTriggerCondition) }
    : { ...condition }
}

export function isHitTrigger(x: unknown): x is HitTrigger {
  if (!x || typeof x !== "object") return false
  const t = x as Record<string, unknown>
  if (
    t.kind !== "applyBuff" &&
    t.kind !== "applyDebuff" &&
    t.kind !== "castSkill" &&
    t.kind !== "applyDot" &&
    t.kind !== "detonateDot" &&
    t.kind !== "releaseEcho" &&
    t.kind !== "clearStatus" &&
    t.kind !== "meterDelta"
  )
    return false
  if (typeof t.targetId !== "string") return false
  if (typeof t.stacks !== "number" || !Number.isFinite(t.stacks)) return false
  if (t.condition !== null && !isTriggerCondition(t.condition)) return false
  if (t.conditions !== undefined) {
    if (!Array.isArray(t.conditions)) return false
    for (const c of t.conditions) {
      if (!isTriggerCondition(c)) return false
    }
  }
  if (t.kind !== "castSkill") {
    if (hasBuffEngineSource(t.condition)) return false
    if (Array.isArray(t.conditions) && t.conditions.some(hasBuffEngineSource)) return false
  }
  if (t.transferFrom !== undefined) {
    if (typeof t.transferFrom !== "string" || !t.transferFrom) return false
    if (t.extendFrames !== undefined) return false
  }
  if (t.phase !== undefined && !isQiPhase(t.phase)) return false
  if (
    t.cooldownFrames !== undefined &&
    (typeof t.cooldownFrames !== "number" ||
      !Number.isFinite(t.cooldownFrames) ||
      t.cooldownFrames < 0)
  )
    return false
  if (
    t.durationFrames !== undefined &&
    (typeof t.durationFrames !== "number" ||
      !Number.isFinite(t.durationFrames) ||
      t.durationFrames <= 0)
  )
    return false
  if (
    t.cooldownDecayFramesPerAttempt !== undefined &&
    (typeof t.cooldownDecayFramesPerAttempt !== "number" ||
      !Number.isFinite(t.cooldownDecayFramesPerAttempt) ||
      t.cooldownDecayFramesPerAttempt < 0)
  )
    return false
  if (
    t.cooldownFloorFrames !== undefined &&
    (typeof t.cooldownFloorFrames !== "number" ||
      !Number.isFinite(t.cooldownFloorFrames) ||
      t.cooldownFloorFrames < 0)
  )
    return false
  if (t.cooldownGroup !== undefined && (typeof t.cooldownGroup !== "string" || !t.cooldownGroup))
    return false
  if (t.requiresParam !== undefined && (typeof t.requiresParam !== "string" || !t.requiresParam))
    return false
  if (t.requiresMinTier !== undefined) {
    if (typeof t.requiresMinTier !== "number" || !Number.isFinite(t.requiresMinTier)) return false
    if (typeof t.requiresParam !== "string" || !t.requiresParam) return false
  }
  if (
    t.meterSpendCapToCurrent !== undefined &&
    (typeof t.meterSpendCapToCurrent !== "number" || !Number.isFinite(t.meterSpendCapToCurrent))
  )
    return false
  if (
    t.recordSpendAsStatus !== undefined &&
    (typeof t.recordSpendAsStatus !== "string" || !t.recordSpendAsStatus)
  )
    return false
  if (
    t.refundFractionOfCastCost !== undefined &&
    (typeof t.refundFractionOfCastCost !== "number" || !Number.isFinite(t.refundFractionOfCastCost))
  )
    return false
  return true
}

export function isQiPhase(x: unknown): x is QiPhase {
  return x === "normal" || x === "below30" || x === "exhausted"
}

export function isHitVariant(x: unknown): x is HitVariant {
  if (!x || typeof x !== "object") return false
  const v = x as Record<string, unknown>
  if (typeof v.id !== "string" || !v.id) return false
  if (typeof v.label !== "string") return false
  if (!Array.isArray(v.conditions)) return false
  for (const c of v.conditions) {
    if (!isHitOrVariantCondition(c)) return false
  }
  for (const k of ["physMultiplier", "attributeMultiplier", "physFixed", "attributeFixed"]) {
    if (typeof v[k] !== "number" || !Number.isFinite(v[k] as number)) return false
  }
  if (v.castFrames !== undefined) {
    if (typeof v.castFrames !== "number" || !Number.isFinite(v.castFrames)) return false
  }
  return true
}

export function isSkillHit(x: unknown): x is SkillHit {
  if (!x || typeof x !== "object") return false
  const h = x as Record<string, unknown>
  if (typeof h.id !== "string" || !h.id) return false
  for (const k of [
    "frame",
    "physMultiplier",
    "attributeMultiplier",
    "physFixed",
    "attributeFixed",
    "extraCritDamage",
  ]) {
    if (typeof h[k] !== "number" || !Number.isFinite(h[k] as number)) return false
  }
  if (!Array.isArray(h.triggers)) return false
  for (const t of h.triggers) {
    if (!isHitTrigger(t)) return false
  }
  if (h.variants !== undefined) {
    if (!Array.isArray(h.variants)) return false
    for (const v of h.variants) {
      if (!isHitVariant(v)) return false
    }
  }
  if (h.conditions !== undefined) {
    if (!Array.isArray(h.conditions)) return false
    for (const c of h.conditions) {
      if (!isHitOrVariantCondition(c)) return false
    }
  }
  return true
}

export function triggerConditions(tr: HitTrigger): TriggerCondition[] {
  const out: TriggerCondition[] = []
  if (tr.condition) out.push(tr.condition)
  if (tr.conditions) out.push(...tr.conditions)
  return out
}

export function selectHitVariant(
  hit: SkillHit,
  test: (c: TriggerCondition) => boolean,
): HitVariant | null {
  for (const variant of hit.variants ?? []) {
    if (variant.conditions.every((c) => test(c))) return variant
  }
  return null
}

export function breakdownNameOf(breakdownName: string | undefined, fallbackName: string): string {
  return breakdownName?.trim() || fallbackName
}

export function isPrePullSkill(skill: Skill): boolean {
  return skill.prePull ?? /prepull/i.test(skill.name)
}

export function hitDealsDamage(hit: SkillHit): boolean {
  return (
    hit.physMultiplier !== 0 ||
    hit.attributeMultiplier !== 0 ||
    hit.physFixed !== 0 ||
    hit.attributeFixed !== 0
  )
}

export function isSkill(x: unknown): x is Skill {
  if (!x || typeof x !== "object") return false
  const s = x as Record<string, unknown>
  if (typeof s.id !== "string" || !s.id) return false
  if (typeof s.classId !== "string" || !s.classId) return false
  if (typeof s.name !== "string") return false
  if (typeof s.skillType !== "string") return false
  if (typeof s.weaponOrAttribute !== "string") return false
  if (typeof s.attributeAttack !== "string") return false
  if (!Array.isArray(s.hits)) return false
  for (const h of s.hits) {
    if (!isSkillHit(h)) return false
  }
  if (typeof s.castFrames !== "number" || !Number.isFinite(s.castFrames)) return false
  if (typeof s.createdAt !== "string") return false
  if (typeof s.updatedAt !== "string") return false
  if (s.receives !== undefined && !isStringArray(s.receives)) return false
  if (s.triggersBuffs !== undefined && !isStringArray(s.triggersBuffs)) return false
  if (s.castConditions !== undefined) {
    if (!Array.isArray(s.castConditions)) return false
    for (const condition of s.castConditions) {
      if (!isHitOrVariantCondition(condition)) return false
    }
  }
  if (s.meterCosts !== undefined) {
    if (!Array.isArray(s.meterCosts)) return false
    for (const cost of s.meterCosts) {
      const meterCost = cost as Record<string, unknown>
      if (typeof meterCost.meterId !== "string" || !meterCost.meterId) return false
      if (typeof meterCost.amount !== "number" || !Number.isFinite(meterCost.amount)) return false
      if (meterCost.requiresParam !== undefined && typeof meterCost.requiresParam !== "string")
        return false
      if (
        meterCost.requiresMinTier !== undefined &&
        (typeof meterCost.requiresMinTier !== "number" ||
          !Number.isFinite(meterCost.requiresMinTier))
      )
        return false
      if (
        meterCost.requiresMaxTier !== undefined &&
        (typeof meterCost.requiresMaxTier !== "number" ||
          !Number.isFinite(meterCost.requiresMaxTier))
      )
        return false
    }
  }
  if (s.meterDrains !== undefined) {
    if (!Array.isArray(s.meterDrains)) return false
    for (const drain of s.meterDrains) {
      const meterDrain = drain as Record<string, unknown>
      if (typeof meterDrain.meterId !== "string" || !meterDrain.meterId) return false
      if (typeof meterDrain.perSecond !== "number" || !Number.isFinite(meterDrain.perSecond))
        return false
      if (typeof meterDrain.fromFrame !== "number" || !Number.isFinite(meterDrain.fromFrame))
        return false
      if (
        meterDrain.stopAfterSec !== undefined &&
        (typeof meterDrain.stopAfterSec !== "number" || !Number.isFinite(meterDrain.stopAfterSec))
      )
        return false
    }
  }
  if (s.meterFreezes !== undefined) {
    if (!Array.isArray(s.meterFreezes)) return false
    for (const freeze of s.meterFreezes) {
      const meterFreeze = freeze as Record<string, unknown>
      if (typeof meterFreeze.meterId !== "string" || !meterFreeze.meterId) return false
      if (typeof meterFreeze.fromFrame !== "number" || !Number.isFinite(meterFreeze.fromFrame))
        return false
    }
  }
  return true
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

export function hitToArtRow(hit: SkillHit, skill: Skill): ArtRow {
  return {
    name: skill.name,
    physMultiplier: hit.physMultiplier,
    physFixed: hit.physFixed,
    attributeMultiplier: hit.attributeMultiplier,
    attributeFixed: hit.attributeFixed,
    extraCritDamage: hit.extraCritDamage,
    skillType: skill.skillType || "weapon",
    weaponOrAttribute: skill.weaponOrAttribute || undefined,
    attributeAttack: skill.attributeAttack || undefined,
    specialTag: skill.skillType === "sustain" ? "sustain" : undefined,
    elevatedAttributeMultiplier: skill.elevatedAttributeMultiplier === false ? false : undefined,
    abrasionAvoidRate: skill.neverAbrades ? 1 : undefined,
    guaranteedNormal: skill.guaranteedNormal ? 1 : undefined,
    mysticCategory: mysticCategoryOf(skill) || undefined,
    attuneTag: attuneTagOf(skill) || undefined,
  } as ArtRow
}

export function seedSkillFromBuiltin(classId: string, src: Skill): Skill {
  return makeSkill(classId, {
    id: src.id,
    name: src.name,
    skillType: src.skillType,
    weaponOrAttribute: src.weaponOrAttribute,
    attributeAttack: src.attributeAttack,
    castFrames: src.castFrames,
    triggerable: src.triggerable,
    elevatedAttributeMultiplier: src.elevatedAttributeMultiplier,
    neverAbrades: src.neverAbrades,
    guaranteedNormal: src.guaranteedNormal,
    prePull: src.prePull,
    startLatency: src.startLatency,
    tags: [...(src.tags ?? [])],
    // Carried so that renaming a seeded copy keeps the buffs it triggers.
    castTag: src.castTag,
    breakdownName: src.breakdownName,
    receives: src.receives ? [...src.receives] : undefined,
    triggersBuffs: src.triggersBuffs ? [...src.triggersBuffs] : undefined,
    castConditions: src.castConditions?.map(cloneTriggerCondition),
    meterCosts: src.meterCosts?.map((cost) => ({ ...cost })),
    meterDrains: src.meterDrains?.map((drain) => ({ ...drain })),
    meterFreezes: src.meterFreezes?.map((freeze) => ({ ...freeze })),
    hits: src.hits.map((h) => ({
      ...h,
      id: newHitId(),
      variants: h.variants?.map((v) => ({
        ...v,
        id: newVariantId(),
        conditions: v.conditions.map(cloneTriggerCondition),
      })),
      conditions: h.conditions?.map(cloneTriggerCondition),
      triggers: h.triggers.map((tr) => ({
        ...tr,
        condition: tr.condition ? cloneTriggerCondition(tr.condition) : null,
        conditions: tr.conditions ? tr.conditions.map(cloneTriggerCondition) : undefined,
      })),
    })),
  })
}
