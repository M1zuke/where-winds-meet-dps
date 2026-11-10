import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  LEVEL_TABLES,
  V130__draughtLevelRows,
  healSkill,
} from "../../src/migrations/customSkills/V130__draughtLevelRows"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { isLevelRows, type CoefficientRow, type Skill } from "../../src/engine/skill"
import storeV129File from "./testCustomSkills/v129/store.json"

const STORE = storeV129File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_IDS = [
  "bamboocutDraught-bloombreak",
  "bamboocutDraught-boundvessel",
  "bamboocutDraught-castlink",
  "bamboocutDraught-dragonquench-inebriate",
  "bamboocutDraught-dual-blades-light-attack-3",
  "bamboocutDraught-peakfall",
  "bamboocutDraught-twinblades-dual",
]
const ROUNDED_ID = "bamboocutDraught-boundvessel"
const CONSTANT_IDS = ["bamboocutDraught-falcons-pursuit"]
const EDITED_ID = "bamboocutDraught-light-attack"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!
const rowOf = (row: CoefficientRow) => [
  row.physMultiplier,
  row.attributeMultiplier,
  row.physFixed,
  row.attributeFixed,
]
const rowsOf = (skill: Skill) =>
  skill.hits.map((hit) => [rowOf(hit), (hit.variants ?? []).map((variant) => rowOf(variant))])

describe("custom-skills v129 fixture", () => {
  it("is v129 and stores seeded Draught copies with no level rows", () => {
    expect(STORE.v).toBe(V130__draughtLevelRows.to - 1)
    for (const id of [...SEEDED_IDS, ...CONSTANT_IDS]) {
      for (const hit of skillIn(STORE, id).hits) {
        expect(hit.levelRows, id).toBeUndefined()
        for (const variant of hit.variants ?? []) expect(variant.levelRows, id).toBeUndefined()
      }
    }
  })

  it("stores a Strength copy that already carries level rows", () => {
    expect(
      skillIn(STORE, "stonesplitStrength-heng-light-attack-3").hits[0]!.levelRows,
    ).toBeDefined()
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
    const scaledIndex = 2
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
    const strength = skillIn(STORE, "stonesplitStrength-heng-light-attack-3")
    expect(healSkill(clone(strength))).toEqual(strength)
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

describe("V130__draughtLevelRows — through the chain", () => {
  it("is registered and is exactly what the v129 → v130 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V130__draughtLevelRows)
    const hopped = runCustomSkillMigrations(clone(STORE), { toVersion: 130 })!.blob
    expect(hopped.v).toBe(130)
    expect(hopped).toEqual(V130__draughtLevelRows.migrate(clone(STORE)))
    expect(skillIn(hopped, SEEDED_IDS[0]!).hits[0]!.levelRows).toBeDefined()
  })
})
