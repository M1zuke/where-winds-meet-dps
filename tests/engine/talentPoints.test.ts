import { describe, expect, it } from "vitest"
import {
  TALENT_POINT_GROUPS,
  enabledMembers,
  getConfiguredBase,
  groupTotals,
  isTalentPointEnabled,
  playerAttributes,
  stepValues,
  withTalentPointEnabled,
} from "../../src/definitions/baseStats"
import { TALENT_POINTS, TALENT_POINT_TIERS } from "../../src/data/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { DisabledTalentPoints, Inputs } from "../../src/engine/types"

const ALL_POINTS = TALENT_POINT_TIERS.flatMap((tier) =>
  TALENT_POINTS[tier].map((point) => ({ tier, point })),
)

const ATTRIBUTE_STATS = ["power", "agility", "momentum"]

function withDisabled(disabled: DisabledTalentPoints): Inputs {
  return { ...defaultInputs, disabledTalentPoints: disabled }
}

function groupFor(stat: string) {
  return TALENT_POINT_GROUPS.find((group) => group.stats[0] === stat)!
}

describe("talent point authoring", () => {
  it("merges only the primary-attribute triple into one point", () => {
    for (const { point } of ALL_POINTS) {
      const stats = Object.keys(point.effects)
      if (stats.length === 1) continue
      expect(stats.sort()).toEqual([...ATTRIBUTE_STATS].sort())
    }
  })

  it("keeps a min/max attack pair as two separate points", () => {
    for (const { point } of ALL_POINTS) {
      const stats = Object.keys(point.effects)
      expect(stats.includes("minPhys") && stats.includes("maxPhys")).toBe(false)
      expect(stats.includes("minFormless") && stats.includes("maxFormless")).toBe(false)
    }
  })
})

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

  it("gives a stat one group regardless of how much each of its points grants", () => {
    const phys = groupFor("minPhys")
    expect(phys.stats).toEqual(["minPhys"])
    expect(new Set(phys.members.map((member) => member.effects.minPhys)).size).toBeGreaterThan(1)
    expect(phys.members.length).toBe(
      ALL_POINTS.filter(({ point }) => "minPhys" in point.effects).length,
    )
  })

  it("groups a point by its stats, so a newly authored point needs no group list", () => {
    for (const { tier, point } of ALL_POINTS) {
      const stats = Object.keys(point.effects).sort().join("|")
      const group = TALENT_POINT_GROUPS.find((candidate) =>
        candidate.members.some((member) => member.tier === tier && member.id === point.id),
      )
      expect([...group!.stats].sort().join("|")).toBe(stats)
    }
  })

  it("orders a group's steps richest first", () => {
    for (const group of TALENT_POINT_GROUPS) {
      const stat = group.stats[0]
      const values = group.members.map((member) => member.effects[stat] ?? 0)
      expect(values).toEqual([...values].sort((left, right) => right - left))
    }
  })

  it("collapses a step label to one number when every stat of the point is equal", () => {
    const attributes = groupFor("power")
    expect(stepValues(attributes.members[0])).toEqual([1])
    expect(stepValues(groupFor("minPhys").members[0])).toHaveLength(1)
  })

  it("sums only the steps left on", () => {
    const phys = groupFor("minPhys")
    const full = phys.members.reduce((sum, member) => sum + (member.effects.minPhys ?? 0), 0)
    expect(groupTotals(phys, {}).minPhys).toBeCloseTo(full, 9)
    const first = phys.members[0]
    expect(groupTotals(phys, { [first.tier]: [first.id] }).minPhys).toBeCloseTo(
      full - (first.effects.minPhys ?? 0),
      9,
    )
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
    const group = groupFor("critRate")
    const member = group.members[0]
    const before = getConfiguredBase(withDisabled({}), [])
    const after = getConfiguredBase(withDisabled({ [member.tier]: [member.id] }), [])
    expect(after.critRate).toBeCloseTo(before.critRate - (member.effects.critRate ?? 0), 9)
  })

  it("takes only the min side down when a min-phys step goes off", () => {
    const member = groupFor("minPhys").members[0]
    const before = getConfiguredBase(withDisabled({}), [])
    const after = getConfiguredBase(withDisabled({ [member.tier]: [member.id] }), [])
    expect(before["phys.min"] - after["phys.min"]).toBeCloseTo(member.effects.minPhys ?? 0, 9)
    expect(after["phys.max"]).toBeCloseTo(before["phys.max"], 9)
  })

  it("carries an attribute point through the attribute conversion", () => {
    const member = groupFor("power").members[0]
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
  const member = { tier: "95.1", id: 1, effects: { critRate: 0.04 } }
  const other = { tier: "95.1", id: 2, effects: { critDamage: 0.05 } }

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
    const off = withTalentPointEnabled(withTalentPointEnabled({}, member, false), other, false)
    expect(off).toEqual({ "95.1": [1, 2] })
    expect(withTalentPointEnabled(off, member, true)).toEqual({ "95.1": [2] })
  })

  it("reports the group's remaining members after a toggle", () => {
    const group = TALENT_POINT_GROUPS[0]
    const off = withTalentPointEnabled({}, group.members[0], false)
    expect(enabledMembers(group, off)).toHaveLength(group.members.length - 1)
  })
})
