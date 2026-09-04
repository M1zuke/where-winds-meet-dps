import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { DisabledTalentPoints, Inputs } from "../../src/engine/types"
import type { TalentPointGroup } from "../../src/definitions/baseStats"
import { TALENT_POINT_GROUPS } from "../../src/definitions/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { TalentPointsTab } from "../../src/ui/features/talents/talent-points-tab/TalentPointsTab"

const MULTI_MEMBER_INDEX = TALENT_POINT_GROUPS.findIndex((group) => group.members.length > 1)
const MULTI_MEMBER = TALENT_POINT_GROUPS[MULTI_MEMBER_INDEX]

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

function cardFor(index: number): HTMLElement {
  return screen.getAllByLabelText("Disable one")[index].closest("div.panel") as HTMLElement
}

function allDisabled(group: TalentPointGroup): DisabledTalentPoints {
  const out: DisabledTalentPoints = {}
  for (const member of group.members) out[member.tier] = [...(out[member.tier] ?? []), member.id]
  return out
}

describe("TalentPointsTab", () => {
  it("renders one card per derived group rather than a hand-written list", () => {
    renderTab(defaultInputs)
    expect(screen.getAllByLabelText("Disable one")).toHaveLength(TALENT_POINT_GROUPS.length)
  })

  it("opens with every point of every group on", () => {
    renderTab(defaultInputs)
    for (const [index, group] of TALENT_POINT_GROUPS.entries()) {
      expect(within(cardFor(index)).getByText(String(group.members.length))).toBeTruthy()
    }
  })

  it("switches the last point of a group off", () => {
    const onChange = renderTab(defaultInputs)
    const last = MULTI_MEMBER.members[MULTI_MEMBER.members.length - 1]
    fireEvent.click(within(cardFor(MULTI_MEMBER_INDEX)).getByLabelText("Disable one"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ disabledTalentPoints: { [last.tier]: [last.id] } }),
    )
  })

  it("switches a point back on", () => {
    const member = MULTI_MEMBER.members[0]
    const onChange = renderTab({
      ...defaultInputs,
      disabledTalentPoints: { [member.tier]: [member.id] },
    })
    fireEvent.click(within(cardFor(MULTI_MEMBER_INDEX)).getByLabelText("Enable one more"))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ disabledTalentPoints: {} }))
  })

  it("stops the steppers at the ends of a group", () => {
    renderTab({ ...defaultInputs, disabledTalentPoints: allDisabled(MULTI_MEMBER) })
    const card = cardFor(MULTI_MEMBER_INDEX)
    expect(within(card).getByLabelText("Disable one")).toBeDisabled()
    expect(within(card).getByLabelText("Enable one more")).not.toBeDisabled()
    expect(within(card).getByText("0")).toBeTruthy()
  })

  it("scales the group total with the number of points left on", () => {
    const index = TALENT_POINT_GROUPS.findIndex((group) => group.stats[0] === "critRate")
    const group = TALENT_POINT_GROUPS[index]
    const perPoint = Math.round((group.effects.critRate ?? 0) * 1000) / 10
    renderTab(defaultInputs)
    expect(within(cardFor(index)).getByText(`+${perPoint * group.members.length}%`)).toBeTruthy()
  })
})
