import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { ScreenshotGearDialog } from "../../src/ui/features/gear/screenshot-gear-dialog/ScreenshotGearDialog"
import { GearTab } from "../../src/ui/features/gear/gear-tab/GearTab"

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

vi.mock("../../src/ui/features/gear/screenshot-gear-dialog/ocrEngine", () => ({
  decodeGearScreenshot: vi.fn(async () => ({ width: 10, height: 10 }) as unknown as ImageBitmap),
  preprocessGearScreenshot: vi.fn(() => document.createElement("canvas")),
  recognizeGearScreenshot: vi.fn(async () => TRANSCRIPT_A),
  terminateOcrWorker: vi.fn(async () => {}),
}))

const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

function renderDialog(onCancel = vi.fn(), onImport = vi.fn()) {
  render(
    <I18nProvider>
      <ScreenshotGearDialog
        inputs={inputs}
        fallbackSlot="leftWeapon"
        onCancel={onCancel}
        onImport={onImport}
      />
    </I18nProvider>,
  )
  return { onCancel, onImport }
}

function addScreenshot(): void {
  const file = new File(["fake"], "shot.png", { type: "image/png" })
  fireEvent.change(screen.getByLabelText("Choose files"), { target: { files: [file] } })
}

describe("ScreenshotGearDialog", () => {
  it("explains how to add an image and keeps Import disabled while empty", () => {
    renderDialog()

    expect(screen.getByText(/get started/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled()
  })

  it("shows the parsed piece's name and word labels after a mocked recognition, and enables Import", async () => {
    renderDialog()

    addScreenshot()

    await screen.findByDisplayValue("Mirage Sentinel")
    const comboboxValues = screen
      .getAllByRole("combobox")
      .map((element) => (element as HTMLInputElement).value)
    expect(comboboxValues).toContain("Max Physical Attack")
    expect(screen.getByRole("button", { name: "Import" })).not.toBeDisabled()
  })

  it("returns to the empty state and disables Import again after removing the only card", async () => {
    renderDialog()

    addScreenshot()
    await screen.findByDisplayValue("Mirage Sentinel")

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByText(/get started/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled()
  })

  it("calls onCancel and writes nothing on Escape", () => {
    const { onCancel, onImport } = renderDialog()

    fireEvent.keyDown(document, { key: "Escape" })

    expect(onCancel).toHaveBeenCalled()
    expect(onImport).not.toHaveBeenCalled()
  })

  it("calls onCancel and writes nothing on Cancel", () => {
    const { onCancel, onImport } = renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onCancel).toHaveBeenCalled()
    expect(onImport).not.toHaveBeenCalled()
  })

  it("hands back an edited word value on Import", async () => {
    const { onImport } = renderDialog()

    addScreenshot()
    await screen.findByDisplayValue("Mirage Sentinel")

    const valueInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(valueInputs[0]!, { target: { value: "60" } })
    fireEvent.blur(valueInputs[0]!)

    fireEvent.click(screen.getByRole("button", { name: "Import" }))

    expect(onImport).toHaveBeenCalledTimes(1)
    const [pieces] = onImport.mock.calls[0]!
    expect(pieces[0].words[0]).toMatchObject({ word: "maxPhys", value: 60 })
  })
})

describe("GearTab screenshot import button", () => {
  it("is present beside Import gear, and opens the dialog", () => {
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

    const head = screen.getByRole("heading", { name: "Equipped" }).parentElement!
    const button = within(head).getByRole("button", { name: "Import from screenshot" })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
