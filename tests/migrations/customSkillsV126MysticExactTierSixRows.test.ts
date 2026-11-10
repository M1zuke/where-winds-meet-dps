import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  EXACT_SWAPS,
  V126__mysticExactTierSixRows,
  healSkill,
} from "../../src/migrations/customSkills/V126__mysticExactTierSixRows"
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import { withoutLevelRows } from "../helpers/withoutLevelRows"
import type { CoefficientRow, Skill } from "../../src/engine/skill"
import storeV125File from "./testCustomSkills/v125/store.json"

const STORE = storeV125File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
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
const builtinOf = (id: string): Skill => MYSTIC_SKILLS.find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])

describe("custom-skills v125 fixture", () => {
  it("is v125 and stores seeded mystic copies on the rounded tier-6 row with level rows", () => {
    expect(STORE.v).toBe(V126__mysticExactTierSixRows.to - 1)
    for (const id of SEEDED_IDS) {
      expect(
        skillIn(STORE, id).hits.some((hit) => hit.levelRows !== undefined),
        id,
      ).toBe(true)
      expect(rowsOf(skillIn(STORE, id)), id).toEqual(rowsOf(withoutLevelRows(builtinOf(id))))
    }
  })

  it("stores a rounded row the built-in no longer carries", () => {
    expect(skillIn(STORE, "mystic-dragon-head").hits[0]!.physMultiplier).toBe(19.07564)
    expect(builtinOf("mystic-dragon-head").hits[0]!.physMultiplier).toBe(19.07563988)
  })
})

describe("healSkill", () => {
  it.each(SEEDED_IDS)("gives the untouched %s copy the built-in's exact rows", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(rowsOf(healed)).toEqual(rowsOf(builtinOf(id)))
    expect(healed.hits.map((hit) => hit.levelRows)).toEqual(
      builtinOf(id).hits.map((hit) => hit.levelRows),
    )
    expect(healed.hits.map((hit) => hit.variants?.map((variant) => variant.levelRows))).toEqual(
      builtinOf(id).hits.map((hit) => hit.variants?.map((variant) => variant.levelRows)),
    )
  })

  it("keeps the tier-5 row it already carries", () => {
    const before = skillIn(STORE, "mystic-dragon-head").hits[0]!.levelRows!.rows["5"]
    const healed = healSkill(clone(skillIn(STORE, "mystic-dragon-head"))) as Skill
    expect(healed.hits[0]!.levelRows!.rows["5"]).toEqual(before)
  })

  it("keeps a copy whose row was edited and still heals an untouched neighbour hit", () => {
    const edited = clone(skillIn(STORE, EDITED_ID))
    const healed = healSkill(clone(edited)) as Skill
    expect(rowOf(healed.hits[0]!)).toEqual(rowOf(edited.hits[0]!))
    expect(healed.hits[0]!.levelRows).toBeUndefined()
    expect(rowOf(healed.hits[1]!)).toEqual(rowOf(builtinOf(EDITED_ID).hits[1]!))
  })

  it("keeps a copy whose own row matches but whose level rows were removed", () => {
    const copy = clone(skillIn(STORE, "mystic-dragon-head"))
    delete copy.hits[0]!.levelRows
    expect(healSkill(clone(copy))).toEqual(copy)
  })

  it("leaves a user-authored skill alone", () => {
    const authored = skillIn(STORE, USER_AUTHORED_ID)
    expect(healSkill(clone(authored))).toEqual(authored)
  })

  it("is idempotent", () => {
    for (const id of SEEDED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })

  it("never maps one rounded row to two different exact tables", () => {
    const seen = new Map<string, string>()
    for (const swap of EXACT_SWAPS) {
      const key = swap.from.join(",")
      const table = JSON.stringify(swap.rows)
      expect(seen.get(key) ?? table, key).toBe(table)
      seen.set(key, table)
    }
  })
})

describe("V126__mysticExactTierSixRows — through the chain", () => {
  it("is registered and is exactly what the v125 → v126 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V126__mysticExactTierSixRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 126 })!.blob
    expect(hopped.v).toBe(126)
    expect(hopped).toEqual(V126__mysticExactTierSixRows.migrate(clone(STORE)))
    expect(skillIn(hopped, "mystic-dragon-head").hits[0]!.physMultiplier).toBe(19.07563988)
  })
})
