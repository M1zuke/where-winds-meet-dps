import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"

function openSkill(classId: string, skillName: string) {
  render(
    <I18nProvider>
      <ConfirmProvider>
        <SkillsTab
          inputs={{ ...defaultInputs, classId }}
          engineInputs={{ ...defaultInputs, classId }}
          customSkills={[]}
          onCustomSkillsChange={() => {}}
          customBuffs={[]}
          customDebuffs={[]}
        />
      </ConfirmProvider>
    </I18nProvider>,
  )
  fireEvent.click(screen.getByText(skillName))
}

describe("Skill Editor — every built-in trigger row names what it does", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("names the meter a meter-delta trigger moves", () => {
    openSkill("silkbindJade", "FanLightCharged")

    expect(screen.getByText(/^Endurance [+−]\d+$/)).toBeInTheDocument()
    expect(screen.queryByText("Select a target…")).not.toBeInTheDocument()
  })

  it("names an inner-way buff module an apply-buff trigger grants", () => {
    openSkill("silkbindJade", "FanSpecial")

    expect(screen.getByText("Thunder")).toBeInTheDocument()
    expect(screen.queryByText("Select a target…")).not.toBeInTheDocument()
  })

  it("names a bare cooldown group after the trigger its cooldown gates", () => {
    openSkill("bellstrikeUmbra", "SwordSpecial 1-Hit")

    expect(screen.getByText("Cuts cooldown of Endurance")).toBeInTheDocument()
    expect(screen.queryByText("Select a target…")).not.toBeInTheDocument()
  })

  it("names the status a clear-status trigger removes", () => {
    openSkill("stonesplitStrength", "SnowpartingVC")

    expect(screen.getByText("Clears Forgetfulness Cooldown")).toBeInTheDocument()
    expect(screen.queryByText("Select a target…")).not.toBeInTheDocument()
  })
})
