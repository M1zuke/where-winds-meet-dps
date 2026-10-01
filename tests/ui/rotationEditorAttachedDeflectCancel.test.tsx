import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { deflectCancelSkillId } from "../../src/engine/deflectCancels"
import { builtinSkill, testRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

const CLASS = "bellstrikeUmbra"

describe("the Rotation Editor's attached interrupt-recovery cast", () => {
  it("shows under its parent step, with no move or remove controls of its own", () => {
    const cancelForm = makeSkill(CLASS, {
      name: "Test Form [cancel]",
      castFrames: 12,
      hits: [makeHit({ frame: 0 })],
      cancelledBy: "deflectCancel",
    })
    const after = makeSkill(CLASS, { name: "After", castFrames: 10, hits: [makeHit({ frame: 0 })] })
    const skills = [cancelForm, after]
    const rotation = testRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: skills,
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    const deflectCancelName = builtinSkill(CLASS, deflectCancelSkillId(CLASS)).name

    render(
      <I18nProvider>
        <ConfirmProvider>
          <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.getByText(deflectCancelName)).toBeInTheDocument()
    expect(screen.getAllByLabelText("remove")).toHaveLength(rotation.steps.length)
    expect(screen.getAllByLabelText("move up")).toHaveLength(rotation.steps.length)
  })
})
