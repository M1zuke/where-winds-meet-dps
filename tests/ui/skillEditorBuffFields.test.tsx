import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"
import { loadCustomSkillsForClass } from "../../src/storage"

const CLASS_ID = "stonesplitStrength"

function columnNamed(heading: string): HTMLElement {
  return screen.getByText(heading).parentElement!
}

function openInactiveReceives(receivesColumn: HTMLElement) {
  fireEvent.click(within(receivesColumn).getByText(/^Not in your current build/))
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

describe("Skill Editor — Effects: Triggers / Receives columns", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("shows a built-in's existing receives/triggersBuffs by buff name, not id", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    openInactiveReceives(receivesColumn)
    expect(within(receivesColumn).getByText("Mountain Splitter")).toBeInTheDocument()
    expect(within(receivesColumn).queryByText("mountainSplitter")).not.toBeInTheDocument()

    const triggersColumn = columnNamed("Triggers (this skill applies)")
    expect(within(triggersColumn).getByText("Throat-Pierced")).toBeInTheDocument()
    expect(within(triggersColumn).getByText("Mountain Splitter")).toBeInTheDocument()
  })

  it("renders a received buff the class itself owns under Spec Mechanics, not Receives", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const specColumn = columnNamed("Spec Mechanics")
    expect(within(specColumn).getByText("Shattered Ridge (Max Stacks)")).toBeInTheDocument()
    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    openInactiveReceives(receivesColumn)
    expect(
      within(receivesColumn).queryByText("Shattered Ridge (Max Stacks)"),
    ).not.toBeInTheDocument()
  })

  it("does not remove a row when its name or the column heading is clicked", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    fireEvent.click(within(receivesColumn).getByText("Receives (buffs affecting this skill)"))
    openInactiveReceives(receivesColumn)
    fireEvent.click(within(receivesColumn).getByText("Mountain Splitter"))

    expect(within(receivesColumn).getByText("Mountain Splitter")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("keeps Save disabled and unmarked until the draft actually changes", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(screen.queryByText(/unsaved/)).not.toBeInTheDocument()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    openInactiveReceives(receivesColumn)
    const row = within(receivesColumn).getByText("Mountain Splitter").closest("div")!
    fireEvent.click(within(row).getByRole("button", { name: "Remove" }))

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    expect(screen.getByText(/unsaved/)).toBeInTheDocument()
  })

  it("offers only buffs with their own reach statement to add to Receives", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    fireEvent.focus(within(receivesColumn).getByPlaceholderText("Add received buff…"))
    expect(screen.getByRole("option", { name: "Frost-Clad Night (Snowbreak)" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Iron Guards" })).not.toBeInTheDocument()
  })

  it("adds a picked buff and writes its id through to the saved skill", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    fireEvent.focus(within(receivesColumn).getByPlaceholderText("Add received buff…"))
    fireEvent.mouseDown(screen.getByRole("option", { name: "Frost-Clad Night (Snowbreak)" }))
    openInactiveReceives(receivesColumn)
    expect(within(receivesColumn).getByText("Frost-Clad Night (Snowbreak)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().receives).toEqual(
      expect.arrayContaining(["mountainSplitter", "shatteredRidgeDeflect", "frostCladSnowbreak"]),
    )
  })

  it("removes a row and writes the shortened list through to the saved skill", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const triggersColumn = columnNamed("Triggers (this skill applies)")
    const row = within(triggersColumn).getByText("Throat-Pierced").closest("div")!
    fireEvent.click(within(row).getByRole("button", { name: "Remove" }))
    expect(within(triggersColumn).queryByText("Throat-Pierced")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().triggersBuffs).toEqual(["mountainSplitter"])
  })

  it("keeps an explicitly removed entry gone rather than re-populating it from legacy tags on reload", () => {
    renderSkillsTab()
    selectAnxiSoldierMoDown()

    const receivesColumn = columnNamed("Receives (buffs affecting this skill)")
    openInactiveReceives(receivesColumn)
    const row = within(receivesColumn).getByText("Mountain Splitter").closest("div")!
    fireEvent.click(within(row).getByRole("button", { name: "Remove" }))
    expect(within(receivesColumn).queryByText("Mountain Splitter")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(savedAnxiSoldierMoDown().receives).toEqual(["shatteredRidgeDeflect"])
  })
})
