import { describe, expect, it } from "vitest"
import {
  evasiveCharge,
  EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE,
} from "../../src/data/innerWays/evasiveCharge"
import { EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS } from "../../src/data/skills/universal/buffs/evasiveChargeDodgeRefund"

describe("Evasive Charge", () => {
  it("cuts a dodge's Endurance cost by 20% from rank 3 up and not below", () => {
    expect(EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE.requiresMinTier).toBe(3)
    expect(EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE.meterModifiers).toEqual([
      expect.objectContaining({ kind: "cost", amount: -0.2 }),
    ])
    expect(evasiveCharge.gateBuffs).toContain(EVASIVE_CHARGE_DODGE_COST_REDUCTION_GATE)
  })

  it("refunds a dodge's cost with a 70% chance from rank 1 as one trigger without a rank floor", () => {
    expect(EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS).toHaveLength(1)
    const [refund] = EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS
    expect(refund!.refundFractionOfCastCost).toBe(0.7)
    expect(refund!.requiresMinTier).toBeUndefined()
  })
})
