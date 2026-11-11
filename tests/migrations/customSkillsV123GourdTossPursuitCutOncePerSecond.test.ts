import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V123__gourdTossPursuitCutOncePerSecond,
  healSkill,
} from "../../src/migrations/customSkills/V123__gourdTossPursuitCutOncePerSecond"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV122File from "./testCustomSkills/v122/store.json"

const STORE = storeV122File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = ["silkbindJade-fanheavypursuit-3-hit", "silkbindJade-fanheavypursuit-5-hit"]
const UNTOUCHED_IDS = ["silkbindJade-fanspecial", "sk-user-authored-pursuit"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v122 fixture", () => {
  it("is v122 and stores the recharge cut without a cooldown on every strike", () => {
    expect(STORE.v).toBe(V123__gourdTossPursuitCutOncePerSecond.to - 1)
    for (const id of HEALED_IDS)
      for (const strike of skillIn(STORE, id).hits)
        expect(strike.triggers[0]!.cooldownFrames).toBeUndefined()
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("gives every strike of the untouched %s copy the built-in's cut", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const builtinCut = builtinOf(id).hits[0]!.triggers[0]
    for (const strike of healed.hits) expect(strike.triggers[0]).toEqual(builtinCut)
  })

  it("keeps a cut that was edited", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.hits[1]!.triggers[0]!.stacks = 120
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[1]!.triggers[0]).toEqual(edited.hits[1]!.triggers[0])
    expect(healed.hits[0]!.triggers[0]!.cooldownFrames).toBe(60)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V123__gourdTossPursuitCutOncePerSecond — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V123__gourdTossPursuitCutOncePerSecond.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v122 → v123 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V123__gourdTossPursuitCutOncePerSecond)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 123 })!
    expect(result.applied).toEqual(["V123__gourdTossPursuitCutOncePerSecond"])
    expect(result.blob.v).toBe(123)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
