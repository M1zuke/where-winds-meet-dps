import { describe, expect, it, vi } from "vitest"
import { dotTickDamage, dotTickSkill } from "../../src/engine/dot"
import { builtinDebuff } from "../builtins"
import { DEBUFF } from "../../src/data/skills/mystic/ids"
import type { FormulaContext } from "../../src/engine/formula"

const CLASS_ID = "bellstrikeUmbra"
const toadPoison = builtinDebuff(CLASS_ID, DEBUFF.toadPoison)
const combustion = builtinDebuff(CLASS_ID, DEBUFF.combustion)

describe("a dot.directHit pulse behaves as a direct hit, not a DoT tick", () => {
  it("carries no isDotTick flag", () => {
    expect(dotTickSkill(toadPoison).isDotTick).toBe(false)
  })

  it("takes no DoT-only sustain routing", () => {
    const compute = vi.fn().mockReturnValue({ expectedDamage: 0 })
    dotTickDamage(toadPoison, {} as FormulaContext, compute)
    expect(compute.mock.calls[0][0].specialTag).toBeUndefined()
  })
})

describe("a dot without directHit still ticks as a DoT", () => {
  it("carries the isDotTick flag", () => {
    expect(dotTickSkill(combustion).isDotTick).toBe(true)
  })

  it("takes the sustain routing", () => {
    const compute = vi.fn().mockReturnValue({ expectedDamage: 0 })
    dotTickDamage(combustion, {} as FormulaContext, compute)
    expect(compute.mock.calls[0][0].specialTag).toBe("sustain")
  })
})
