import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V90__draughtTipsylayAndExCooldowns,
  healSkill,
} from "../../src/migrations/customSkills/V90__draughtTipsylayAndExCooldowns"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV89File from "./testCustomSkills/v89/store.json"

const STORE = storeV89File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const TIPSYLAY_ID = "bamboocutDraught-nightwick-primepick"
const EX_ID = "bamboocutDraught-skystrike-gauntlets-ex"
const UNTOUCHED_ID = "bamboocutDraught-peakfall"
const HEALED_IDS = [TIPSYLAY_ID, EX_ID]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

const gatedFieldsOf = (skill: Skill) => ({
  castConditions: skill.castConditions,
  hits: skill.hits,
})

describe("custom-skills v89 fixture", () => {
  it("is v89 and stores both skills without the cooldown gates", () => {
    expect(STORE.v).toBe(V90__draughtTipsylayAndExCooldowns.to - 1)
    for (const id of HEALED_IDS) {
      expect(JSON.stringify(gatedFieldsOf(skillIn(STORE, id))), id).not.toBe(
        JSON.stringify(gatedFieldsOf(builtinOf(id))),
      )
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's gates and hits", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(gatedFieldsOf(healed)).toEqual(gatedFieldsOf(builtinOf(id)))
  })

  it("leaves a Tipsylay copy that already carries a gate alone", () => {
    const edited = clone(skillIn(STORE, TIPSYLAY_ID))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an EX copy whose hit was moved alone", () => {
    const edited = clone(skillIn(STORE, EX_ID))
    edited.hits[0]!.frame = 5
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched skill and a user-authored one alone and is idempotent", () => {
    const authored = { ...clone(skillIn(STORE, UNTOUCHED_ID)), id: "sk-user-authored-special" }
    for (const seeded of [skillIn(STORE, UNTOUCHED_ID), authored]) {
      expect(healSkill(clone(seeded)), seeded.id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V90__draughtTipsylayAndExCooldowns — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V90__draughtTipsylayAndExCooldowns.migrate(clone(STORE))
    expect(after.v).toBe(90)
    for (const id of HEALED_IDS)
      expect(gatedFieldsOf(skillIn(after, id)), id).toEqual(gatedFieldsOf(builtinOf(id)))
    expect(skillIn(after, UNTOUCHED_ID)).toEqual(skillIn(STORE, UNTOUCHED_ID))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V90__draughtTipsylayAndExCooldowns.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v89 → v90 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V90__draughtTipsylayAndExCooldowns)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 90 })!
    expect(result.applied).toEqual(["V90__draughtTipsylayAndExCooldowns"])
    expect(result.blob.v).toBe(90)
  })
})
