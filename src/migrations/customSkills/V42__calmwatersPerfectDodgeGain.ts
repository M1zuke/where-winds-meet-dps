// v41 -> v42 — the Calmwaters gear set's own 4-piece Endurance gain, an
// unconditional +5 on a Perfect Dodge while that set is equipped, on every
// built-in dodge skill. No editable surface in the Skill Editor, so a stored
// copy is healed unconditionally, matched by the gain's own `requiresParam`
// rather than by hit index.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface HitTrigger {
  kind: string
  targetId: string
  stacks: number
  condition: unknown
  [key: string]: unknown
}

const CALMWATERS_PERFECT_DODGE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 5,
  condition: null,
  requiresParam: "calmwatersSet",
}

interface SkillGainPatch {
  matchId: (id: string) => boolean
  appendHitTriggers: Record<number, HitTrigger[]>
}

const exact = (id: string) => (candidate: string) => candidate === id

const PATCHES: SkillGainPatch[] = [
  {
    matchId: exact("universal-perfect-dodge"),
    appendHitTriggers: { 0: [CALMWATERS_PERFECT_DODGE_GAIN] },
  },
  {
    matchId: exact("universal-perfect-dodge-full"),
    appendHitTriggers: { 0: [CALMWATERS_PERFECT_DODGE_GAIN] },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge"),
    appendHitTriggers: { 0: [CALMWATERS_PERFECT_DODGE_GAIN] },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge-full"),
    appendHitTriggers: { 0: [CALMWATERS_PERFECT_DODGE_GAIN] },
  },
]

function alreadyHasGain(triggers: unknown, requiresParam: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "meterDelta" &&
        trigger.requiresParam === requiresParam,
    )
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch || !Array.isArray(skill.hits)) return skill

  return {
    ...skill,
    hits: skill.hits.map((hit, index) => {
      const additions = patch.appendHitTriggers[index]
      if (!additions || !isRecord(hit)) return hit
      const existingTriggers = Array.isArray(hit.triggers) ? hit.triggers : []
      const missing = additions.filter(
        (addition) => !alreadyHasGain(existingTriggers, addition.requiresParam as string),
      )
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    }),
  }
}

export const V42__calmwatersPerfectDodgeGain: CustomSkillMigration = {
  to: 42,
  name: "V42__calmwatersPerfectDodgeGain",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 42, skills }
  },
}
