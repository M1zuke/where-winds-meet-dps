import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { SkillsTab } from "../../src/ui/features/skills/skills-tab/SkillsTab"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { artLevelRows } from "../../src/definitions/skills/levelRowsDef"
import { levelScaled } from "../../src/definitions/skills/skillDef"
import { saveCustomSkill } from "../../src/storage"

const CLASS_ID = "bellstrikeUmbra"

const firstRows = artLevelRows({
  90: { physMultiplier: 1.1, attributeMultiplier: 1.65, physFixed: 111, attributeFixed: 61 },
  100: { physMultiplier: 1.3, attributeMultiplier: 1.95, physFixed: 222, attributeFixed: 122 },
})
const secondRows = artLevelRows({
  90: { physMultiplier: 0.5, attributeMultiplier: 0.75, physFixed: 333, attributeFixed: 33 },
  100: { physMultiplier: 0.6, attributeMultiplier: 0.9, physFixed: 444, attributeFixed: 44 },
})

function renderEditor(skill: Skill, onChange: (skills: Skill[]) => void = () => {}) {
  saveCustomSkill(skill)
  const inputs = { ...defaultInputs, classId: CLASS_ID, breakthrough: 13 }
  render(
    <I18nProvider>
      <ConfirmProvider>
        <SkillsTab
          inputs={inputs}
          engineInputs={inputs}
          customSkills={[skill]}
          onCustomSkillsChange={onChange}
          customBuffs={[]}
          customDebuffs={[]}
        />
      </ConfirmProvider>
    </I18nProvider>,
  )
  fireEvent.click(screen.getByText(skill.name))
}

describe("Skill Editor — a level-scaled row follows the breakthrough", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  const skill = makeSkill(CLASS_ID, {
    name: "Level Probe Strike",
    hits: [
      makeHit({ frame: 0, ...levelScaled(firstRows) }),
      makeHit({ frame: 10, ...levelScaled(secondRows) }),
    ],
  })

  it("shows the value of the selected breakthrough, not the authored top row", () => {
    renderEditor(skill)
    expect(screen.getByDisplayValue("111")).toBeInTheDocument()
    expect(screen.getByDisplayValue("333")).toBeInTheDocument()
    expect(screen.queryByDisplayValue("222")).toBeNull()
    expect(screen.getAllByText(/Art level 90/)).toHaveLength(2)
  })

  it("fixes only the edited row at the value shown and keeps its neighbour's rows", () => {
    let saved: Skill[] = []
    renderEditor(skill, (next) => {
      saved = next
    })
    fireEvent.change(screen.getByDisplayValue("111"), { target: { value: "150" } })
    fireEvent.click(screen.getByText("Save"))

    const stored = saved.find((entry) => entry.id === skill.id)!
    expect(stored.hits[0].levelRows).toBeUndefined()
    expect(stored.hits[0]).toMatchObject({
      physFixed: 150,
      physMultiplier: 1.1,
      attributeMultiplier: 1.65,
      attributeFixed: 61,
    })
    expect(stored.hits[1].levelRows).toEqual(secondRows)
    expect(stored.hits[1].physFixed).toBe(444)
  })
})
