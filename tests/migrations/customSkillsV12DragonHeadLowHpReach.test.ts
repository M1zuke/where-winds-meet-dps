// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V12__dragonHeadLowHpReach,
  healDragonHeadLowHpReach,
} from "../../src/migrations/customSkills/V12__dragonHeadLowHpReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { SKILL as MYSTIC_SKILL } from "../../src/data/skills/mystic/ids"
import type { Skill } from "../../src/engine/skill"
import storeV11File from "./testCustomSkills/v11/store.json"

const CLASS = "bellstrikeUmbra"
const DRAGON_HEAD_ID = "bellstrikeUmbra-dragon-head"
const USER_AUTHORED = "sk-user-authored-slash"
const SEEDED_RECEIVES = ["surgingWaves"]
const HEALED_RECEIVES = ["surgingWaves", "dragonHeadLowHp"]
const STORE = storeV11File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v11 fixture", () => {
  it("is v11 and still lists only Surging Wave's Might on the base Dragon Head copy", () => {
    expect(STORE.v).toBe(V12__dragonHeadLowHpReach.to - 1)
    expect(skillIn(STORE, DRAGON_HEAD_ID).receives).toEqual(SEEDED_RECEIVES)
  })

  it("holds the corrected shape on the built-in the copy was seeded from", () => {
    expect(builtin(MYSTIC_SKILL.dragonHead).receives).toEqual(HEALED_RECEIVES)
  })
})

describe("healDragonHeadLowHpReach", () => {
  it("appends the low-HP buff to an untouched Dragon Head copy", () => {
    const healed = healDragonHeadLowHpReach(clone(skillIn(STORE, DRAGON_HEAD_ID))) as Skill
    expect(healed.receives).toEqual(HEALED_RECEIVES)
  })

  it("leaves a copy whose receives list has been edited alone", () => {
    const edited = {
      ...clone(skillIn(STORE, DRAGON_HEAD_ID)),
      receives: ["surgingWaves", "someOtherBuff"],
    }
    expect(healDragonHeadLowHpReach(edited)).toEqual(edited)
  })

  it("leaves an unrelated skill alone", () => {
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healDragonHeadLowHpReach(other)).toEqual(other)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, DRAGON_HEAD_ID))
    const snapshot = clone(input)
    const once = healDragonHeadLowHpReach(input)
    expect(input).toEqual(snapshot)
    expect(healDragonHeadLowHpReach(clone(once))).toEqual(once)
  })
})

describe("V12__dragonHeadLowHpReach — called directly", () => {
  it("heals the Dragon Head copy and nothing else", () => {
    const after = V12__dragonHeadLowHpReach.migrate(clone(STORE))
    expect(after.v).toBe(12)
    expect(skillIn(after, DRAGON_HEAD_ID).receives).toEqual(HEALED_RECEIVES)
    for (const skill of STORE.skills) {
      if (skill.id === DRAGON_HEAD_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V12__dragonHeadLowHpReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V12__dragonHeadLowHpReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V12__dragonHeadLowHpReach — through the chain", () => {
  it("is registered and is exactly what the v11 → v12 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V12__dragonHeadLowHpReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 12 })!
    expect(result.applied).toEqual(["V12__dragonHeadLowHpReach"])
    expect(result.blob.v).toBe(12)
    expect(skillIn(result.blob, DRAGON_HEAD_ID).receives).toEqual(HEALED_RECEIVES)
  })
})
