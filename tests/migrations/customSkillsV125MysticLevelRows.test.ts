import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V125__mysticLevelRows,
  healSkill,
} from "../../src/migrations/customSkills/V125__mysticLevelRows"
import { healSkill as healExactSkill } from "../../src/migrations/customSkills/V126__mysticExactTierSixRows"
import { withoutLevelRows } from "../helpers/withoutLevelRows"
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import { isLevelRows, type CoefficientRow, type Skill } from "../../src/engine/skill"
import storeV124File from "./testCustomSkills/v124/store.json"

const STORE = storeV124File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = [
  "mystic-dragon-head",
  "mystic-dragon-head-plus",
  "mystic-fire-breath-1-hit",
  "mystic-toad-fury",
  "mystic-free-morph",
]
const EDITED_ID = "mystic-dragon-fire-smolder-2-hits"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])
const builtinOf = (id: string): Skill => MYSTIC_SKILLS.find((skill) => skill.id === id)!

describe("custom-skills v124 fixture", () => {
  it("is v124 and stores seeded mystic copies with no level rows", () => {
    expect(STORE.v).toBe(V125__mysticLevelRows.to - 1)
    for (const id of SEEDED_IDS) {
      for (const hit of skillIn(STORE, id).hits) {
        expect(hit.levelRows, id).toBeUndefined()
      }
    }
  })

  it("stores each seeded copy on the rounded row the built-in held as its top row", () => {
    for (const id of SEEDED_IDS) {
      expect(rowsOf(skillIn(STORE, id)), id).toEqual(rowsOf(withoutLevelRows(builtinOf(id))))
    }
  })
})

describe("healSkill", () => {
  it.each(SEEDED_IDS)(
    "gives the untouched %s copy the built-in's level rows once made exact",
    (id) => {
      const healed = healExactSkill(healSkill(clone(skillIn(STORE, id)))) as Skill
      const builtin = builtinOf(id)
      expect(healed.hits.map((hit) => hit.levelRows)).toEqual(
        builtin.hits.map((hit) => hit.levelRows),
      )
      expect(healed.hits.map((hit) => hit.variants?.map((variant) => variant.levelRows))).toEqual(
        builtin.hits.map((hit) => hit.variants?.map((variant) => variant.levelRows)),
      )
      expect(rowsOf(healed)).toEqual(rowsOf(builtin))
    },
  )

  it("writes valid mystic-tier level rows with the branch form on tier 6 only", () => {
    const plus = healSkill(clone(skillIn(STORE, "mystic-dragon-head-plus"))) as Skill
    expect(isLevelRows(plus.hits[0]!.levelRows)).toBe(true)
    expect(Object.keys(plus.hits[0]!.levelRows!.rows)).toEqual(["6"])
    const head = healSkill(clone(skillIn(STORE, "mystic-dragon-head"))) as Skill
    expect(Object.keys(head.hits[0]!.levelRows!.rows)).toEqual(["5", "6"])
  })

  it("keeps a copy whose row was edited, and gives an untouched neighbour hit its rows", () => {
    const edited = clone(skillIn(STORE, EDITED_ID))
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.levelRows).toBeUndefined()
    expect(rowOf(healed.hits[0]!)).toEqual(rowOf(edited.hits[0]!))
    expect(healed.hits[1]!.levelRows).toBeDefined()
  })

  it("leaves a user-authored skill alone and is idempotent", () => {
    const authored = skillIn(STORE, USER_AUTHORED_ID)
    expect(healSkill(clone(authored))).toEqual(authored)
    for (const id of SEEDED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V125__mysticLevelRows — through the chain", () => {
  it("is registered and is exactly what the v124 → v125 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V125__mysticLevelRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 125 })!.blob
    expect(hopped.v).toBe(125)
    expect(hopped).toEqual(V125__mysticLevelRows.migrate(clone(STORE)))
    expect(skillIn(hopped, "mystic-dragon-head").hits[0]!.levelRows).toBeDefined()
  })
})
