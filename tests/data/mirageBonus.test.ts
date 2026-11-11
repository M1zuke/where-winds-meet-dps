import { describe, expect, it } from "vitest"
import { mirageBonus } from "../../src/data/skills/buffs/mirageBonus"

describe("mirageBonus", () => {
  it("raises HP damage and Qi damage by the same 15%", () => {
    expect(mirageBonus.effects).toEqual([
      { kind: "stat", statKey: "allDamageBoost", amount: 0.15 },
      { kind: "stat", statKey: "qiDamageBoost", amount: 0.15 },
    ])
  })
})
