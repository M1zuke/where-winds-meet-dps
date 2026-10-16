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

const noInnerWays: Inputs["mindMethods"] = [emptySlot, emptySlot, emptySlot, emptySlot]

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
const WITH_STANCE = [SKILL.swordq, SKILL.legionCrusher]

describe("Wushuang Stance changes Vagrant Sword's charge", () => {
  it("refuses every plain Vagrant Sword form while the stance is up", () => {
    for (const plainForm of [
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged2Hit,
      SKILL.swordHeavyChargedTier1,
    ]) {
      expect(run([...WITH_STANCE, plainForm]).invalidCount, plainForm).toBe(1)
    }
  })

  it("accepts the plain form again once the stance is gone", () => {
    expect(run([SKILL.swordq, SKILL.swordHeavyCharged]).invalidCount).toBe(0)
  })

  it("releases three waves from the stance form with Sword Morph", () => {
    const stance = run([...WITH_STANCE, SKILL.swordHeavyChargedWushuang])
    expect(stance.invalidCount).toBe(0)
    expect(stance.hitsOf(STANCE_FORM)).toBe(WAVES)
  })

  it("releases a single bolt from the stance form without Sword Morph", () => {
    const stance = run([...WITH_STANCE, SKILL.swordHeavyChargedWushuang], noInnerWays)
    expect(stance.invalidCount).toBe(0)
    expect(stance.hitsOf(STANCE_FORM)).toBe(1)
  })

  it("consumes the stance on the three-wave release but not on the single bolt", () => {
    const afterRelease = run([
      ...WITH_STANCE,
      SKILL.swordHeavyChargedWushuang,
      SKILL.swordHeavyChargedWushuang,
    ])
    expect(afterRelease.invalidCount).toBe(1)
    const keptBySingleBolt = run(
      [...WITH_STANCE, SKILL.swordHeavyChargedWushuang, SKILL.swordHeavyChargedWushuang],
      noInnerWays,
    )
    expect(keptBySingleBolt.invalidCount).toBe(0)
    expect(keptBySingleBolt.hitsOf(STANCE_FORM)).toBe(2)
  })

  it("spends the stance on the Deflect-cancelled second wave too", () => {
    const afterRelease = run([
      ...WITH_STANCE,
      SKILL.swordHeavyCharged2HitWushuang,
      SKILL.swordHeavyCharged2HitWushuang,
    ])
    expect(afterRelease.invalidCount).toBe(1)
  })

  it("flags the stance forms as illegal without the stance", () => {
    expect(run([SKILL.swordq, SKILL.swordHeavyChargedWushuang]).invalidCount).toBe(1)
    expect(run([SKILL.swordq, SKILL.swordHeavyCharged2HitWushuang]).invalidCount).toBe(1)
  })

  it("flags the stance second-wave form as illegal without Sword Morph", () => {
    expect(
      run([...WITH_STANCE, SKILL.swordHeavyCharged2HitWushuang], noInnerWays).invalidCount,
    ).toBe(1)
  })

  it("reaches the release 24.2 f earlier than the normal hold, with the same waves", () => {
    const normal = builtinSkill(CLASS, SKILL.swordHeavyCharged)
    const faster = builtinSkill(CLASS, SKILL.swordHeavyChargedWushuang)
    const releaseFrameOf = (skill: typeof normal) =>
      skill.hits.find((skillHit) => skillHit.physMultiplier === 0)!.frame
    expect(releaseFrameOf(normal) - releaseFrameOf(faster)).toBeCloseTo(24.2, 9)
    expect(faster.hits[0]!.variants![0]!.castFrames).toBeCloseTo(
      normal.hits[0]!.variants![0]!.castFrames! - 24.2,
      9,
    )
  })

  it("starts the charge 12.4 f in, releases on 60.4 f and lands the third wave 45.3 f later", () => {
    const stance = builtinSkill(CLASS, SKILL.swordHeavyChargedWushuang)
    const release = stance.hits[3]!.frame
    expect(release).toBe(60.4)
    expect(stance.hits[2]!.frame).toBeCloseTo(release + 45.3, 9)
    expect(stance.meterDrains![0]!.fromFrame).toBe(12.4)
  })

  it("launches the level-1 bolt 8.09 f after the first tier and ends the cast 24.8 f after it, keeping the stance", () => {
    const tierOne = builtinSkill(CLASS, SKILL.swordHeavyChargedTier1Wushuang)
    const firstTier = 12.4 + 22
    expect(tierOne.hits[0]!.frame).toBeCloseTo(firstTier + 8.09, 9)
    expect(tierOne.castFrames).toBeCloseTo(firstTier + 24.8, 9)
    expect(tierOne.meterDrains![0]!.fromFrame).toBe(12.4)
    const twice = run([
      ...WITH_STANCE,
      SKILL.swordHeavyChargedTier1Wushuang,
      SKILL.swordHeavyChargedTier1Wushuang,
    ])
    expect(twice.invalidCount).toBe(0)
    expect(twice.hitsOf("SwordHeavyCharged Tier 1 (Wushuang Stance)")).toBe(2)
  })

  it("flags the level-1 stance form as illegal without the stance", () => {
    expect(run([SKILL.swordq, SKILL.swordHeavyChargedTier1Wushuang]).invalidCount).toBe(1)
  })

  it("lands the second-wave form's waves where the three-wave form lands its first two", () => {
    const threeWave = builtinSkill(CLASS, SKILL.swordHeavyChargedWushuang)
    const twoWave = builtinSkill(CLASS, SKILL.swordHeavyCharged2HitWushuang)
    expect(twoWave.hits[0]!.frame).toBe(threeWave.hits[0]!.variants![0]!.frame)
    expect(twoWave.hits[1]!.frame).toBe(threeWave.hits[1]!.frame)
    expect(twoWave.castFrames).toBe(twoWave.hits[1]!.frame + 1)
  })

  it("flies every wave and bolt as a projectile", () => {
    for (const skillId of [
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyCharged2Hit,
      SKILL.swordHeavyChargedWushuang,
      SKILL.swordHeavyCharged2HitWushuang,
      SKILL.swordHeavyChargedTier1Wushuang,
    ]) {
      const waves = builtinSkill(CLASS, skillId).hits.filter(
        (skillHit) => skillHit.physMultiplier > 0 || skillHit.variants,
      )
      for (const wave of waves) expect(wave.projectile, skillId).toBeDefined()
    }
  })
})
