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

// The exact shape this hop alone produces, pinned independently of what a
// later hop (e.g. the second Poet collider) goes on to do to the same rows —
// this file locks V23's own behavior, not the live built-in.
const V23_COMBUSTION_EXPLOSION_HIT = {
  id: "hit-1",
  frame: 0,
  physMultiplier: 0.70166,
  attributeMultiplier: 1.05249,
  physFixed: 105.48,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [],
  conditions: [
    { buffId: "debuff-mystic-combustion", op: "gte" as const, stacks: 1 },
    { buffId: "debuff-mystic-smolder", op: "eq" as const, stacks: 0 },
  ],
}
const V23_SMOLDER_EXPLOSION_HIT = {
  id: "hit-2",
  frame: 0,
  physMultiplier: 1.60796,
  attributeMultiplier: 2.41194,
  physFixed: 241.72,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: [],
  conditions: [{ buffId: "debuff-mystic-smolder", op: "gte" as const, stacks: 1 }],
}
const v23PoetHits = (id: string): Skill["hits"] => [
  skillIn(STORE, id).hits[0],
  V23_COMBUSTION_EXPLOSION_HIT,
  V23_SMOLDER_EXPLOSION_HIT,
]
const v23FinalStrikeHits = (): Skill["hits"] => [
  {
    ...skillIn(STORE, FINAL_STRIKE).hits[0],
    triggers: [
      ...skillIn(STORE, FINAL_STRIKE).hits[0].triggers,
      {
        kind: "castSkill",
        targetId: "mystic-poet-final-hit-cancel-explosion",
        stacks: 1,
        condition: null,
      },
    ],
  },
]

describe("custom-skills v22 fixture", () => {
  it("is v22 and still stores the superseded, shorter Poet rows", () => {
    expect(STORE.v).toBe(V23__drunkenHazeExplosion.to - 1)
    for (const id of [POET2, POET3, POET4, FINAL_STRIKE]) {
      expect(skillIn(STORE, id).hits, id).toHaveLength(1)
    }
  })

  it("stores rows the built-ins no longer carry", () => {
    expect(builtinOf(POET2).hits).toHaveLength(6)
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
      expect(healed, id).toEqual(v23PoetHits(id))
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
    expect(healed).toEqual(v23FinalStrikeHits())
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
    const expectedHits = (id: string): Skill["hits"] =>
      id === FINAL_STRIKE ? v23FinalStrikeHits() : v23PoetHits(id)
    for (const id of RECALIBRATED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(expectedHits(id))
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
    expect(skillIn(result.blob, POET2).hits).toEqual(v23PoetHits(POET2))
  })
})
