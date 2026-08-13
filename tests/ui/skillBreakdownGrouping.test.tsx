import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Result, SkillTickResult } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { PerSkillTable } from "../../src/ui/layout/output-panel/OutputPanel"
import { RotationBreakdownPanel } from "../../src/ui/features/rotation/rotation-breakdown-panel/RotationBreakdownPanel"
import { groupByBreakdownName } from "../../src/ui/utils/skillBreakdown"

function row(patch: Partial<SkillTickResult>): SkillTickResult {
  return {
    name: "Variant",
    breakdownName: "Variant",
    type: "weapon",
    count: 1,
    expectedDamage: 100,
    percentOfTotal: 0.1,
    castCount: 1,
    castTimeSec: 1,
    dpsOfCastTime: 100,
    ...patch,
  }
}

function resultWith(perSkill: SkillTickResult[]): Result {
  return {
    dps: 0,
    totalDamage: 0,
    rotationDuration: 0,
    graduationRate: null,
    perSkill,
    ranking: [],
    warnings: [],
  }
}

describe("grouping the breakdown by breakdown name", () => {
  it("sums hits, cast time, damage and share of every row sharing one breakdown name", () => {
    const grouped = groupByBreakdownName([
      row({ name: "Skill 3-Hit", breakdownName: "In-Game Skill", count: 3, expectedDamage: 300 }),
      row({ name: "Skill 4-Hit", breakdownName: "In-Game Skill", count: 4, expectedDamage: 400 }),
    ])

    expect(grouped).toHaveLength(1)
    expect(grouped[0]).toMatchObject({
      name: "In-Game Skill",
      count: 7,
      castTimeSec: 2,
      expectedDamage: 700,
      percentOfTotal: 0.2,
    })
  })

  it("derives the group's cast-time DPS from the summed damage and summed cast time", () => {
    const grouped = groupByBreakdownName([
      row({ breakdownName: "In-Game Skill", expectedDamage: 300, castTimeSec: 2 }),
      row({ breakdownName: "In-Game Skill", expectedDamage: 900, castTimeSec: 4 }),
    ])

    expect(grouped[0].dpsOfCastTime).toBe(200)
  })

  it("keeps rows apart when their breakdown names differ, ordered by damage", () => {
    const grouped = groupByBreakdownName([
      row({ name: "Weak", breakdownName: "Weak Skill", expectedDamage: 100 }),
      row({ name: "Strong", breakdownName: "Strong Skill", expectedDamage: 900 }),
    ])

    expect(grouped.map((groupedRow) => groupedRow.name)).toEqual(["Strong Skill", "Weak Skill"])
  })

  it("falls back to the skill name when the breakdown name is missing or blank", () => {
    const grouped = groupByBreakdownName([
      row({ name: "Named Skill", breakdownName: "" }),
      row({ name: "Whitespace Skill", breakdownName: "   " }),
      row({ name: "Undefined Skill", breakdownName: undefined as unknown as string }),
    ])

    expect(grouped.map((groupedRow) => groupedRow.name).sort()).toEqual([
      "Named Skill",
      "Undefined Skill",
      "Whitespace Skill",
    ])
  })

  it("shows one row per breakdown name in both breakdown tables", () => {
    const result = resultWith([
      row({ name: "Skill 3-Hit", breakdownName: "In-Game Skill", expectedDamage: 300 }),
      row({ name: "Skill 4-Hit", breakdownName: "In-Game Skill", expectedDamage: 400 }),
    ])

    const { unmount } = render(
      <I18nProvider>
        <PerSkillTable result={result} />
      </I18nProvider>,
    )
    expect(screen.getByText("In-Game Skill")).toBeInTheDocument()
    expect(screen.queryByText("Skill 3-Hit")).not.toBeInTheDocument()
    expect(screen.queryByText("Skill 4-Hit")).not.toBeInTheDocument()
    unmount()

    render(
      <I18nProvider>
        <RotationBreakdownPanel result={result} />
      </I18nProvider>,
    )
    expect(screen.getByText("In-Game Skill")).toBeInTheDocument()
    expect(screen.queryByText("Skill 3-Hit")).not.toBeInTheDocument()
    expect(screen.queryByText("Skill 4-Hit")).not.toBeInTheDocument()
  })
})
