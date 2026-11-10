import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V109__dragonBreathSingleHitFastFrame,
  healSkill,
} from "../../src/migrations/customSkills/V109__dragonBreathSingleHitFastFrame"
import { fireBreath1Hit } from "../../src/data/skills/mystic/fire-breath-1-hit"
import type { Skill } from "../../src/engine/skill"
import storeV108File from "./testCustomSkills/v108/store.json"

const STORE = storeV108File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SINGLE_HIT_ID = fireBreath1Hit.id
const NEIGHBOUR_ID = "mystic-fire-breath-2-hit"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v108 fixture", () => {
  it("is v108 and still lands the single-hit breath on frame 40", () => {
    expect(STORE.v).toBe(V109__dragonBreathSingleHitFastFrame.to - 1)
    expect(skillIn(STORE, SINGLE_HIT_ID).hits[0]!.frame).toBe(40)
  })
})

describe("healSkill", () => {
  it("lands the untouched copy on the built-in frame and keeps its cast length", () => {
    const seeded = skillIn(STORE, SINGLE_HIT_ID)
    const healed = healSkill(clone(seeded)) as Skill
    expect(healed.hits[0]!.frame).toBe(fireBreath1Hit.hits[0]!.frame)
    expect(healed.castFrames).toBe(seeded.castFrames)
  })

  it("keeps a copy whose frame was edited", () => {
    const edited = clone(skillIn(STORE, SINGLE_HIT_ID))
    edited.hits[0]!.frame = 38
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, SINGLE_HIT_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V109__dragonBreathSingleHitFastFrame — called directly and through the chain", () => {
  it("heals the copy and keeps every other skill", () => {
    const after = V109__dragonBreathSingleHitFastFrame.migrate(clone(STORE))
    expect(after.v).toBe(109)
    expect(skillIn(after, SINGLE_HIT_ID).hits[0]!.frame).toBe(36)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V109__dragonBreathSingleHitFastFrame.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v108 → v109 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V109__dragonBreathSingleHitFastFrame)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 109 })!
    expect(result.applied).toEqual(["V109__dragonBreathSingleHitFastFrame"])
    expect(result.blob.v).toBe(109)
  })
})
