import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V102__prepullVagrantSwordBoltTiming,
  healSkill,
} from "../../src/migrations/customSkills/V102__prepullVagrantSwordBoltTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV101File from "./testCustomSkills/v101/store.json"

const STORE = storeV101File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const UNTOUCHED_ID = "bellstrikeSplendor-legioncrusher"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinPrepull = (): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === PREPULL_ID)!

describe("custom-skills v101 fixture", () => {
  it("is v101 and still launches the pre-pull bolt on frame 12 and ends the cast on frame 37", () => {
    expect(STORE.v).toBe(V102__prepullVagrantSwordBoltTiming.to - 1)
    expect(skillIn(STORE, PREPULL_ID).hits[0]!.frame).toBe(12)
    expect(skillIn(STORE, PREPULL_ID).castFrames).toBe(37)
  })
})

describe("healSkill", () => {
  it("lands the untouched pre-pull copy on the built-in", () => {
    const healed = healSkill(clone(skillIn(STORE, PREPULL_ID))) as Skill
    expect(healed.hits).toEqual(builtinPrepull().hits)
    expect(healed.castFrames).toBe(builtinPrepull().castFrames)
  })

  it("retimes only the values that still hold the seeded one", () => {
    const edited = clone(skillIn(STORE, PREPULL_ID))
    edited.castFrames = 40
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(40)
    expect(healed.hits[0]!.frame).toBe(12.14)

    const editedBolt = clone(skillIn(STORE, PREPULL_ID))
    editedBolt.hits[0]!.frame = 14
    const healedBolt = healSkill(clone(editedBolt)) as Skill
    expect(healedBolt.hits[0]!.frame).toBe(14)
    expect(healedBolt.castFrames).toBe(37.2)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, PREPULL_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V102__prepullVagrantSwordBoltTiming — called directly", () => {
  it("heals the pre-pull copy and keeps every other skill", () => {
    const after = V102__prepullVagrantSwordBoltTiming.migrate(clone(STORE))
    expect(after.v).toBe(102)
    expect(skillIn(after, PREPULL_ID).hits).toEqual(builtinPrepull().hits)
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V102__prepullVagrantSwordBoltTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V102__prepullVagrantSwordBoltTiming — through the chain", () => {
  it("is registered and is exactly what the v101 → v102 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V102__prepullVagrantSwordBoltTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 102 })!
    expect(result.applied).toEqual(["V102__prepullVagrantSwordBoltTiming"])
    expect(result.blob.v).toBe(102)
  })
})
