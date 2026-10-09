import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

const CLASS = "bellstrikeUmbra"

describe("the Rotation Editor's fight-clock cast times", () => {
  it("shows the first damaging cast at 0.00 s and a buff-only cast before it negative", () => {
    const buffOnly = makeSkill(CLASS, { name: "Buff Only", castFrames: 60, hits: [makeHit()] })
    const damaging = makeSkill(CLASS, {
      name: "Damaging",
      castFrames: 30,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const skills = [buffOnly, damaging]
    const rotation = makeRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id })),
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: skills,
      activeCustomRotation: rotation,
      set: null,
    }
    const result = simulateTimeline(inputs)
    expect(result.fightStartSec).toBeGreaterThan(0)

    render(
      <I18nProvider>
        <ConfirmProvider>
          <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.getByText("0.00s")).toBeInTheDocument()
    expect(screen.getByText(`-${result.fightStartSec.toFixed(2)}s`)).toBeInTheDocument()
  })
})
