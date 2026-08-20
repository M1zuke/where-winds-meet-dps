import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"

const CLASS_ID = "stonesplitStrength"

describe("Skill Editor — gear-stat Receives rows show the gear-derived value", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("reads the boost off engineInputs, where gear words are folded in, not the raw inputs", () => {
    render(
      <I18nProvider>
        <ConfirmProvider>
          <SkillsTab
            inputs={{ ...defaultInputs, classId: CLASS_ID, modaoBoost: 0 }}
            engineInputs={{
              ...defaultInputs,
              classId: CLASS_ID,
              modaoBoost: 0.07,
              allMartialBoost: 0.032,
            }}
            customSkills={[]}
            onCustomSkillsChange={() => {}}
            customBuffs={[]}
            customDebuffs={[]}
          />
        </ConfirmProvider>
      </I18nProvider>,
    )
    fireEvent.click(screen.getByText("AnxiSoldierMoDown"))

    const modaoRow = screen.getByText("Art of Modao DMG Boost").parentElement!
    expect(modaoRow.textContent).toContain("+7.0% damage")
    const allMartialRow = screen.getByText("All Martial Boost").parentElement!
    expect(allMartialRow.textContent).toContain("+3.2% damage")
  })
})
