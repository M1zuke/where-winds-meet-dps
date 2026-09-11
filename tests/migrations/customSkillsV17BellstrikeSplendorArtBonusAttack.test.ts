// Scoped to Bellstrike Splendor — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V17__bellstrikeSplendorArtBonusAttack,
  healBellstrikeSplendorArtBonusAttack,
} from "../../src/migrations/customSkills/V17__bellstrikeSplendorArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV16File from "./testCustomSkills/v16/store.json"

const SWORD_SEEDED = "bellstrikeSplendor-swordq"
const SWORD_SEEDED_OTHER = "bellstrikeSplendor-swordq-2nd"
const SPEAR_SEEDED = "bellstrikeSplendor-spearq"
const USER_AUTHORED = "sk-user-authored-splendor-slash"
const OTHER_CLASS_SKILL = "stonesplitStrength-dragon-head-plus"
const SWORD_BUFF = "namelessSwordAdditionalAttack"
const SPEAR_BUFF = "namelessSpearAdditionalAttack"
const STORE = storeV16File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v16 fixture", () => {
  it("is v16 and lists neither art buff on any Bellstrike Splendor sword or spear row", () => {
    expect(STORE.v).toBe(V17__bellstrikeSplendorArtBonusAttack.to - 1)
    expect(skillIn(STORE, SWORD_SEEDED).receives ?? []).not.toContain(SWORD_BUFF)
    expect(skillIn(STORE, SWORD_SEEDED_OTHER).receives ?? []).not.toContain(SWORD_BUFF)
    expect(skillIn(STORE, SPEAR_SEEDED).receives ?? []).not.toContain(SPEAR_BUFF)
  })
})

describe("healBellstrikeSplendorArtBonusAttack", () => {
  it("appends the sword buff to a stale sword-tagged Bellstrike Splendor copy with no prior receives", () => {
    const before = clone(skillIn(STORE, SWORD_SEEDED))
    expect(before.receives).toBeUndefined()
    const healed = healBellstrikeSplendorArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([SWORD_BUFF])
  })

  it("appends the sword buff to every sword-tagged copy, not just the first", () => {
    const before = clone(skillIn(STORE, SWORD_SEEDED_OTHER))
    const healed = healBellstrikeSplendorArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([SWORD_BUFF])
  })

  it("appends the spear buff to a stale spear-tagged copy", () => {
    const before = clone(skillIn(STORE, SPEAR_SEEDED))
    const healed = healBellstrikeSplendorArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([SPEAR_BUFF])
  })

  it("leaves an already-healed copy alone", () => {
    const healedOnce = healBellstrikeSplendorArtBonusAttack(clone(skillIn(STORE, SWORD_SEEDED)))
    expect(healBellstrikeSplendorArtBonusAttack(clone(healedOnce))).toEqual(healedOnce)
  })

  it("leaves the user-authored entry alone — same weaponOrAttribute, but no weapon tag to match on", () => {
    const userAuthored = clone(skillIn(STORE, USER_AUTHORED))
    expect(userAuthored.tags).toEqual([])
    expect(healBellstrikeSplendorArtBonusAttack(userAuthored)).toEqual(userAuthored)
  })

  it("leaves a copy of another class's skill alone, even carrying a matching weapon tag", () => {
    const otherClass = clone(skillIn(STORE, OTHER_CLASS_SKILL))
    expect(healBellstrikeSplendorArtBonusAttack(otherClass)).toEqual(otherClass)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, SWORD_SEEDED))
    const snapshot = clone(input)
    const once = healBellstrikeSplendorArtBonusAttack(input)
    expect(input).toEqual(snapshot)
    expect(healBellstrikeSplendorArtBonusAttack(clone(once))).toEqual(once)
  })
})

describe("V17__bellstrikeSplendorArtBonusAttack — called directly", () => {
  it("heals every sword and spear row and nothing else", () => {
    const after = V17__bellstrikeSplendorArtBonusAttack.migrate(clone(STORE))
    expect(after.v).toBe(17)
    expect(skillIn(after, SWORD_SEEDED).receives).toContain(SWORD_BUFF)
    expect(skillIn(after, SWORD_SEEDED_OTHER).receives).toContain(SWORD_BUFF)
    expect(skillIn(after, SPEAR_SEEDED).receives).toContain(SPEAR_BUFF)
    for (const skill of STORE.skills) {
      if ([SWORD_SEEDED, SWORD_SEEDED_OTHER, SPEAR_SEEDED].includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V17__bellstrikeSplendorArtBonusAttack.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V17__bellstrikeSplendorArtBonusAttack.migrate(clone(once))).toEqual(once)
  })
})

describe("V17__bellstrikeSplendorArtBonusAttack — through the chain", () => {
  it("is registered and is exactly what the v16 → v17 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V17__bellstrikeSplendorArtBonusAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 17 })!
    expect(result.applied).toEqual(["V17__bellstrikeSplendorArtBonusAttack"])
    expect(result.blob.v).toBe(17)
    expect(skillIn(result.blob, SWORD_SEEDED).receives).toContain(SWORD_BUFF)
    expect(skillIn(result.blob, SPEAR_SEEDED).receives).toContain(SPEAR_BUFF)
  })
})
