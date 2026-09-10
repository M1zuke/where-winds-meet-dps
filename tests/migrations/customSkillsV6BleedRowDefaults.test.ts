// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V6__bleedRowDefaults,
  healBleedRowDefaults,
} from "../../src/migrations/customSkills/V6__bleedRowDefaults"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV5File from "./testCustomSkills/v5/store.json"

const CLASS = "bellstrikeUmbra"
const BLEED_TICK = `${CLASS}-bleed-tick`
const BLEED_DETONATION = `${CLASS}-bleed-detonation`
const USER_AUTHORED = "sk-user-authored-slash"
const STORE = storeV5File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v5 fixture", () => {
  it("is v5 and still stores the superseded bleed row fields", () => {
    expect(STORE.v).toBe(V6__bleedRowDefaults.to - 1)
    expect(skillIn(STORE, BLEED_TICK).elevatedAttributeMultiplier).toBe(false)
    expect(skillIn(STORE, BLEED_DETONATION).skillType).toBe("sustain")
  })

  it("holds fields the built-ins no longer carry", () => {
    expect(builtin(BLEED_TICK).elevatedAttributeMultiplier).not.toBe(false)
    expect(builtin(BLEED_DETONATION).skillType).not.toBe("sustain")
  })
})

describe("healBleedRowDefaults", () => {
  it("drops an untouched bleed tick's stale elevatedAttributeMultiplier", () => {
    const healed = healBleedRowDefaults(clone(skillIn(STORE, BLEED_TICK))) as Skill
    expect(healed.elevatedAttributeMultiplier).toBeUndefined()
    expect("elevatedAttributeMultiplier" in healed).toBe(false)
  })

  it("rewrites an untouched blood burst's stale skillType to weapon", () => {
    const healed = healBleedRowDefaults(clone(skillIn(STORE, BLEED_DETONATION))) as Skill
    expect(healed.skillType).toBe("weapon")
  })

  it("leaves an edited copy of either skill, and a skill with another id, alone", () => {
    const editedTick = { ...clone(skillIn(STORE, BLEED_TICK)), elevatedAttributeMultiplier: true }
    expect(healBleedRowDefaults(editedTick)).toEqual(editedTick)
    const editedDetonation = { ...clone(skillIn(STORE, BLEED_DETONATION)), skillType: "mystic" }
    expect(healBleedRowDefaults(editedDetonation)).toEqual(editedDetonation)
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healBleedRowDefaults(other)).toEqual(other)
  })
})

describe("V6__bleedRowDefaults — called directly", () => {
  it("heals both stale bleed rows and nothing else", () => {
    const after = V6__bleedRowDefaults.migrate(clone(STORE))
    expect(after.v).toBe(6)
    expect(skillIn(after, BLEED_TICK).elevatedAttributeMultiplier).toBeUndefined()
    expect(skillIn(after, BLEED_DETONATION).skillType).toBe("weapon")
    for (const skill of STORE.skills) {
      if (skill.id === BLEED_TICK || skill.id === BLEED_DETONATION) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("touches nothing on the healed rows but the one stale field", () => {
    const after = V6__bleedRowDefaults.migrate(clone(STORE))
    const { elevatedAttributeMultiplier: _before, ...tickRest } = skillIn(STORE, BLEED_TICK)
    void _before
    expect(skillIn(after, BLEED_TICK)).toEqual(tickRest)
    const { skillType: _beforeType, ...detonationRest } = skillIn(STORE, BLEED_DETONATION)
    void _beforeType
    expect(skillIn(after, BLEED_DETONATION)).toEqual({ ...detonationRest, skillType: "weapon" })
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V6__bleedRowDefaults.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V6__bleedRowDefaults.migrate(clone(once))).toEqual(once)
  })
})

describe("V6__bleedRowDefaults — through the chain", () => {
  it("is registered and is exactly what the v5 → v6 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V6__bleedRowDefaults)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 6 })!
    expect(result.applied).toEqual(["V6__bleedRowDefaults"])
    expect(result.blob.v).toBe(6)
    expect(skillIn(result.blob, BLEED_DETONATION).skillType).toBe("weapon")
  })
})
