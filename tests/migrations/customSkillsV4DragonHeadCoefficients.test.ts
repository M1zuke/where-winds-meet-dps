import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V4__dragonHeadCoefficients,
  migrateDragonHeadHits,
} from "../../src/migrations/customSkills/V4__dragonHeadCoefficients"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV3File from "./testCustomSkills/v3/store.json"

const CLASS = "bellstrikeUmbra"
const DRAGON_HEAD_PLUS = `${CLASS}-dragon-head-plus`
const STORE = storeV3File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v3 fixture", () => {
  it("is v3 and still stores the superseded Dragon Head - Plus rows", () => {
    expect(STORE.v).toBe(V4__dragonHeadCoefficients.to - 1)
    const hit = skillIn(STORE, DRAGON_HEAD_PLUS).hits[0]
    expect(hit.physMultiplier).toBe(25.200406)
    expect(hit.physFixed).toBe(4695.46)
    expect(hit.attributeMultiplier).toBe(37.800609)
  })

  it("stores rows the built-in no longer carries", () => {
    const builtin = builtinSkillsForClass(CLASS).find((skill) => skill.id === DRAGON_HEAD_PLUS)!
    expect(builtin.hits[0].physMultiplier).not.toBe(25.200406)
  })
})

describe("migrateDragonHeadHits", () => {
  it("rewrites an untouched superseded row to the built-in's current row", () => {
    const builtin = builtinSkillsForClass(CLASS).find((skill) => skill.id === DRAGON_HEAD_PLUS)!
    const [healed] = migrateDragonHeadHits(
      DRAGON_HEAD_PLUS,
      clone(skillIn(STORE, DRAGON_HEAD_PLUS).hits),
    ) as Skill["hits"]
    expect(healed.physMultiplier).toBe(builtin.hits[0].physMultiplier)
    expect(healed.physFixed).toBe(builtin.hits[0].physFixed)
    expect(healed.attributeMultiplier).toBe(builtin.hits[0].attributeMultiplier)
  })

  it("leaves an edited row and a skill with another id alone", () => {
    const edited = clone(skillIn(STORE, DRAGON_HEAD_PLUS).hits)
    edited[0].physMultiplier = 30
    expect(migrateDragonHeadHits(DRAGON_HEAD_PLUS, edited)).toEqual(edited)
    const other = clone(skillIn(STORE, `${CLASS}-swordq`).hits)
    expect(migrateDragonHeadHits(`${CLASS}-swordq`, other)).toEqual(other)
  })
})

describe("V4__dragonHeadCoefficients — called directly", () => {
  it("rewrites the Dragon Head copy and nothing else", () => {
    const before = clone(STORE)
    const after = V4__dragonHeadCoefficients.migrate(before)
    expect(after.v).toBe(4)
    expect(skillIn(after, DRAGON_HEAD_PLUS).hits[0].physMultiplier).toBe(17.3793)
    for (const skill of STORE.skills) {
      if (skill.id === DRAGON_HEAD_PLUS) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
    const { hits: _hits, ...restBefore } = skillIn(STORE, DRAGON_HEAD_PLUS)
    const { hits: _healedHits, ...restAfter } = skillIn(after, DRAGON_HEAD_PLUS)
    void _hits
    void _healedHits
    expect(restAfter).toEqual(restBefore)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V4__dragonHeadCoefficients.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V4__dragonHeadCoefficients.migrate(clone(once))).toEqual(once)
  })
})

describe("V4__dragonHeadCoefficients — through the chain", () => {
  it("is registered and is exactly what the v3 → v4 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V4__dragonHeadCoefficients)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 4 })!
    expect(result.applied).toEqual(["V4__dragonHeadCoefficients"])
    expect(result.blob.v).toBe(4)
    expect(skillIn(result.blob, DRAGON_HEAD_PLUS).hits[0].physMultiplier).toBe(17.3793)
  })
})
