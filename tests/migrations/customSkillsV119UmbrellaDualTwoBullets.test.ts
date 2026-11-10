import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V119__umbrellaDualTwoBullets,
  healSkill,
} from "../../src/migrations/customSkills/V119__umbrellaDualTwoBullets"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV118File from "./testCustomSkills/v118/store.json"

const STORE = storeV118File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const DUAL_ID = "silkbindJade-umbrella-dual"
const UNTOUCHED_IDS = ["silkbindJade-fan-dual", "sk-user-authored-umbrella-dual"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v118 fixture", () => {
  it("is v118 and stores the umbrella dual as a hit at 12 frames and a double share at 18", () => {
    expect(STORE.v).toBe(V119__umbrellaDualTwoBullets.to - 1)
    expect(skillIn(STORE, DUAL_ID).hits.map((hit) => hit.frame)).toEqual([12, 18])
  })
})

describe("healSkill", () => {
  it("lands the untouched copy on the built-in's cast length and bullets", () => {
    const healed = healSkill(clone(skillIn(STORE, DUAL_ID))) as Skill
    const builtin = builtinOf(DUAL_ID)
    expect(healed.castFrames).toBe(builtin.castFrames)
    expect(healed.hits).toEqual(builtin.hits)
  })

  it("keeps a copy whose cast length or hits were edited", () => {
    const retimed = clone(skillIn(STORE, DUAL_ID))
    retimed.castFrames = 50
    expect(healSkill(clone(retimed))).toEqual(retimed)
    const reweighted = clone(skillIn(STORE, DUAL_ID))
    reweighted.hits[0]!.physFixed = 1
    expect(healSkill(clone(reweighted))).toEqual(reweighted)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, DUAL_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V119__umbrellaDualTwoBullets — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V119__umbrellaDualTwoBullets.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v118 → v119 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V119__umbrellaDualTwoBullets)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 119 })!
    expect(result.applied).toEqual(["V119__umbrellaDualTwoBullets"])
    expect(result.blob.v).toBe(119)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
