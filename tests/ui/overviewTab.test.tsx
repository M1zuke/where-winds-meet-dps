import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  CustomGraduationBuild,
  CustomGraduationSlot,
} from "../../src/engine/customGraduationBuild"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import { runEngine } from "../../src/engine/dps"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { OverviewTab } from "../../src/ui/features/overview/overview-tab/OverviewTab"

vi.mock("../../src/ui/hooks/useItemRanking", () => ({
  useItemRanking: () => ({ rows: [], isPending: false }),
}))

describe("the Overview tab", () => {
  it("no longer renders a set bonuses card or any set or arsenal choice", () => {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    render(
      <I18nProvider>
        <OverviewTab
          inputs={inputs}
          configuredInputs={inputs}
          engineInputs={inputs}
          onChange={() => {}}
          result={runEngine(inputs)}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("heading", { name: "Class & Breakthrough" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Set Bonuses" })).toBeNull()
    expect(screen.queryByRole("radio", { name: /Arsenal/ })).toBeNull()
  })

  it("leaves the Encounter Settings trigger to the header", () => {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    render(
      <I18nProvider>
        <OverviewTab
          inputs={inputs}
          configuredInputs={inputs}
          engineInputs={inputs}
          onChange={() => {}}
          result={runEngine(inputs)}
        />
      </I18nProvider>,
    )

    expect(screen.queryByRole("button", { name: /Encounter Settings/ })).toBeNull()
  })

  it("counts the wanted stat lines of a followed custom graduation build", () => {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
    const customBuild: CustomGraduationBuild = {
      id: "custom-build",
      name: "Custom build",
      classId: "bellstrikeUmbra",
      slots: [
        {
          slot: "helm",
          words: ["crit", "crit", "crit", "crit", "crit"] as CustomGraduationSlot["words"],
          attunement: "",
        },
      ],
      set: null,
      bowSet: null,
      arsenal: "general",
      rotationId: "none",
      createdAt: "",
      updatedAt: "",
    }
    const configuredInputs = {
      ...inputs,
      graduationBuildId: customBuild.id,
      customGraduationBuild: customBuild,
    }
    render(
      <I18nProvider>
        <OverviewTab
          inputs={{ ...inputs, graduationBuildId: customBuild.id }}
          configuredInputs={configuredInputs}
          engineInputs={configuredInputs}
          onChange={() => {}}
          result={runEngine(configuredInputs)}
        />
      </I18nProvider>,
    )

    const panel = screen
      .getByRole("heading", { name: "Equipped Stat Lines" })
      .closest(".panel") as HTMLElement
    expect(panel.querySelector(".panel-head-meta")?.textContent).toBe("0 / 5")
    expect(within(panel).getByRole("row", { name: /Critical/ })).toHaveTextContent("0 / 5")
  })
})

describe("the Sword Trial boss choice on the Overview tab", () => {
  function renderTab(patch: Partial<Inputs> = {}, onChange: (next: Inputs) => void = () => {}) {
    const inputs = { ...defaultInputs, classId: "bellstrikeUmbra", ...patch }
    render(
      <I18nProvider>
        <OverviewTab
          inputs={inputs}
          configuredInputs={inputs}
          engineInputs={inputs}
          onChange={onChange}
          result={runEngine(inputs)}
        />
      </I18nProvider>,
    )
  }

  it("renders the Sword Trial boss choice under the breakthrough", () => {
    renderTab()
    const breakthrough = screen.getByRole("combobox", { name: "Breakthrough" })
    const boss = screen.getByRole("combobox", { name: "Sword Trial Boss" })
    expect(boss).toHaveTextContent("River Master")
    expect(
      breakthrough.compareDocumentPosition(boss) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByText("Boss talent +15%")).toBeInTheDocument()
  })

  it("marks bosses above the breakthrough as locked", () => {
    renderTab({ breakthrough: 13 })
    fireEvent.click(screen.getByRole("combobox", { name: "Sword Trial Boss" }))
    expect(screen.getByRole("option", { name: /Lodestar Swordmaster/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    )
    expect(screen.getByRole("option", { name: /Sleeping Daoist/ })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    )
  })

  it("writes the chosen boss to the inputs", () => {
    const onChange = vi.fn()
    renderTab({ breakthrough: 13 }, onChange)
    fireEvent.click(screen.getByRole("combobox", { name: "Sword Trial Boss" }))
    fireEvent.mouseDown(screen.getByRole("option", { name: /Murong Yuan/ }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ swordTrialBoss: "murongYuan" }))
  })

  it("disables the boss choice in dummy mode and says the talents are off", () => {
    renderTab({ dummyMode: true })
    expect(screen.getByRole("combobox", { name: "Sword Trial Boss" })).toBeDisabled()
    expect(screen.getByText("Training dummy: boss talents do not apply")).toBeInTheDocument()
  })

  it("keeps a boss saved above the breakthrough and says what it is scored as", () => {
    renderTab({ breakthrough: 13, swordTrialBoss: "yeluAbuli" })
    expect(screen.getByRole("combobox", { name: "Sword Trial Boss" })).toHaveTextContent(
      "Yelu A'buli",
    )
    expect(screen.getByText("Not fought at BT 13: scored as River Master")).toBeInTheDocument()
  })
})
