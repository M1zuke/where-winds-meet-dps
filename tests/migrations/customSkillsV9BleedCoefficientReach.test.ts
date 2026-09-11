// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V9__bleedCoefficientReach,
  healBleedCoefficientReach,
} from "../../src/migrations/customSkills/V9__bleedCoefficientReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV8File from "./testCustomSkills/v8/store.json"

const CLASS = "bellstrikeUmbra"
const BLEED_TICK = `${CLASS}-bleed-tick`
const BLEED_DETONATION = `${CLASS}-bleed-detonation`
const USER_AUTHORED = "sk-user-authored-slash"
const COEFFICIENT_BUFF = "bellstrikeUmbraBleedCoefficient"
const EMPOWERED_TAG = "prop:empoweredDotEffect"
const STORE = storeV8File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v8 fixture", () => {
  it("is v8 and still lists neither the coefficient buff nor the empowered tag", () => {
    expect(STORE.v).toBe(V9__bleedCoefficientReach.to - 1)
    expect(skillIn(STORE, BLEED_TICK).receives).not.toContain(COEFFICIENT_BUFF)
    expect(skillIn(STORE, BLEED_DETONATION).receives).not.toContain(COEFFICIENT_BUFF)
    expect(skillIn(STORE, BLEED_DETONATION).tags).not.toContain(EMPOWERED_TAG)
  })

  it("holds both on the built-ins the copies were seeded from", () => {
    expect(builtin(BLEED_TICK).receives).toContain(COEFFICIENT_BUFF)
    expect(builtin(BLEED_DETONATION).receives).toContain(COEFFICIENT_BUFF)
    expect(builtin(BLEED_DETONATION).tags).toContain(EMPOWERED_TAG)
  })
})

describe("healBleedCoefficientReach", () => {
  it("appends the coefficient buff to a stale bleed tick, keeping the entries it already had", () => {
    const before = clone(skillIn(STORE, BLEED_TICK))
    const healed = healBleedCoefficientReach(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), COEFFICIENT_BUFF])
  })

  it("appends both the coefficient buff and the empowered tag to a stale blood burst", () => {
    const before = clone(skillIn(STORE, BLEED_DETONATION))
    const healed = healBleedCoefficientReach(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), COEFFICIENT_BUFF])
    expect(healed.tags).toEqual([...(before.tags ?? []), EMPOWERED_TAG])
  })

  it("leaves an already-healed copy, and a skill with another id, alone", () => {
    const healedOnce = healBleedCoefficientReach(clone(skillIn(STORE, BLEED_DETONATION)))
    expect(healBleedCoefficientReach(clone(healedOnce))).toEqual(healedOnce)
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healBleedCoefficientReach(other)).toEqual(other)
  })
})

describe("V9__bleedCoefficientReach — called directly", () => {
  it("heals both bleed rows and nothing else", () => {
    const after = V9__bleedCoefficientReach.migrate(clone(STORE))
    expect(after.v).toBe(9)
    expect(skillIn(after, BLEED_TICK).receives).toContain(COEFFICIENT_BUFF)
    expect(skillIn(after, BLEED_DETONATION).tags).toContain(EMPOWERED_TAG)
    for (const skill of STORE.skills) {
      if (skill.id === BLEED_TICK || skill.id === BLEED_DETONATION) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V9__bleedCoefficientReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V9__bleedCoefficientReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V9__bleedCoefficientReach — through the chain", () => {
  it("is registered and is exactly what the v8 → v9 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V9__bleedCoefficientReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 9 })!
    expect(result.applied).toEqual(["V9__bleedCoefficientReach"])
    expect(result.blob.v).toBe(9)
    expect(skillIn(result.blob, BLEED_DETONATION).receives).toContain(COEFFICIENT_BUFF)
  })
})
