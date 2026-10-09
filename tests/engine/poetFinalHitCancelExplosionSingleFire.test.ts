// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"
import { poetFinalHitCancelExplosion } from "../../src/data/skills/mystic/poet-final-hit-cancel-explosion"

function rotationOf(classId: string, skillIds: string[]) {
  const steps = skillIds.map((skillId) => makeStep({ skillId: builtinSkill(classId, skillId).id }))
  return makeRotation(classId, { name: `test-${skillIds.join("+")}`, steps })
}

describe("a castSkill-triggered sub-cast still gates its own hits by their conditions", () => {
  it("Poet Final Hit[Cancel]'s explosion lands exactly once on a Combustion-only target, never both branches together", () => {
    const rotation = rotationOf("bellstrikeUmbra", [
      MYSTIC_SKILL.fireBreath1Hit,
      MYSTIC_SKILL.poet1,
      MYSTIC_SKILL.poet2,
      MYSTIC_SKILL.poet3,
      MYSTIC_SKILL.poet4,
      MYSTIC_SKILL.poetFinalHitCancel,
    ])
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    const explosionRow = result.perSkill.find((p) => p.name === poetFinalHitCancelExplosion.name)
    expect(explosionRow).toBeTruthy()
    expect(explosionRow!.count).toBe(1)
  })
})
