import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming,
  healSkill,
} from "../../src/migrations/customSkills/V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV91File from "./testCustomSkills/v91/store.json"

const STORE = storeV91File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-umbrella-slash"
const UNTOUCHED_ID = "silkbindJade-umblightcharge"
const TRIGGER_HEALED_IDS = [
  "silkbindJade-fanlightcharged",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
]
const RECEIVES_HEALED_IDS = [
  "silkbindJade-apricot-heaven-normal",
  "silkbindJade-apricot-heaven-enhanced",
  "silkbindJade-glow-and-flow-stage-1",
  "silkbindJade-glow-and-flow-stage-2",
]
const HEALED_IDS = [...TRIGGER_HEALED_IDS, ...RECEIVES_HEALED_IDS]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

const triggersOf = (skill: Skill) => skill.hits.map((hit) => hit.triggers)
const receivesOf = (skill: Skill) => [...(skill.receives ?? [])].sort()

describe("custom-skills v91 fixture", () => {
  it("is v91 and still stores the old triggers and receives for every healed skill", () => {
    expect(STORE.v).toBe(V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming.to - 1)
    for (const id of TRIGGER_HEALED_IDS)
      expect(triggersOf(skillIn(STORE, id)), id).not.toEqual(triggersOf(builtinOf(id)))
    for (const id of RECEIVES_HEALED_IDS)
      expect(receivesOf(skillIn(STORE, id)), id).not.toEqual(receivesOf(builtinOf(id)))
  })
})

describe("healSkill", () => {
  it.each(TRIGGER_HEALED_IDS)("lands the untouched %s copy's triggers on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(triggersOf(healed)).toEqual(triggersOf(builtinOf(id)))
  })

  it.each(RECEIVES_HEALED_IDS)("lands the untouched %s copy's receives on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(receivesOf(healed)).toEqual(receivesOf(builtinOf(id)))
    expect(healed.receives).toContain("pursuitChargedBoost")
  })

  it("leaves a Charged skill whose receives were edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-glow-and-flow-stage-2"))
    edited.receives = [...edited.receives!, "userAddedBuff"]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.receives).toEqual(edited.receives)
  })

  it("stacks Startling Spring on every Moon Shatter Spring hit and nothing else", () => {
    const healed = healSkill(clone(skillIn(STORE, "silkbindJade-fanheavypursuit-5-hit"))) as Skill
    expect(healed.hits).toHaveLength(5)
    for (const hit of healed.hits)
      expect(hit.triggers.map((trigger) => trigger.targetId)).toEqual([
        "peaksSpringlessSilenceCharges",
        "pursuitChargedBoost",
      ])
  })

  it("moves the Endurance gain from the cast's end to 0.03 s after the hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "silkbindJade-fanlightcharged"))) as Skill
    expect(healed.hits[0]!.triggers).toEqual([
      { kind: "meterDelta", targetId: "endurance", stacks: 10, condition: null, delayFrames: 1.8 },
    ])
  })

  it("leaves a copy whose hit triggers were edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanheavypursuit-3-hit"))
    edited.hits[1]!.triggers = []
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[1]!.triggers).toEqual([])
    expect(healed.hits[0]!.triggers).toHaveLength(2)
  })

  it("leaves every other skill and a user-authored one alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming.migrate(clone(STORE))
    expect(after.v).toBe(92)
    for (const id of TRIGGER_HEALED_IDS)
      expect(triggersOf(skillIn(after, id)), id).toEqual(triggersOf(builtinOf(id)))
    for (const id of RECEIVES_HEALED_IDS)
      expect(receivesOf(skillIn(after, id)), id).toEqual(receivesOf(builtinOf(id)))
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming — through the chain", () => {
  it("is registered and is exactly what the v91 → v92 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(
      V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming,
    )
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 92 })!
    expect(result.applied).toEqual(["V92__jadeStartlingSpringStacksAndFlurryEnduranceTiming"])
    expect(result.blob.v).toBe(92)
  })
})
