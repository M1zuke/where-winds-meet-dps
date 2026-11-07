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

describe("the rotation editor's Qi break row shows every computed break, read only", () => {
  it("renders each computed break's span when the simulated schedule has one", () => {
    const result = renderPanel(defaultInputs)
    const breaks = result.qiBreaks ?? []
    if (breaks.length === 0) {
      expect(screen.getByText("No break")).toBeInTheDocument()
      return
    }
    for (const [index, qiBreak] of breaks.entries()) {
      expect(screen.getByText(`Computed break ${index + 1}`)).toBeInTheDocument()
      expect(
        screen.getByText(`${qiBreak.startSec.toFixed(1)}s – ${qiBreak.endSec.toFixed(1)}s`),
      ).toBeInTheDocument()
    }
  })
})
