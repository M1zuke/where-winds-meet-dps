import type { BuffStatEffect, StackScaling, BuffActivation } from "./buff"
import type { AttributeKey } from "./types"

export interface DotStackShape {
  physMultiplier: number
  physFixed: number
  attributeMultiplier: number
  attributeFixed: number
}

export interface DebuffDotSpec {
  tickIntervalFrames: number
  physMultiplier: number
  physFixed: number
  attributeMultiplier: number
  attributeFixed: number
  attributeAttack: AttributeKey | ""
  skillType: string
  weaponOrAttribute?: string | null
  mysticCategory?: string | null
  attuneTag?: string | null
  count: number
  perStackShapes?: DotStackShape[] | null
  perStackMultipliers?: number[] | null
}

export interface DotDetonationSpec {
  skillId: string
  retainStacks?: number
  retainParam?: string
  retainMinTier?: number
  retainParamStacks?: number
}

export interface Debuff {
  id: string
  classId: string
  name: string
  activation: BuffActivation
  durationFrames: number
  effects: BuffStatEffect[]
  dot: DebuffDotSpec | null
  maxStacks: number
  stackScaling: StackScaling
  detonation?: DotDetonationSpec | null
  createdAt: string
  updatedAt: string
}

let counter = 0
export function newDebuffId(): string {
  counter = (counter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `df-${t}-${r}-${counter.toString(36)}`
}

export function makeDebuff(classId: string, patch: Partial<Debuff> = {}): Debuff {
  const now = new Date().toISOString()
  return {
    id: newDebuffId(),
    classId,
    name: "",
    activation: "triggered",
    durationFrames: 600,
    effects: [],
    dot: null,
    maxStacks: 1,
    stackScaling: "flat",
    detonation: null,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export function seedDebuffFromBuiltin(classId: string, src: Debuff): Debuff {
  return makeDebuff(classId, {
    id: src.id,
    name: src.name,
    activation: src.activation,
    durationFrames: src.durationFrames,
    effects: src.effects.map((e) => ({ ...e })),
    dot: src.dot
      ? {
          ...src.dot,
          perStackShapes: src.dot.perStackShapes
            ? src.dot.perStackShapes.map((r) => ({ ...r }))
            : null,
          perStackMultipliers: src.dot.perStackMultipliers
            ? [...src.dot.perStackMultipliers]
            : null,
        }
      : null,
    maxStacks: src.maxStacks,
    stackScaling: src.stackScaling,
    detonation: src.detonation ? { ...src.detonation } : (src.detonation ?? null),
  })
}

export function isDebuff(x: unknown): x is Debuff {
  if (!x || typeof x !== "object") return false
  const d = x as Record<string, unknown>
  if (typeof d.id !== "string" || !d.id) return false
  if (typeof d.classId !== "string" || !d.classId) return false
  if (typeof d.name !== "string") return false
  if (d.activation !== "permanent" && d.activation !== "triggered") return false
  if (typeof d.durationFrames !== "number" || !Number.isFinite(d.durationFrames)) return false
  if (!Array.isArray(d.effects)) return false
  for (const e of d.effects) {
    const ef = e as Record<string, unknown>
    if (!ef || typeof ef.statKey !== "string") return false
    if (typeof ef.amount !== "number" || !Number.isFinite(ef.amount)) return false
  }
  if (typeof d.createdAt !== "string") return false
  if (typeof d.updatedAt !== "string") return false
  return true
}
