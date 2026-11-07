import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V105__swordMorphConversionAtTheRelease,
  healSkill,
} from "../../src/migrations/customSkills/V105__swordMorphConversionAtTheRelease"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import storeV104File from "./testCustomSkills/v104/store.json"

const STORE = storeV104File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_ID = SKILL.swordHeavyChargedWushuang
const UNTOUCHED_ID = "bellstrikeSplendor-legioncrusher"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"
const HEALED_IDS = [
  SKILL.swordHeavyCharged,
  SKILL.swordHeavyCharged2Hit,
  SKILL.swordHeavyCharged2HitWushuang,
  SKILL.swordHeavyChargedPrepull,
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

const spendIndexOf = (skill: Skill): number =>
  skill.hits.findIndex((hit) =>
    hit.triggers.some((trigger) => trigger.recordSpendAsStatus === "swordMorphConvertedAmount"),
  )

describe("custom-skills v104 fixture", () => {
  it("is v104 and still carries the spend on a damaging wave of every untouched Vagrant Sword copy", () => {
    expect(STORE.v).toBe(V105__swordMorphConversionAtTheRelease.to - 1)
    for (const id of HEALED_IDS) {
      const skill = skillIn(STORE, id)
      expect(spendIndexOf(skill), id).toBeGreaterThan(-1)
      expect(skill.hits[spendIndexOf(skill)]!.physMultiplier, id).toBeGreaterThan(0)
    }
    expect(skillIn(STORE, SKILL.swordHeavyCharged2Hit).hits).toHaveLength(2)
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.hits).toEqual(builtinOf(id).hits)
    expect(healed.castFrames).toBe(builtinOf(id).castFrames)
  })

  it.each(HEALED_IDS)("moves the spend of %s onto the release hit ahead of the gain", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const releaseHit = healed.hits[spendIndexOf(healed)]!
    const spendAt = releaseHit.triggers.findIndex(
      (trigger) => trigger.recordSpendAsStatus !== undefined,
    )
    expect(releaseHit.physMultiplier).toBe(0)
    expect(releaseHit.triggers[spendAt + 1]).toMatchObject({ kind: "meterDelta", stacks: 20 })
  })

  it("leaves a copy whose release hit was edited alone", () => {
    const edited = skillIn(STORE, EDITED_ID)
    expect(spendIndexOf(edited)).toBeLessThan(edited.hits.length - 1)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy whose spend was removed alone", () => {
    const edited = clone(skillIn(STORE, SKILL.swordHeavyCharged))
    for (const hit of edited.hits)
      hit.triggers = hit.triggers.filter((trigger) => trigger.recordSpendAsStatus === undefined)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a two-wave copy whose first wave was edited alone", () => {
    const edited = clone(skillIn(STORE, SKILL.swordHeavyCharged2Hit))
    edited.hits[0]!.triggers = edited.hits[0]!.triggers.slice(1)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
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

describe("V105__swordMorphConversionAtTheRelease — called directly", () => {
  it("heals the Vagrant Sword copies and keeps every other skill", () => {
    const after = V105__swordMorphConversionAtTheRelease.migrate(clone(STORE))
    expect(after.v).toBe(105)
    for (const id of HEALED_IDS) expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID, EDITED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V105__swordMorphConversionAtTheRelease.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V105__swordMorphConversionAtTheRelease — through the chain", () => {
  it("is registered and is exactly what the v104 → v105 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V105__swordMorphConversionAtTheRelease)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 105 })!
    expect(result.applied).toEqual(["V105__swordMorphConversionAtTheRelease"])
    expect(result.blob.v).toBe(105)
  })
})
