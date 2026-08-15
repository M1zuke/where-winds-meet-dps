// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { attunementsForClass } from "../../src/engine/attunements"
import { hitToArtRow } from "../../src/engine/skill"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const BLEED_BOOST = 0.2

function umbraInputs(classSpecificAttunement: Record<string, number> = {}): Inputs {
  return { ...defaultInputs, classId: "bellstrikeUmbra", classSpecificAttunement }
}

const ART = {
  name: "probe",
  physMultiplier: 1,
  attributeMultiplier: 1,
  skillType: "weapon",
} as Parameters<typeof computeSkillDamage>[0]

function damageWith(attuneTag: string | undefined, inputs: Inputs): number {
  const ctx = buildContext(inputs)
  return computeSkillDamage({ ...ART, attuneTag }, ctx, 1).expectedDamage
}

describe("attunement scope — the stat reaches only what declares the tag", () => {
  it("exposes the rolled stat under the tag its option declares", () => {
    const ctx = buildContext(umbraInputs({ bleedingDamage: BLEED_BOOST }))
    expect(ctx.attuneBoostByTag).toEqual({ "attune:bleed": BLEED_BOOST })
  })

  it("multiplies a tagged art row by (1 + rolled), and leaves an untagged one alone", () => {
    const inputs = umbraInputs({ bleedingDamage: BLEED_BOOST })
    const untagged = damageWith(undefined, inputs)
    expect(damageWith("attune:bleed", inputs)).toBeCloseTo(untagged * (1 + BLEED_BOOST), 6)
    expect(damageWith("attune:swordQ", inputs)).toBeCloseTo(untagged, 6)
  })

  it("contributes nothing when the stat is unrolled", () => {
    const inputs = umbraInputs()
    expect(damageWith("attune:bleed", inputs)).toBeCloseTo(damageWith(undefined, inputs), 6)
  })

  // The option's `classIds` is the gate. `buildContext` cannot be driven by a
  // foreign classId (only Bellstrike Umbra is registered, and `getSchool`
  // throws on anything else), so this drives that same gate directly.
  it("stays inert for a class the attunement cannot roll on", () => {
    const optionsForOtherClass = attunementsForClass("someOtherClass")
    expect(optionsForOtherClass.some((option) => option.affectsTag === "attune:bleed")).toBe(false)
  })
})

describe("attunement scope — the two entities that declare it", () => {
  const skills = builtinSkillsForClass("bellstrikeUmbra")
  const tagged = skills.filter((skill) => (skill.tags ?? []).includes("attune:bleed"))

  it("is exactly Bleed Tick and Blood Burst", () => {
    expect(tagged.map((skill) => skill.id).sort()).toEqual(
      [SKILL.bleedTick, SKILL.bleedDetonation].sort(),
    )
  })

  it("puts the tag on the art row the timeline builds", () => {
    for (const skill of tagged) {
      expect(hitToArtRow(skill.hits[0], skill).attuneTag).toBe("attune:bleed")
    }
  })

  it("shows up in the Skill Editor's Receives column for those skills only", () => {
    const inputs = umbraInputs({ bleedingDamage: BLEED_BOOST })
    const rowsFor = (skillId: string) =>
      receivesForSkill(builtinSkill("bellstrikeUmbra", skillId), "bellstrikeUmbra", inputs).filter(
        (row) => row.id === "attunement:bleedingDamage",
      )

    expect(rowsFor(SKILL.bleedDetonation)).toHaveLength(1)
    expect(rowsFor(SKILL.bleedDetonation)[0].active).toBe(true)
    expect(rowsFor(SKILL.spearq)).toHaveLength(0)
  })
})
