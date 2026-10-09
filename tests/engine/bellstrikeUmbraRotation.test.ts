import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { swordq } from "../../src/data/skills/bellstrike-umbra/swordq"
import { swordqfollowup } from "../../src/data/skills/bellstrike-umbra/swordqfollowup"
import { swordqFollowUp1HitCancel } from "../../src/data/skills/bellstrike-umbra/swordq-follow-up-1-hit-cancel"
import { swordqFollowUp2HitCancel } from "../../src/data/skills/bellstrike-umbra/swordq-follow-up-2-hit-cancel"
import { swordspecial1Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-1-hit"
import { swordspecial2Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-2-hit"
import { swordspecial3Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-3-hit"
import { swordspecial4Hit } from "../../src/data/skills/bellstrike-umbra/swordspecial-4-hit"
import { swordMartialQqq } from "../../src/data/skills/bellstrike-umbra/sword-martial-qqq"
import { swordChargeStage11Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-1-hit"
import { swordChargeStage12Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-2-hit"
import { swordChargeStage13Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-3-hit"
import { swordChargeStage14Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-4-hit"
import { swordChargeStage15Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-1-5-hit"
import { swordRChargeFollowUp } from "../../src/data/skills/bellstrike-umbra/sword-r-charge-follow-up"
import { swordRChargeFollowUp1HitCancel } from "../../src/data/skills/bellstrike-umbra/sword-r-charge-follow-up-1-hit-cancel"
import { crosswindBlade } from "../../src/data/skills/bellstrike-umbra/crosswind-blade"
import { crosswindBladeCancel } from "../../src/data/skills/bellstrike-umbra/crosswind-blade-cancel"
import { spearheavy } from "../../src/data/skills/bellstrike-umbra/spearheavy"
import { spearheavy1Hit } from "../../src/data/skills/bellstrike-umbra/spearheavy-1-hit"
import { spearq } from "../../src/data/skills/bellstrike-umbra/spearq"
import { spearq5HitCancel } from "../../src/data/skills/bellstrike-umbra/spearq-5-hit-cancel"
import { spearspecial } from "../../src/data/skills/bellstrike-umbra/spearspecial"
import { spearspecial1HitCancel } from "../../src/data/skills/bellstrike-umbra/spearspecial-1-hit-cancel"
import { dragonFireSmolder1Hit } from "../../src/data/skills/mystic/dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "../../src/data/skills/mystic/dragon-fire-smolder-2-hits"
import { ATTUNE } from "../../src/data/skills/ids"
import type { SkillHit } from "../../src/engine/skill"

// Each form's own Sword Horizon variant ends its own cast at a different
// length, and a hit cut short straight into the follow-up gates on the next
// rotation step rather than on any of this comparison's own casts — both
// excluded from a hits-are-a-prefix comparison.
const withoutSituational = (hits: readonly SkillHit[]) =>
  hits.map(
    ({
      variants: _variants,
      requiresNextStepSkillIds: _requiresNextStepSkillIds,
      castFramesWhenGated: _castFramesWhenGated,
      ...rest
    }) => rest,
  )

const CLASS = "bellstrikeUmbra"

const RETIMED_SKILLS = [
  swordq,
  swordqfollowup,
  swordqFollowUp1HitCancel,
  swordqFollowUp2HitCancel,
  swordspecial1Hit,
  swordspecial2Hit,
  swordspecial3Hit,
  swordspecial4Hit,
  swordMartialQqq,
  swordChargeStage11Hit,
  swordChargeStage12Hit,
  swordChargeStage13Hit,
  swordChargeStage14Hit,
  swordChargeStage15Hit,
  swordRChargeFollowUp,
  swordRChargeFollowUp1HitCancel,
  crosswindBlade,
  crosswindBladeCancel,
  spearheavy,
  spearheavy1Hit,
  spearq,
  spearq5HitCancel,
  spearspecial,
  spearspecial1HitCancel,
  dragonFireSmolder1Hit,
  dragonFireSmolder2Hits,
]

describe("the built-in Bellstrike Umbra default rotation", () => {
  const classDef = classDefinition(CLASS)!

  it("every step resolves to a registered skill", () => {
    const rotation = classDef.rotations.find(
      (candidate) => candidate.id === classDef.defaultRotationId,
    )!
    const skillIds = new Set(classDef.skills.map((skill) => skill.id))
    for (const step of rotation.steps) {
      expect(skillIds.has(step.skillId), step.skillId).toBe(true)
    }
  })

  // A hit's own `castFramesWhenGated` is the cast length it actually lands
  // inside of — the skill's static `castFrames` is what an ungated cast of
  // the same skill keeps instead.
  const castLengthFor = (skill: (typeof RETIMED_SKILLS)[number], hit: SkillHit) =>
    hit.castFramesWhenGated ?? skill.castFrames

  it("every hit of a retimed module lands inside its cast", () => {
    for (const skill of RETIMED_SKILLS) {
      for (const hit of skill.hits) {
        expect(hit.frame, `${skill.id} ${hit.id}`).toBeLessThan(castLengthFor(skill, hit))
      }
    }
  })

  it("no retimed module has a hit on or past its own castFrames", () => {
    for (const skill of RETIMED_SKILLS) {
      for (const hit of skill.hits) {
        expect(hit.frame, `${skill.id} ${hit.id}`).toBeLessThan(castLengthFor(skill, hit))
      }
    }
  })
})

describe("a cancel form shares its full form's hits over a shorter cast", () => {
  it("Sword Martial QQ 1-Hit [Cancel] keeps only the first hit", () => {
    expect(withoutSituational(swordqFollowUp1HitCancel.hits)).toEqual(
      withoutSituational([swordqfollowup.hits[0]]),
    )
    expect(swordqFollowUp1HitCancel.castFrames).toBeLessThan(swordqfollowup.castFrames)
  })

  it("Sword Martial QQ 2-Hit [Cancel] keeps the first two hits", () => {
    expect(withoutSituational([swordqFollowUp2HitCancel.hits[0]])).toEqual(
      withoutSituational([swordqfollowup.hits[0]]),
    )
    expect(swordqFollowUp2HitCancel.castFrames).toBeLessThan(swordqfollowup.castFrames)
  })

  it("Sword R Charge - Follow Up 1-Hit[cancel] keeps only the first hit", () => {
    // The cancel form's own last hit carries the Endurance gain the full
    // form's true last hit (hit 1, not present here) carries instead.
    const [{ triggers: _triggers, ...cancelHit }] = swordRChargeFollowUp1HitCancel.hits
    const { triggers: _fullTriggers, ...fullHit } = swordRChargeFollowUp.hits[0]
    expect(cancelHit).toEqual(fullHit)
    expect(swordRChargeFollowUp1HitCancel.castFrames).toBeLessThan(swordRChargeFollowUp.castFrames)
  })

  it("Sword Charge Stage 1's five player-ended forms each keep the next one's hits, each over a shorter cast", () => {
    const chain = [
      swordChargeStage11Hit,
      swordChargeStage12Hit,
      swordChargeStage13Hit,
      swordChargeStage14Hit,
      swordChargeStage15Hit,
    ]
    for (let index = 0; index < chain.length - 1; index++) {
      const shorter = chain[index]
      const longer = chain[index + 1]
      expect(withoutSituational(shorter.hits)).toEqual(
        withoutSituational(longer.hits.slice(0, shorter.hits.length)),
      )
      expect(shorter.castFrames).toBeLessThan(longer.castFrames)
    }
  })

  it("SpearQ 5-Hit Cancel ends before SpearQ's own cast", () => {
    expect(spearq5HitCancel.castFrames).toBeLessThan(spearq.castFrames)
  })

  it("Spear Special (1 Hit Cancel) keeps Sweep All's Shattered Stone hit and its first damage hit, ending before its own cast", () => {
    // The cancel form's own copy of hit 1 carries its own cast-length
    // override on the River Flow variant, everything else shared.
    const [shatteredStone, sharedHit] = spearspecial.hits
    expect(spearspecial1HitCancel.hits).toEqual([
      shatteredStone,
      {
        ...sharedHit,
        variants: sharedHit.variants!.map((variant) =>
          variant.label === "River Flow" ? { ...variant, castFrames: 19 } : variant,
        ),
      },
    ])
    expect(spearspecial1HitCancel.castFrames).toBeLessThan(spearspecial.castFrames)
  })

  it("Crosswind Blade [cancel] keeps the full form's only hit, ending before its own cast", () => {
    expect(crosswindBladeCancel.hits).toEqual([crosswindBlade.hits[0]])
    expect(crosswindBladeCancel.castFrames).toBeLessThan(crosswindBlade.castFrames)
  })

  it("Crosswind Blade and its cancel form both reach the Special attunement", () => {
    expect(crosswindBlade.tags).toContain(ATTUNE.swordSpecial)
    expect(crosswindBladeCancel.tags).toContain(ATTUNE.swordSpecial)
  })

  it("SwordSpecial's four player-ended forms each keep the next one's hits, each over a shorter cast", () => {
    const chain = [swordspecial1Hit, swordspecial2Hit, swordspecial3Hit]
    for (let index = 0; index < chain.length - 1; index++) {
      const shorter = chain[index]
      const longer = chain[index + 1]
      expect(withoutSituational(shorter.hits)).toEqual(
        withoutSituational(longer.hits.slice(0, shorter.hits.length)),
      )
      expect(shorter.castFrames).toBeLessThan(longer.castFrames)
    }
    expect(swordspecial3Hit.castFrames).toBeLessThan(swordspecial4Hit.castFrames)
  })

  it("SwordSpecial 4-Hit's hit 3 matches the 3-Hit cancel's own hit 3 except for the companion-cast trigger", () => {
    const [hit0, hit1, hit2] = swordspecial4Hit.hits
    expect(withoutSituational([hit0, hit1])).toEqual(
      withoutSituational(swordspecial3Hit.hits.slice(0, 2)),
    )
    const [, , cancelHit2] = swordspecial3Hit.hits
    expect(hit2.triggers.slice(0, cancelHit2.triggers.length)).toEqual(cancelHit2.triggers)
    expect(hit2.triggers.length).toBe(cancelHit2.triggers.length + 1)
    expect(hit2.triggers.at(-1)!.kind).toBe("castSkill")
  })
})

describe("Sweep All lands a Shattered Stone hit and two damage hits, 42 frames apart", () => {
  it("Spear Special carries all three hits", () => {
    expect(spearspecial.hits).toHaveLength(3)
    const [, first, second] = spearspecial.hits
    expect(second.frame - first.frame).toBe(42)
  })

  it("the two damage hits' coefficients split 0.40 / 0.60 of the whole skill", () => {
    const [, first, second] = spearspecial.hits
    const total = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => first[field] + second[field]
    expect(first.physMultiplier / total("physMultiplier")).toBeCloseTo(0.4, 6)
    expect(second.physMultiplier / total("physMultiplier")).toBeCloseTo(0.6, 6)
  })
})
