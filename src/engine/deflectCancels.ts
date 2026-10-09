// The automatic Deflect Cancel a cancel-form step carries — see docs/
// TIMELINE.md § "Identity and tags". Pure functions only: the layout pass
// owns the sequencing, this module only owns which steps need one inserted.

import { cancelledByOf, type Skill } from "./skill"
import type { ResolvedStep } from "./rotation"

export function deflectCancelSkillId(classId: string): string {
  return `${classId}-deflect-cancel`
}

// Inserts the class's own Deflect Cancel right after every cancel-form step
// whose skill resolves to it, pre-pull steps included. A manual one already
// there needs no second — a rotation step is never edited, only the fresh
// synthetic steps this returns are new.
export function expandStepsWithDeflectCancels(
  steps: readonly ResolvedStep[],
  deflectCancelSkill: Skill,
  makeAttachedStep: (parentStepId: string) => ResolvedStep,
): ResolvedStep[] {
  const expanded: ResolvedStep[] = []
  for (let index = 0; index < steps.length; index++) {
    const resolvedStep = steps[index]
    expanded.push(resolvedStep)
    if (cancelledByOf(resolvedStep.skill) !== "deflectCancel") continue
    const nextStep = steps[index + 1]
    if (nextStep?.skill.id === deflectCancelSkill.id) continue
    expanded.push(makeAttachedStep(resolvedStep.step.id))
  }
  return expanded
}
