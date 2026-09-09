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
import { dragonFireSmolder1Hit } from "../../src/data/skills/bellstrike-umbra/dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "../../src/data/skills/bellstrike-umbra/dragon-fire-smolder-2-hits"

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

  it("every hit of a retimed module lands inside its cast", () => {
    for (const skill of RETIMED_SKILLS) {
      const maxHitFrame = Math.max(...skill.hits.map((hit) => hit.frame))
      expect(maxHitFrame, skill.id).toBeLessThan(skill.castFrames)
    }
  })

  it("no retimed module has a hit on or past its own castFrames", () => {
    for (const skill of RETIMED_SKILLS) {
      for (const hit of skill.hits) {
        expect(hit.frame, `${skill.id} ${hit.id}`).toBeLessThan(skill.castFrames)
      }
    }
  })
})

describe("a cancel form shares its full form's hits over a shorter cast", () => {
  it("Sword Martial QQ 1-Hit [Cancel] keeps only the first hit", () => {
    expect(swordqFollowUp1HitCancel.hits).toEqual([swordqfollowup.hits[0]])
    expect(swordqFollowUp1HitCancel.castFrames).toBeLessThan(swordqfollowup.castFrames)
  })

  it("Sword Martial QQ 2-Hit [Cancel] keeps the first two hits", () => {
    expect(swordqFollowUp2HitCancel.hits[0]).toEqual(swordqfollowup.hits[0])
    expect(swordqFollowUp2HitCancel.castFrames).toBeLessThan(swordqfollowup.castFrames)
  })

  it("Sword R Charge - Follow Up 1-Hit[cancel] keeps only the first hit", () => {
    expect(swordRChargeFollowUp1HitCancel.hits).toEqual([swordRChargeFollowUp.hits[0]])
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
      expect(shorter.hits).toEqual(longer.hits.slice(0, shorter.hits.length))
      expect(shorter.castFrames).toBeLessThan(longer.castFrames)
    }
  })

  it("SpearQ 5-Hit Cancel ends before SpearQ's own cast", () => {
    expect(spearq5HitCancel.castFrames).toBeLessThan(spearq.castFrames)
  })

  it("Spear Special (1 Hit Cancel) keeps Sweep All's first hit, ending before its own cast", () => {
    expect(spearspecial1HitCancel.hits).toEqual([spearspecial.hits[0]])
    expect(spearspecial1HitCancel.castFrames).toBeLessThan(spearspecial.castFrames)
  })

  it("Crosswind Blade [cancel] keeps the full form's only hit, ending before its own cast", () => {
    expect(crosswindBladeCancel.hits).toEqual([crosswindBlade.hits[0]])
    expect(crosswindBladeCancel.castFrames).toBeLessThan(crosswindBlade.castFrames)
  })

  it("SwordSpecial's four player-ended forms each keep the next one's hits, each over a shorter cast", () => {
    const chain = [swordspecial1Hit, swordspecial2Hit, swordspecial3Hit, swordspecial4Hit]
    for (let index = 0; index < chain.length - 1; index++) {
      const shorter = chain[index]
      const longer = chain[index + 1]
      expect(shorter.hits).toEqual(longer.hits.slice(0, shorter.hits.length))
      expect(shorter.castFrames).toBeLessThan(longer.castFrames)
    }
  })
})

describe("Sweep All lands two hits", () => {
  it("Spear Special carries both hits, 42 frames apart", () => {
    expect(spearspecial.hits).toHaveLength(2)
    expect(spearspecial.hits[1].frame - spearspecial.hits[0].frame).toBe(42)
  })

  it("the two hits' coefficients split 0.40 / 0.60 of the whole skill", () => {
    const [first, second] = spearspecial.hits
    const total = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => first[field] + second[field]
    expect(first.physMultiplier / total("physMultiplier")).toBeCloseTo(0.4, 6)
    expect(second.physMultiplier / total("physMultiplier")).toBeCloseTo(0.6, 6)
  })
})
