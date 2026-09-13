import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { TalentsTab } from "../../src/ui/features/talents/talents-tab/TalentsTab"
import styles from "../../src/ui/features/talents/talents-tab/TalentsTab.module.scss"
import { getDefaultTalentsForClass } from "../../src/definitions/baseStats"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import {
  ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION,
  additionalAttackRankAt,
} from "../../src/data/skills/buffs/additionalAttackRanks"
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

describe("the stage attack line follows the breakthrough", () => {
  const umbraAt = (breakthrough: number): Inputs => ({
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    breakthrough,
    martialArtsTalents: getDefaultTalentsForClass("bellstrikeUmbra", breakthrough),
  })

  it("shows 98/196 at breakthrough 17", () => {
    renderTab(umbraAt(17))
    expect(screen.getAllByText(/\+98 min \/ \+196 max Bellstrike Attack \(always\)/)).toHaveLength(
      2,
    )
  })

  it("shows 106/212 at breakthrough 18", () => {
    renderTab(umbraAt(18))
    expect(screen.getAllByText(/\+106 min \/ \+212 max Bellstrike Attack \(always\)/)).toHaveLength(
      2,
    )
  })
})

describe("the Additional Attack Up talent card", () => {
  const umbraAt = (breakthrough: number): Inputs => ({
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    breakthrough,
    martialArtsTalents: getDefaultTalentsForClass("bellstrikeUmbra", breakthrough),
  })

  const bamboocutAt = (breakthrough: number): Inputs => ({
    ...defaultInputs,
    classId: "bamboocutDraught",
    breakthrough,
    martialArtsTalents: getDefaultTalentsForClass("bamboocutDraught", breakthrough),
  })

  const cardFor = (headingText: string) => {
    const column = within(
      screen.getByText(headingText).closest(`.${styles.classBuffsColumn}`) as HTMLElement,
    )
    return within(
      column.getByText("Additional Attack Up").closest(`.${styles.classBuffRow}`) as HTMLElement,
    )
  }

  it("renders below breakthrough 18 with the unlock note and rank-1 values in the note style, on every art column", () => {
    renderTab(umbraAt(17))
    const cards = screen.getAllByText("Additional Attack Up")
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      const cardRow = within(card.closest(`.${styles.classBuffRow}`) as HTMLElement)
      expect(cardRow.getByText(/Unlocks at breakthrough 18/)).toBeTruthy()
      const bonusAttackValue = cardRow.getByText(/\+7\.25%/)
      expect(bonusAttackValue.className).toBe(styles.classBuffNote)
    }
  })

  it("shows +7.25% bonus attack and +0.725% on the bleed coefficients at breakthrough 18", () => {
    renderTab(umbraAt(18))
    const strategicSword = cardFor("Strategic Sword")
    const bonusAttackValue = strategicSword.getByText(/\+7\.25%/)
    expect(bonusAttackValue.className).toBe(styles.classBuffEffect)
    expect(strategicSword.getByText(/\+0\.725%/)).toBeTruthy()
    expect(strategicSword.getByText(/Bleeding and Blood Burst coefficients/)).toBeTruthy()
  })

  it("shows only the bonus-attack line on Heavenquaker Spear at breakthrough 18", () => {
    renderTab(umbraAt(18))
    const heavenquakerSpear = cardFor("Heavenquaker Spear")
    expect(heavenquakerSpear.getByText(/\+7\.25%/)).toBeTruthy()
    expect(heavenquakerSpear.queryByText(/\+0\.725%/)).toBeNull()
  })

  it("shows +30% and +3% at breakthrough 21", () => {
    renderTab(umbraAt(21))
    const strategicSword = cardFor("Strategic Sword")
    expect(strategicSword.getByText(/\+30%/)).toBeTruthy()
    expect(strategicSword.getByText(/\+3%/)).toBeTruthy()
  })

  it("shows +30% and +3% with the Falcon's Pursuit target text at breakthrough 21, the highest tier the app carries today", () => {
    renderTab(bamboocutAt(21))
    const skystrikeGauntlets = cardFor("Skystrike Gauntlets")
    expect(skystrikeGauntlets.getByText(/\+30%/)).toBeTruthy()
    expect(skystrikeGauntlets.getByText(/\+3%/)).toBeTruthy()
    expect(skystrikeGauntlets.getByText(/Falcon's Pursuit coefficients/)).toBeTruthy()
  })

  it("resolves the six-rank ladder's breakthrough-23 values, ahead of the tier existing on any build", () => {
    const rank = additionalAttackRankAt(ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION, 23)
    expect(rank).toEqual({ breakthrough: 23, flatBonus: 0.5, coefficientBonus: 0.05 })
  })

  it("renders on both art columns of Stonesplit Strength, which has no other talent node modelled", () => {
    renderTab({
      ...defaultInputs,
      classId: "stonesplitStrength",
      martialArtsTalents: getDefaultTalentsForClass("stonesplitStrength"),
    })
    expect(screen.getByText("Phalanxbane Blade")).toBeTruthy()
    expect(screen.getByText("Snowparting Blade")).toBeTruthy()
    expect(screen.getAllByText("Additional Attack Up")).toHaveLength(2)
  })
})
