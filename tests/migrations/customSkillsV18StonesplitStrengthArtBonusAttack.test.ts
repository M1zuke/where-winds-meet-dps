// Scoped to Stonesplit Strength — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V18__stonesplitStrengthArtBonusAttack,
  healStonesplitStrengthArtBonusAttack,
} from "../../src/migrations/customSkills/V18__stonesplitStrengthArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV17File from "./testCustomSkills/v17/store.json"

const MO_BLADE_SEEDED = "stonesplitStrength-phalanxq"
const MO_BLADE_SEEDED_OTHER = "stonesplitStrength-phalanxspecial"
const HENG_BLADE_SEEDED = "stonesplitStrength-snowpartingdual"
const USER_AUTHORED = "sk-user-authored-stonesplit-slash"
const OTHER_CLASS_SKILL = "bellstrikeSplendor-swordq"
const MO_BLADE_BUFF = "phalanxbaneBladeAdditionalAttack"
const HENG_BLADE_BUFF = "snowpartingBladeAdditionalAttack"
const STORE = storeV17File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v17 fixture", () => {
  it("is v17 and lists neither art buff on any Stonesplit Strength Mo Blade or Heng Blade row", () => {
    expect(STORE.v).toBe(V18__stonesplitStrengthArtBonusAttack.to - 1)
    expect(skillIn(STORE, MO_BLADE_SEEDED).receives ?? []).not.toContain(MO_BLADE_BUFF)
    expect(skillIn(STORE, MO_BLADE_SEEDED_OTHER).receives ?? []).not.toContain(MO_BLADE_BUFF)
    expect(skillIn(STORE, HENG_BLADE_SEEDED).receives ?? []).not.toContain(HENG_BLADE_BUFF)
  })
})

describe("healStonesplitStrengthArtBonusAttack", () => {
  it("appends the Mo Blade buff to a stale Mo Blade-tagged copy, keeping the entries it already had", () => {
    const before = clone(skillIn(STORE, MO_BLADE_SEEDED))
    const healed = healStonesplitStrengthArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), MO_BLADE_BUFF])
  })

  it("appends the Mo Blade buff to a stale Mo Blade-tagged copy with no prior receives", () => {
    const before = clone(skillIn(STORE, MO_BLADE_SEEDED_OTHER))
    expect(before.receives).toBeUndefined()
    const healed = healStonesplitStrengthArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([MO_BLADE_BUFF])
  })

  it("appends the Heng Blade buff to a stale Heng Blade-tagged copy", () => {
    const before = clone(skillIn(STORE, HENG_BLADE_SEEDED))
    expect(before.receives).toBeUndefined()
    const healed = healStonesplitStrengthArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([HENG_BLADE_BUFF])
  })

  it("leaves an already-healed copy alone", () => {
    const healedOnce = healStonesplitStrengthArtBonusAttack(clone(skillIn(STORE, MO_BLADE_SEEDED)))
    expect(healStonesplitStrengthArtBonusAttack(clone(healedOnce))).toEqual(healedOnce)
  })

  it("leaves the user-authored entry alone — same weaponOrAttribute, but no weapon tag to match on", () => {
    const userAuthored = clone(skillIn(STORE, USER_AUTHORED))
    expect(userAuthored.tags).toEqual([])
    expect(healStonesplitStrengthArtBonusAttack(userAuthored)).toEqual(userAuthored)
  })

  it("leaves a copy of another class's skill alone, even carrying a matching weapon tag", () => {
    const otherClass = clone(skillIn(STORE, OTHER_CLASS_SKILL))
    expect(healStonesplitStrengthArtBonusAttack(otherClass)).toEqual(otherClass)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, MO_BLADE_SEEDED))
    const snapshot = clone(input)
    const once = healStonesplitStrengthArtBonusAttack(input)
    expect(input).toEqual(snapshot)
    expect(healStonesplitStrengthArtBonusAttack(clone(once))).toEqual(once)
  })
})

describe("V18__stonesplitStrengthArtBonusAttack — called directly", () => {
  it("heals every Mo Blade and Heng Blade row and nothing else", () => {
    const after = V18__stonesplitStrengthArtBonusAttack.migrate(clone(STORE))
    expect(after.v).toBe(18)
    expect(skillIn(after, MO_BLADE_SEEDED).receives).toContain(MO_BLADE_BUFF)
    expect(skillIn(after, MO_BLADE_SEEDED_OTHER).receives).toContain(MO_BLADE_BUFF)
    expect(skillIn(after, HENG_BLADE_SEEDED).receives).toContain(HENG_BLADE_BUFF)
    for (const skill of STORE.skills) {
      if ([MO_BLADE_SEEDED, MO_BLADE_SEEDED_OTHER, HENG_BLADE_SEEDED].includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V18__stonesplitStrengthArtBonusAttack.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V18__stonesplitStrengthArtBonusAttack.migrate(clone(once))).toEqual(once)
  })
})

describe("V18__stonesplitStrengthArtBonusAttack — through the chain", () => {
  it("is registered and is exactly what the v17 → v18 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V18__stonesplitStrengthArtBonusAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 18 })!
    expect(result.applied).toEqual(["V18__stonesplitStrengthArtBonusAttack"])
    expect(result.blob.v).toBe(18)
    expect(skillIn(result.blob, MO_BLADE_SEEDED).receives).toContain(MO_BLADE_BUFF)
    expect(skillIn(result.blob, HENG_BLADE_SEEDED).receives).toContain(HENG_BLADE_BUFF)
  })
})
