import { describe, expect, it } from "vitest"
import { poet2 } from "../../src/data/skills/mystic/poet2"
import { poet3 } from "../../src/data/skills/mystic/poet3"
import { poet4 } from "../../src/data/skills/mystic/poet4"
import { poetFinalHitCancelExplosion } from "../../src/data/skills/mystic/poet-final-hit-cancel-explosion"
import { DEBUFF } from "../../src/data/skills/mystic/ids"
import type { Skill } from "../../src/engine/skill"

const EXPLODING_SKILLS: readonly [string, Skill][] = [
  ["poet2", poet2],
  ["poet3", poet3],
  ["poet4", poet4],
  ["poet-final-hit-cancel (explosion)", poetFinalHitCancelExplosion],
]

describe("a Drunken Aura explosion prefers Smolder over Combustion", () => {
  it.each(EXPLODING_SKILLS)(
    "%s's Combustion explosion only fires with Smolder inactive",
    (_name, skill) => {
      const combustionHit = skill.hits.find((candidate) =>
        candidate.conditions?.some((condition) => condition.buffId === DEBUFF.combustion),
      )!
      expect(combustionHit.conditions).toContainEqual({
        buffId: DEBUFF.combustion,
        op: "gte",
        stacks: 1,
      })
      expect(combustionHit.conditions).toContainEqual({
        buffId: DEBUFF.smolder,
        op: "eq",
        stacks: 0,
      })
    },
  )

  it.each(EXPLODING_SKILLS)(
    "%s's Smolder explosion fires regardless of Combustion",
    (_name, skill) => {
      const smolderHit = skill.hits.find((candidate) =>
        candidate.conditions?.some(
          (condition) => condition.buffId === DEBUFF.smolder && condition.op === "gte",
        ),
      )!
      expect(smolderHit.conditions).toEqual([{ buffId: DEBUFF.smolder, op: "gte", stacks: 1 }])
    },
  )
})
