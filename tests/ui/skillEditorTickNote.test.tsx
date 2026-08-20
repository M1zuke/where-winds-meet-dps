import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"

const CLASS_ID = "silkbindJade"

function renderSkillsTab() {
  render(
    <I18nProvider>
      <ConfirmProvider>
        <SkillsTab
          inputs={{ ...defaultInputs, classId: CLASS_ID }}
          engineInputs={{ ...defaultInputs, classId: CLASS_ID }}
          customSkills={[]}
          onCustomSkillsChange={() => {}}
          customBuffs={[]}
          customDebuffs={[]}
        />
      </ConfirmProvider>
    </I18nProvider>,
  )
}

describe("Skill Editor — a tick source states how many times its one hit lands", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("counts the drone's ticks under the per-hit damage preview", () => {
    renderSkillsTab()
    fireEvent.click(screen.getByText("UmbDrone[20hit] Tick"))

    expect(screen.getByText("× 20")).toBeInTheDocument()
  })

  it("counts Bitter Season's four ticks, not the five hits it used to author", () => {
    renderSkillsTab()
    fireEvent.click(screen.getByText("Bitter Season Tick"))

    expect(screen.getByText("× 4")).toBeInTheDocument()
  })

  it("shows the skill's own hit count, not a tick count, when it is not a tick source", () => {
    renderSkillsTab()
    fireEvent.click(screen.getByText("FanSpecial"))

    expect(screen.getByText("× 2")).toBeInTheDocument()
  })
})
