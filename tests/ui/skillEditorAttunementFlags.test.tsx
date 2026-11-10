import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"
import { loadCustomSkillsForClass } from "../../src/storage"

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

const attuneTagsOfSaved = (): string[] =>
  (
    loadCustomSkillsForClass(CLASS_ID).find((skill) => skill.name === "UmbLightCharge")?.tags ?? []
  ).filter((tag) => tag.startsWith("attune:"))

describe("Skill Editor — a skill carrying two attunement tags", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("shows both tags and keeps the other one when one is changed", () => {
    renderSkillsTab()
    fireEvent.click(screen.getByText("UmbLightCharge"))
    expect(screen.getByDisplayValue("umbFrequentProjectile")).toBeInTheDocument()
    const charged = screen.getByDisplayValue("umbCharged")
    fireEvent.focus(charged)
    fireEvent.mouseDown(screen.getByRole("option", { name: "umbSpecial" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(attuneTagsOfSaved()).toEqual(["attune:umbFrequentProjectile", "attune:umbSpecial"])
  })

  it("keeps the other tag when one is cleared", () => {
    renderSkillsTab()
    fireEvent.click(screen.getByText("UmbLightCharge"))
    fireEvent.focus(screen.getByDisplayValue("umbFrequentProjectile"))
    fireEvent.mouseDown(screen.getAllByRole("option", { name: "None" })[0])
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(attuneTagsOfSaved()).toEqual(["attune:umbCharged"])
  })
})
