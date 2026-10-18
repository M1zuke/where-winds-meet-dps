import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"
import { RotationTimelinePanel } from "../../src/ui/features/rotation/rotation-timeline-panel/RotationTimelinePanel"
import { testRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"
const EMPTYING_QI = 1_000_000
const FILLER_STEPS = 12

function breakingInputs(): Inputs {
  const emptier = makeSkill(CLASS, {
    name: "Emptier",
    castFrames: 30,
    hits: [makeHit({ frame: 0, physMultiplier: 1, qiFlat: EMPTYING_QI })],
  })
  const filler = makeSkill(CLASS, {
    name: "Filler",
    castFrames: 120,
    hits: [makeHit({ frame: 0, physMultiplier: 1, qiFlat: 20 })],
  })
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [emptier, filler],
    activeCustomRotation: testRotation(CLASS, {
      steps: [
        makeStep({ skillId: emptier.id }),
        ...Array.from({ length: FILLER_STEPS }, () => makeStep({ skillId: filler.id })),
      ],
    }),
  }
}

const inputs = breakingInputs()
const result = simulateTimeline(inputs, {})

describe("the target's Qi in the rotation views", () => {
  it("records the emptying hit, the refill and the immunity after it", () => {
    const trace = result.qiTrace!
    expect(trace.points[0].value).toBe(0)
    expect(trace.points[1]).toMatchObject({ value: trace.max, refill: true })
    expect(trace.directImmunities).toHaveLength(1)
    expect(trace.directImmunities[0].startSec).toBeCloseTo(trace.points[1].timeSec, 9)
  })

  it("shows a Target Qi lane with its break and refill labels in the cast timeline", () => {
    render(
      <I18nProvider>
        <RotationTimelinePanel result={result} />
      </I18nProvider>,
    )
    expect(screen.getByText("Target Qi")).toBeInTheDocument()
    expect(screen.getByText(/0 — break/)).toBeInTheDocument()
    expect(screen.getByText(/— refill/)).toBeInTheDocument()
  })

  it("adds the delta ledger with its break, refill and immune rows to the editor", () => {
    render(
      <I18nProvider>
        <ConfirmProvider>
          <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
        </ConfirmProvider>
      </I18nProvider>,
    )
    expect(screen.getByText("Δ Qi")).toBeInTheDocument()
    expect(screen.getAllByText(/ exhausted /)).toHaveLength(result.qiBreaks!.length)
    expect(screen.getByText(/^Refill · /)).toBeInTheDocument()
    expect(screen.getAllByText(/^Broken /).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^Immune /).length).toBeGreaterThan(0)
  })
})
