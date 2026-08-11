import { describe, expect, it } from "vitest"
import { allowedInnerWaysForClass } from "../../src/engine/panel"
import { syncClassPermanent } from "../../src/ui/utils/classSetup"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

describe("allowedInnerWaysForClass", () => {
  it("is exactly the five Bellstrike Umbra inner ways, signature first", () => {
    expect(allowedInnerWaysForClass("bellstrikeUmbra")).toEqual([
      "swordHorizon",
      "wolfchasersArt",
      "insightfulStrike",
      "moraleChant",
      "bitterSeason",
    ])
  })

  it("folds the class signature in exactly once", () => {
    for (const classId of ["bellstrikeUmbra", "bamboocutWindTwinblade", "silkbindJade"]) {
      const list = allowedInnerWaysForClass(classId)
      expect(new Set(list).size).toBe(list.length)
    }
  })

  it("returns an empty list for an unknown classId instead of throwing", () => {
    expect(allowedInnerWaysForClass("notAClass")).toEqual([])
  })
})

describe("syncClassPermanent — inner-way slots on a class switch", () => {
  function withSlots(inputs: Inputs, names: string[]): Inputs {
    return {
      ...inputs,
      mindMethods: names.map((name) => ({
        name,
        stacks: name ? "tier 6" : "",
      })) as Inputs["mindMethods"],
    }
  }

  it("seeds slot 0 with the new class's signature", () => {
    const next = syncClassPermanent(defaultInputs, "bellstrikeUmbra")
    expect(next.mindMethods[0]).toEqual({ name: "swordHorizon", stacks: "tier 6" })
  })

  // Only Bellstrike Umbra is loadable — `syncClassPermanent` throws via
  // `getSchool` on any other id (CLAUDE.md § "Implemented classes") — so this
  // drives the clearing logic with a name outside Umbra's own allowed set
  // rather than a foreign class's inner way.
  it("clears slots holding an inner way the class doesn't allow", () => {
    const before = withSlots(defaultInputs, [
      "",
      "notARealInnerWay",
      "moraleChant",
      "insightfulStrike",
    ])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[1]).toEqual({ name: "", stacks: "" })
    expect(next.mindMethods[2]).toEqual({ name: "moraleChant", stacks: "tier 6" })
    expect(next.mindMethods[3].name).toBe("insightfulStrike")
  })

  it("keeps an inner way the new class does allow", () => {
    const before = withSlots(defaultInputs, ["", "wolfchasersArt", "insightfulStrike", ""])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[1].name).toBe("wolfchasersArt")
    expect(next.mindMethods[2].name).toBe("insightfulStrike")
  })

  it("clears a slot that duplicates the signature seeded into slot 0", () => {
    const before = withSlots(defaultInputs, ["", "swordHorizon", "", ""])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[0].name).toBe("swordHorizon")
    expect(next.mindMethods[1]).toEqual({ name: "", stacks: "" })
  })

  it("leaves the loadout untouched when re-synced to the same class", () => {
    const once = syncClassPermanent(defaultInputs, "bellstrikeUmbra")
    const twice = syncClassPermanent(once, "bellstrikeUmbra")
    expect(twice.mindMethods).toEqual(once.mindMethods)
  })
})
