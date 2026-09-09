import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V7__mysticArtRankRepair,
  healMysticArtRank,
} from "../../src/migrations/customSkills/V7__mysticArtRankRepair"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV6File from "./testCustomSkills/v6/store.json"

const CLASS = "bellstrikeUmbra"
const POET1 = `${CLASS}-poet1`
const DRAGON_HEAD_PLUS = `${CLASS}-dragon-head-plus`
const SMOLDER_2_HITS = `${CLASS}-dragon-fire-smolder-2-hits`
const TOAD_CANCEL = `${CLASS}-toad-cancel`
const USER_AUTHORED = "sk-user-authored-slash"
const STORE = storeV6File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v6 fixture", () => {
  it("is v6 and still stores mystic arts at a rank below the current one", () => {
    expect(STORE.v).toBe(V7__mysticArtRankRepair.to - 1)
    expect(skillIn(STORE, POET1).hits[0].physMultiplier).toBe(1.0238)
    expect(skillIn(STORE, DRAGON_HEAD_PLUS).hits[0].physMultiplier).toBe(17.3793)
  })

  it("holds coefficients the built-ins no longer carry", () => {
    expect(builtin(POET1).hits[0].physMultiplier).not.toBe(1.0238)
    expect(builtin(DRAGON_HEAD_PLUS).hits[0].physMultiplier).not.toBe(17.3793)
  })
})

describe("healMysticArtRank", () => {
  it("rewrites an untouched Poet1 row to the current rank", () => {
    const healed = healMysticArtRank(clone(skillIn(STORE, POET1))) as Skill
    expect(healed.hits[0].physMultiplier).toBeCloseTo(1.02325, 10)
    expect(healed.hits[0].attributeMultiplier).toBeCloseTo(1.534875, 10)
    expect(healed.hits[0].physFixed).toBeCloseTo(153.82, 10)
  })

  it("rewrites every untouched hit of a multi-hit skill", () => {
    const healed = healMysticArtRank(clone(skillIn(STORE, SMOLDER_2_HITS))) as Skill
    for (const hit of healed.hits) {
      expect(hit.physMultiplier).toBeCloseTo(1.40692, 10)
      expect(hit.attributeMultiplier).toBeCloseTo(2.11038, 10)
      expect(hit.physFixed).toBeCloseTo(212.49, 10)
    }
  })

  it("rewrites only the hits still identical to the seeded row, leaving an edited one alone", () => {
    const healed = healMysticArtRank(clone(skillIn(STORE, TOAD_CANCEL))) as Skill
    expect(healed.hits[0].physMultiplier).toBe(99)
    expect(healed.hits[1].physMultiplier).toBeCloseTo(1.8922, 10)
    expect(healed.hits[1].attributeMultiplier).toBeCloseTo(2.8383, 10)
    expect(healed.hits[1].physFixed).toBeCloseTo(284.31, 10)
  })

  it("leaves a skill this repair does not target alone", () => {
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healMysticArtRank(other)).toEqual(other)
  })
})

describe("V7__mysticArtRankRepair — through the chain", () => {
  it("is registered and is exactly what the v6 → v7 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V7__mysticArtRankRepair)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 7 })!
    expect(result.applied).toEqual(["V7__mysticArtRankRepair"])
    expect(result.blob.v).toBe(7)
    expect(skillIn(result.blob, POET1).hits[0].physMultiplier).toBeCloseTo(1.02325, 10)
    expect(skillIn(result.blob, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V7__mysticArtRankRepair.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V7__mysticArtRankRepair.migrate(clone(once))).toEqual(once)
  })
})
