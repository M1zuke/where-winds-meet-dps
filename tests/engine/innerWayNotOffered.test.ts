import { describe, expect, it } from "vitest"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { allowedInnerWaysForClass, withScoredInnerWays } from "../../src/engine/panel"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import type { Inputs } from "../../src/engine/types"

const heldButNotOffered = INNER_WAY_ID.battleAnthem

function withSlot(slot: Inputs["mindMethods"][number]): Inputs {
  return {
    ...defaultInputs,
    classId: "bellstrikeUmbra",
    mindMethods: [slot, emptyMindMethod, emptyMindMethod, emptyMindMethod] as Inputs["mindMethods"],
  }
}

describe("an inner way the class is not offered", () => {
  it("is not in the class's allowlist", () => {
    expect(allowedInnerWaysForClass("bellstrikeUmbra")).not.toContain(heldButNotOffered)
  })

  it("scores exactly like an empty slot", () => {
    const held = withSlot({ name: "", id: heldButNotOffered, stacks: "tier 6" })
    const empty = withSlot(emptyMindMethod)
    expect(runEngine(withDerivedStats(held)).dps).toBe(runEngine(withDerivedStats(empty)).dps)
  })

  it("stays on the inputs it was stored on", () => {
    const held = withSlot({ name: "", id: heldButNotOffered, stacks: "tier 6" })
    expect(withScoredInnerWays(held).mindMethods[0]).toEqual({ name: "", stacks: "" })
    expect(held.mindMethods[0]!.id).toBe(heldButNotOffered)
  })
})
