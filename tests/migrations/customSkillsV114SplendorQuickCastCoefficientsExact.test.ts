import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V114__splendorQuickCastCoefficientsExact,
  healSkill,
} from "../../src/migrations/customSkills/V114__splendorQuickCastCoefficientsExact"
import { swordq } from "../../src/data/skills/bellstrike-splendor/swordq"
import { swordq2nd } from "../../src/data/skills/bellstrike-splendor/swordq-2nd"
import { swordq3rd } from "../../src/data/skills/bellstrike-splendor/swordq-3rd"
import { spearq } from "../../src/data/skills/bellstrike-splendor/spearq"
import { legionCrusher } from "../../src/data/skills/bellstrike-splendor/legioncrusher"
import type { Skill } from "../../src/engine/skill"
import { withoutLevelRows } from "../helpers/withoutLevelRows"
import storeV113File from "./testCustomSkills/v113/store.json"

const STORE = storeV113File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"
const HEALED_SKILLS = [swordq, swordq2nd, swordq3rd, spearq].map(withoutLevelRows)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v113 fixture", () => {
  it("is v113 and stores the rounded Daunting Strike and Qiankun's Lock rows", () => {
    expect(STORE.v).toBe(V114__splendorQuickCastCoefficientsExact.to - 1)
    expect(skillIn(STORE, swordq.id).hits[0]!.physMultiplier).toBe(1.0253)
    expect(skillIn(STORE, spearq.id).hits[1]!.physMultiplier).toBe(0.5732)
    expect(skillIn(STORE, swordq2nd.id).hits[0]!.physMultiplier).toBe(0.768985)
  })
})

describe("healSkill", () => {
  it.each(HEALED_SKILLS.map((skill) => [skill.id, skill] as const))(
    "lands the untouched %s copy on the built-in hits",
    (id, builtin) => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.hits).toEqual(builtin.hits)
    },
  )

  it("keeps a row that was edited", () => {
    const edited = clone(skillIn(STORE, swordq.id))
    edited.hits[0]!.physMultiplier = 2
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [legionCrusher.id, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, swordq.id)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V114__splendorQuickCastCoefficientsExact — called directly and through the chain", () => {
  it("heals the copies and keeps every other skill", () => {
    const after = V114__splendorQuickCastCoefficientsExact.migrate(clone(STORE))
    expect(after.v).toBe(114)
    for (const skill of HEALED_SKILLS) expect(skillIn(after, skill.id).hits).toEqual(skill.hits)
    for (const id of [legionCrusher.id, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V114__splendorQuickCastCoefficientsExact.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v113 → v114 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V114__splendorQuickCastCoefficientsExact)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 114 })!
    expect(result.applied).toEqual(["V114__splendorQuickCastCoefficientsExact"])
    expect(result.blob.v).toBe(114)
  })
})
