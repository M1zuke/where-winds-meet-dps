import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { RotationEditorPanel } from "../../src/ui/features/rotation/rotation-editor-panel/RotationEditorPanel"

function renderPanel(inputs: typeof defaultInputs) {
  const result = runEngine(inputs)
  render(
    <I18nProvider>
      <ConfirmProvider>
        <RotationEditorPanel inputs={inputs} onChange={() => {}} result={result} />
      </ConfirmProvider>
    </I18nProvider>,
  )
  return result
}

describe("the rotation editor's Qi break row shows the computed first break beside the authored one", () => {
  it("renders the computed first break in seconds when the simulated schedule has one", () => {
    const result = renderPanel(defaultInputs)
    const computedStartSec = result.qiBreaks?.[0]?.startSec
    expect(screen.getByText("Computed first break")).toBeInTheDocument()
    if (computedStartSec !== undefined) {
      expect(screen.getByText(`${computedStartSec.toFixed(1)} s`)).toBeInTheDocument()
    } else {
      expect(screen.getByText("No break")).toBeInTheDocument()
    }
  })
})
