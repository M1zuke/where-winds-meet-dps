import { describe, expect, it } from "vitest"
import { allowedInnerWaysForClass } from "../../src/engine/panel"
import { syncClassPermanent } from "../../src/ui/utils/classSetup"
import { blankInputs, defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

describe("allowedInnerWaysForClass", () => {
  it("is exactly the five Bellstrike Umbra inner ways, signature first", () => {
    expect(allowedInnerWaysForClass("bellstrikeUmbra")).toEqual([
      "Sword Horizon",
      "Wolfchaser's Art",
      "Insightful Strike",
      "Morale Chant",
      "Bitter Season",
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
    expect(next.mindMethods[0]).toEqual({ name: "Sword Horizon", stacks: "tier 6" })
  })

  it("clears slots 1-3 holding an inner way the new class doesn't allow", () => {
    const before = withSlots(defaultInputs, [
      "Forgotten River Echo",
      "Mud-Fish Heart",
      "Morale Chant",
      "Stone-Cutter",
    ])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[1]).toEqual({ name: "", stacks: "" })
    expect(next.mindMethods[2]).toEqual({ name: "Morale Chant", stacks: "tier 6" })
    expect(next.mindMethods[3]).toEqual({ name: "", stacks: "" })
  })

  it("keeps an inner way the new class does allow", () => {
    const before = withSlots(defaultInputs, ["", "Wolfchaser's Art", "Insightful Strike", ""])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[1].name).toBe("Wolfchaser's Art")
    expect(next.mindMethods[2].name).toBe("Insightful Strike")
  })

  it("clears a slot that duplicates the signature seeded into slot 0", () => {
    const before = withSlots(defaultInputs, ["", "Sword Horizon", "", ""])
    const next = syncClassPermanent(before, "bellstrikeUmbra")
    expect(next.mindMethods[0].name).toBe("Sword Horizon")
    expect(next.mindMethods[1]).toEqual({ name: "", stacks: "" })
  })

  it("leaves the loadout untouched when re-synced to the same class", () => {
    const once = syncClassPermanent(defaultInputs, "bamboocutWindTwinblade")
    const twice = syncClassPermanent(once, "bamboocutWindTwinblade")
    expect(twice.mindMethods).toEqual(once.mindMethods)
    expect(once.mindMethods).toEqual(defaultInputs.mindMethods)
  })

  it("replaces fresh-profile Bellstrike talents when Stonesplit Strength is selected", () => {
    const initialized = syncClassPermanent(blankInputs, blankInputs.classId)
    const next = syncClassPermanent(initialized, "stonesplitStrength")

    expect(initialized.martialArtsTalents[0].stat).toBe("affinityRate")
    expect(next.martialArtsTalents).toHaveLength(8)
    expect(next.martialArtsTalents[0].stat).toBe("critRate")
    expect(
      next.martialArtsTalents.every((talent) => talent.id.includes("stonesplitStrength")),
    ).toBe(true)
  })

  it("keeps edited talents when re-synced to the same class", () => {
    const initialized = syncClassPermanent(blankInputs, blankInputs.classId)
    const edited = {
      ...initialized,
      martialArtsTalents: initialized.martialArtsTalents.map((talent, index) =>
        index === 0 ? { ...talent, enabled: false } : talent,
      ),
    }

    const next = syncClassPermanent(edited, edited.classId)

    expect(next.martialArtsTalents).toEqual(edited.martialArtsTalents)
  })
})
