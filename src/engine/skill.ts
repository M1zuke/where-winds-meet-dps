import type { computeSkillDamage } from "./formula"
import { attuneTagOf, mysticCategoryOf } from "./buffs/tags"

type ArtRow = Parameters<typeof computeSkillDamage>[0]

export type TriggerKind = "applyBuff" | "applyDebuff" | "castSkill" | "applyDot" | "detonateDot"
export type TriggerOp = "gte" | "gt" | "eq"

export interface TriggerCondition {
  buffId: string
  op: TriggerOp
  stacks: number
}

export interface HitVariant {
  id: string
  label: string
  conditions: TriggerCondition[]
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}

export interface HitTrigger {
  id: string
  kind: TriggerKind
  targetId: string
  stacks: number
  condition: TriggerCondition | null
  conditions?: TriggerCondition[]
  extendFrames?: number
  extendOnly?: boolean
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
  triggers: HitTrigger[]
}

export interface Skill {
  id: string
  classId: string
  name: string
  skillType: string
  weaponOrAttribute: string
  attributeAttack: string
  tags?: string[]
  hits: SkillHit[]
  castFrames: number
  triggerable: boolean
  elevatedAttributeMultiplier?: boolean
  guaranteedPrecision?: boolean
  guaranteedNormal?: boolean
  prePull?: boolean
  createdAt: string
  updatedAt: string
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
export function newTriggerId(): string {
  return nextId("tg")
}
export function newVariantId(): string {
  return nextId("hv")
}

export function makeTrigger(patch: Partial<HitTrigger> = {}): HitTrigger {
  return {
    id: newTriggerId(),
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

export function isTriggerCondition(x: unknown): x is TriggerCondition {
  if (!x || typeof x !== "object") return false
  const c = x as Record<string, unknown>
  if (typeof c.buffId !== "string") return false
  if (c.op !== "gte" && c.op !== "gt" && c.op !== "eq") return false
  if (typeof c.stacks !== "number" || !Number.isFinite(c.stacks)) return false
  return true
}

export function isHitTrigger(x: unknown): x is HitTrigger {
  if (!x || typeof x !== "object") return false
  const t = x as Record<string, unknown>
  if (typeof t.id !== "string" || !t.id) return false
  if (
    t.kind !== "applyBuff" &&
    t.kind !== "applyDebuff" &&
    t.kind !== "castSkill" &&
    t.kind !== "applyDot" &&
    t.kind !== "detonateDot"
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
  return true
}

export function isHitVariant(x: unknown): x is HitVariant {
  if (!x || typeof x !== "object") return false
  const v = x as Record<string, unknown>
  if (typeof v.id !== "string" || !v.id) return false
  if (typeof v.label !== "string") return false
  if (!Array.isArray(v.conditions)) return false
  for (const c of v.conditions) {
    if (!isTriggerCondition(c)) return false
  }
  for (const k of ["physMultiplier", "attributeMultiplier", "physFixed", "attributeFixed"]) {
    if (typeof v[k] !== "number" || !Number.isFinite(v[k] as number)) return false
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
  return true
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
    guaranteedPrecision: skill.guaranteedPrecision ? 1 : undefined,
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
    guaranteedPrecision: src.guaranteedPrecision,
    guaranteedNormal: src.guaranteedNormal,
    prePull: src.prePull,
    tags: [...(src.tags ?? [])],
    hits: src.hits.map((h) => ({
      ...h,
      id: newHitId(),
      variants: h.variants?.map((v) => ({
        ...v,
        id: newVariantId(),
        conditions: v.conditions.map((c) => ({ ...c })),
      })),
      triggers: h.triggers.map((tr) => ({
        ...tr,
        id: newTriggerId(),
        conditions: tr.conditions ? tr.conditions.map((c) => ({ ...c })) : undefined,
      })),
    })),
  })
}
