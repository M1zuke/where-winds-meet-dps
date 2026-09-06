import type { StatKey } from "./statRegistry"
import { isHitTrigger, type HitTrigger } from "./skill"

export interface BuffStatEffect {
  statKey: StatKey
  amount: number
}

export type BuffScope = "player" | "team"
export type BuffActivation = "permanent" | "triggered"

export type StackScaling = "flat" | "perStack"

export interface Buff {
  id: string
  classId: string
  name: string
  description?: string
  scope: BuffScope
  activation: BuffActivation
  durationFrames: number
  effects: BuffStatEffect[]
  maxStacks: number
  stackScaling: StackScaling
  requiresParam?: string
  requiresMinTier?: number
  defaultOpeningStacks?: number
  onExpire?: { targetId: string; stacks: number; requiresBuffId?: string }
  stacksPerDamagingHit?: { cooldownFrames: number }
  onMaxStacks?: HitTrigger[]
  createdAt: string
  updatedAt: string
}

let counter = 0
export function newBuffId(): string {
  counter = (counter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `bf-${t}-${r}-${counter.toString(36)}`
}

export function isBuff(x: unknown): x is Buff {
  if (!x || typeof x !== "object") return false
  const b = x as Record<string, unknown>
  if (typeof b.id !== "string" || !b.id) return false
  if (typeof b.classId !== "string" || !b.classId) return false
  if (typeof b.name !== "string") return false
  if (b.scope !== "player" && b.scope !== "team") return false
  if (b.activation !== "permanent" && b.activation !== "triggered") return false
  if (typeof b.durationFrames !== "number" || !Number.isFinite(b.durationFrames)) return false
  if (!Array.isArray(b.effects)) return false
  for (const e of b.effects) {
    const ef = e as Record<string, unknown>
    if (!ef || typeof ef.statKey !== "string") return false
    if (typeof ef.amount !== "number" || !Number.isFinite(ef.amount)) return false
  }
  if (
    b.defaultOpeningStacks !== undefined &&
    (typeof b.defaultOpeningStacks !== "number" || !Number.isFinite(b.defaultOpeningStacks))
  )
    return false
  if (b.requiresMinTier !== undefined) {
    if (typeof b.requiresMinTier !== "number" || !Number.isFinite(b.requiresMinTier)) return false
    if (typeof b.requiresParam !== "string" || !b.requiresParam) return false
  }
  if (b.onExpire !== undefined) {
    const onExpire = b.onExpire as Record<string, unknown> | null
    if (!onExpire || typeof onExpire !== "object") return false
    if (typeof onExpire.targetId !== "string" || !onExpire.targetId) return false
    if (typeof onExpire.stacks !== "number" || !Number.isFinite(onExpire.stacks)) return false
    if (onExpire.requiresBuffId !== undefined && typeof onExpire.requiresBuffId !== "string")
      return false
  }
  if (b.stacksPerDamagingHit !== undefined) {
    const perHit = b.stacksPerDamagingHit as Record<string, unknown> | null
    if (!perHit || typeof perHit !== "object") return false
    if (typeof perHit.cooldownFrames !== "number" || !Number.isFinite(perHit.cooldownFrames))
      return false
  }
  if (b.onMaxStacks !== undefined) {
    if (!Array.isArray(b.onMaxStacks)) return false
    for (const trigger of b.onMaxStacks) if (!isHitTrigger(trigger)) return false
  }
  if (typeof b.createdAt !== "string") return false
  if (typeof b.updatedAt !== "string") return false
  return true
}

export function makeBuff(classId: string, patch: Partial<Buff>): Buff {
  const now = new Date().toISOString()
  return {
    id: newBuffId(),
    classId,
    name: "",
    scope: "player",
    activation: "triggered",
    durationFrames: 600,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}
