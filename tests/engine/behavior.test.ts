import { describe, expect, it } from "vitest"
import { DEFAULT_BEHAVIOR, behaviorFor, registerSkillBehavior } from "../../src/engine/behavior"
import type { HitInput } from "../../src/engine/behavior"
import { StatusLedger } from "../../src/engine/ledger"
import { makeHit, makeSkill, newVariantId } from "../../src/engine/skill"
import type { Skill, SkillHit } from "../../src/engine/skill"

const build = {
  classId: "bellstrikeUmbra",
  set: null,
  innerWayTier: () => null,
  dingYin: () => 0,
}

function inputFor(skill: Skill, hit: SkillHit, holds = () => false): HitInput {
  return {
    skill,
    hit,
    frame: 0,
    statuses: new StatusLedger(0, 600),
    build,
    holds,
  }
}

describe("DEFAULT_BEHAVIOR — data-driven, what every skill gets", () => {
  it("builds the art row from the hit and the skill", () => {
    const hit = makeHit({ physMultiplier: 2, attributeMultiplier: 3 })
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Probe",
      hits: [hit],
      weaponOrAttribute: "Sword",
      tags: ["attune:bleed"],
    })
    const art = DEFAULT_BEHAVIOR.buildArt(inputFor(skill, hit))
    expect(art.physMultiplier).toBe(2)
    expect(art.weaponOrAttribute).toBe("Sword")
    expect(art.attuneTag).toBe("attune:bleed")
  })

  it("swaps in a variant's coefficients when its conditions hold, and not otherwise", () => {
    const variant = {
      id: newVariantId(),
      label: "empowered",
      conditions: [{ buffId: "gate", op: "gte" as const, stacks: 1 }],
      physMultiplier: 9,
      attributeMultiplier: 8,
      physFixed: 7,
      attributeFixed: 6,
    }
    const hit = makeHit({ physMultiplier: 2, attributeMultiplier: 3, variants: [variant] })
    const skill = makeSkill("bellstrikeUmbra", { name: "Probe", hits: [hit] })

    expect(DEFAULT_BEHAVIOR.buildArt(inputFor(skill, hit, () => false)).physMultiplier).toBe(2)
    expect(DEFAULT_BEHAVIOR.buildArt(inputFor(skill, hit, () => true)).physMultiplier).toBe(9)
  })
})

describe("behaviorFor — opt-in per skill", () => {
  it("returns the default until a skill registers its own", () => {
    const skill = makeSkill("bellstrikeUmbra", { name: "Probe" })
    expect(behaviorFor(skill)).toBe(DEFAULT_BEHAVIOR)

    const own = { ...DEFAULT_BEHAVIOR, buildArt: () => ({ name: "override" }) }
    registerSkillBehavior(skill.id, own)
    expect(behaviorFor(skill)).toBe(own)

    const other = makeSkill("bellstrikeUmbra", { name: "Other" })
    expect(behaviorFor(other)).toBe(DEFAULT_BEHAVIOR)
  })
})
