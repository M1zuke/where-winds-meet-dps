import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V60__springlessSilenceLandingHitOnly,
  healSkill,
} from "../../src/migrations/customSkills/V60__springlessSilenceLandingHitOnly"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV59File from "./testCustomSkills/v59/store.json"

const SPRINGLESS_ID = "silkbindJade-fanspecial"
const REMOVED_SKILL_ID = "silkbindJade-healer-buff"
const USER_AUTHORED_ID = "sk-user-authored-fan"
const STORE = storeV59File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinSpringless = (): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === SPRINGLESS_ID)!

describe("custom-skills v59 fixture", () => {
  it("is v59 and still stores both Springless Silence hits", () => {
    expect(STORE.v).toBe(V60__springlessSilenceLandingHitOnly.to - 1)
    expect(skillIn(STORE, SPRINGLESS_ID).hits).toHaveLength(2)
  })

  it("the built-in carries the landing hit alone", () => {
    expect(builtinSpringless().hits).toHaveLength(1)
  })
})

describe("healSkill", () => {
  it("drops the small hit from a seeded copy and keeps the landing hit as hit-0, triggers included", () => {
    const original = clone(skillIn(STORE, SPRINGLESS_ID))
    const healed = healSkill(clone(original)) as Skill
    expect(healed.hits).toEqual([{ ...original.hits[1], id: "hit-0" }])
    expect(healed.hits[0]).toEqual(builtinSpringless().hits[0])
  })

  it("keeps every other field of the copy", () => {
    const original = clone(skillIn(STORE, SPRINGLESS_ID))
    const { hits: _originalHits, ...originalRest } = original
    const { hits: _healedHits, ...healedRest } = healSkill(clone(original)) as Skill
    expect(healedRest).toEqual(originalRest)
  })

  it("leaves a copy whose landing hit was edited alone", () => {
    const edited = clone(skillIn(STORE, SPRINGLESS_ID))
    edited.hits[1]!.physMultiplier = 2
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy whose small hit was edited alone", () => {
    const edited = clone(skillIn(STORE, SPRINGLESS_ID))
    edited.hits[0]!.physFixed = 10
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy that no longer has two hits alone", () => {
    const edited = clone(skillIn(STORE, SPRINGLESS_ID))
    edited.hits = [edited.hits[1]!]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill with the same rows alone", () => {
    const authored = clone(skillIn(STORE, USER_AUTHORED_ID))
    expect(healSkill(clone(authored))).toEqual(authored)
  })
})

describe("V60__springlessSilenceLandingHitOnly — called directly", () => {
  it("keeps every skill, including the copy of a skill that no longer exists", () => {
    const after = V60__springlessSilenceLandingHitOnly.migrate(clone(STORE))
    expect(after.v).toBe(60)
    const idsAfter = (after.skills as Skill[]).map((skill) => skill.id)
    expect(idsAfter).toEqual((STORE.skills as Skill[]).map((skill) => skill.id))
    expect(skillIn(after, REMOVED_SKILL_ID)).toEqual(skillIn(STORE, REMOVED_SKILL_ID))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V60__springlessSilenceLandingHitOnly.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V60__springlessSilenceLandingHitOnly.migrate(clone(once))).toEqual(once)
  })
})

describe("V60__springlessSilenceLandingHitOnly — through the chain", () => {
  it("is registered and is exactly what the v59 → v60 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V60__springlessSilenceLandingHitOnly)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 60 })!
    expect(result.applied).toEqual(["V60__springlessSilenceLandingHitOnly"])
    expect(result.blob.v).toBe(60)
    expect(skillIn(result.blob, SPRINGLESS_ID).hits).toEqual(builtinSpringless().hits)
    expect(skillIn(result.blob, USER_AUTHORED_ID)).toEqual(skillIn(STORE, USER_AUTHORED_ID))
  })
})
