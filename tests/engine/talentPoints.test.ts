import { describe, expect, it } from "vitest"
import {
  TALENT_POINT_GROUPS,
  enabledMembers,
  getConfiguredBase,
  groupTotals,
  isTalentPointEnabled,
  playerAttributes,
  withTalentPointEnabled,
} from "../../src/definitions/baseStats"
import { TALENT_POINTS, TALENT_POINT_TIERS } from "../../src/data/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { DisabledTalentPoints, Inputs } from "../../src/engine/types"

const ALL_POINTS = TALENT_POINT_TIERS.flatMap((tier) =>
  TALENT_POINTS[tier].map((point) => ({ tier, point })),
)

function withDisabled(disabled: DisabledTalentPoints): Inputs {
  return { ...defaultInputs, disabledTalentPoints: disabled }
}

describe("talent point grouping", () => {
  it("places every talent point in exactly one group", () => {
    const seen = new Set<string>()
    for (const group of TALENT_POINT_GROUPS) {
      for (const member of group.members) {
        const key = `${member.tier}:${member.id}`
        expect(seen.has(key), `${key} appears in two groups`).toBe(false)
        seen.add(key)
      }
    }
    expect(seen.size).toBe(ALL_POINTS.length)
  })

  it("gives every member of a group the same effects as the group", () => {
    for (const group of TALENT_POINT_GROUPS) {
      for (const member of group.members) {
        const point = TALENT_POINTS[member.tier as (typeof TALENT_POINT_TIERS)[number]].find(
          (candidate) => candidate.id === member.id,
        )
        expect(point?.effects).toEqual(group.effects)
      }
    }
  })

  it("groups a point by its effects, so a newly authored point needs no group list", () => {
    const attributeGroups = TALENT_POINT_GROUPS.filter((group) => group.stats.includes("power"))
    expect(attributeGroups).toHaveLength(1)
    expect(attributeGroups[0].stats).toEqual(["power", "agility", "momentum"])
    expect(attributeGroups[0].members.length).toBe(
      ALL_POINTS.filter(({ point }) => "power" in point.effects).length,
    )
  })

  it("scales a group's totals by the number of points left on", () => {
    const group = TALENT_POINT_GROUPS.find((candidate) => candidate.stats.length === 1)!
    const stat = group.stats[0]
    expect(groupTotals(group, 0)[stat]).toBe(0)
    expect(groupTotals(group, 3)[stat]).toBeCloseTo((group.effects[stat] ?? 0) * 3, 9)
  })
})

describe("switching a talent point off", () => {
  it("treats an empty record as every point on", () => {
    for (const { tier, point } of ALL_POINTS) {
      expect(isTalentPointEnabled({}, tier, point.id)).toBe(true)
    }
  })

  it("leaves the base untouched when nothing is disabled", () => {
    expect(getConfiguredBase(withDisabled({}), [])).toEqual(getConfiguredBase(defaultInputs, []))
  })

  it("lowers a rate on the configured base", () => {
    const group = TALENT_POINT_GROUPS.find((candidate) => candidate.stats[0] === "critRate")!
    const member = group.members[0]
    const before = getConfiguredBase(withDisabled({}), [])
    const after = getConfiguredBase(withDisabled({ [member.tier]: [member.id] }), [])
    expect(after.critRate).toBeCloseTo(before.critRate - (group.effects.critRate ?? 0), 9)
  })

  it("carries an attribute point through the attribute conversion", () => {
    const group = TALENT_POINT_GROUPS.find((candidate) => candidate.stats.includes("power"))!
    const member = group.members[0]
    const disabled = { [member.tier]: [member.id] }
    expect(playerAttributes(defaultInputs.breakthrough, disabled).power).toBe(
      playerAttributes(defaultInputs.breakthrough).power - 1,
    )
    const before = getConfiguredBase(withDisabled({}), [])
    const after = getConfiguredBase(withDisabled(disabled), [])
    expect(after["phys.max"]).toBeLessThan(before["phys.max"])
    expect(after.critRate).toBeLessThan(before.critRate)
  })

  it("ignores a stored id no tier defines", () => {
    const base = getConfiguredBase(withDisabled({ "95.1": [9999] }), [])
    expect(base).toEqual(getConfiguredBase(withDisabled({}), []))
  })
})

describe("withTalentPointEnabled", () => {
  const member = { tier: "95.1", id: 1 }

  it("returns a new record and never mutates the old one", () => {
    const before: DisabledTalentPoints = {}
    const after = withTalentPointEnabled(before, member, false)
    expect(before).toEqual({})
    expect(after).toEqual({ "95.1": [1] })
  })

  it("is idempotent in both directions", () => {
    const off = withTalentPointEnabled({}, member, false)
    expect(withTalentPointEnabled(off, member, false)).toEqual(off)
    const on = withTalentPointEnabled(off, member, true)
    expect(on).toEqual({})
    expect(withTalentPointEnabled(on, member, true)).toEqual({})
  })

  it("drops a tier once its last disabled id comes back on", () => {
    const off = withTalentPointEnabled(
      withTalentPointEnabled({}, member, false),
      {
        tier: "95.1",
        id: 2,
      },
      false,
    )
    expect(off).toEqual({ "95.1": [1, 2] })
    expect(withTalentPointEnabled(off, { tier: "95.1", id: 1 }, true)).toEqual({ "95.1": [2] })
  })

  it("reports the group's remaining members after a toggle", () => {
    const group = TALENT_POINT_GROUPS[0]
    const off = withTalentPointEnabled({}, group.members[0], false)
    expect(enabledMembers(group, off)).toHaveLength(group.members.length - 1)
  })
})
