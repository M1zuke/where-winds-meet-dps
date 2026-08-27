import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { NewGearPieceDialog } from "../../src/ui/features/gear/new-gear-piece-dialog/NewGearPieceDialog"

const TRANSCRIPT_A = `
Mirage Sentinel
Relaying · Tier 96
Max Physical Attack +73.1
Momentum +45.9
Affinity Rate +4.1%
Power +46.4
[Turn]Max Physical Attack +73.1
Physical Penetration +10.7
`

vi.mock("../../src/ui/features/gear/screenshot-ocr/ocrEngine", () => ({
  decodeGearScreenshot: vi.fn(async () => ({ width: 10, height: 10 }) as unknown as ImageBitmap),
  preprocessGearScreenshot: vi.fn(() => document.createElement("canvas")),
  recognizeGearScreenshot: vi.fn(async () => TRANSCRIPT_A),
  terminateOcrWorker: vi.fn(async () => {}),
}))

const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function renderDialog(onCancel = vi.fn(), onSave = vi.fn()) {
  render(
    <I18nProvider>
      <NewGearPieceDialog
        initialSlot="leftWeapon"
        inputs={inputs}
        onCancel={onCancel}
        onSave={onSave}
      />
    </I18nProvider>,
  )
  return { onCancel, onSave }
}

function addScreenshot(): void {
  const file = new File(["fake"], "shot.png", { type: "image/png" })
  fireEvent.change(screen.getByLabelText("Choose file"), { target: { files: [file] } })
}

describe("NewGearPieceDialog screenshot import", () => {
  it("has no separate screenshot dialog entry point left in the gear tab", async () => {
    const { GearTab } = await import("../../src/ui/features/gear/gear-tab/GearTab")
    const { ConfirmProvider } = await import("../../src/ui/components/confirm-dialog/ConfirmDialog")
    render(
      <I18nProvider>
        <ConfirmProvider>
          <GearTab
            inputs={defaultInputs}
            engineInputs={defaultInputs}
            onChange={() => {}}
            currentDps={40000}
          />
        </ConfirmProvider>
      </I18nProvider>,
    )

    expect(screen.queryByRole("button", { name: "Import from screenshot" })).toBeNull()
  })

  it("populates the draft form after a mocked recognition", async () => {
    renderDialog()

    addScreenshot()

    await screen.findAllByDisplayValue("Max Physical Attack")
    const comboboxValues = screen
      .getAllByRole("combobox")
      .map((element) => (element as HTMLInputElement).value)
    expect(comboboxValues).toContain("Max Physical Attack")
  })

  it("hands back the OCR-populated piece on Save & Equip", async () => {
    const { onSave } = renderDialog()

    addScreenshot()
    await screen.findAllByDisplayValue("Max Physical Attack")

    fireEvent.click(screen.getByRole("button", { name: "Save & Equip" }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const [piece, mode] = onSave.mock.calls[0]!
    expect(mode).toBe("equip")
    expect(piece.label).toBe("Mirage Sentinel")
    expect(piece.words[0]).toMatchObject({ word: "maxPhys", value: 73.1 })
  })

  it("still saves a blank hand-typed draft when no screenshot was ever added", () => {
    const { onSave } = renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Save & Store" }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const [piece, mode] = onSave.mock.calls[0]!
    expect(mode).toBe("store")
    expect(piece.words.every((word: { word: string }) => word.word === "")).toBe(true)
  })

  it("calls onCancel and writes nothing on Cancel", () => {
    const { onCancel, onSave } = renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("shows the example screenshot and its numbered steps before any paste", () => {
    renderDialog()

    expect(screen.getByAltText("Example of a cropped gear panel screenshot")).toBeInTheDocument()
    expect(screen.getByText("Press “Tune” or “Develop”.")).toBeInTheDocument()
  })

  it("swaps the example for the user's own screenshot once one is added, with a way back", async () => {
    renderDialog()

    addScreenshot()
    await screen.findAllByDisplayValue("Max Physical Attack")

    expect(screen.getByAltText("Your pasted gear screenshot")).toBeInTheDocument()
    expect(screen.queryByAltText("Example of a cropped gear panel screenshot")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Back to instructions" }))

    expect(screen.getByAltText("Example of a cropped gear panel screenshot")).toBeInTheDocument()
  })

  it("exposes a collapsed OCR readout naming every recognised line and how each row resolved", async () => {
    renderDialog()

    addScreenshot()
    await screen.findAllByDisplayValue("Max Physical Attack")

    const disclosure = screen.getByText("OCR readout").closest("details")
    expect(disclosure).not.toBeNull()
    expect(disclosure).not.toHaveAttribute("open")

    expect(screen.getAllByText(/Physical Penetration \+10\.7/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/maxPhys/).length).toBeGreaterThan(0)
  })

  it("copies the OCR readout to the clipboard", async () => {
    const writeText = vi.fn(async (_text: string) => {})
    Object.assign(navigator, { clipboard: { writeText } })

    renderDialog()
    addScreenshot()
    await screen.findAllByDisplayValue("Max Physical Attack")

    fireEvent.click(screen.getByRole("button", { name: "Copy diagnostics" }))

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0]![0]).toContain("maxPhys")
  })
})
