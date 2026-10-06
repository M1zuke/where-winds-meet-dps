import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../../src/data/skills/ids"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { swordChargeStage24Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-2-4-hit"
import { swordChargeStage25Hit } from "../../src/data/skills/bellstrike-umbra/sword-charge-stage-2-5-hit"
import { swordLight1 } from "../../src/data/skills/bellstrike-umbra/sword-light-1"
import { swordLight2 } from "../../src/data/skills/bellstrike-umbra/sword-light-2"
import { swordLight3 } from "../../src/data/skills/bellstrike-umbra/sword-light-3"
import { swordLight3EndsChain } from "../../src/data/skills/bellstrike-umbra/sword-light-3-ends-chain"
import { swordLight4 } from "../../src/data/skills/bellstrike-umbra/sword-light-4"
import { swordHeavy2 } from "../../src/data/skills/bellstrike-umbra/sword-heavy-2"
import { swordHeavy3 } from "../../src/data/skills/bellstrike-umbra/sword-heavy-3"
import { swordDash } from "../../src/data/skills/bellstrike-umbra/sword-dash"
import { spearLight1 } from "../../src/data/skills/bellstrike-umbra/spear-light-1"
import { spearLight2 } from "../../src/data/skills/bellstrike-umbra/spear-light-2"
import { spearLight3 } from "../../src/data/skills/bellstrike-umbra/spear-light-3"
import { spearLight4 } from "../../src/data/skills/bellstrike-umbra/spear-light-4"
import { spearHeavy1 } from "../../src/data/skills/bellstrike-umbra/spear-heavy-1"
import { spearHeavy2 } from "../../src/data/skills/bellstrike-umbra/spear-heavy-2"
import { spearHeavy3 } from "../../src/data/skills/bellstrike-umbra/spear-heavy-3"
import { spearDash } from "../../src/data/skills/bellstrike-umbra/spear-dash"
import { SECOND_TRACK_SLASH_STAGE_2_DRAIN } from "../../src/data/skills/bellstrike-umbra/buffs/secondTrackSlashEndurance"
import type { Skill } from "../../src/engine/skill"

const NEW_SKILLS: Skill[] = [
  swordChargeStage24Hit,
  swordChargeStage25Hit,
  swordLight1,
  swordLight2,
  swordLight3,
  swordLight3EndsChain,
  swordLight4,
  swordHeavy2,
  swordHeavy3,
  swordDash,
  spearLight1,
  spearLight2,
  spearLight3,
  spearLight4,
  spearHeavy1,
  spearHeavy2,
  spearHeavy3,
  spearDash,
]

const frames = (skill: Skill) => skill.hits.map((hit) => hit.frame)

