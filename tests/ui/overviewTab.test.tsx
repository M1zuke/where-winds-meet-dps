import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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
})
