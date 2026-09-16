// Scoped to Silkbind Jade — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V20__silkbindJadeArtBonusAttack,
  healSilkbindJadeArtBonusAttack,
} from "../../src/migrations/customSkills/V20__silkbindJadeArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV19File from "./testCustomSkills/v19/store.json"

const FAN_SEEDED = "silkbindJade-fanq"
const FAN_SEEDED_OTHER = "silkbindJade-fanspecial"
const UMBRELLA_SEEDED = "silkbindJade-umbq"
const USER_AUTHORED = "sk-user-authored-silkbind-slash"
const OTHER_CLASS_SKILL = "bellstrikeSplendor-swordq"
const FAN_BUFF = "inkwellFanAdditionalAttack"
const UMBRELLA_BUFF = "vernalUmbrellaAdditionalAttack"
const STORE = storeV19File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v19 fixture", () => {
  it("is v19 and lists neither art buff on any Silkbind Jade Fan or Umbrella row", () => {
    expect(STORE.v).toBe(V20__silkbindJadeArtBonusAttack.to - 1)
    expect(skillIn(STORE, FAN_SEEDED).receives ?? []).not.toContain(FAN_BUFF)
    expect(skillIn(STORE, FAN_SEEDED_OTHER).receives ?? []).not.toContain(FAN_BUFF)
    expect(skillIn(STORE, UMBRELLA_SEEDED).receives ?? []).not.toContain(UMBRELLA_BUFF)
  })
})

describe("healSilkbindJadeArtBonusAttack", () => {
  it("appends the Fan buff to a stale Fan-tagged copy, keeping the entries it already had", () => {
    const before = clone(skillIn(STORE, FAN_SEEDED_OTHER))
    const healed = healSilkbindJadeArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), FAN_BUFF])
  })

  it("appends the Fan buff to a stale Fan-tagged copy with no prior receives", () => {
    const before = clone(skillIn(STORE, FAN_SEEDED))
    expect(before.receives).toBeUndefined()
    const healed = healSilkbindJadeArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([FAN_BUFF])
  })

  it("appends the Umbrella buff to a stale Umbrella-tagged copy", () => {
    const before = clone(skillIn(STORE, UMBRELLA_SEEDED))
    const healed = healSilkbindJadeArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), UMBRELLA_BUFF])
  })

  it("leaves an already-healed copy alone", () => {
    const healedOnce = healSilkbindJadeArtBonusAttack(clone(skillIn(STORE, FAN_SEEDED)))
    expect(healSilkbindJadeArtBonusAttack(clone(healedOnce))).toEqual(healedOnce)
  })

  it("leaves the user-authored entry alone — same weaponOrAttribute, but no weapon tag to match on", () => {
    const userAuthored = clone(skillIn(STORE, USER_AUTHORED))
    expect(userAuthored.tags).toEqual([])
    expect(healSilkbindJadeArtBonusAttack(userAuthored)).toEqual(userAuthored)
  })

  it("leaves a copy of another class's skill alone, even carrying a matching weapon tag", () => {
    const otherClass = clone(skillIn(STORE, OTHER_CLASS_SKILL))
    expect(healSilkbindJadeArtBonusAttack(otherClass)).toEqual(otherClass)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, UMBRELLA_SEEDED))
    const snapshot = clone(input)
    const once = healSilkbindJadeArtBonusAttack(input)
    expect(input).toEqual(snapshot)
    expect(healSilkbindJadeArtBonusAttack(clone(once))).toEqual(once)
  })
})

describe("V20__silkbindJadeArtBonusAttack — called directly", () => {
  it("heals every Fan and Umbrella row and nothing else", () => {
    const after = V20__silkbindJadeArtBonusAttack.migrate(clone(STORE))
    expect(after.v).toBe(20)
    expect(skillIn(after, FAN_SEEDED).receives).toContain(FAN_BUFF)
    expect(skillIn(after, FAN_SEEDED_OTHER).receives).toContain(FAN_BUFF)
    expect(skillIn(after, UMBRELLA_SEEDED).receives).toContain(UMBRELLA_BUFF)
    for (const skill of STORE.skills) {
      if ([FAN_SEEDED, FAN_SEEDED_OTHER, UMBRELLA_SEEDED].includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V20__silkbindJadeArtBonusAttack.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V20__silkbindJadeArtBonusAttack.migrate(clone(once))).toEqual(once)
  })
})

describe("V20__silkbindJadeArtBonusAttack — through the chain", () => {
  it("is registered and is exactly what the v19 → v20 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V20__silkbindJadeArtBonusAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 20 })!
    expect(result.applied).toEqual(["V20__silkbindJadeArtBonusAttack"])
    expect(result.blob.v).toBe(20)
    expect(skillIn(result.blob, FAN_SEEDED).receives).toContain(FAN_BUFF)
    expect(skillIn(result.blob, UMBRELLA_SEEDED).receives).toContain(UMBRELLA_BUFF)
  })
})
