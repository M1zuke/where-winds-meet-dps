import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Result } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { MetricsCard } from "../../src/ui/layout/output-panel/OutputPanel"

const result: Result = {
  dps: 8642,
  totalDamage: 518520,
  rotationDuration: 60,
  castDuration: 60,
  graduationRate: 0.8642,
  perSkill: [],
  ranking: [],
  warnings: [],
}

describe("MetricsCard", () => {
  it("shows the graduation rate with its theoretical benchmark", () => {
    const onGraduationClick = vi.fn()
    render(
      <I18nProvider>
        <MetricsCard
          result={result}
          theoreticalDps={10000}
          graduationBuildName="Example Build"
          onGraduationClick={onGraduationClick}
        />
      </I18nProvider>,
    )

    expect(screen.getByText("8,642.00")).toBeInTheDocument()
    expect(screen.getByText("86.4%")).toBeInTheDocument()
    expect(screen.getByText("Graduation")).toBeInTheDocument()
    expect(screen.getByLabelText("Graduation: 86.4% · Example Build")).toHaveAttribute(
      "title",
      "Current DPS divided by the theoretical class maximum: 10,000.00 DPS",
    )
    fireEvent.click(screen.getByRole("button", { name: "Graduation: 86.4% · Example Build" }))
    expect(onGraduationClick).toHaveBeenCalledOnce()
  })

  it("names the followed graduation build on the card", () => {
    render(
      <I18nProvider>
        <MetricsCard result={result} graduationBuildName="Example Build" />
      </I18nProvider>,
    )

    const button = screen.getByRole("button", { name: "Graduation: 86.4% · Example Build" })
    const buildLabel = screen.getByText("Build")
    expect(button).toContainElement(buildLabel)
    expect(buildLabel.nextElementSibling).toHaveTextContent("Example Build")
  })

  it("asks for a build while none is followed", () => {
    render(
      <I18nProvider>
        <MetricsCard result={{ ...result, graduationRate: null }} />
      </I18nProvider>,
    )

    expect(
      screen.getByRole("button", { name: "Graduation: — · Choose a build" }),
    ).toHaveTextContent("Choose a build")
  })

  it("puts the graduation button last, after duration, labelled above its value", () => {
    render(
      <I18nProvider>
        <MetricsCard result={result} theoreticalDps={10000} graduationBuildName="Example Build" />
      </I18nProvider>,
    )

    const button = screen.getByRole("button", { name: "Graduation: 86.4% · Example Build" })
    const duration = screen.getByText("Duration")

    expect(duration.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(button.parentElement?.lastElementChild).toBe(button)

    const label = screen.getByText("Graduation")
    const value = screen.getByText("86.4%")
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("sets the graduation button on fire above a 94% rate", () => {
    render(
      <I18nProvider>
        <MetricsCard
          result={{ ...result, graduationRate: 0.95 }}
          graduationBuildName="Example Build"
        />
      </I18nProvider>,
    )

    const button = screen.getByRole("button", { name: "Graduation: 95.0% · Example Build" })
    expect(button.querySelector("canvas")).toHaveAttribute("aria-hidden", "true")
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("keeps the graduation button unlit at a 94% rate", () => {
    render(
      <I18nProvider>
        <MetricsCard
          result={{ ...result, graduationRate: 0.94 }}
          graduationBuildName="Example Build"
        />
      </I18nProvider>,
    )

    const button = screen.getByRole("button", { name: "Graduation: 94.0% · Example Build" })
    expect(button.querySelector("canvas")).toBeNull()
  })

  it("shows a pending placeholder before the first benchmark arrives", () => {
    render(
      <I18nProvider>
        <MetricsCard
          result={{ ...result, graduationRate: null }}
          graduationBuildName="Example Build"
          graduationPending
        />
      </I18nProvider>,
    )

    expect(screen.getByLabelText("Graduation: … · Example Build")).toBeInTheDocument()
  })
})
