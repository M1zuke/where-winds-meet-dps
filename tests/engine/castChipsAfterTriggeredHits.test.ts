// Scoped to bellstrikeUmbra — TESTING.md § "Class scoping".
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { ZENITH_BAR_BUFF_ID } from "../../src/data/innerWays/swordHorizonZenith"
import type { Inputs, RotationCast } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function castsOf(skillIds: readonly string[]): RotationCast[] {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { name: "Sword Horizon", id: "swordHorizon", stacks: "tier 6" },
      ...defaultInputs.mindMethods.slice(1),
    ] as Inputs["mindMethods"],
    activeCustomRotation: makeRotation(CLASS, {
      name: "triggered-hit-chips",
      steps: skillIds.map((id) => makeStep({ skillId: builtinSkill(CLASS, id)!.id })),
      openingStacks: { [ZENITH_BAR_BUFF_ID]: 5 },
    }),
  }
  return simulateTimeline(inputs).casts ?? []
}

const zenithOn = (cast: RotationCast | undefined) =>
  cast?.buffs.find((buff) => buff.id === ZENITH_BAR_BUFF_ID)?.stacks

describe("a cast's chips include the hits its own trigger chain lands after the cast ends", () => {
  const casts = castsOf([
    SKILL.swordChargeStage14Hit,
    SKILL.spearq5HitCancel,
    SKILL.swordspecial4Hit,
    SKILL.spearq5HitCancel,
  ])
  const special = casts.find((cast) => cast.skillName === "SwordSpecial 4-Hit")

  it("counts both Blood Bursts of a SwordSpecial 4-Hit that detonates twice", () => {
    expect(zenithOn(special)).toBe(3)
  })
})
