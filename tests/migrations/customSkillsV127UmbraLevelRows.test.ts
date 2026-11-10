import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  LEVEL_TABLES,
  V127__umbraLevelRows,
  healSkill,
} from "../../src/migrations/customSkills/V127__umbraLevelRows"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { isLevelRows, type CoefficientRow, type Skill } from "../../src/engine/skill"
import storeV126File from "./testCustomSkills/v126/store.json"

const STORE = storeV126File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = [
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-swordspecial-4-hit",
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-sword-dash",
]
const CONSTANT_ID = "bellstrikeUmbra-crosswind-blade"
const EDITED_ID = "bellstrikeUmbra-sword-light-1"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])

describe("custom-skills v126 fixture", () => {
  it("is v126 and stores seeded Umbra copies with no level rows", () => {
    expect(STORE.v).toBe(V127__umbraLevelRows.to - 1)
    for (const id of [...SEEDED_IDS, CONSTANT_ID]) {
      for (const hit of skillIn(STORE, id).hits) {
        expect(hit.levelRows, id).toBeUndefined()
        for (const variant of hit.variants ?? []) expect(variant.levelRows, id).toBeUndefined()
      }
    }
  })

  it("stores a rounded row the built-in no longer carries", () => {
    expect(skillIn(STORE, "bellstrikeUmbra-spearheavy").hits[0]!.physMultiplier).toBe(0.3314827)
    expect(builtinOf("bellstrikeUmbra-spearheavy").hits[0]!.physMultiplier).not.toBe(0.3314827)
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
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-swordq"))) as Skill
    expect(isLevelRows(healed.hits[0]!.levelRows)).toBe(true)
    expect(healed.hits[0]!.levelRows!.scale).toBe("artLevel")
    expect(Object.keys(healed.hits[0]!.levelRows!.rows).sort()).toEqual(["100", "90", "95"])
  })

  it("leaves a constant row without level rows", () => {
    const copy = skillIn(STORE, CONSTANT_ID)
    expect(healSkill(clone(copy))).toEqual(copy)
  })

  it("keeps a copy whose row was edited", () => {
    const edited = skillIn(STORE, EDITED_ID)
    expect(healSkill(clone(edited))).toEqual(edited)
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

describe("V127__umbraLevelRows — through the chain", () => {
  it("is registered and is exactly what the v126 → v127 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V127__umbraLevelRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 127 })!.blob
    expect(hopped.v).toBe(127)
    expect(hopped).toEqual(V127__umbraLevelRows.migrate(clone(STORE)))
    expect(skillIn(hopped, "bellstrikeUmbra-swordq").hits[0]!.levelRows).toBeDefined()
  })
})
