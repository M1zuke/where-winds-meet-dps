import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V111__volutefitReachesWineboundMystics,
  healSkill,
} from "../../src/migrations/customSkills/V111__volutefitReachesWineboundMystics"
import { poet1 } from "../../src/data/skills/mystic/poet1"
import { poetFinalHitCancel } from "../../src/data/skills/mystic/poet-final-hit-cancel"
import { fireBreath2Hit } from "../../src/data/skills/mystic/fire-breath-2-hit"
import { BUFF } from "../../src/data/skills/buffs/ids"
import type { Skill } from "../../src/engine/skill"
import storeV110File from "./testCustomSkills/v110/store.json"

const STORE = storeV110File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const NEIGHBOUR_ID = "bellstrikeUmbra-spear-heavy-1"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v110 fixture", () => {
  it("is v110 and stores the Dragon's Breath and Drunken Poet copies without the buff", () => {
    expect(STORE.v).toBe(V111__volutefitReachesWineboundMystics.to - 1)
    for (const id of [poet1.id, poetFinalHitCancel.id, fireBreath2Hit.id])
      expect(skillIn(STORE, id).receives ?? [], id).not.toContain(BUFF.volutefitWineboundDamage)
  })
})

describe("healSkill", () => {
  it("lands every untouched copy on the built-in's receives list", () => {
    for (const builtin of [poet1, poetFinalHitCancel, fireBreath2Hit]) {
      const healed = healSkill(clone(skillIn(STORE, builtin.id))) as Skill
      expect(healed.receives, builtin.id).toEqual(builtin.receives)
    }
  })

  it("keeps a copy whose receives list was edited", () => {
    const edited = clone(skillIn(STORE, poetFinalHitCancel.id))
    edited.receives = [BUFF.poetFinalStrikeStack, "someOtherBuff"]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, poet1.id)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V111__volutefitReachesWineboundMystics — called directly and through the chain", () => {
  it("heals the copies and keeps every other skill", () => {
    const after = V111__volutefitReachesWineboundMystics.migrate(clone(STORE))
    expect(after.v).toBe(111)
    expect(skillIn(after, poet1.id).receives).toEqual([BUFF.volutefitWineboundDamage])
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V111__volutefitReachesWineboundMystics.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v110 → v111 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V111__volutefitReachesWineboundMystics)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 111 })!
    expect(result.applied).toEqual(["V111__volutefitReachesWineboundMystics"])
    expect(result.blob.v).toBe(111)
  })
})
