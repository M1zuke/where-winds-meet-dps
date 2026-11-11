import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V124__dragonHeadCastLength,
  healSkill,
} from "../../src/migrations/customSkills/V124__dragonHeadCastLength"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV123File from "./testCustomSkills/v123/store.json"

const STORE = storeV123File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = ["mystic-dragon-head", "mystic-dragon-head-plus"]
const UNTOUCHED_IDS = ["bamboocutDraught-dragon-head", "sk-user-authored-slash"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

describe("custom-skills v123 fixture", () => {
  it("is v123 and stores both Dragon Heads with the 246 frame cast and hit", () => {
    expect(STORE.v).toBe(V124__dragonHeadCastLength.to - 1)
    for (const id of SEEDED_IDS) {
      expect(skillIn(STORE, id).castFrames).toBe(246)
      expect(skillIn(STORE, id).hits[0]!.frame).toBe(246)
    }
  })
})

describe("healSkill", () => {
  it.each(SEEDED_IDS)("moves the untouched %s copy onto the built-in's timing", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.castFrames).toBe(builtinOf(id).castFrames)
    expect(healed.hits).toEqual(builtinOf(id).hits)
  })

  it("keeps a copy whose cast or hit frame was edited", () => {
    const edited = clone(skillIn(STORE, "mystic-dragon-head"))
    edited.hits[0]!.frame = 250
    expect(healSkill(clone(edited))).toEqual(edited)
    const longerCast = clone(skillIn(STORE, "mystic-dragon-head-plus"))
    longerCast.castFrames = 300
    expect(healSkill(clone(longerCast))).toEqual(longerCast)
  })

  it("leaves an edited neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of SEEDED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V124__dragonHeadCastLength — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V124__dragonHeadCastLength.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v123 → v124 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V124__dragonHeadCastLength)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 124 })!
    expect(result.applied).toEqual(["V124__dragonHeadCastLength"])
    expect(result.blob.v).toBe(124)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
    for (const id of SEEDED_IDS) expect(skillIn(result.blob, id).castFrames).toBe(348)
  })
})
