// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V10__wolfchasersArtSwordOverreach,
  healWolfchasersArtSwordOverreach,
} from "../../src/migrations/customSkills/V10__wolfchasersArtSwordOverreach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV9File from "./testCustomSkills/v9/store.json"

const CLASS = "bellstrikeUmbra"
const SWORD_MARTIAL_Q_IDS = [
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-swordqfollowup",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  "bellstrikeUmbra-sword-martial-qqq",
]
const SPEAR_Q_IDS = ["bellstrikeUmbra-spearq"]
const USER_AUTHORED = "sk-user-authored-slash"
const BUFF_ID = "wolfchasersArtMartialDamage"
const STORE = storeV9File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v9 fixture", () => {
  it("is v9 and still lists the buff on every sword Martial Q row", () => {
    expect(STORE.v).toBe(V10__wolfchasersArtSwordOverreach.to - 1)
    for (const id of SWORD_MARTIAL_Q_IDS) expect(skillIn(STORE, id).receives).toEqual([BUFF_ID])
  })

  it("keeps the buff on the spear Q rows the bonus actually belongs to", () => {
    for (const id of SPEAR_Q_IDS) expect(skillIn(STORE, id).receives).toContain(BUFF_ID)
  })

  it("holds the corrected shape on the built-ins the copies were seeded from", () => {
    for (const id of SWORD_MARTIAL_Q_IDS) expect(builtin(id).receives ?? []).not.toContain(BUFF_ID)
    for (const id of SPEAR_Q_IDS) expect(builtin(id).receives).toContain(BUFF_ID)
  })
})

describe("healWolfchasersArtSwordOverreach", () => {
  it("strips the buff id from an untouched sword Martial Q copy", () => {
    for (const id of SWORD_MARTIAL_Q_IDS) {
      const healed = healWolfchasersArtSwordOverreach(clone(skillIn(STORE, id))) as Skill
      expect(healed.receives).toBeUndefined()
    }
  })

  it("leaves a copy whose receives list has been edited alone", () => {
    const edited = {
      ...clone(skillIn(STORE, SWORD_MARTIAL_Q_IDS[0])),
      receives: [BUFF_ID, "someOtherBuff"],
    }
    expect(healWolfchasersArtSwordOverreach(edited)).toEqual(edited)
  })

  it("leaves the spear Q rows alone", () => {
    for (const id of SPEAR_Q_IDS) {
      const before = clone(skillIn(STORE, id))
      expect(healWolfchasersArtSwordOverreach(before)).toEqual(before)
    }
  })

  it("leaves an unrelated skill alone", () => {
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healWolfchasersArtSwordOverreach(other)).toEqual(other)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, SWORD_MARTIAL_Q_IDS[0]))
    const snapshot = clone(input)
    const once = healWolfchasersArtSwordOverreach(input)
    expect(input).toEqual(snapshot)
    expect(healWolfchasersArtSwordOverreach(clone(once))).toEqual(once)
  })
})

describe("V10__wolfchasersArtSwordOverreach — called directly", () => {
  it("heals every sword Martial Q row and nothing else", () => {
    const after = V10__wolfchasersArtSwordOverreach.migrate(clone(STORE))
    expect(after.v).toBe(10)
    for (const id of SWORD_MARTIAL_Q_IDS) expect(skillIn(after, id).receives).toBeUndefined()
    for (const skill of STORE.skills) {
      if (SWORD_MARTIAL_Q_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V10__wolfchasersArtSwordOverreach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V10__wolfchasersArtSwordOverreach.migrate(clone(once))).toEqual(once)
  })
})

describe("V10__wolfchasersArtSwordOverreach — through the chain", () => {
  it("is registered and is exactly what the v9 → v10 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V10__wolfchasersArtSwordOverreach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 10 })!
    expect(result.applied).toEqual(["V10__wolfchasersArtSwordOverreach"])
    expect(result.blob.v).toBe(10)
    for (const id of SWORD_MARTIAL_Q_IDS) expect(skillIn(result.blob, id).receives).toBeUndefined()
    for (const id of SPEAR_Q_IDS) expect(skillIn(result.blob, id).receives).toContain(BUFF_ID)
  })
})
