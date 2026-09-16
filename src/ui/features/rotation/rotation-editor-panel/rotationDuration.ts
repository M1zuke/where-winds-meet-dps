import type { Rotation } from "../../../../engine/rotation"
import type { RotationCast } from "../../../../engine/types"
import { FPS } from "../../../../engine/timeline"
import { isPrePullSkill, type Skill } from "../../../../engine/skill"

export function stepCastFrames(skill: Skill | undefined): number {
  if (!skill) return 0
  const maxFrame = skill.hits.length > 0 ? Math.max(...skill.hits.map((hit) => hit.frame)) : -1
  return skill.castFrames || maxFrame + 1
}

export function castsCoverRotation(
  rotation: Rotation,
  casts: readonly RotationCast[] | undefined,
): boolean {
  if (!casts || casts.length !== rotation.steps.length) return false
  return rotation.steps.every((step, index) => casts[index]?.stepId === step.id)
}

export function rotationDurationSec(
  rotation: Rotation,
  skillsById: ReadonlyMap<string, Skill>,
  simulated: { castDuration: number; casts?: readonly RotationCast[] },
): number {
  if (castsCoverRotation(rotation, simulated.casts)) return simulated.castDuration
  const frames = rotation.steps
    .filter((step) => {
      const skill = skillsById.get(step.skillId)
      return !skill || !isPrePullSkill(skill)
    })
    .reduce((sum, step) => sum + stepCastFrames(skillsById.get(step.skillId)), 0)
  return frames / FPS
}
