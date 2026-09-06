import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  LATEST_CUSTOM_SKILLS_VERSION,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V7__neverAbrades,
  migrateNeverAbradesSkill,
} from "../../src/migrations/customSkills/V7__neverAbrades"
import { loadCustomSkills, loadCustomSkillsForClass } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV6File from "./testCustomSkills/v6/store.json"

const SKILLS_KEY = "wwm.customSkills"
const SEEDED_COPY = "mystic-dragon-head-plus"
const EDITED_COPY = "stonesplitStrength-dragon-head-plus"
const USER_AUTHORED = "sk-user-authored-slash"
const UNTOUCHED_SKILL = "sk-user-authored-poet-chain"
const STORE = storeV6File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: { skills: unknown[] }, id: string): Record<string, unknown> =>
  (blob.skills as Record<string, unknown>[]).find((skill) => skill.id === id)!

describe("custom-skills v6 fixture", () => {
  it("is v6 and still carries the old flag on every kind of copy", () => {
    expect(STORE.v).toBe(V7__neverAbrades.to - 1)
    for (const id of [SEEDED_COPY, EDITED_COPY, USER_AUTHORED]) {
      expect(skillIn(STORE, id).guaranteedPrecision, id).toBe(true)
      expect(skillIn(STORE, id).neverAbrades, id).toBeUndefined()
    }
  })
})

describe("migrateNeverAbradesSkill", () => {
  it("renames the flag and drops the old key", () => {
    const migrated = migrateNeverAbradesSkill(clone(skillIn(STORE, SEEDED_COPY))) as Skill
    expect(migrated.neverAbrades).toBe(true)
    expect("guaranteedPrecision" in migrated).toBe(false)
  })

  it("leaves a skill that never carried the flag untouched", () => {
    const untouched = clone(skillIn(STORE, UNTOUCHED_SKILL))
    expect(migrateNeverAbradesSkill(untouched)).toEqual(untouched)
  })
})

describe("V7__neverAbrades — called directly", () => {
  const after = V7__neverAbrades.migrate(clone(STORE))

  it("renames the flag on the seeded copy", () => {
    expect(after.v).toBe(7)
    const seeded = skillIn(after, SEEDED_COPY)
    expect(seeded.neverAbrades).toBe(true)
    expect("guaranteedPrecision" in seeded).toBe(false)
  })

  it("renames the flag on an edited second-class copy the same way", () => {
    const edited = skillIn(after, EDITED_COPY)
    expect(edited.neverAbrades).toBe(true)
    expect("guaranteedPrecision" in edited).toBe(false)
  })

  it("renames the flag on a user-authored skill", () => {
    const authored = skillIn(after, USER_AUTHORED)
    expect(authored.neverAbrades).toBe(true)
    expect("guaranteedPrecision" in authored).toBe(false)
  })

  it("leaves a skill with no flag untouched", () => {
    expect(skillIn(after, UNTOUCHED_SKILL)).toEqual(skillIn(STORE, UNTOUCHED_SKILL))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V7__neverAbrades.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V7__neverAbrades.migrate(clone(once))).toEqual(once)
  })
})

describe("V7__neverAbrades — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v6 → v7 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V7__neverAbrades)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 7 })!
    expect(result.applied).toEqual(["V7__neverAbrades"])
    expect(result.blob.v).toBe(7)
  })

  it("loadCustomSkills persists the store at the latest version with the flag renamed everywhere", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of [SEEDED_COPY, EDITED_COPY, USER_AUTHORED]) {
      const skill = loaded.find((entry) => entry.id === id)!
      expect(skill.neverAbrades, id).toBe(true)
      expect("guaranteedPrecision" in skill, id).toBe(false)
    }
    const persisted = JSON.parse(localStorage.getItem(SKILLS_KEY)!) as RawCustomSkillsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
    expect(
      loadCustomSkillsForClass("stonesplitStrength").find((skill) => skill.id === EDITED_COPY)
        ?.neverAbrades,
    ).toBe(true)
  })
})
