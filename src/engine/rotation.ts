import type { Skill } from "./skill"
import type { QiBreakWindow } from "./types"

export interface RotationStep {
  id: string
  skillId: string
  hitCount: number
  /** @deprecated pre-pull is now a skill property — see `isPrePullSkill` in `./skill`. */
  prePull: boolean
}

export interface Rotation {
  id: string
  name: string
  classId: string
  steps: RotationStep[]
  permanentBuffIds: string[]
  openingStacks?: Record<string, number>
  qiBreak?: QiBreakWindow
  createdAt: string
  updatedAt: string
  description?: string
}

let counter = 0
function nextId(prefix: string): string {
  counter = (counter + 1) | 0
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${t}-${r}-${counter.toString(36)}`
}
export function newRotationId(): string {
  return nextId("rt")
}
export function newStepId(): string {
  return nextId("st")
}

export function makeStep(patch: Partial<RotationStep> = {}): RotationStep {
  return {
    id: newStepId(),
    skillId: "",
    hitCount: 1,
    prePull: false,
    ...patch,
  }
}

export function makeRotation(classId: string, patch: Partial<Rotation> = {}): Rotation {
  const now = new Date().toISOString()
  return {
    id: newRotationId(),
    name: "",
    classId,
    steps: [],
    permanentBuffIds: [],
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export function isRotationStep(x: unknown): x is RotationStep {
  if (!x || typeof x !== "object") return false
  const s = x as Record<string, unknown>
  if (typeof s.id !== "string" || !s.id) return false
  if (typeof s.skillId !== "string") return false
  if (typeof s.hitCount !== "number" || !Number.isFinite(s.hitCount)) return false
  if (typeof s.prePull !== "boolean") return false
  return true
}

export function isRotation(x: unknown): x is Rotation {
  if (!x || typeof x !== "object") return false
  const r = x as Record<string, unknown>
  if (typeof r.id !== "string" || !r.id) return false
  if (typeof r.name !== "string") return false
  if (typeof r.classId !== "string" || !r.classId) return false
  if (!Array.isArray(r.steps)) return false
  for (const s of r.steps) {
    if (!isRotationStep(s)) return false
  }
  if (!Array.isArray(r.permanentBuffIds)) return false
  for (const id of r.permanentBuffIds) {
    if (typeof id !== "string") return false
  }
  if (r.openingStacks !== undefined) {
    if (!r.openingStacks || typeof r.openingStacks !== "object" || Array.isArray(r.openingStacks))
      return false
    for (const stacks of Object.values(r.openingStacks as Record<string, unknown>)) {
      if (typeof stacks !== "number" || !Number.isFinite(stacks) || stacks < 0) return false
    }
  }
  if (r.qiBreak !== undefined && !isQiBreakWindow(r.qiBreak)) return false
  if (typeof r.createdAt !== "string") return false
  if (typeof r.updatedAt !== "string") return false
  return true
}

export function isQiBreakWindow(x: unknown): x is QiBreakWindow {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false
  const w = x as Record<string, unknown>
  for (const key of ["startSec", "durationSec", "lowQiLeadSec"] as const) {
    const value = w[key]
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return false
  }
  return true
}

export interface ResolvedStep {
  step: RotationStep
  skill: Skill
}

export interface ResolvedRotation {
  steps: ResolvedStep[]
  warnings: string[]
}

export function resolveRotation(
  rotation: Rotation,
  skills: readonly Skill[],
  statuses: readonly { id: string }[],
): ResolvedRotation {
  const skillById = new Map(skills.map((s) => [s.id, s] as const))
  const statusIds = new Set(statuses.map((s) => s.id))
  const steps: ResolvedStep[] = []
  const warnings: string[] = []

  let orphanSteps = 0
  for (const step of rotation.steps) {
    const skill = skillById.get(step.skillId)
    if (!skill) {
      orphanSteps++
      continue
    }
    steps.push({ step, skill })
  }
  if (orphanSteps > 0) {
    warnings.push(
      `${orphanSteps} rotation step${orphanSteps === 1 ? "" : "s"} reference${orphanSteps === 1 ? "s" : ""} a missing skill and ${orphanSteps === 1 ? "was" : "were"} skipped.`,
    )
  }

  const missingPermanent = rotation.permanentBuffIds.filter((id) => !statusIds.has(id))
  if (missingPermanent.length > 0) {
    warnings.push(
      `${missingPermanent.length} permanent buff${missingPermanent.length === 1 ? "" : "s"} could not be found.`,
    )
  }

  if (rotation.steps.length === 0) {
    warnings.push("Rotation has no steps.")
  }

  return { steps, warnings }
}
