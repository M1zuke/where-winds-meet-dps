// The Skill Editor's Receives list is where a mechanic becomes visible without
// a def restating it. The last assertion is the one that matters most: the
// moment a def is minted for a mechanic's id, the engine applies that def on
// top of the mechanic, which is how Concentration came to be counted twice.
import { describe, expect, it } from "vitest"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { buffDefsForClass, allBuffDefsDeduped } from "../../src/engine/buffs/data"
import { classDefinition } from "../../src/definitions/classes/registry"
import { INNER_WAYS } from "../../src/definitions/innerWays/registry"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

const skill = classDefinition(CLASS)!.skills.find(
  (candidate) => candidate.name === "Sword Martial Q",
)!

function inputsWith(mindMethodName: string | null): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      mindMethodName ? { name: mindMethodName, stacks: "tier 6" } : { ...emptyMindMethod },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
      { ...emptyMindMethod },
    ],
  }
}

function concentrationRow(inputs: Inputs) {
  return receivesForSkill(skill, CLASS, inputs).find((row) => row.id === "concentration")
}

describe("mechanic catalog rows", () => {
  it("lists Concentration for a class that can slot Insightful Strike", () => {
    expect(concentrationRow(inputsWith("Insightful Strike"))!.name).toBe("Concentration (all)")
  })

  it("marks it active only once the inner way is actually slotted", () => {
    expect(concentrationRow(inputsWith("Insightful Strike"))!.active).toBe(true)
    expect(concentrationRow(inputsWith(null))!.active).toBe(false)
  })

  it("omits it for a class that cannot slot the inner way", () => {
    const stonesplit = "stonesplitStrength"
    const canSlot = classDefinition(stonesplit)!.allowedMindMethods.includes("insightfulStrike")
    expect(canSlot).toBe(false)
    const rows = receivesForSkill(classDefinition(stonesplit)!.skills[0], stonesplit, {
      ...defaultInputs,
      classId: stonesplit,
    })
    expect(rows.some((row) => row.id === "concentration")).toBe(false)
  })

  it("no buff def shares a mechanic's id — a def would be applied on top of it", () => {
    const mechanicIds = new Set(
      INNER_WAYS.flatMap((def) => def.mechanics ?? []).map(({ mechanic }) => mechanic.id),
    )
    const collisions = [...buffDefsForClass(CLASS), ...allBuffDefsDeduped()]
      .map((module) => module.id)
      .filter((id) => mechanicIds.has(id))
    expect(collisions).toEqual([])
  })
})
