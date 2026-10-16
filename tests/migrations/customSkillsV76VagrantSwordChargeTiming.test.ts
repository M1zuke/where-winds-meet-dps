import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V76__vagrantSwordChargeTiming } from "../../src/migrations/customSkills/V76__vagrantSwordChargeTiming"
import { healSkill as healFractionalFrameTiming } from "../../src/migrations/customSkills/V95__fractionalFrameTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import storeV75File from "./testCustomSkills/v75/store.json"

const STORE = storeV75File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const FORM_IDS = [
  SKILL.swordHeavyCharged,
  SKILL.swordHeavyCharged2Hit,
  SKILL.swordHeavyChargedTier1,
]
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v75 fixture", () => {
  it("is v75 and stores the Vagrant Sword copies on the earlier timings", () => {
    expect(STORE.v).toBe(V76__vagrantSwordChargeTiming.to - 1)
    const plain = skillIn(STORE, SKILL.swordHeavyCharged)
    expect(plain.castFrames).toBe(121)
    expect(plain.hits[0].frame).toBe(0)
    expect(plain.castConditions ?? []).toEqual([])
    expect(skillIn(STORE, SKILL.swordHeavyChargedTier1).castFrames).toBe(82)
  })
})

describe("V76__vagrantSwordChargeTiming — called directly", () => {
  it("moves every untouched copy onto the built-in's cast length, frames, projectiles, drain and gate", () => {
    const after = V76__vagrantSwordChargeTiming.migrate(clone(STORE))
    expect(after.v).toBe(76)
    for (const id of FORM_IDS) {
      const healed = healFractionalFrameTiming(skillIn(after, id)) as Skill
      const live = builtin(id)
      expect(healed.castFrames, id).toBe(live.castFrames)
      expect(healed.castConditions, id).toEqual(live.castConditions)
      expect(healed.meterDrains, id).toEqual(live.meterDrains)
      expect(
        healed.hits.map((hit) => [hit.frame, hit.projectile]),
        id,
      ).toEqual(live.hits.map((hit) => [hit.frame, hit.projectile]))
      expect(
        healed.hits.map((hit) =>
          hit.variants?.map((variant) => [variant.frame, variant.castFrames]),
        ),
        id,
      ).toEqual(
        live.hits.map((hit) => hit.variants?.map((variant) => [variant.frame, variant.castFrames])),
      )
    }
  })

  it("leaves a value the user edited, a user-authored skill and every other field alone", () => {
    const edited = clone(STORE)
    const plain = skillIn(edited, SKILL.swordHeavyCharged)
    plain.castFrames = 130
    plain.hits[1]!.frame = 104
    plain.castConditions = [{ buffId: "qiShield", op: "gte", stacks: 1 }]
    const after = V76__vagrantSwordChargeTiming.migrate(edited)
    const healed = skillIn(after, SKILL.swordHeavyCharged)
    expect(healed.castFrames).toBe(130)
    expect(healed.hits[1]!.frame).toBe(104)
    expect(healed.castConditions).toEqual([{ buffId: "qiShield", op: "gte", stacks: 1 }])
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    const before = skillIn(STORE, SKILL.swordHeavyChargedTier1)
    const rest = ({ castFrames, castConditions, hits, meterDrains, ...others }: Skill) => others
    expect(rest(skillIn(after, SKILL.swordHeavyChargedTier1))).toEqual(rest(before))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V76__vagrantSwordChargeTiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V76__vagrantSwordChargeTiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V76__vagrantSwordChargeTiming — through the chain", () => {
  it("is registered and is exactly what the v75 → v76 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V76__vagrantSwordChargeTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 76 })!
    expect(result.applied).toEqual(["V76__vagrantSwordChargeTiming"])
    expect(result.blob.v).toBe(76)
    expect(skillIn(result.blob, SKILL.swordHeavyCharged).castFrames).toBe(122)
  })
})
