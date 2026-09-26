import { describe, expect, it } from "vitest"
import { formatConditions, statusTooltip } from "../../src/ui/features/skills/statusText"
import type { TriggerCondition } from "../../src/engine/skill"

const fakeT = (key: string, fallback?: string) => fallback ?? key

describe("formatConditions", () => {
  it("renders ≥ / > / = for each op", () => {
    const gte: TriggerCondition = { buffId: "bf-1", op: "gte", stacks: 1 }
    const gt: TriggerCondition = { buffId: "bf-1", op: "gt", stacks: 2 }
    const eq: TriggerCondition = { buffId: "bf-1", op: "eq", stacks: 0 }
    const nameOf = () => "Gate"
    expect(formatConditions([gte], nameOf, fakeT)).toBe("Gate ≥ 1")
    expect(formatConditions([gt], nameOf, fakeT)).toBe("Gate > 2")
    expect(formatConditions([eq], nameOf, fakeT)).toBe("Gate = 0")
  })

  it("joins multiple clauses with ' · '", () => {
    const conds: TriggerCondition[] = [
      { buffId: "bf-river-flow", op: "gte", stacks: 1 },
      { buffId: "bf-cooldown", op: "eq", stacks: 0 },
    ]
    const nameOf = (id: string) =>
      id === "bf-river-flow" ? "River Flow" : "Spear Special Cooldown"
    expect(formatConditions(conds, nameOf, fakeT)).toBe(
      "River Flow ≥ 1 · Spear Special Cooldown = 0",
    )
  })

  it("resolves names via the callback and falls back to the raw id when unknown", () => {
    const cond: TriggerCondition = { buffId: "bf-unknown", op: "gte", stacks: 1 }
    expect(formatConditions([cond], () => undefined, fakeT)).toBe("bf-unknown ≥ 1")
  })

  it("returns an empty string for an empty condition list", () => {
    expect(formatConditions([], () => "whatever", fakeT)).toBe("")
  })

  it("joins an anyOf clause's members with the translated joiner", () => {
    const cond: TriggerCondition = {
      anyOf: [
        { buffId: "bf-a", op: "gte", stacks: 1 },
        { buffId: "bf-b", op: "gte", stacks: 1 },
      ],
    }
    const nameOf = (id: string) => (id === "bf-a" ? "A" : "B")
    expect(formatConditions([cond], nameOf, fakeT)).toBe("(A ≥ 1 or B ≥ 1)")
  })

  it("renders a param condition's tier through the translated abbreviation", () => {
    const cond: TriggerCondition = { param: "someParam", minTier: 3 }
    expect(formatConditions([cond], () => undefined, fakeT)).toBe("Some Param T3+")
  })
})

describe("statusTooltip", () => {
  it("with a duration, contains the name, the formatted window, and 'remaining time' wording", () => {
    const tip = statusTooltip("Example Buff", fakeT, 1080)
    expect(tip).toContain("Example Buff")
    expect(tip).toContain("18.0s")
    expect(tip).toContain("remaining time")
  })

  it("with no duration, contains just the name", () => {
    expect(statusTooltip("River Flow", fakeT)).toBe("River Flow")
  })
})
