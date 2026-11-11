import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  LEVEL_TABLES,
  V128__splendorLevelRows,
  healSkill,
} from "../../src/migrations/customSkills/V128__splendorLevelRows"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { isLevelRows, type CoefficientRow, type Skill } from "../../src/engine/skill"
import storeV127File from "./testCustomSkills/v127/store.json"

const STORE = storeV127File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = [
  "bellstrikeSplendor-swordq",
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-stormdance-stage-2",
  "bellstrikeSplendor-spear-light-attack",
]
const CONSTANT_ID = "bellstrikeSplendor-bitter-season-tick"
const EDITED_ID = "bellstrikeSplendor-sword-heavy-attack"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])

describe("custom-skills v127 fixture", () => {
  it("is v127 and stores seeded Splendor copies with no level rows", () => {
    expect(STORE.v).toBe(V128__splendorLevelRows.to - 1)
    for (const id of [...SEEDED_IDS, CONSTANT_ID]) {
      for (const hit of skillIn(STORE, id).hits) {
        expect(hit.levelRows, id).toBeUndefined()
        for (const variant of hit.variants ?? []) expect(variant.levelRows, id).toBeUndefined()
      }
    }
  })

  it("stores an Umbra copy that already carries level rows", () => {
    expect(skillIn(STORE, "bellstrikeUmbra-swordq").hits[0]!.levelRows).toBeDefined()
  })
})

describe("healSkill", () => {
  it.each(SEEDED_IDS)("gives the untouched %s copy the built-in's rows and level rows", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const builtin = builtinOf(id)
    expect(rowsOf(healed)).toEqual(rowsOf(builtin))
    expect(healed.hits.map((hit) => hit.levelRows)).toEqual(
      builtin.hits.map((hit) => hit.levelRows),
    )
    expect(healed.hits.map((hit) => hit.variants?.map((variant) => variant.levelRows))).toEqual(
      builtin.hits.map((hit) => hit.variants?.map((variant) => variant.levelRows)),
    )
  })

  it("writes valid art-level rows for the three selected art levels", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordq"))) as Skill
    expect(isLevelRows(healed.hits[0]!.levelRows)).toBe(true)
    expect(healed.hits[0]!.levelRows!.scale).toBe("artLevel")
    expect(Object.keys(healed.hits[0]!.levelRows!.rows).sort()).toEqual(["100", "90", "95"])
  })

  it("leaves a constant row without level rows", () => {
    const copy = skillIn(STORE, CONSTANT_ID)
    expect(healSkill(clone(copy))).toEqual(copy)
  })

  it("keeps the edited hit as it is and still heals its untouched neighbours", () => {
    const edited = skillIn(STORE, EDITED_ID)
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]).toEqual(edited.hits[0])
    expect(healed.hits[0]!.levelRows).toBeUndefined()
    for (const hit of healed.hits.slice(1)) expect(hit.levelRows).toBeDefined()
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

  it("never maps one seeded row to two different tables", () => {
    const seen = new Map<string, string>()
    for (const table of LEVEL_TABLES) {
      const key = table.from.join(",")
      const rows = JSON.stringify(table.rows)
      expect(seen.get(key) ?? rows, key).toBe(rows)
      seen.set(key, rows)
    }
  })
})

describe("V128__splendorLevelRows — through the chain", () => {
  it("is registered and is exactly what the v127 → v128 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V128__splendorLevelRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 128 })!.blob
    expect(hopped.v).toBe(128)
    expect(hopped).toEqual(V128__splendorLevelRows.migrate(clone(STORE)))
    expect(skillIn(hopped, "bellstrikeSplendor-swordq").hits[0]!.levelRows).toBeDefined()
  })
})
