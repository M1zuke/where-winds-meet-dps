import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  CustomGraduationBuild,
  CustomGraduationSlot,
} from "../../src/engine/customGraduationBuild"
import { defaultInputs } from "../../src/engine/defaults"
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
