import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V69__lightAttackThreeHitFrames } from "../../src/migrations/customSkills/V69__lightAttackThreeHitFrames"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV68File from "./testCustomSkills/v68/store.json"

const STORE = storeV68File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SPEAR_LIGHT_3 = "bellstrikeUmbra-spear-light-3"
const SWORD_LIGHT_3 = "bellstrikeUmbra-sword-light-3"
const SWORD_LIGHT_3_ENDS_CHAIN = "bellstrikeUmbra-sword-light-3-ends-chain"
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const framesOf = (skill: Skill): number[] => skill.hits.map((hit) => hit.frame)

const builtinFrames = (id: string): number[] =>
  framesOf(builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!)

describe("custom-skills v68 fixture", () => {
  it("is v68 and stores the light attack stage 3 copies on their earlier frames", () => {
    expect(STORE.v).toBe(V69__lightAttackThreeHitFrames.to - 1)
    expect(framesOf(skillIn(STORE, SPEAR_LIGHT_3))).toEqual([14, 31])
    expect(framesOf(skillIn(STORE, SWORD_LIGHT_3))).toEqual([8, 21])
    expect(framesOf(skillIn(STORE, SWORD_LIGHT_3_ENDS_CHAIN))).toEqual([8, 21, 34])
  })
})

describe("V69__lightAttackThreeHitFrames — called directly", () => {
  it("moves every untouched copy onto the built-in's frames", () => {
    const after = V69__lightAttackThreeHitFrames.migrate(clone(STORE))
    expect(after.v).toBe(69)
    for (const id of [SPEAR_LIGHT_3, SWORD_LIGHT_3, SWORD_LIGHT_3_ENDS_CHAIN]) {
      expect(framesOf(skillIn(after, id)), id).toEqual(builtinFrames(id))
    }
  })

  it("leaves a frame the user edited, a user-authored skill and every other field alone", () => {
    const edited = clone(STORE)
    skillIn(edited, SPEAR_LIGHT_3).hits[0]!.frame = 16
    const after = V69__lightAttackThreeHitFrames.migrate(edited)
    expect(framesOf(skillIn(after, SPEAR_LIGHT_3))).toEqual([16, 35])
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    const { hits: _beforeHits, ...restBefore } = skillIn(STORE, SWORD_LIGHT_3)
    const { hits: _afterHits, ...restAfter } = skillIn(after, SWORD_LIGHT_3)
    void _beforeHits
    void _afterHits
    expect(restAfter).toEqual(restBefore)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V69__lightAttackThreeHitFrames.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V69__lightAttackThreeHitFrames.migrate(clone(once))).toEqual(once)
  })
})

describe("V69__lightAttackThreeHitFrames — through the chain", () => {
  it("is registered and is exactly what the v68 → v69 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V69__lightAttackThreeHitFrames)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 69 })!
    expect(result.applied).toEqual(["V69__lightAttackThreeHitFrames"])
    expect(result.blob.v).toBe(69)
    expect(framesOf(skillIn(result.blob, SPEAR_LIGHT_3))).toEqual([18, 35])
  })
})
