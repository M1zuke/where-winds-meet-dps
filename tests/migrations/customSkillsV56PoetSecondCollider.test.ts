import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V56__poetSecondCollider,
  healSkill,
} from "../../src/migrations/customSkills/V56__poetSecondCollider"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV55File from "./testCustomSkills/v55/store.json"

const CLASS = "bellstrikeUmbra"
const POET1 = "mystic-poet1"
const POET2 = "mystic-poet2"
const POET3 = "mystic-poet3"
const POET4 = "mystic-poet4"
const RECALIBRATED_IDS = [POET1, POET2, POET3, POET4]
const STORE = storeV55File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v55 fixture", () => {
  it("is v55 and still stores the single-collider Poet rows", () => {
    expect(STORE.v).toBe(V56__poetSecondCollider.to - 1)
    expect(skillIn(STORE, POET1).hits).toHaveLength(1)
    for (const id of [POET2, POET3, POET4]) expect(skillIn(STORE, id).hits, id).toHaveLength(3)
  })

  it("stores rows the built-ins no longer carry", () => {
    expect(builtinOf(POET1).hits).toHaveLength(2)
    expect(builtinOf(POET2).hits).toHaveLength(6)
  })
})

describe("healSkill", () => {
  it("mirrors every seeded Poet row onto the built-in's own second-collider shape", () => {
    for (const id of RECALIBRATED_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.hits, id).toEqual(builtinOf(id).hits)
    }
  })

  it("produces exactly the two-collider rows this hop defines, independent of the live built-in", () => {
    const strike = { physMultiplier: 1.02325, attributeMultiplier: 1.534875, physFixed: 153.82 }
    const combustion = {
      physMultiplier: 0.70166,
      attributeMultiplier: 1.05249,
      physFixed: 105.48,
      conditions: [
        { buffId: "debuff-mystic-combustion", op: "gte", stacks: 1 },
        { buffId: "debuff-mystic-smolder", op: "eq", stacks: 0 },
      ],
    }
    const smolder = {
      physMultiplier: 1.60796,
      attributeMultiplier: 2.41194,
      physFixed: 241.72,
      conditions: [{ buffId: "debuff-mystic-smolder", op: "gte", stacks: 1 }],
    }

    const poet1 = healSkill(clone(skillIn(STORE, POET1))) as Skill
    expect(poet1.hits).toMatchObject([
      { id: "hit-0", ...strike },
      { id: "hit-1", ...strike },
    ])

    const poet2 = healSkill(clone(skillIn(STORE, POET2))) as Skill
    expect(poet2.hits).toMatchObject([
      { id: "hit-0", ...strike },
      { id: "hit-1", ...strike },
      { id: "hit-2", ...combustion },
      { id: "hit-3", ...smolder },
      { id: "hit-4", ...combustion },
      { id: "hit-5", ...smolder },
    ])
  })

  it("leaves an edited row alone", () => {
    const edited = clone(skillIn(STORE, POET2))
    edited.hits[0].physMultiplier = 5
    expect(healSkill(edited)).toEqual(edited)
  })

  it("leaves a skill the migration does not target alone", () => {
    const other = clone(skillIn(STORE, POET2))
    const generic = { ...other, id: "not-a-target-skill" }
    expect(healSkill(clone(generic))).toEqual(generic)
  })
})

describe("V56__poetSecondCollider — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V56__poetSecondCollider.migrate(clone(STORE))
    expect(after.v).toBe(56)
    for (const id of RECALIBRATED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V56__poetSecondCollider.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V56__poetSecondCollider.migrate(clone(once))).toEqual(once)
  })
})

describe("V56__poetSecondCollider — through the chain", () => {
  it("is registered and is exactly what the v55 → v56 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V56__poetSecondCollider)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 56 })!
    expect(result.applied).toEqual(["V56__poetSecondCollider"])
    expect(result.blob.v).toBe(56)
    expect(skillIn(result.blob, POET2).hits).toEqual(builtinOf(POET2).hits)
  })
})
