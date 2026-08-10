import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { defaultInputs } from "../../src/engine/defaults"

import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes"). `defaultInputs` itself is a bellstrikeUmbra build.
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

const LEVEL_100_BONUS = 150

function baseInputs(classId: string): Inputs {
  return {
    ...umbraInputs,
    classId,
    set: null,
    allMartialBoost: 0,
    phys: { min: 977.23, max: 0, penetration: 0.411 },
    bellstrike: { min: 274, max: 687.63, penetration: 0.18 },
    dingYinByTag: {},
    mindMethods: [
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
    buffParams: { swordHorizon: false },
  }
}

describe("level-based attribute-attack bonus (ju) on Bleed Detonation", () => {
  it("adds exactly +150 bellstrike min/max to a single Bleed Detonation hit (bellstrikeUmbra)", () => {
    const hit = makeHit({ frame: 0, physMultiplier: 2.4, attributeMultiplier: 3.6 })
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Bleed Detonation",
      // The bonus follows the declared role, not the name — a skill merely
      // called "Bleed Detonation" no longer inherits the mechanic.
      tags: ["role:bleedDetonation"],
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      castFrames: 60,
      hits: [hit],
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [makeStep({ skillId: skill.id, hitCount: 1 })],
    })
    const inputs: Inputs = {
      ...baseInputs("bellstrikeUmbra"),
      customSkills: [skill],
      activeCustomRotation: rotation,
    }

    const result = simulateTimeline(inputs)
    const detonation = result.perSkill.find((p) => p.name === "Bleed Detonation")
    expect(detonation).toBeTruthy()

    const art = {
      name: "Bleed Detonation",
      physMultiplier: 2.4,
      attributeMultiplier: 3.6,
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      specialTag: "sustain",
    }
    const withoutBonus = computeSkillDamage(art as never, buildContext(inputs), 1).expectedDamage
    const withBonus = computeSkillDamage(
      art as never,
      buildContext({
        ...inputs,
        bellstrike: {
          min: inputs.bellstrike.min + LEVEL_100_BONUS,
          max: inputs.bellstrike.max + LEVEL_100_BONUS,
          penetration: inputs.bellstrike.penetration,
        },
      }),
      1,
    ).expectedDamage

    expect(detonation!.expectedDamage).toBeCloseTo(withBonus, 6)
    expect(withBonus).toBeGreaterThan(withoutBonus)
  })

  it("does not apply to a same-class skill with a different name", () => {
    const hit = makeHit({ frame: 0, physMultiplier: 2.4, attributeMultiplier: 3.6 })
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Some Other Skill",
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      castFrames: 60,
      hits: [hit],
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [makeStep({ skillId: skill.id, hitCount: 1 })],
    })
    const inputs: Inputs = {
      ...baseInputs("bellstrikeUmbra"),
      customSkills: [skill],
      activeCustomRotation: rotation,
    }

    const result = simulateTimeline(inputs)
    const row = result.perSkill.find((p) => p.name === "Some Other Skill")!
    const art = {
      name: "Some Other Skill",
      physMultiplier: 2.4,
      attributeMultiplier: 3.6,
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bellstrike",
      specialTag: "sustain",
    }
    const withoutBonus = computeSkillDamage(art as never, buildContext(inputs), 1).expectedDamage
    expect(row.expectedDamage).toBeCloseTo(withoutBonus, 6)
  })

  // The bonus is gated on the class, not the skill name: the same
  // "Bleed Detonation" skill must NOT pick it up under any other classId.
  it("does not apply to a Bleed Detonation-named skill on a non-bellstrikeUmbra class", () => {
    const OTHER = "bamboocutWindTwinblade"
    const hit = makeHit({ frame: 0, physMultiplier: 2.4, attributeMultiplier: 3.6 })
    const skill = makeSkill(OTHER, {
      name: "Bleed Detonation",
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bamboocut",
      castFrames: 60,
      hits: [hit],
    })
    const rotation = makeRotation(OTHER, { steps: [makeStep({ skillId: skill.id, hitCount: 1 })] })
    const inputs: Inputs = {
      ...baseInputs(OTHER),
      customSkills: [skill],
      activeCustomRotation: rotation,
    }

    const result = simulateTimeline(inputs)
    const row = result.perSkill.find((p) => p.name === "Bleed Detonation")!
    const art = {
      name: "Bleed Detonation",
      physMultiplier: 2.4,
      attributeMultiplier: 3.6,
      skillType: "sustain",
      weaponOrAttribute: "Sword",
      attributeAttack: "Bamboocut",
      specialTag: "sustain",
    }
    const withoutBonus = computeSkillDamage(art as never, buildContext(inputs), 1).expectedDamage
    expect(row.expectedDamage).toBeCloseTo(withoutBonus, 6)
  })
})
