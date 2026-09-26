import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V34__herosBloodInebriateConditionalNoAbrasion,
  healSkill,
} from "../../src/migrations/customSkills/V34__herosBloodInebriateConditionalNoAbrasion"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV33File from "./testCustomSkills/v33/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const HEROS_BLOOD_INEBRIATE_ID = "bamboocutDraught-heros-blood-inebriate"

const STORE = storeV33File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

function expectHealed(healed: Skill) {
  const original = skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID)
  expect(healed.neverAbrades).toBeUndefined()
  expect(healed.receives).toEqual([...original.receives!, "herosBloodInebriateNoAbrasion"])
}

describe("custom-skills v33 fixture", () => {
  it("is v33 and still stores the pre-V34 shape", () => {
    expect(STORE.v).toBe(V34__herosBloodInebriateConditionalNoAbrasion.to - 1)
    const original = skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID)
    expect(original.neverAbrades).toBe(true)
    expect(original.receives).not.toContain("herosBloodInebriateNoAbrasion")
  })
})

describe("healSkill", () => {
  it("drops the always-on flag and adds the conditional receives entry on the untouched seeded copy", () => {
    expectHealed(healSkill(clone(skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID))) as Skill)
  })

  it("does not double-heal a copy that already carries the receives entry", () => {
    const alreadyHealed = healSkill(clone(skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID))) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves an edited receives list alone rather than rewriting it", () => {
    const edited = {
      ...clone(skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID)),
      receives: ["eonpourInebriateDamage"],
    }
    const healed = healSkill(edited) as Skill
    expect(healed.receives).toEqual(["eonpourInebriateDamage"])
    expect(healed.neverAbrades).toBeUndefined()
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "bamboocutDraught-heros-blood"))
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V34__herosBloodInebriateConditionalNoAbrasion — called directly", () => {
  it("heals the targeted skill and nothing else", () => {
    const after = V34__herosBloodInebriateConditionalNoAbrasion.migrate(clone(STORE))
    expect(after.v).toBe(34)
    expectHealed(skillIn(after, HEROS_BLOOD_INEBRIATE_ID))
    for (const skill of STORE.skills) {
      if (skill.id === HEROS_BLOOD_INEBRIATE_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V34__herosBloodInebriateConditionalNoAbrasion.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V34__herosBloodInebriateConditionalNoAbrasion.migrate(clone(once))).toEqual(once)
  })
})

describe("V34__herosBloodInebriateConditionalNoAbrasion — through the chain", () => {
  it("is registered and is exactly what the v33 → v34 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V34__herosBloodInebriateConditionalNoAbrasion)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 34 })!
    expect(result.applied).toEqual(["V34__herosBloodInebriateConditionalNoAbrasion"])
    expect(result.blob.v).toBe(34)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V34__herosBloodInebriateConditionalNoAbrasion,
    )
    const result = runChain(withoutStep, 34, clone(STORE))!
    expect(result.applied).not.toContain("V34__herosBloodInebriateConditionalNoAbrasion")
    expect(skillIn(result.blob, HEROS_BLOOD_INEBRIATE_ID)).toEqual(
      skillIn(STORE, HEROS_BLOOD_INEBRIATE_ID),
    )
  })
})

describe("the healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the conditional gate after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === HEROS_BLOOD_INEBRIATE_ID)!
    expectHealed(skill)
  })
})
