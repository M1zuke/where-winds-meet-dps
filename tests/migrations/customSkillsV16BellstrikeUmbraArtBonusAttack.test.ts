// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V16__bellstrikeUmbraArtBonusAttack,
  healBellstrikeUmbraArtBonusAttack,
} from "../../src/migrations/customSkills/V16__bellstrikeUmbraArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV15File from "./testCustomSkills/v15/store.json"

const SWORD_SEEDED = "bellstrikeUmbra-swordq"
const SWORD_SEEDED_OTHER = "bellstrikeUmbra-swordqfollowup"
const SPEAR_SEEDED = "bellstrikeUmbra-spearspecial"
const USER_AUTHORED = "sk-user-authored-slash"
const UNTAGGED_UMBRA_SKILL = "bellstrikeUmbra-flute-of-the-tides-full"
const OTHER_CLASS_SKILL = "stonesplitStrength-dragon-head-plus"
const SWORD_BUFF = "strategicSwordAdditionalAttack"
const SPEAR_BUFF = "heavenquakerSpearAdditionalAttack"
const STORE = storeV15File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v15 fixture", () => {
  it("is v15 and lists neither art buff on any Bellstrike Umbra sword or spear row", () => {
    expect(STORE.v).toBe(V16__bellstrikeUmbraArtBonusAttack.to - 1)
    expect(skillIn(STORE, SWORD_SEEDED).receives ?? []).not.toContain(SWORD_BUFF)
    expect(skillIn(STORE, SWORD_SEEDED_OTHER).receives ?? []).not.toContain(SWORD_BUFF)
    expect(skillIn(STORE, SPEAR_SEEDED).receives ?? []).not.toContain(SPEAR_BUFF)
  })
})

describe("healBellstrikeUmbraArtBonusAttack", () => {
  it("appends the sword buff to a stale sword-tagged Bellstrike Umbra copy, keeping the entries it already had", () => {
    const before = clone(skillIn(STORE, SWORD_SEEDED))
    const healed = healBellstrikeUmbraArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), SWORD_BUFF])
  })

  it("appends the spear buff to a stale spear-tagged copy, keeping its pre-existing receives entries", () => {
    const before = clone(skillIn(STORE, SPEAR_SEEDED))
    expect(before.receives).toEqual(["mistwillowLightBuff", "mistwillowBuff"])
    const healed = healBellstrikeUmbraArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), SPEAR_BUFF])
  })

  it("leaves an already-healed copy alone", () => {
    const healedOnce = healBellstrikeUmbraArtBonusAttack(clone(skillIn(STORE, SWORD_SEEDED)))
    expect(healBellstrikeUmbraArtBonusAttack(clone(healedOnce))).toEqual(healedOnce)
  })

  it("leaves the user-authored entry alone — same weaponOrAttribute, but no weapon tag to match on", () => {
    const userAuthored = clone(skillIn(STORE, USER_AUTHORED))
    expect(userAuthored.tags).toEqual([])
    expect(healBellstrikeUmbraArtBonusAttack(userAuthored)).toEqual(userAuthored)
  })

  it("leaves a Bellstrike Umbra copy with no weapon tag alone", () => {
    const untagged = clone(skillIn(STORE, UNTAGGED_UMBRA_SKILL))
    expect(healBellstrikeUmbraArtBonusAttack(untagged)).toEqual(untagged)
  })

  it("leaves a copy of another class's skill alone, even carrying a matching weapon tag", () => {
    const otherClass = clone(skillIn(STORE, OTHER_CLASS_SKILL))
    expect(healBellstrikeUmbraArtBonusAttack(otherClass)).toEqual(otherClass)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, SWORD_SEEDED))
    const snapshot = clone(input)
    const once = healBellstrikeUmbraArtBonusAttack(input)
    expect(input).toEqual(snapshot)
    expect(healBellstrikeUmbraArtBonusAttack(clone(once))).toEqual(once)
  })
})

describe("V16__bellstrikeUmbraArtBonusAttack — called directly", () => {
  it("heals every sword and spear row and nothing else", () => {
    const after = V16__bellstrikeUmbraArtBonusAttack.migrate(clone(STORE))
    expect(after.v).toBe(16)
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
    const once = V16__bellstrikeUmbraArtBonusAttack.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V16__bellstrikeUmbraArtBonusAttack.migrate(clone(once))).toEqual(once)
  })
})

describe("V16__bellstrikeUmbraArtBonusAttack — through the chain", () => {
  it("is registered and is exactly what the v15 → v16 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V16__bellstrikeUmbraArtBonusAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 16 })!
    expect(result.applied).toEqual(["V16__bellstrikeUmbraArtBonusAttack"])
    expect(result.blob.v).toBe(16)
    expect(skillIn(result.blob, SWORD_SEEDED).receives).toContain(SWORD_BUFF)
    expect(skillIn(result.blob, SPEAR_SEEDED).receives).toContain(SPEAR_BUFF)
  })
})
