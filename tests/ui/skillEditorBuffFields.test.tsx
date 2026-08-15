import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"
import { loadCustomSkillsForClass } from "../../src/storage"

const CLASS_ID = "stonesplitStrength"

function fieldNamed(label: string): HTMLElement {
  return screen.getByText(label).closest("label, [role='group']")!
}

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

function selectAnxiSoldierMoDown() {
  fireEvent.click(screen.getByText("AnxiSoldierMoDown"))
}

function savedAnxiSoldierMoDown() {
  return loadCustomSkillsForClass(CLASS_ID).find((skill) => skill.name === "AnxiSoldierMoDown")!
}

describe("Skill Editor — Buffs Received / Buffs Triggered", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("shows a built-in's existing receives/triggersBuffs as chips by buff name, not id", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesField = fieldNamed("Buffs Received")
    expect(within(receivesField).getByText("Mountain Splitter")).toBeInTheDocument()
    expect(within(receivesField).getByText("Shattered Ridge (Max Stacks)")).toBeInTheDocument()
    expect(within(receivesField).queryByText("mountainSplitter")).not.toBeInTheDocument()

    const triggersField = fieldNamed("Buffs Triggered")
    expect(within(triggersField).getByText("Throat-Pierced")).toBeInTheDocument()
    expect(within(triggersField).getByText("Mountain Splitter")).toBeInTheDocument()
  })

  it("does not remove a chip when the field caption is clicked", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesField = fieldNamed("Buffs Received")
    fireEvent.click(within(receivesField).getByText("Buffs Received"))

    expect(within(receivesField).getByText("Mountain Splitter")).toBeInTheDocument()
    expect(within(receivesField).getByText("Shattered Ridge (Max Stacks)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().receives).toEqual(
      expect.arrayContaining(["mountainSplitter", "shatteredRidgeDeflect"]),
    )
  })

  it("offers only buffs with their own reach statement to add to Buffs Received", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesField = fieldNamed("Buffs Received")
    fireEvent.focus(within(receivesField).getByPlaceholderText("Add buff…"))
    expect(screen.getByRole("option", { name: "Frost-Clad Night (Snowbreak)" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Iron Guards" })).not.toBeInTheDocument()
  })

  it("adds a picked buff and writes its id through to the saved skill", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesField = fieldNamed("Buffs Received")
    fireEvent.focus(within(receivesField).getByPlaceholderText("Add buff…"))
    fireEvent.mouseDown(screen.getByRole("option", { name: "Frost-Clad Night (Snowbreak)" }))
    expect(within(receivesField).getByText("Frost-Clad Night (Snowbreak)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().receives).toEqual(
      expect.arrayContaining(["mountainSplitter", "shatteredRidgeDeflect", "frostCladSnowbreak"]),
    )
  })

  it("removes a chip and writes the shortened list through to the saved skill", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const triggersField = fieldNamed("Buffs Triggered")
    const chip = within(triggersField).getByText("Throat-Pierced")
    fireEvent.click(within(chip).getByRole("button", { name: "Remove" }))
    expect(within(triggersField).queryByText("Throat-Pierced")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().triggersBuffs).toEqual(["mountainSplitter"])
  })

  it("keeps an explicitly emptied list empty rather than re-populating it from legacy tags on reload", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesField = fieldNamed("Buffs Received")
    for (const name of ["Mountain Splitter", "Shattered Ridge (Max Stacks)"]) {
      const chip = within(receivesField).getByText(name)
      fireEvent.click(within(chip).getByRole("button", { name: "Remove" }))
    }
    expect(within(receivesField).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().receives).toEqual([])
  })
})
