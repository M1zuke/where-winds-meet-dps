import { describe, expect, it } from "vitest"
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic/index"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/mystic/ids"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"

describe("Drunken Fist Breakthrough reaches only the final strike's own hit", () => {
  it("every Drunken Poet strike triggers a stack", () => {
    const triggeringIds = MYSTIC_SKILLS.filter((skill) =>
      skill.triggersBuffs?.includes(BUFF.poetFinalStrikeStack),
    ).map((skill) => skill.id)
    expect(new Set(triggeringIds)).toEqual(
      new Set([SKILL.poet1, SKILL.poet2, SKILL.poet3, SKILL.poet4]),
    )
  })

  it("only the final strike receives the stack bonus, never its own explosion cast", () => {
    const receivingIds = MYSTIC_SKILLS.filter((skill) =>
      skill.receives?.includes(BUFF.poetFinalStrikeStack),
    ).map((skill) => skill.id)
    expect(receivingIds).toEqual([SKILL.poetFinalHitCancel])
    const explosion = MYSTIC_SKILLS.find((skill) => skill.id === SKILL.poetFinalHitCancelExplosion)!
    expect(explosion.receives ?? []).not.toContain(BUFF.poetFinalStrikeStack)
  })

  it("a strike's own two colliders grant one stack, not two", () => {
    const steps = [SKILL.poet1, SKILL.poet2].map((skillId) =>
      makeStep({ skillId: builtinSkill("bellstrikeUmbra", skillId).id }),
    )
    const rotation = makeRotation("bellstrikeUmbra", { name: "poet1+poet2", steps })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const casts = simulateTimeline(inputs).casts ?? []
    const poet2Cast = casts.find((cast) => cast.skillName === "Poet2")!
    const stack = poet2Cast.buffs.find((buff) => buff.name === "Drunken Fist Breakthrough")!
    expect(stack.stacks).toBe(2)
  })
})
