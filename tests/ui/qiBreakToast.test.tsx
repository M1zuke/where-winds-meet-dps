import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import type { Result } from "../../src/engine/types"
import {
  QI_BREAK_TOAST_HIDDEN_UNTIL_KEY,
  QiBreakToast,
} from "../../src/ui/layout/qi-break-toast/QiBreakToast"
import { CornerToasts } from "../../src/ui/layout/corner-toasts/CornerToasts"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const HIDE_LABEL = "Don't show for 7 days"

function toastAt(nowMs: number, onCheckRotation: () => void = () => {}) {
  return (
    <I18nProvider>
      <QiBreakToast onCheckRotation={onCheckRotation} now={() => nowMs} />
    </I18nProvider>
  )
}

function closeToast(): void {
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
}

afterEach(() => {
  localStorage.clear()
})

describe("QiBreakToast", () => {
  it("sends the user to the rotation editor from its link", () => {
    const onCheckRotation = vi.fn()
    render(toastAt(1_000, onCheckRotation))

    fireEvent.click(screen.getByRole("button", { name: "click here" }))

    expect(onCheckRotation).toHaveBeenCalledTimes(1)
  })

  it("hides for the session on an unchecked close and returns after a remount", () => {
    const first = render(toastAt(1_000))
    closeToast()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    first.unmount()

    render(toastAt(2_000))

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("stays hidden across a remount for seven days after a checked close", () => {
    const first = render(toastAt(1_000))
    fireEvent.click(screen.getByRole("checkbox", { name: HIDE_LABEL }))
    closeToast()
    first.unmount()

    render(toastAt(1_000 + WEEK_MS - 1))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows again once seven days have passed", () => {
    const first = render(toastAt(1_000))
    fireEvent.click(screen.getByRole("checkbox", { name: HIDE_LABEL }))
    closeToast()
    first.unmount()

    render(toastAt(1_000 + WEEK_MS))

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("counts a corrupt stored value as not hidden", () => {
    localStorage.setItem(QI_BREAK_TOAST_HIDDEN_UNTIL_KEY, "not a number")

    render(toastAt(1_000))

    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})

describe("CornerToasts", () => {
  it("shows the Qi-break notice and the warnings at once, each closing on its own", () => {
    const result: Result = { ...runEngine(defaultInputs), warnings: ["Something is off"] }
    render(
      <I18nProvider>
        <CornerToasts result={result} onCheckRotation={() => {}} />
      </I18nProvider>,
    )

    expect(screen.getAllByRole("status")).toHaveLength(2)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    const remaining = screen.getAllByRole("status")
    expect(remaining).toHaveLength(1)
    expect(remaining[0]).not.toHaveTextContent("Something is off")
  })
})
