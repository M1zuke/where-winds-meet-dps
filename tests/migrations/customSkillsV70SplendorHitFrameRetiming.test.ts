import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V70__splendorHitFrameRetiming } from "../../src/migrations/customSkills/V70__splendorHitFrameRetiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import storeV69File from "./testCustomSkills/v69/store.json"

const STORE = storeV69File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const RETIMED_IDS = [SKILL.cloudstep, SKILL.swordq3rd, SKILL.swordLightAttack]
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const framesOf = (skill: Skill): number[] => skill.hits.map((hit) => hit.frame)

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v69 fixture", () => {
  it("is v69 and stores the Splendor copies on their earlier timings", () => {
    expect(STORE.v).toBe(V70__splendorHitFrameRetiming.to - 1)
    expect(skillIn(STORE, SKILL.cloudstep).castFrames).toBe(43)
    expect(framesOf(skillIn(STORE, SKILL.cloudstep))).toEqual([29])
    expect(framesOf(skillIn(STORE, SKILL.swordq3rd))[1]).toBe(19)
    expect(framesOf(skillIn(STORE, SKILL.swordLightAttack))[4]).toBe(88)
  })
})

describe("V70__splendorHitFrameRetiming — called directly", () => {
  it("lets the stance enable and spend on an untouched Vagrant Sword copy", () => {
    const after = V70__splendorHitFrameRetiming.migrate(clone(STORE))
    expect(skillIn(after, SKILL.swordHeavyCharged).hits).toEqual(
      builtin(SKILL.swordHeavyCharged).hits,
    )
  })

  it("moves every untouched copy onto the built-in's cast length and frames", () => {
    const after = V70__splendorHitFrameRetiming.migrate(clone(STORE))
    expect(after.v).toBe(70)
    for (const id of RETIMED_IDS) {
      expect(skillIn(after, id).castFrames, id).toBe(builtin(id).castFrames)
      expect(framesOf(skillIn(after, id)), id).toEqual(framesOf(builtin(id)))
    }
  })

  it("leaves a value the user edited, a user-authored skill and every other field alone", () => {
    const edited = clone(STORE)
    const cloudstep = skillIn(edited, SKILL.cloudstep)
    cloudstep.castFrames = 40
    cloudstep.hits[0]!.frame = 31
    const after = V70__splendorHitFrameRetiming.migrate(edited)
    expect(skillIn(after, SKILL.cloudstep).castFrames).toBe(40)
    expect(framesOf(skillIn(after, SKILL.cloudstep))).toEqual([31])
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    const {
      hits: _beforeHits,
      castFrames: _beforeCast,
      ...restBefore
    } = skillIn(STORE, SKILL.swordq3rd)
    const {
      hits: _afterHits,
      castFrames: _afterCast,
      ...restAfter
    } = skillIn(after, SKILL.swordq3rd)
    void [_beforeHits, _beforeCast, _afterHits, _afterCast]
    expect(restAfter).toEqual(restBefore)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V70__splendorHitFrameRetiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V70__splendorHitFrameRetiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V70__splendorHitFrameRetiming — through the chain", () => {
  it("is registered and is exactly what the v69 → v70 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V70__splendorHitFrameRetiming)
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(result.applied).toEqual(["V70__splendorHitFrameRetiming"])
    expect(result.blob.v).toBe(70)
    expect(skillIn(result.blob, SKILL.cloudstep).castFrames).toBe(36)
  })
})
