import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V23__drunkenHazeExplosion,
  addDrunkenHazeExplosionHits,
  addFinalStrikeExplosionTrigger,
} from "../../src/migrations/customSkills/V23__drunkenHazeExplosion"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV22File from "./testCustomSkills/v22/store.json"

const CLASS = "bellstrikeUmbra"
const POET2 = "mystic-poet2"
const POET3 = "mystic-poet3"
const POET4 = "mystic-poet4"
const FINAL_STRIKE = "mystic-poet-final-hit-cancel"
const RECALIBRATED_IDS = [POET2, POET3, POET4, FINAL_STRIKE]
const STORE = storeV22File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v22 fixture", () => {
  it("is v22 and still stores the superseded, shorter Poet rows", () => {
    expect(STORE.v).toBe(V23__drunkenHazeExplosion.to - 1)
    for (const id of [POET2, POET3, POET4, FINAL_STRIKE]) {
      expect(skillIn(STORE, id).hits, id).toHaveLength(1)
    }
  })

  it("stores rows the built-ins no longer carry", () => {
    expect(builtinOf(POET2).hits).toHaveLength(3)
    expect(builtinOf(FINAL_STRIKE).hits[0].triggers).toHaveLength(2)
  })
})

describe("addDrunkenHazeExplosionHits", () => {
  it("appends the Combustion and Smolder explosion hits to an untouched Poet2-4 row", () => {
    for (const id of [POET2, POET3, POET4]) {
      const healed = addDrunkenHazeExplosionHits(
        id,
        clone(skillIn(STORE, id).hits),
      ) as Skill["hits"]
      expect(healed, id).toEqual(builtinOf(id).hits)
    }
  })

  it("leaves an edited row and Poet1 (no explosion of its own) alone", () => {
    const edited = clone(skillIn(STORE, POET2).hits)
    edited[0].physMultiplier = 5
    expect(addDrunkenHazeExplosionHits(POET2, edited)).toEqual(edited)
    const poet1Hits = [{ ...clone(skillIn(STORE, POET2).hits)[0], id: "hit-1" }]
    expect(addDrunkenHazeExplosionHits("mystic-poet1", poet1Hits)).toEqual(poet1Hits)
  })
})

describe("addFinalStrikeExplosionTrigger", () => {
  it("appends the explosion cast trigger to an untouched final-strike hit", () => {
    const healed = addFinalStrikeExplosionTrigger(
      FINAL_STRIKE,
      clone(skillIn(STORE, FINAL_STRIKE).hits),
    ) as Skill["hits"]
    expect(healed).toEqual(builtinOf(FINAL_STRIKE).hits)
  })

  it("leaves an edited hit and another skill's hits alone", () => {
    const edited = clone(skillIn(STORE, FINAL_STRIKE).hits)
    edited[0].physMultiplier = 5
    expect(addFinalStrikeExplosionTrigger(FINAL_STRIKE, edited)).toEqual(edited)
    const other = clone(skillIn(STORE, POET2).hits)
    expect(addFinalStrikeExplosionTrigger(POET2, other)).toEqual(other)
  })
})

describe("V23__drunkenHazeExplosion — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V23__drunkenHazeExplosion.migrate(clone(STORE))
    expect(after.v).toBe(23)
    for (const id of RECALIBRATED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
      const { hits: _beforeHits, ...restBefore } = skillIn(STORE, id)
      const { hits: _afterHits, ...restAfter } = skillIn(after, id)
      void _beforeHits
      void _afterHits
      expect(restAfter, id).toEqual(restBefore)
    }
    for (const skill of STORE.skills) {
      if (RECALIBRATED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V23__drunkenHazeExplosion.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V23__drunkenHazeExplosion.migrate(clone(once))).toEqual(once)
  })
})

describe("V23__drunkenHazeExplosion — through the chain", () => {
  it("is registered and is exactly what the v22 → v23 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V23__drunkenHazeExplosion)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 23 })!
    expect(result.applied).toEqual(["V23__drunkenHazeExplosion"])
    expect(result.blob.v).toBe(23)
    expect(skillIn(result.blob, POET2).hits).toEqual(builtinOf(POET2).hits)
  })
})
