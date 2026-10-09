// Scoped to Bellstrike Umbra, a validated class (CLAUDE.md § "Implemented
// classes"), with placeholder skills standing in for a cancel form and its
// neighbours — docs/TIMELINE.md § "Identity and tags".
import { beforeEach, describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeStep, newRotationId } from "../../src/engine/rotation"
import { deflectCancelSkillId } from "../../src/engine/deflectCancels"
import { builtinSkill, testRotation } from "../builtins"
import { loadCustomRotations, saveCustomRotation, saveCustomSkill } from "../../src/storage"
import { kvStore } from "../../src/kvStore"
import { SKILL as DRAUGHT_SKILL } from "../../src/data/skills/bamboocut-draught/ids"
import type { Inputs, Result } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function makeFiller(name: string): Skill {
  return makeSkill(CLASS, { name, castFrames: 10, hits: [makeHit({ frame: 0 })] })
}

function makeCancelForm(name = "Test Form [cancel]"): Skill {
  return makeSkill(CLASS, {
    name,
    castFrames: 12,
    hits: [makeHit({ frame: 0 })],
    cancelledBy: "deflectCancel",
  })
}

function runRotation(skillIds: string[], extraSkills: Skill[] = []): Result {
  const rotation = testRotation(CLASS, { steps: skillIds.map((skillId) => makeStep({ skillId })) })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: rotation,
    customSkills: extraSkills,
  }
  return simulateTimeline(inputs)
}

const DEFLECT_CANCEL_ID = deflectCancelSkillId(CLASS)

function deflectCancelCasts(result: Result) {
  return (result.casts ?? []).filter(
    (cast) => cast.skillName === builtinSkill(CLASS, DEFLECT_CANCEL_ID).name,
  )
}

describe("a cancel-form skill brings its own interrupt-recovery cast", () => {
  it("gets exactly one, attached to its own step", () => {
    const cancelForm = makeCancelForm()
    const filler = makeFiller("After")
    const result = runRotation([cancelForm.id, filler.id], [cancelForm, filler])
    const casts = deflectCancelCasts(result)
    expect(casts).toHaveLength(1)
    const cancelFormStepId = result.casts!.find(
      (cast) => cast.skillName === cancelForm.name,
    )!.stepId
    expect(casts[0].attachedToStepId).toBe(cancelFormStepId)
  })

  it("does not double when a manual one already follows it", () => {
    const cancelForm = makeCancelForm()
    const filler = makeFiller("After")
    const result = runRotation([cancelForm.id, DEFLECT_CANCEL_ID, filler.id], [cancelForm, filler])
    expect(deflectCancelCasts(result)).toHaveLength(1)
  })

  it("is skipped for a skill marked as cancelled by the next skill instead", () => {
    const cancelForm = makeSkill(CLASS, {
      name: "Test Form [cancel]",
      castFrames: 12,
      hits: [makeHit({ frame: 0 })],
      cancelledBy: "nextSkill",
    })
    const filler = makeFiller("After")
    const result = runRotation([cancelForm.id, filler.id], [cancelForm, filler])
    expect(deflectCancelCasts(result)).toHaveLength(0)
  })

  it("the Bamboocut Draught follow-up exception is authored this way", () => {
    const followUpCancel = builtinSkill(
      "bamboocutDraught",
      DRAUGHT_SKILL.nightwickPrimepickFollowUpCancel,
    )
    expect(followUpCancel.cancelledBy).toBe("nextSkill")
  })
})

describe("renaming a cancel-form skill does not change whether it gets a Deflect Cancel", () => {
  it("a skill with no 'cancel' anywhere in its name still gets one, by its own cancelledBy", () => {
    const cancelForm = makeCancelForm("Totally Unrelated Display Name")
    const filler = makeFiller("After")
    const result = runRotation([cancelForm.id, filler.id], [cancelForm, filler])
    expect(deflectCancelCasts(result)).toHaveLength(1)
  })

  it("a skill whose name reads as a cancel form but carries no cancelledBy gets none", () => {
    const lookalike = makeSkill(CLASS, {
      name: "Looks Like A Cancel Form [cancel]",
      castFrames: 12,
      hits: [makeHit({ frame: 0 })],
    })
    const filler = makeFiller("After")
    const result = runRotation([lookalike.id, filler.id], [lookalike, filler])
    expect(deflectCancelCasts(result)).toHaveLength(0)
  })
})

describe("a Deflect Cancel standing after a non-cancel-form skill", () => {
  it("stays as its own unattached cast", () => {
    const filler = makeFiller("Before")
    const result = runRotation([filler.id, DEFLECT_CANCEL_ID], [filler])
    const casts = deflectCancelCasts(result)
    expect(casts).toHaveLength(1)
    expect(casts[0].attachedToStepId).toBeUndefined()
  })
})

describe("a stored custom rotation's manual Deflect Cancel after a cancel-form step", () => {
  beforeEach(() => {
    kvStore.remove("wwm.customRotations")
    kvStore.remove("wwm.customSkills")
  })

  it("is healed away on load", () => {
    const cancelForm = makeCancelForm("Stored Form [cancel]")
    const filler = makeFiller("Stored After")
    saveCustomSkill(cancelForm)
    saveCustomSkill(filler)
    const saved = saveCustomRotation(
      testRotation(CLASS, {
        id: newRotationId(),
        steps: [
          makeStep({ skillId: cancelForm.id }),
          makeStep({ skillId: DEFLECT_CANCEL_ID }),
          makeStep({ skillId: filler.id }),
        ],
      }),
    )
    const healed = loadCustomRotations().find((rotation) => rotation.id === saved.id)!
    expect(healed.steps.map((step) => step.skillId)).toEqual([cancelForm.id, filler.id])
  })
})
