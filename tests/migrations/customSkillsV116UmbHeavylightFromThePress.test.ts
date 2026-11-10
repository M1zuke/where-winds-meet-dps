import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V116__umbHeavylightFromThePress,
  healSkill,
} from "../../src/migrations/customSkills/V116__umbHeavylightFromThePress"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV115File from "./testCustomSkills/v115/store.json"

const STORE = storeV115File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEAVYLIGHT_ID = "silkbindJade-umb-heavylight"
const NEIGHBOUR_IDS = ["silkbindJade-umb-heavylight-heavyshare", "silkbindJade-umbq"]
const USER_AUTHORED_ID = "sk-user-authored-phoenix"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v115 fixture", () => {
  it("is v115 and stores Umb HeavyLight as a 78 frame cast of three Phoenix hits", () => {
    expect(STORE.v).toBe(V116__umbHeavylightFromThePress.to - 1)
    const seeded = skillIn(STORE, HEAVYLIGHT_ID)
    expect(seeded.castFrames).toBe(78)
    expect(seeded.hits.map((hit) => hit.frame)).toEqual([6, 31, 56])
  })
})

describe("healSkill", () => {
  it("lands the untouched copy on the built-in's cast length, hit frames and rows", () => {
    const healed = healSkill(clone(skillIn(STORE, HEAVYLIGHT_ID))) as Skill
    const builtin = builtinOf(HEAVYLIGHT_ID)
    expect(healed.castFrames).toBe(builtin.castFrames)
    expect(healed.hits).toEqual(builtin.hits)
  })

  it("keeps a copy whose cast length or hits were edited", () => {
    const retimed = clone(skillIn(STORE, HEAVYLIGHT_ID))
    retimed.castFrames = 90
    expect(healSkill(clone(retimed))).toEqual(retimed)
    const reweighted = clone(skillIn(STORE, HEAVYLIGHT_ID))
    reweighted.hits[1]!.physFixed = 1
    expect(healSkill(clone(reweighted))).toEqual(reweighted)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [...NEIGHBOUR_IDS, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, HEAVYLIGHT_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V116__umbHeavylightFromThePress — called directly and through the chain", () => {
  it("heals the seeded copy and keeps every other skill", () => {
    const after = V116__umbHeavylightFromThePress.migrate(clone(STORE))
    expect(after.v).toBe(116)
    expect(skillIn(after, HEAVYLIGHT_ID).castFrames).toBe(113.95)
    for (const id of [...NEIGHBOUR_IDS, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V116__umbHeavylightFromThePress.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v115 → v116 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V116__umbHeavylightFromThePress)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 116 })!
    expect(result.applied).toEqual(["V116__umbHeavylightFromThePress"])
    expect(result.blob.v).toBe(116)
  })
})
