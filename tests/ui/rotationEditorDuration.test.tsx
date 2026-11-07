// Scoped to Bellstrike Splendor — a validated class (CLAUDE.md § "Implemented
// classes") whose built-in rotation opens on a damaging pre-pull hit.
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

describe("the Rotation Editor's computed duration", () => {
  it("shows the same fight duration the output panel divides by, even when a pre-pull hit opens the fight", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeSplendor",
      activeCustomRotation: null,
      selectedBuiltinRotationId: "builtin-bellstrikeSplendor-kaezuma-42vs-1db",
    }
    const result = runEngine(inputs)
    expect(result.fightStartSec).toBeLessThan(0)

    render(
      <I18nProvider>
        <ConfirmProvider>
          <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.getByText(`${result.rotationDuration.toFixed(2)} s`)).toBeTruthy()
  })
})
