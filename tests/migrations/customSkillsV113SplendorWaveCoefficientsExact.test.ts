import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V113__splendorWaveCoefficientsExact,
  healSkill,
} from "../../src/migrations/customSkills/V113__splendorWaveCoefficientsExact"
import { swordHeavyCharged } from "../../src/data/skills/bellstrike-splendor/swordheavycharged"
import { swordHeavyCharged2Hit } from "../../src/data/skills/bellstrike-splendor/swordheavycharged-2-hit"
import { swordHeavyChargedPrepull } from "../../src/data/skills/bellstrike-splendor/swordheavycharged-prepull"
import { swordHeavyChargedWushuang } from "../../src/data/skills/bellstrike-splendor/swordheavycharged-wushuang"
import { swordHeavyCharged2HitWushuang } from "../../src/data/skills/bellstrike-splendor/swordheavycharged-2-hit-wushuang"
import { energySurge } from "../../src/data/skills/bellstrike-splendor/energysurge"
import { legionCrusher } from "../../src/data/skills/bellstrike-splendor/legioncrusher"
import type { Skill } from "../../src/engine/skill"
import storeV112File from "./testCustomSkills/v112/store.json"

const STORE = storeV112File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"
const WAVE_SKILLS = [
  swordHeavyCharged,
  swordHeavyCharged2Hit,
  swordHeavyChargedPrepull,
  swordHeavyChargedWushuang,
  swordHeavyCharged2HitWushuang,
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const rowsOf = (skill: Skill) =>
  skill.hits.flatMap((hit) =>
    [hit, ...(hit.variants ?? [])].map((row) => [
      row.physMultiplier,
      row.attributeMultiplier,
      row.physFixed,
      row.attributeFixed,
    ]),
  )

describe("custom-skills v112 fixture", () => {
  it("is v112 and stores every wave at the four-decimal roundings", () => {
    expect(STORE.v).toBe(V113__splendorWaveCoefficientsExact.to - 1)
    expect(rowsOf(skillIn(STORE, swordHeavyCharged.id))).toContainEqual([
      1.3066, 1.9598, 361.6, 197.2,
    ])
  })
})

describe("healSkill", () => {
  it.each(WAVE_SKILLS.map((skill) => [skill.id, skill] as const))(
    "lands the untouched %s copy on the built-in wave rows",
    (id, builtin) => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(rowsOf(healed)).toEqual(rowsOf(builtin))
    },
  )

  it("heals an Energy Surge copy the same way", () => {
    const stale = clone(energySurge)
    for (const hit of stale.hits) {
      if (hit.physMultiplier === 1.30656)
        Object.assign(hit, { physMultiplier: 1.3066, attributeMultiplier: 1.9598 })
      if (hit.physMultiplier === 1.567872)
        Object.assign(hit, { physMultiplier: 1.5679, attributeMultiplier: 2.3518 })
      if (hit.physMultiplier === 1.829184)
        Object.assign(hit, { physMultiplier: 1.8292, attributeMultiplier: 2.7438 })
    }
    expect(rowsOf(stale)).not.toEqual(rowsOf(energySurge))
    expect(rowsOf(healSkill(stale) as Skill)).toEqual(rowsOf(energySurge))
  })

  it("keeps a wave row that was edited", () => {
    const edited = clone(skillIn(STORE, swordHeavyCharged.id))
    edited.hits[1]!.physMultiplier = 2
    expect(healSkill(clone(edited))).toEqual(
      expect.objectContaining({
        hits: expect.arrayContaining([expect.objectContaining({ physMultiplier: 2 })]),
      }),
    )
    expect((healSkill(clone(edited)) as Skill).hits[1]!.physMultiplier).toBe(2)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [legionCrusher.id, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, swordHeavyCharged.id)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V113__splendorWaveCoefficientsExact — called directly and through the chain", () => {
  it("heals the copies and keeps every other skill", () => {
    const after = V113__splendorWaveCoefficientsExact.migrate(clone(STORE))
    expect(after.v).toBe(113)
    for (const skill of WAVE_SKILLS) expect(rowsOf(skillIn(after, skill.id))).toEqual(rowsOf(skill))
    for (const id of [legionCrusher.id, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V113__splendorWaveCoefficientsExact.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v112 → v113 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V113__splendorWaveCoefficientsExact)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 113 })!
    expect(result.applied).toEqual(["V113__splendorWaveCoefficientsExact"])
    expect(result.blob.v).toBe(113)
  })
})