describe("Bellstrike Umbra's basic-attack and stage-2 charge modules", () => {
  const classDef = classDefinition("bellstrikeUmbra")!

  it("are registered with their own cast tag and absent from every built-in rotation", () => {
    const registered = new Set(classDef.skills.map((skill) => skill.id))
    const castTags = new Set<string>()
    for (const skill of NEW_SKILLS) {
      expect(registered.has(skill.id), skill.id).toBe(true)
      expect(skill.castTag, skill.id).toBeTruthy()
      expect(castTags.has(skill.castTag!), skill.id).toBe(false)
      castTags.add(skill.castTag!)
    }
    const newIds = new Set(NEW_SKILLS.map((skill) => skill.id))
    for (const rotation of classDef.rotations) {
      for (const step of rotation.steps) {
        expect(newIds.has(step.skillId), `${rotation.id} ${step.skillId}`).toBe(false)
      }
    }
  })

  it("every hit lands inside its cast", () => {
    for (const skill of NEW_SKILLS) {
      for (const hit of skill.hits) {
        expect(hit.frame, `${skill.id} ${hit.id}`).toBeLessThan(skill.castFrames)
      }
    }
  })

  it("Second Track Slash stage 2 casts 207 f with five bleeding hits and the Charged attunement", () => {
    expect(swordChargeStage25Hit.castTag).toBe(CAST.swordChargeStage25Hit)
    expect(swordChargeStage25Hit.castFrames).toBe(207)
    expect(frames(swordChargeStage25Hit)).toEqual([91, 115, 125, 135, 193])
    expect(swordChargeStage25Hit.tags).toContain(ATTUNE.swordCharged)
    for (const hit of swordChargeStage25Hit.hits) {
      expect(hit.triggers).toEqual([
        expect.objectContaining({ kind: "applyDot", targetId: DEBUFF.bleedTick }),
      ])
    }
  })

  it("Second Track Slash stage 2's 4-hit form needs Sword Horizon and ends at 142 f", () => {
    expect(swordChargeStage24Hit.castFrames).toBe(142)
    expect(swordChargeStage24Hit.castConditions).toEqual([{ param: PARAM.swordHorizon }])
    expect(swordChargeStage24Hit.hits).toEqual(swordChargeStage25Hit.hits.slice(0, 4))
  })

  it("Second Track Slash stage 2 drains 14 per second for 1.2 s and falls back to stage 1", () => {
    expect(SECOND_TRACK_SLASH_STAGE_2_DRAIN).toEqual([
      expect.objectContaining({
        perSecond: 14,
        fromFrame: 12,
        stopAfterSec: 1.2,
        chargeRelease: { fallbackSkillId: SKILL.swordChargeStage15Hit },
      }),
    ])
  })

  it("sword light attacks carry the light tag, Swallowcall and 2.5 m reach", () => {
    for (const skill of [
      swordLight1,
      swordLight2,
      swordLight3,
      swordLight3EndsChain,
      swordLight4,
    ]) {
      expect(skill.tags, skill.id).toEqual([WEAPON.sword, ATTACK.light])
      expect(skill.receives, skill.id).toContain(BUFF.swallowcallLightAttackBoost)
      expect(skill.reachMeters, skill.id).toBe(2.5)
    }
    expect(
      [swordLight1, swordLight2, swordLight3, swordLight3EndsChain, swordLight4].map(frames),
    ).toEqual([[22], [12, 32], [8, 21], [8, 21, 34], [13]])
    expect(
      [swordLight1, swordLight2, swordLight3, swordLight3EndsChain, swordLight4].map(
        (skill) => skill.castFrames,
      ),
    ).toEqual([31, 36, 33, 35, 33])
  })

  it("the chained third step drops the hit that lands after its cast, the chain-ending one keeps it", () => {
    expect(swordLight3.hits).toHaveLength(2)
    expect(swordLight3EndsChain.hits.slice(0, 2)).toEqual(swordLight3.hits)
    expect(swordLight3EndsChain.hits[2].frame).toBeGreaterThanOrEqual(swordLight3.castFrames)
  })

  it("sword heavy attacks carry the heavy tag and 3 m reach", () => {
    expect(frames(swordHeavy2)).toEqual([10, 44])
    expect(frames(swordHeavy3)).toEqual([14, 48])
    expect([swordHeavy2.castFrames, swordHeavy3.castFrames]).toEqual([53, 73])
    for (const skill of [swordHeavy2, swordHeavy3]) {
      expect(skill.tags).toEqual([WEAPON.sword, ATTACK.heavy])
      expect(skill.reachMeters).toBe(3)
    }
  })

  it("sword dash hits at 8 and 26 f over 41 f", () => {
    expect(frames(swordDash)).toEqual([8, 26])
    expect(swordDash.castFrames).toBe(41)
    expect(swordDash.tags).toEqual([WEAPON.sword])
  })

  it("spear light attacks carry the light tag, Swallowcall and 4.5 m reach", () => {
    const chain = [spearLight1, spearLight2, spearLight3, spearLight4]
    for (const skill of chain) {
      expect(skill.tags, skill.id).toEqual([WEAPON.spear, ATTACK.light])
      expect(skill.receives, skill.id).toContain(BUFF.swallowcallLightAttackBoost)
      expect(skill.reachMeters, skill.id).toBe(4.5)
    }
    expect(chain.map(frames)).toEqual([[20], [14], [14, 31], [12, 23, 40]])
    expect(chain.map((skill) => skill.castFrames)).toEqual([27, 24, 42, 59])
  })

  it("spear heavy attacks carry the heavy tag, 5 m reach and no Soul-Shaken", () => {
    const chain: Skill[] = [spearHeavy1, spearHeavy2, spearHeavy3]
    expect(chain.map(frames)).toEqual([[43], [22], [59]])
    expect(chain.map((skill) => skill.castFrames)).toEqual([66, 43, 72])
    for (const skill of chain) {
      expect(skill.tags).toEqual([WEAPON.spear, ATTACK.heavy])
      expect(skill.reachMeters).toBe(5)
      expect(skill.triggersBuffs ?? []).toEqual([])
    }
  })

  it("spear dash hits at 20 f over 39 f", () => {
    expect(frames(spearDash)).toEqual([20])
    expect(spearDash.castFrames).toBe(39)
    expect(spearDash.tags).toEqual([WEAPON.spear])
  })
})
