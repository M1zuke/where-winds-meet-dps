import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { builtinSkill } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeSplendor"
const WAVES = 3
const emptySlot = { name: "", stacks: "" }

const swordMorphTier3: Inputs["mindMethods"] = [
  { name: "Sword Morph", stacks: "tier 3" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function run(skillIds: string[], mindMethods = swordMorphTier3) {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: makeRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
    set: null,
  })
  return {
    invalidCount: (result.invalidStepIds ?? []).length,
    hitsOf: (name: string) => result.perSkill.find((row) => row.name === name)?.count ?? 0,
  }
}

const STANCE_FORM = "SwordHeavyCharged (Wushuang Stance)"

describe("Wushuang Stance enables Vagrant Sword's three-wave release", () => {
  it("releases three waves from a plain press while the stance is up", () => {
    const withStance = run([SKILL.swordq, SKILL.legionCrusher, SKILL.swordHeavyCharged])
    const withoutStance = run([SKILL.swordq, SKILL.swordHeavyCharged])
    expect(withStance.hitsOf("SwordHeavyCharged")).toBe(WAVES)
    expect(withoutStance.hitsOf("SwordHeavyCharged")).toBe(1)
  })

  it("consumes the stance on the three-wave release but not on the single bolt", () => {
    const afterRelease = run([
      SKILL.swordq,
      SKILL.legionCrusher,
      SKILL.swordHeavyChargedWushuang,
      SKILL.swordHeavyCharged,
    ])
    expect(afterRelease.hitsOf(STANCE_FORM)).toBe(WAVES)
    expect(afterRelease.hitsOf("SwordHeavyCharged")).toBe(1)
  })

  it("flags the faster charge form as illegal without the stance or without Sword Morph", () => {
    expect(run([SKILL.swordq, SKILL.swordHeavyChargedWushuang]).invalidCount).toBe(1)
    const noSwordMorph = run(
      [SKILL.swordq, SKILL.legionCrusher, SKILL.swordHeavyChargedWushuang],
      [emptySlot, emptySlot, emptySlot, emptySlot],
    )
    expect(noSwordMorph.invalidCount).toBe(1)
  })

  it("reaches the release 24 f earlier than the normal hold, with the same waves", () => {
    const normal = builtinSkill(CLASS, SKILL.swordHeavyCharged)
    const faster = builtinSkill(CLASS, SKILL.swordHeavyChargedWushuang)
    const releaseFrameOf = (skill: typeof normal) =>
      skill.hits.find((skillHit) => skillHit.physMultiplier === 0)!.frame
    expect(releaseFrameOf(normal) - releaseFrameOf(faster)).toBe(24)
    expect(faster.castFrames).toBe(normal.hits[0]!.variants![0]!.castFrames! - 24)
  })
})
