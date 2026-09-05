import type { Rotation, RotationStep } from "../../../../engine/rotation"
import type { RotationCast } from "../../../../engine/types"
import { FPS } from "../../../../engine/timeline"
import { isPrePullSkill, type Skill } from "../../../../engine/skill"

export function stepCastFrames(step: RotationStep, skill: Skill | undefined): number {
  if (!skill) return 0
  const hitCount = Math.max(0, Math.min(step.hitCount, skill.hits.length))
  const performed = skill.hits.slice(0, hitCount)
  const maxFrame = performed.length > 0 ? Math.max(...performed.map((hit) => hit.frame)) : -1
  return skill.castFrames || maxFrame + 1
}

export function castsCoverRotation(rotation: Rotation, casts: readonly RotationCast[] | undefined): boolean {
  if (!casts || casts.length !== rotation.steps.length) return false
  return rotation.steps.every((step, index) => casts[index]?.stepId === step.id)
}

export function rotationDurationSec(
  rotation: Rotation,
  skillsById: ReadonlyMap<string, Skill>,
  simulated: { rotationDuration: number; casts?: readonly RotationCast[] },
): number {
  if (castsCoverRotation(rotation, simulated.casts)) return simulated.rotationDuration
  const frames = rotation.steps
    .filter((step) => {
      const skill = skillsById.get(step.skillId)
      return !skill || !isPrePullSkill(skill)
    })
    .reduce((sum, step) => sum + stepCastFrames(step, skillsById.get(step.skillId)), 0)
  return frames / FPS
}
