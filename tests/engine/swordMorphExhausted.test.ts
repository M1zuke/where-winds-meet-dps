// Scoped to Bellstrike Splendor's sword energy attacks — see CLASSES.md
// § "Implemented classes"; these assert the Tier 3 outcome rules, not damage.
import { describe, expect, it } from "vitest"
import { swordMorphExhaustedBehavior } from "../../src/data/innerWays/swordMorphExhausted"
import { swordMorph } from "../../src/data/innerWays/swordMorph"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { BuildView, HitContext, HitInput, QiPhase } from "../../src/engine/behavior"
import type { Skill } from "../../src/engine/skill"

const vagrantSword = (): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === SKILL.swordHeavyCharged)!

const twoWaves = (): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find(
    (skill) => skill.id === SKILL.swordHeavyCharged2Hit,
  )!

const buildAt = (tier: number | null): BuildView => ({
  classId: "bellstrikeSplendor",
  innerWayTier: (name) => (name === swordMorph.id ? tier : null),
  classSpecificAttunement: () => 0,
  grantsMinPhysCritBoost: () => false,
})

const hitInput = (skill: Skill, index: number): HitInput =>
  ({ skill, hit: skill.hits[index]!, frame: 0, build: buildAt(6) }) as unknown as HitInput

const contextAt = (phase: QiPhase): HitContext => ({
  phase,
  qiBreakEnabled: true,
  smallPhys: 0,
  isEngineBuffActive: () => false,
})

describe("Sword Morph's Exhausted sword energy rules", () => {
  it("is absent until the tier that unlocks them", () => {
    expect(swordMorphExhaustedBehavior(buildAt(null))).toBeNull()
    expect(swordMorphExhaustedBehavior(buildAt(1))).toBeNull()
    expect(swordMorphExhaustedBehavior(buildAt(6))).not.toBeNull()
  })

  it("spares every wave from Abrasion against an Exhausted target", () => {
    const behavior = swordMorphExhaustedBehavior(buildAt(6))!
    const skill = vagrantSword()
    for (let index = 0; index < skill.hits.length; index++) {
      const art = behavior.buildArt(hitInput(skill, index), contextAt("exhausted"))
      expect(art.guaranteedPrecision, `wave ${index + 1}`).toBe(1)
    }
  })

  it("leaves Abrasion alone while the target still holds its Qi", () => {
    const behavior = swordMorphExhaustedBehavior(buildAt(6))!
    for (const phase of ["normal", "below30"] as const) {
      const art = behavior.buildArt(hitInput(vagrantSword(), 0), contextAt(phase))
      expect(art.guaranteedPrecision, phase).toBeUndefined()
    }
  })

  it("guarantees Affinity on the third wave alone", () => {
    const behavior = swordMorphExhaustedBehavior(buildAt(6))!
    const skill = vagrantSword()
    const forced = skill.hits.map((_, index) =>
      behavior.claimStatEffects(hitInput(skill, index), "exhausted"),
    )
    expect(forced[0]).toEqual([])
    expect(forced[1]).toEqual([])
    expect(forced[2]).toEqual([{ kind: "forceOutcome", outcome: "affinity" }])
  })

  it("forces nothing outside the break window", () => {
    const behavior = swordMorphExhaustedBehavior(buildAt(6))!
    expect(behavior.claimStatEffects(hitInput(vagrantSword(), 2), "below30")).toEqual([])
    expect(behavior.claimStatEffects(hitInput(vagrantSword(), 2), "normal")).toEqual([])
  })

  it("has no third wave to reach on the two-wave cast", () => {
    const behavior = swordMorphExhaustedBehavior(buildAt(6))!
    const skill = twoWaves()
    expect(skill.hits).toHaveLength(2)
    for (let index = 0; index < skill.hits.length; index++) {
      expect(behavior.claimStatEffects(hitInput(skill, index), "exhausted")).toEqual([])
    }
  })

  it("is registered against every sword energy cast", () => {
    expect(swordMorph.skillBehaviors?.map((entry) => entry.skillId)).toEqual([
      SKILL.swordHeavyCharged,
      SKILL.swordHeavyChargedPrepull,
      SKILL.swordHeavyCharged2Hit,
      SKILL.energySurge,
    ])
  })
})
