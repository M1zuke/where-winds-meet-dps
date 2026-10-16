import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V89__draughtReveldriftChargesAndEmpoweredLightAttack,
  healSkill,
} from "../../src/migrations/customSkills/V89__draughtReveldriftChargesAndEmpoweredLightAttack"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV88File from "./testCustomSkills/v88/store.json"

const STORE = storeV88File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const UNTOUCHED_ID = "bamboocutDraught-peakfall"
const HEALED_IDS = (STORE.skills as Skill[])
  .map((skill) => skill.id)
  .filter((id) => id !== UNTOUCHED_ID)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

const gatedFieldsOf = (skill: Skill) => ({
  castConditions: skill.castConditions,
  meterCosts: skill.meterCosts,
  hits: skill.hits,
})

describe("custom-skills v88 fixture", () => {
  it("is v88 and stores every healed skill without the new gates", () => {
    expect(STORE.v).toBe(V89__draughtReveldriftChargesAndEmpoweredLightAttack.to - 1)
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

  it("leaves a Reveldrift copy that already carries a cost alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-reveldrift"))
    edited.meterCosts = [{ meterId: "endurance", amount: 5 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Tidepour copy whose gate was edited alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-tidepour"))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Realmplay copy with a changed hit count alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-realmplay"))
    edited.hits = edited.hits.slice(0, 1)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Boundvessel copy that already has a gate alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-boundvessel"))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched skill and a user-authored one alone and is idempotent", () => {
    const authored = { ...clone(skillIn(STORE, UNTOUCHED_ID)), id: "sk-user-authored-q" }
    for (const seeded of [skillIn(STORE, UNTOUCHED_ID), authored]) {
      expect(healSkill(clone(seeded)), seeded.id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V89__draughtReveldriftChargesAndEmpoweredLightAttack — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V89__draughtReveldriftChargesAndEmpoweredLightAttack.migrate(clone(STORE))
    expect(after.v).toBe(89)
    for (const id of HEALED_IDS)
      expect(gatedFieldsOf(skillIn(after, id)), id).toEqual(gatedFieldsOf(builtinOf(id)))
    expect(skillIn(after, UNTOUCHED_ID)).toEqual(skillIn(STORE, UNTOUCHED_ID))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V89__draughtReveldriftChargesAndEmpoweredLightAttack.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v88 → v89 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V89__draughtReveldriftChargesAndEmpoweredLightAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 89 })!
    expect(result.applied).toEqual(["V89__draughtReveldriftChargesAndEmpoweredLightAttack"])
    expect(result.blob.v).toBe(89)
  })
})
