import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V79__springAwayReach,
  healSkill,
} from "../../src/migrations/customSkills/V79__springAwayReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import storeV78File from "./testCustomSkills/v78/store.json"

const STORE = storeV78File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SPRING_AWAY_IDS: readonly string[] = [SKILL.umblightcharge, SKILL.umblightcharge12]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v78 fixture", () => {
  it("is v78 and stores both Spring Away copies without a reach or a contact advance", () => {
    expect(STORE.v).toBe(V79__springAwayReach.to - 1)
    for (const id of SPRING_AWAY_IDS) {
      expect(skillIn(STORE, id).reachMeters).toBeUndefined()
      expect(skillIn(STORE, id).hits[0].projectile?.contactAdvanceMeters).toBeUndefined()
    }
  })
})

describe("healSkill", () => {
  it("gives both copies the live reach and every stored projectile its contact advance", () => {
    for (const id of SPRING_AWAY_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.reachMeters).toBe(builtin(id).reachMeters)
      for (const hit of healed.hits) {
        if (hit.projectile) {
          expect(hit.projectile.contactAdvanceMeters).toBe(
            builtin(id).hits[0].projectile?.contactAdvanceMeters,
          )
        }
      }
    }
  })

  it("keeps a reach and a contact advance the copy already carries", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.reachMeters = 6
    edited.hits[0].projectile = { ...edited.hits[0].projectile!, contactAdvanceMeters: 0.1 }
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.reachMeters).toBe(6)
    expect(healed.hits[0].projectile?.contactAdvanceMeters).toBe(0.1)
  })

  it("leaves every other skill alone and is idempotent", () => {
    for (const skill of STORE.skills) {
      if (SPRING_AWAY_IDS.includes(skill.id)) continue
      expect(healSkill(clone(skill)), skill.id).toEqual(skill)
    }
    const once = healSkill(clone(skillIn(STORE, SKILL.umblightcharge)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V79__springAwayReach — through the chain", () => {
  it("is registered and is exactly what the v78 → v79 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V79__springAwayReach)
    const input = clone(STORE)
    const result = runCustomSkillMigrations(input, { toVersion: 79 })!
    expect(result.applied).toEqual(["V79__springAwayReach"])
    expect(result.blob.v).toBe(79)
    expect(skillIn(result.blob, SKILL.umblightcharge).reachMeters).toBe(13)
    expect(input).toEqual(STORE)
  })
})
