import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  LEVEL_TABLES,
  V129__strengthLevelRows,
  healSkill,
} from "../../src/migrations/customSkills/V129__strengthLevelRows"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { isLevelRows, type CoefficientRow, type Skill } from "../../src/engine/skill"
import storeV128File from "./testCustomSkills/v128/store.json"

const STORE = storeV128File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = [
  "stonesplitStrength-heng-light-attack-3",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-snowpartingspecial",
]
const ROUNDED_ID = "stonesplitStrength-phalanxcharged-s3"
const CONSTANT_IDS = ["stonesplitStrength-anxisoldiermosweep", "stonesplitStrength-break-defense"]
const EDITED_ID = "stonesplitStrength-heng-heavy-attack-2"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])

describe("custom-skills v128 fixture", () => {
  it("is v128 and stores seeded Strength copies with no level rows", () => {
    expect(STORE.v).toBe(V129__strengthLevelRows.to - 1)
    for (const id of [...SEEDED_IDS, ...CONSTANT_IDS]) {
      for (const hit of skillIn(STORE, id).hits) {
        expect(hit.levelRows, id).toBeUndefined()
        for (const variant of hit.variants ?? []) expect(variant.levelRows, id).toBeUndefined()
      }
    }
  })

  it("stores a Splendor copy that already carries level rows", () => {
    expect(skillIn(STORE, "bellstrikeSplendor-swordq").hits[0]!.levelRows).toBeDefined()
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

  it("replaces a rounded seeded row with the exact level-100 row", () => {
    const seeded = skillIn(STORE, ROUNDED_ID)
    const healed = healSkill(clone(seeded)) as Skill
    const scaledIndex = seeded.hits.findIndex((hit) => hit.physMultiplier > 0)
    expect(rowOf(healed.hits[scaledIndex]!)).not.toEqual(rowOf(seeded.hits[scaledIndex]!))
    expect(rowOf(healed.hits[scaledIndex]!)).toEqual(
      rowOf(healed.hits[scaledIndex]!.levelRows!.rows["100"]!),
    )
  })

  it("writes valid art-level rows for the three selected art levels", () => {
    const healed = healSkill(clone(skillIn(STORE, SEEDED_IDS[0]!))) as Skill
    expect(isLevelRows(healed.hits[0]!.levelRows)).toBe(true)
    expect(healed.hits[0]!.levelRows!.scale).toBe("artLevel")
    expect(Object.keys(healed.hits[0]!.levelRows!.rows).sort()).toEqual(["100", "90", "95"])
  })

  it.each(CONSTANT_IDS)("leaves the constant %s copy without level rows", (id) => {
    const copy = skillIn(STORE, id)
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

  it("leaves another class's copy alone", () => {
    const splendor = skillIn(STORE, "bellstrikeSplendor-swordq")
    expect(healSkill(clone(splendor))).toEqual(splendor)
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

describe("V129__strengthLevelRows — through the chain", () => {
  it("is registered and is exactly what the v128 → v129 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V129__strengthLevelRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 129 })!.blob
    expect(hopped.v).toBe(129)
    expect(hopped).toEqual(V129__strengthLevelRows.migrate(clone(STORE)))
    expect(skillIn(hopped, SEEDED_IDS[0]!).hits[0]!.levelRows).toBeDefined()
  })
})
