import { describe, expect, it } from "vitest"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

const lastHitFrame = (skillId: string) => {
  const hits = builtinSkill(CLASS, skillId).hits
  return hits[hits.length - 1]!.frame
}

describe("Drifting Thrust casts for its hold plus its release animation", () => {
  it.each([
    [SKILL.spearheavy1Hit, 68],
    [SKILL.spearheavyStage1, 173],
    [SKILL.spearheavy, 302],
  ])("%s casts %i frames", (skillId, castFrames) => {
    expect(builtinSkill(CLASS, skillId).castFrames).toBe(castFrames)
  })

  it.each([SKILL.spearheavy1Hit, SKILL.spearheavyStage1, SKILL.spearheavy])(
    "%s ends after its last hit",
    (skillId) => {
      expect(lastHitFrame(skillId)).toBeLessThan(builtinSkill(CLASS, skillId).castFrames)
    },
  )
})

describe("Sword Martial QQ cancel forms end one frame past their last kept hit", () => {
  it.each([
    [SKILL.swordqFollowUp1HitCancel, 7],
    [SKILL.swordqFollowUp2HitCancel, 25],
  ])("%s casts %i frames", (skillId, castFrames) => {
    expect(builtinSkill(CLASS, skillId).castFrames).toBe(castFrames)
    expect(Math.ceil(lastHitFrame(skillId) + 1)).toBeLessThanOrEqual(castFrames)
  })
})

describe("Sword Martial QQQ lands its hits 32 and 72 frames in", () => {
  it("keeps both hits inside its 86 frame cast", () => {
    const skill = builtinSkill(CLASS, SKILL.swordMartialQqq)
    expect(skill.hits.map((hit) => hit.frame)).toEqual([32, 72])
    expect(skill.castFrames).toBe(86)
  })
})
