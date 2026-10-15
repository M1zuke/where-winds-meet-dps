import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V87__draughtGrantTimingAndAbrasionTalent,
  healSkill,
} from "../../src/migrations/customSkills/V87__draughtGrantTimingAndAbrasionTalent"
import { healSkill as healDraughtMistwillowReach } from "../../src/migrations/customSkills/V88__draughtMistwillowReach"
import { healSkill as healDraughtReveldriftChargesAndEmpoweredLightAttack } from "../../src/migrations/customSkills/V89__draughtReveldriftChargesAndEmpoweredLightAttack"
import { healSkill as healDraughtTipsylayAndExCooldowns } from "../../src/migrations/customSkills/V90__draughtTipsylayAndExCooldowns"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV86File from "./testCustomSkills/v86/store.json"

const STORE = storeV86File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const UNTOUCHED_ID = "bamboocutDraught-peakfall"
const STORED_IDS = (STORE.skills as Skill[]).map((skill) => skill.id)
const DRAGONQUENCH_IDS = STORED_IDS.filter((id) => id.includes("dragonquench"))
const HEALED_IDS = STORED_IDS.filter((id) => id !== UNTOUCHED_ID)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

const throughLaterHops = (skill: unknown): Skill =>
  healDraughtTipsylayAndExCooldowns(
    healDraughtReveldriftChargesAndEmpoweredLightAttack(healDraughtMistwillowReach(skill)),
  ) as Skill

const fieldsOf = (skill: Skill) => ({
  hits: skill.hits,
  receives: skill.receives,
  neverAbrades: skill.neverAbrades,
})

const hitById = (skill: Skill, id: string) => skill.hits.find((hit) => hit.id === id)!

describe("custom-skills v86 fixture", () => {
  it("is v86 and still stores the old shape for every healed skill", () => {
    expect(STORE.v).toBe(V87__draughtGrantTimingAndAbrasionTalent.to - 1)
    for (const id of HEALED_IDS) {
      const diverges =
        JSON.stringify(fieldsOf(skillIn(STORE, id))) !== JSON.stringify(fieldsOf(builtinOf(id)))
      expect(diverges, id).toBe(true)
    }
    expect(skillIn(STORE, UNTOUCHED_ID)).toBeDefined()
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = throughLaterHops(healSkill(clone(skillIn(STORE, id))))
    expect(fieldsOf(healed)).toEqual(fieldsOf(builtinOf(id)))
  })

  it("moves the drink's Binge Points from Tipsylay to the follow-up", () => {
    const tipsylay = healSkill(
      clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick")),
    ) as Skill
    expect(tipsylay.hits[0]!.triggers).toEqual([])
    const followUp = healSkill(
      clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick-follow-up")),
    ) as Skill
    expect(followUp.hits.map((hit) => hit.frame)).toEqual([20, 27])
  })

  it("moves Boundvessel's banking to the finish's own frame", () => {
    const healed = healSkill(clone(skillIn(STORE, "bamboocutDraught-boundvessel"))) as Skill
    expect(hitById(healed, "hit-12").triggers).toEqual([])
    expect(hitById(healed, "hit-15").frame).toBe(159)
  })

  it("renames the talent buff on Hero's Blood - Inebriate", () => {
    const healed = healSkill(
      clone(skillIn(STORE, "bamboocutDraught-heros-blood-inebriate")),
    ) as Skill
    expect(healed.receives).toContain("bingePointGainNoAbrasion")
    expect(healed.receives).not.toContain("herosBloodInebriateNoAbrasion")
  })

  it("leaves a follow-up whose thrust was edited without a banking hit", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick-follow-up"))
    edited.hits[0]!.physMultiplier = 3
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits).toEqual(edited.hits)
  })

  it("leaves a Tipsylay copy whose triggers were edited", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick"))
    edited.hits[0]!.triggers = edited.hits[0]!.triggers.slice(0, 1)
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.triggers).toEqual(edited.hits[0]!.triggers)
  })

  it("leaves a drink copy whose hit was moved", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-quick-drink"))
    edited.hits[0]!.frame = 25
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.frame).toBe(25)
  })

  it("leaves a Boundvessel copy whose finishing slash was edited", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-boundvessel"))
    hitById(edited, "hit-12").triggers = []
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits).toEqual(edited.hits)
  })

  it("keeps the Abrasion flag of a Dragonquench copy whose receives were edited", () => {
    const edited = clone(skillIn(STORE, DRAGONQUENCH_IDS[0]!))
    edited.receives = ["userBuff"]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.neverAbrades).toBe(true)
    expect(healed.receives).toEqual(["userBuff"])
  })

  it("leaves an untouched skill and a user-authored one alone and is idempotent", () => {
    const authored = { ...clone(skillIn(STORE, UNTOUCHED_ID)), id: "sk-user-authored-drink" }
    for (const seeded of [skillIn(STORE, UNTOUCHED_ID), authored]) {
      expect(healSkill(clone(seeded)), seeded.id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V87__draughtGrantTimingAndAbrasionTalent — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V87__draughtGrantTimingAndAbrasionTalent.migrate(clone(STORE))
    expect(after.v).toBe(87)
    for (const id of HEALED_IDS)
      expect(fieldsOf(throughLaterHops(skillIn(after, id))), id).toEqual(fieldsOf(builtinOf(id)))
    expect(skillIn(after, UNTOUCHED_ID)).toEqual(skillIn(STORE, UNTOUCHED_ID))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V87__draughtGrantTimingAndAbrasionTalent.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v86 → v87 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V87__draughtGrantTimingAndAbrasionTalent)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 87 })!
    expect(result.applied).toEqual(["V87__draughtGrantTimingAndAbrasionTalent"])
    expect(result.blob.v).toBe(87)
  })
})
