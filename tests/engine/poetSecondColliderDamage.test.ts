// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"

function rotationOf(classId: string, skillIds: string[]) {
  const steps = skillIds.map((skillId) => makeStep({ skillId: builtinSkill(classId, skillId).id }))
  return makeRotation(classId, { name: `test-${skillIds.join("+")}`, steps })
}

function hitCountOf(inputs: Inputs, skillName: string): number {
  const result = simulateTimeline(inputs)
  return result.perSkill.find((p) => p.name === skillName)?.count ?? 0
}

describe("every Drunken Poet strike lands both its colliders", () => {
  it("Poet1 (no pre-existing aura) lands its two strike colliders and no explosion", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", [MYSTIC_SKILL.poet1]),
    }
    expect(hitCountOf(inputs, "Poet1")).toBe(2)
  })

  it("Poet2 on a Combustion-only target lands two strikes plus one Combustion explosion per collider", () => {
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotationOf("bellstrikeUmbra", [
        MYSTIC_SKILL.fireBreath1Hit,
        MYSTIC_SKILL.poet2,
      ]),
    }
    expect(hitCountOf(inputs, "Poet2")).toBe(4)
  })
})
