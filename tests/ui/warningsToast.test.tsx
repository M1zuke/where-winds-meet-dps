import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import type { Result } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { WarningsToast } from "../../src/ui/layout/warnings-toast/WarningsToast"

const baseResult = runEngine(defaultInputs)

const qiEdgeWarning = {
  skillName: "Test Skill",
  edge: "start" as const,
  side: "before" as const,
  edgeSec: 10,
  offsetSec: 0.5,
  shareOfTotal: 0.05,
}

function resultWith(overrides: Partial<Result>): Result {
  return { ...baseResult, warnings: [], qiEdgeWarnings: [], ...overrides }
}

function toastTree(result: Result) {
  return (
    <I18nProvider>
      <WarningsToast result={result} />
    </I18nProvider>
  )
}

describe("WarningsToast", () => {
  it("renders nothing without warnings", () => {
    render(toastTree(resultWith({})))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows engine warnings and Qi-edge warnings", () => {
    render(
      toastTree(resultWith({ warnings: ["Something is off"], qiEdgeWarnings: [qiEdgeWarning] })),
    )

    const toast = screen.getByRole("status")
    expect(toast).toHaveTextContent("Something is off")
    expect(toast).toHaveTextContent("Test Skill lands 0.50 s before the Qi break starts at 10.00 s")
  })

  it("hides on close and stays hidden while the warnings are unchanged", () => {
    const { rerender } = render(toastTree(resultWith({ warnings: ["Something is off"] })))

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    rerender(toastTree(resultWith({ warnings: ["Something is off"] })))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows again when the set of warnings changes", () => {
    const { rerender } = render(toastTree(resultWith({ warnings: ["Something is off"] })))

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    rerender(toastTree(resultWith({ warnings: ["Something is off", "Something else"] })))

    expect(screen.getByRole("status")).toHaveTextContent("Something else")
  })

  it("shows again when the same warnings return after clearing", () => {
    const { rerender } = render(toastTree(resultWith({ warnings: ["Something is off"] })))

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    rerender(toastTree(resultWith({})))
    rerender(toastTree(resultWith({ warnings: ["Something is off"] })))

    expect(screen.getByRole("status")).toHaveTextContent("Something is off")
  })
})
