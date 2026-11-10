import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { builtinSkill, testRotation } from "../builtins"

const CLASS = "bellstrikeUmbra"

function soberSorrowHitDamages(): { frame: number; damage: number }[] {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [{ name: "Wolfchaser's Art", stacks: "tier 6" }],
    activeCustomRotation: testRotation(CLASS, {
      name: "wine-gu",
      steps: [makeStep({ skillId: builtinSkill(CLASS, "bellstrikeUmbra-spearq").id })],
    }),
  })
  return (result.timeline ?? [])
    .filter((event) => event.kind === "hit")
    .map((event) => ({ frame: event.frame, damage: event.damage }))
}

describe("Wine Gu on Sober Sorrow", () => {
  it("is already paying on the third hit that completes the Wolf Chase Combo", () => {
    const hits = soberSorrowHitDamages()
    const damageAt = (frame: number) => hits.find((hit) => hit.frame === frame)!.damage
    expect(damageAt(45)).toBeGreaterThan(damageAt(31))
    expect(damageAt(45)).toBeCloseTo(damageAt(62), 6)
  })
})
