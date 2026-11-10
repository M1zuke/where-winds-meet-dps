import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V118__jadeLaunchBrokenByHigherPriority,
  healSkill,
} from "../../src/migrations/customSkills/V118__jadeLaunchBrokenByHigherPriority"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV117File from "./testCustomSkills/v117/store.json"

const STORE = storeV117File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const LAUNCH_IDS = [
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
]
const UNTOUCHED_IDS = ["silkbindJade-umbq", "sk-user-authored-launch"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v117 fixture", () => {
  it("is v117 and stores every throw with its single hit", () => {
    expect(STORE.v).toBe(V118__jadeLaunchBrokenByHigherPriority.to - 1)
    for (const id of LAUNCH_IDS) expect(skillIn(STORE, id).hits).toHaveLength(1)
  })
})

describe("healSkill", () => {
  it.each(LAUNCH_IDS)("adds the higher-priority follow-up gate to the untouched %s copy", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.hits[1]).toEqual(builtinOf(id).hits[1])
    expect(healed.hits[0]).toEqual(skillIn(STORE, id).hits[0])
  })

  it("keeps a copy whose cast length or hit list was edited", () => {
    const retimed = clone(skillIn(STORE, LAUNCH_IDS[3]!))
    retimed.castFrames = 50
    expect(healSkill(clone(retimed))).toEqual(retimed)
    const extended = clone(skillIn(STORE, LAUNCH_IDS[3]!))
    extended.hits.push({ ...extended.hits[0]!, id: "hit-9" })
    expect(healSkill(clone(extended))).toEqual(extended)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, LAUNCH_IDS[0]!)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V118__jadeLaunchBrokenByHigherPriority — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V118__jadeLaunchBrokenByHigherPriority.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v117 → v118 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V118__jadeLaunchBrokenByHigherPriority)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 118 })!
    expect(result.applied).toEqual(["V118__jadeLaunchBrokenByHigherPriority"])
    expect(result.blob.v).toBe(118)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
