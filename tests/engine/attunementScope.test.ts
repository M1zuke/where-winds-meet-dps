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

const BLEED_BOOST = 0.2

function umbraInputs(dingYinByTag: Record<string, number> = {}): Inputs {
  return { ...defaultInputs, classId: "bellstrikeUmbra", dingYinByTag }
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
    const ctx = buildContext(umbraInputs({ "Bleed Boost": BLEED_BOOST }))
    expect(ctx.attuneBoostByTag).toEqual({ "attune:bleed": BLEED_BOOST })
  })

  it("multiplies a tagged art row by (1 + rolled), and leaves an untagged one alone", () => {
    const inputs = umbraInputs({ "Bleed Boost": BLEED_BOOST })
    const untagged = damageWith(undefined, inputs)
    expect(damageWith("attune:bleed", inputs)).toBeCloseTo(untagged * (1 + BLEED_BOOST), 6)
    expect(damageWith("attune:swordQ", inputs)).toBeCloseTo(untagged, 6)
  })

  it("contributes nothing when the stat is unrolled", () => {
    const inputs = umbraInputs()
    expect(damageWith("attune:bleed", inputs)).toBeCloseTo(damageWith(undefined, inputs), 6)
  })

  // The option's `classIds` is what gates this now — it replaced a
  // `classId === "bellstrikeUmbra"` branch in the timeline. `buildContext`
  // itself can no longer be driven by a foreign classId (only Bellstrike
  // Umbra is registered, and `getSchool` throws on anything else), so this
  // drives the same `classIds` gate `attuneBoostByTag` reads, directly.
  it("stays inert for a class the attunement cannot roll on", () => {
    const optionsForOtherClass = attunementsForClass("someOtherClass")
    expect(optionsForOtherClass.some((option) => option.affectsTag === "attune:bleed")).toBe(false)
  })
})

describe("attunement scope — the two entities that declare it", () => {
  const skills = builtinSkillsForClass("bellstrikeUmbra")
  const tagged = skills.filter((skill) => (skill.tags ?? []).includes("attune:bleed"))

  it("is exactly Bleed Detonation and Bleed Tick", () => {
    expect(tagged.map((skill) => skill.name).sort()).toEqual(["Bleed Detonation", "Bleed Tick"])
  })

  it("puts the tag on the art row the timeline builds", () => {
    for (const skill of tagged) {
      expect(hitToArtRow(skill.hits[0], skill).attuneTag).toBe("attune:bleed")
    }
  })

  it("shows up in the Skill Editor's Receives column for those skills only", () => {
    const inputs = umbraInputs({ "Bleed Boost": BLEED_BOOST })
    const rowsFor = (name: string) =>
      receivesForSkill(
        skills.find((skill) => skill.name === name)!,
        "bellstrikeUmbra",
        inputs,
      ).filter((row) => row.id === "attunement:bleedingDamage")

    expect(rowsFor("Bleed Detonation")).toHaveLength(1)
    expect(rowsFor("Bleed Detonation")[0].active).toBe(true)
    expect(rowsFor("SpearQ")).toHaveLength(0)
  })
})
