import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { TalentsTab } from "../../src/ui/features/talents/talents-tab/TalentsTab"
import { getDefaultTalentsForClass } from "../../src/definitions/baseStats"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const splendorWithBattleAnthem = (): Inputs => ({
  ...defaultInputs,
  classId: "bellstrikeSplendor",
  martialArtsTalents: getDefaultTalentsForClass("bellstrikeSplendor"),
  mindMethods: [
    { name: INNER_WAY_ID.battleAnthem, stacks: "tier 6" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
    { name: "", stacks: "" },
  ],
})

const renderTab = (inputs: Inputs) =>
  render(
    <I18nProvider>
      <TalentsTab inputs={inputs} />
    </I18nProvider>,
  )

describe("the Talents tab for a class with weapon columns", () => {
  it("heads one column per martial art", () => {
    renderTab(splendorWithBattleAnthem())
    expect(screen.getByText("Nameless Sword")).toBeTruthy()
    expect(screen.getByText("Nameless Spear")).toBeTruthy()
  })

  it("shows every talent the in-game panel does, on the weapon that grants it", () => {
    renderTab(splendorWithBattleAnthem())
    for (const card of [
      "Qi Struggle Enhancement",
      "Physical Attack UP",
      "Sword Qi Affinity",
      "Max Endurance UP",
      "Affinity Rate UP",
      "Affinity DMG UP",
    ]) {
      expect(screen.getByText(card), `${card} is missing`).toBeTruthy()
    }
    expect(screen.getAllByText("Bellstrike Attribute UP")).toHaveLength(2)
    expect(screen.getAllByText("Attr. Attack DMG UP")).toHaveLength(2)
  })

  // An inner way's buffs belong to the inner way, not to the class, so the
  // generic Class Buffs list they used to reach must not render here at all.
  it("keeps a slotted inner way's own buffs out", () => {
    renderTab(splendorWithBattleAnthem())
    expect(screen.queryByText("Class Buffs")).toBeNull()
    expect(screen.queryByText(/Battle Anthem/)).toBeNull()
  })
})
