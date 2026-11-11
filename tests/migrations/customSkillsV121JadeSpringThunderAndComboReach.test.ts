import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V121__jadeSpringThunderAndComboReach,
  healSkill,
} from "../../src/migrations/customSkills/V121__jadeSpringThunderAndComboReach"
import { healSkill as healCleftpeakReachesJadeTaggedHits } from "../../src/migrations/customSkills/V137__cleftpeakReachesJadeTaggedHits"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV120File from "./testCustomSkills/v120/store.json"

const STORE = storeV120File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = [
  "silkbindJade-bamboo-breeze",
  "silkbindJade-hidden-sword-light-1",
  "silkbindJade-hidden-sword-light-2",
  "silkbindJade-hidden-sword-light-3",
  "silkbindJade-hidden-sword-light-4",
  "silkbindJade-hidden-sword-light-5",
  "silkbindJade-hidden-sword-heavy-1",
  "silkbindJade-hidden-sword-heavy-2",
  "silkbindJade-hidden-sword-heavy-3",
  "silkbindJade-hidden-sword-heavy-alt",
  "silkbindJade-umbrella-dual",
  "silkbindJade-fan-dual",
]
const UNTOUCHED_IDS = ["silkbindJade-umbq", "sk-user-authored-bloom"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!
const sorted = (skill: Skill): string[] => [...(skill.receives ?? [])].sort()

describe("custom-skills v120 fixture", () => {
  it("is v120 and stores every healed skill without Spring Thunder", () => {
    expect(STORE.v).toBe(V121__jadeSpringThunderAndComboReach.to - 1)
    for (const id of HEALED_IDS) expect(skillIn(STORE, id).receives).not.toContain("springThunder")
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's reach list", (id) => {
    const healed = healCleftpeakReachesJadeTaggedHits(healSkill(clone(skillIn(STORE, id)))) as Skill
    expect(sorted(healed)).toEqual(sorted(builtinOf(id)))
  })

  it("keeps a reach list that was edited", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-bamboo-breeze"))
    edited.receives = [...(edited.receives ?? []), "userBuff"]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V121__jadeSpringThunderAndComboReach — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V121__jadeSpringThunderAndComboReach.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v120 → v121 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V121__jadeSpringThunderAndComboReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 121 })!
    expect(result.applied).toEqual(["V121__jadeSpringThunderAndComboReach"])
    expect(result.blob.v).toBe(121)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
