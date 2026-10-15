import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V68__mysticArtLevelCap,
  swapsForMysticArt,
} from "../../src/migrations/customSkills/V68__mysticArtLevelCap"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV67File from "./testCustomSkills/v67/store.json"

const STORE = storeV67File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_COPY = "bamboocutDraught-dragon-head"
const USER_AUTHORED = "sk-user-authored-slash"
const DRAGON_HEAD = "mystic-dragon-head"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const seededMysticIds = (): string[] =>
  (STORE.skills as Skill[])
    .filter((skill) => skill.id.startsWith("mystic-"))
    .map((skill) => skill.id)

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

describe("custom-skills v67 fixture", () => {
  it("is v67 and stores every mystic art at the level-71 row", () => {
    expect(STORE.v).toBe(V68__mysticArtLevelCap.to - 1)
    expect(skillIn(STORE, DRAGON_HEAD).hits[0]!.physMultiplier).toBe(19.07454)
    expect(skillIn(STORE, "mystic-toad-fury").hits[1]!.physMultiplier).toBe(3.060207)
  })

  it("stores rows the built-ins no longer carry", () => {
    expect(builtinOf(DRAGON_HEAD).hits[0]!.physMultiplier).toBe(19.07564)
  })
})

describe("V68__mysticArtLevelCap — called directly", () => {
  it("rewrites every untouched seeded mystic copy onto the built-in's own rows", () => {
    const after = V68__mysticArtLevelCap.migrate(clone(STORE))
    expect(after.v).toBe(68)
    const ids = seededMysticIds()
    expect(ids.length).toBeGreaterThan(20)
    for (const id of ids) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
  })

  it("leaves an edited copy, a user-authored skill and every other field alone", () => {
    const after = V68__mysticArtLevelCap.migrate(clone(STORE))
    expect(skillIn(after, EDITED_COPY)).toEqual(skillIn(STORE, EDITED_COPY))
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    for (const id of seededMysticIds()) {
      const { hits: _beforeHits, ...restBefore } = skillIn(STORE, id)
      const { hits: _afterHits, ...restAfter } = skillIn(after, id)
      void _beforeHits
      void _afterHits
      expect(restAfter, id).toEqual(restBefore)
    }
  })

  it("rewrites a row that sits beside an edited row of the same skill", () => {
    const partial = clone(STORE)
    const poet = skillIn(partial, "mystic-poet2")
    poet.hits[0]!.physMultiplier = 9
    const after = V68__mysticArtLevelCap.migrate(partial)
    const healed = skillIn(after, "mystic-poet2").hits
    expect(healed[0]!.physMultiplier).toBe(9)
    expect(healed.slice(1)).toEqual(builtinOf("mystic-poet2").hits.slice(1))
  })

  it("matches the suffix a legacy per-class id carries", () => {
    expect(swapsForMysticArt("bellstrikeUmbra-poet1")).toBeDefined()
    expect(swapsForMysticArt("bellstrikeUmbra-swordq")).toBeUndefined()
    expect(swapsForMysticArt("mystic-dragon-head-plus")).not.toBe(
      swapsForMysticArt("mystic-dragon-head"),
    )
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V68__mysticArtLevelCap.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V68__mysticArtLevelCap.migrate(clone(once))).toEqual(once)
  })
})

describe("V68__mysticArtLevelCap — through the chain", () => {
  it("is registered and is exactly what the v67 → v68 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V68__mysticArtLevelCap)
    const throughV68 = CUSTOM_SKILL_MIGRATIONS.filter((step) => step.to <= 68)
    const result = runChain(throughV68, 68, clone(STORE))!
    expect(result.applied).toEqual(["V68__mysticArtLevelCap"])
    expect(result.blob.v).toBe(68)
    expect(skillIn(result.blob, DRAGON_HEAD).hits).toEqual(builtinOf(DRAGON_HEAD).hits)
  })

  it("removing the step from the registry leaves the pre-migration rows untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V68__mysticArtLevelCap)
    const result = runChain(withoutStep, 68, clone(STORE))!
    expect(result.applied).not.toContain("V68__mysticArtLevelCap")
    expect(skillIn(result.blob, DRAGON_HEAD).hits[0]!.physMultiplier).toBe(19.07454)
  })
})
