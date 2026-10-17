import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V80__prepullVagrantSwordWaveTiming,
  healSkill,
} from "../../src/migrations/customSkills/V80__prepullVagrantSwordWaveTiming"
import { healSkill as healFractionalFrameTiming } from "../../src/migrations/customSkills/V95__fractionalFrameTiming"
import { healSkill as healPrepullVagrantSwordBoltTiming } from "../../src/migrations/customSkills/V102__prepullVagrantSwordBoltTiming"
import { healSkill as healSplendorRootMotion } from "../../src/migrations/customSkills/V103__splendorRootMotion"
import { healSkill as healSwordMorphConversion } from "../../src/migrations/customSkills/V105__swordMorphConversionAtTheRelease"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import storeV79File from "./testCustomSkills/v79/store.json"

const healLatestSplendorHops = (skill: unknown): unknown =>
  healSwordMorphConversion(healSplendorRootMotion(healPrepullVagrantSwordBoltTiming(skill)))

const STORE = storeV79File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const PREPULL_ID = SKILL.swordHeavyChargedPrepull
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v79 fixture", () => {
  it("is v79 and stores the pre-pull Vagrant Sword on waves 0, 17 and 34 without projectiles or a release hit", () => {
    expect(STORE.v).toBe(V80__prepullVagrantSwordWaveTiming.to - 1)
    const prepull = skillIn(STORE, PREPULL_ID)
    expect(prepull.hits).toHaveLength(3)
    expect(prepull.hits[0].variants![0].frame).toBe(0)
    expect(prepull.hits[1].frame).toBe(17)
    expect(prepull.hits[2].frame).toBe(34)
    expect(prepull.hits.every((hit) => hit.projectile === undefined)).toBe(true)
  })
})

describe("healSkill", () => {
  it("lands an untouched copy on the built-in's hits", () => {
    const healed = healLatestSplendorHops(
      healFractionalFrameTiming(healSkill(clone(skillIn(STORE, PREPULL_ID)))),
    ) as Skill
    expect(healed.hits).toEqual(builtin(PREPULL_ID).hits)
    expect(healed.castFrames).toBe(builtin(PREPULL_ID).castFrames)
  })

  it("keeps a frame the user changed and still adds the projectile and the release hit", () => {
    const edited = clone(skillIn(STORE, PREPULL_ID))
    edited.hits[2].frame = 40
    const healed = healSkill(edited) as Skill
    expect(healed.hits[2].frame).toBe(40)
    expect(healed.hits[2].projectile).toBeDefined()
    expect(healed.hits).toHaveLength(4)
  })

  it("leaves a copy whose first hit no longer carries the seeded triggers without a release hit", () => {
    const edited = clone(skillIn(STORE, PREPULL_ID))
    edited.hits[0].triggers = []
    const healed = healSkill(edited) as Skill
    expect(healed.hits).toHaveLength(3)
    expect(healed.hits[0].triggers).toEqual([])
  })
})

describe("V80__prepullVagrantSwordWaveTiming — called directly", () => {
  it("moves the untouched pre-pull copy onto the built-in and leaves every other skill alone", () => {
    const after = V80__prepullVagrantSwordWaveTiming.migrate(clone(STORE))
    expect(after.v).toBe(80)
    expect(
      (healLatestSplendorHops(healFractionalFrameTiming(skillIn(after, PREPULL_ID))) as Skill).hits,
    ).toEqual(builtin(PREPULL_ID).hits)
    for (const skill of STORE.skills) {
      if (skill.id === PREPULL_ID) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V80__prepullVagrantSwordWaveTiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V80__prepullVagrantSwordWaveTiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V80__prepullVagrantSwordWaveTiming — through the chain", () => {
  it("is registered and is exactly what the v79 → v80 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V80__prepullVagrantSwordWaveTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 80 })!
    expect(result.applied).toEqual(["V80__prepullVagrantSwordWaveTiming"])
    expect(result.blob.v).toBe(80)
    expect(skillIn(result.blob, PREPULL_ID).hits).toHaveLength(4)
  })
})
