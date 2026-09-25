import { describe, expect, it } from "vitest"
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic/index"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/mystic/ids"

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
})
