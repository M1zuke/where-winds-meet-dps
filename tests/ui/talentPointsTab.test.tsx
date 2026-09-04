import { fireEvent, render, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { DisabledTalentPoints, Inputs } from "../../src/engine/types"
import type { TalentPointGroup } from "../../src/definitions/baseStats"
import { TALENT_POINT_GROUPS } from "../../src/definitions/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { TalentPointsTab } from "../../src/ui/features/talents/talent-points-tab/TalentPointsTab"

const PHYS = TALENT_POINT_GROUPS.find((group) => group.stats[0] === "minPhys")!
const MAX_PHYS = TALENT_POINT_GROUPS.find((group) => group.stats[0] === "maxPhys")!

function renderTab(inputs: Inputs, onChange = vi.fn()) {
  render(
    <I18nProvider>
      <ConfirmProvider>
        <TalentPointsTab inputs={inputs} onChange={onChange} />
      </ConfirmProvider>
    </I18nProvider>,
  )
  return onChange
}

function cardFor(group: TalentPointGroup): HTMLElement {
  return document.querySelectorAll("div.panel")[TALENT_POINT_GROUPS.indexOf(group)] as HTMLElement
}

function pipsIn(card: HTMLElement): HTMLElement[] {
  return within(card)
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-pressed"))
}

function allDisabled(group: TalentPointGroup): DisabledTalentPoints {
  const out: DisabledTalentPoints = {}
  for (const member of group.members) out[member.tier] = [...(out[member.tier] ?? []), member.id]
  return out
}

describe("TalentPointsTab", () => {
  it("renders one card per derived group rather than a hand-written list", () => {
    renderTab(defaultInputs)
    expect(document.querySelectorAll("div.panel")).toHaveLength(TALENT_POINT_GROUPS.length)
  })

  it("gives every talent point of a group its own step", () => {
    renderTab(defaultInputs)
    for (const group of TALENT_POINT_GROUPS) {
      expect(pipsIn(cardFor(group))).toHaveLength(group.members.length)
    }
  })

  it("keeps min and max phys on separate cards", () => {
    renderTab(defaultInputs)
    expect(cardFor(PHYS)).not.toBe(cardFor(MAX_PHYS))
  })

  it("opens with every step on", () => {
    renderTab(defaultInputs)
    for (const pip of pipsIn(cardFor(PHYS))) {
      expect(pip).toHaveAttribute("aria-pressed", "true")
    }
    expect(within(cardFor(PHYS)).getByText(String(PHYS.members.length))).toBeTruthy()
  })

  it("switches the clicked point off and leaves its neighbours alone", () => {
    const onChange = renderTab(defaultInputs)
    const target = PHYS.members[1]
    fireEvent.click(pipsIn(cardFor(PHYS))[1])
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disabledTalentPoints: { [target.tier]: [target.id] } }),
    )
  })

  it("switches a point back on", () => {
    const member = PHYS.members[0]
    const onChange = renderTab({
      ...defaultInputs,
      disabledTalentPoints: { [member.tier]: [member.id] },
    })
    fireEvent.click(pipsIn(cardFor(PHYS))[0])
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ disabledTalentPoints: {} }))
  })

  it("takes the last point still on when the minus button is used", () => {
    const onChange = renderTab(defaultInputs)
    const last = PHYS.members[PHYS.members.length - 1]
    fireEvent.click(within(cardFor(PHYS)).getByLabelText("Disable one"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disabledTalentPoints: { [last.tier]: [last.id] } }),
    )
  })

  it("stops the steppers at the ends of a group", () => {
    renderTab({ ...defaultInputs, disabledTalentPoints: allDisabled(PHYS) })
    const card = cardFor(PHYS)
    expect(within(card).getByLabelText("Disable one")).toBeDisabled()
    expect(within(card).getByLabelText("Enable one more")).not.toBeDisabled()
  })

  it("sums only the steps left on", () => {
    const full = PHYS.members.reduce((sum, member) => sum + (member.effects.minPhys ?? 0), 0)
    renderTab(defaultInputs)
    expect(within(cardFor(PHYS)).getByText(`+${Math.round(full * 10) / 10}`)).toBeTruthy()
  })

  it("reads zero once every step of a group is off", () => {
    renderTab({ ...defaultInputs, disabledTalentPoints: allDisabled(PHYS) })
    const card = cardFor(PHYS)
    expect(within(card).getByText("+0")).toBeTruthy()
    for (const pip of pipsIn(card)) expect(pip).toHaveAttribute("aria-pressed", "false")
  })
})
