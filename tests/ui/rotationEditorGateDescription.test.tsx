// Scoped to Bamboocut Draught's Carouse gate — the class carries no
// validated anchor (docs/TESTING.md § "Class scoping"), so nothing here
// asserts an absolute DPS number.
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BAMBOOCUT_DRAUGHT_GATES } from "../../src/data/classes/bamboocut-draught/gates"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

describe("the cast-chip tooltip shows a gate's description", () => {
  it("renders the Carouse gate's description text", () => {
    const carouseGate = BAMBOOCUT_DRAUGHT_GATES.find((gate) => gate.id === STATUS.carouse)!
    const inputs = {
      ...defaultInputs,
      classId: "bamboocutDraught",
      set: null,
      activeCustomRotation: makeRotation("bamboocutDraught", {
        steps: [makeStep({ skillId: SKILL.lightAttack, hitCount: 1 })],
        openingStacks: { [STATUS.carouse]: 1 },
      }),
    }
    const result = runEngine(inputs)

    render(
      <I18nProvider>
        <ConfirmProvider>
          <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.getByText(carouseGate.description!)).toBeInTheDocument()
  })
})
