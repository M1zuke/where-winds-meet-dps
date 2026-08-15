import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { SetupWizard } from "../../src/ui/features/setup/setup-wizard/SetupWizard"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { blankInputs } from "../../src/engine/defaults"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import fixture from "./fixtures/dashboardRoleInfo.json"

const fixtureText = JSON.stringify(fixture)

function renderWizard(onFinish = vi.fn()) {
  render(
    <I18nProvider>
      <SetupWizard
        initialName="Fallback Name"
        initialInputs={blankInputs}
        mode="first-run"
        onFinish={onFinish}
      />
    </I18nProvider>,
  )
  return onFinish
}

describe("SetupWizard", () => {
  it("step 1 shows the class picker, and Next lands on the import step", () => {
    renderWizard()

    const otherClass = CLASS_DEFS().find((classDef) => classDef.id !== blankInputs.classId)!
    fireEvent.click(screen.getByRole("button", { name: new RegExp(otherClass.displayName) }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByPlaceholderText("Paste the copied gear JSON here")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "I'd rather do it manually" })).toBeInTheDocument()
  })

  it("the manual button leads to a name step, and finishing there reports the typed name and chosen class", () => {
    const onFinish = renderWizard()

    const otherClass = CLASS_DEFS().find((classDef) => classDef.id !== blankInputs.classId)!
    fireEvent.click(screen.getByRole("button", { name: new RegExp(otherClass.displayName) }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "I'd rather do it manually" }))

    fireEvent.change(screen.getByLabelText("Profile name"), {
      target: { value: "My Wanderer" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }))

    expect(onFinish).toHaveBeenCalledOnce()
    const [name, inputs] = onFinish.mock.calls[0]
    expect(name).toBe("My Wanderer")
    expect(inputs.classId).toBe(otherClass.id)
  })

  it("the finish button on the import step is disabled until a capture with importable pieces is pasted", () => {
    renderWizard()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("button", { name: "Finish setup" })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText("Paste the copied gear JSON here"), {
      target: { value: fixtureText },
    })

    expect(screen.getByRole("button", { name: "Finish setup" })).toBeEnabled()
  })

  it("pasting the fixture and finishing names the profile after the captured character, with each piece equipped", () => {
    const onFinish = renderWizard()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    fireEvent.change(screen.getByPlaceholderText("Paste the copied gear JSON here"), {
      target: { value: fixtureText },
    })
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }))

    expect(onFinish).toHaveBeenCalledOnce()
    const [name, inputs] = onFinish.mock.calls[0]
    expect(name).toBe("Testwanderer")
    expect(inputs.inventory.length).toBeGreaterThan(0)
    for (const piece of inputs.inventory) {
      expect(inputs.equipped[piece.slot]).toBe(piece.id)
    }
  })

  it("Back from the name step returns to the import step", () => {
    renderWizard()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "I'd rather do it manually" }))
    expect(screen.getByLabelText("Profile name")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Back" }))

    expect(screen.getByPlaceholderText("Paste the copied gear JSON here")).toBeInTheDocument()
    expect(screen.getByText("Step 2 / 2")).toBeInTheDocument()
  })
})
