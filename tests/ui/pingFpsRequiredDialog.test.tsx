import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PingFpsRequiredDialog } from "../../src/ui/layout/ping-fps-required-dialog/PingFpsRequiredDialog"
import { I18nProvider } from "../../src/i18n/I18nProvider"

function renderDialog(pingMs: number | null = null, averageFps: number | null = null) {
  const onConfirm = vi.fn()
  render(
    <I18nProvider>
      <PingFpsRequiredDialog pingMs={pingMs} averageFps={averageFps} onConfirm={onConfirm} />
    </I18nProvider>,
  )
  return onConfirm
}

describe("PingFpsRequiredDialog", () => {
  it("keeps Continue disabled until both fields hold a valid value", () => {
    renderDialog()
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Ping (ms)"), { target: { value: "50" } })
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Average FPS"), { target: { value: "60" } })
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
  })

  it("reports the entered numbers once Continue is pressed", () => {
    const onConfirm = renderDialog()
    fireEvent.change(screen.getByLabelText("Ping (ms)"), { target: { value: "80" } })
    fireEvent.change(screen.getByLabelText("Average FPS"), { target: { value: "144" } })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(onConfirm).toHaveBeenCalledWith(80, 144)
  })

  it("starts pre-filled from an already partly configured profile", () => {
    renderDialog(50, null)
    expect(screen.getByLabelText("Ping (ms)")).toHaveValue(50)
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("cannot be dismissed by Escape or a backdrop click", () => {
    const onConfirm = renderDialog()
    fireEvent.keyDown(document, { key: "Escape" })
    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
