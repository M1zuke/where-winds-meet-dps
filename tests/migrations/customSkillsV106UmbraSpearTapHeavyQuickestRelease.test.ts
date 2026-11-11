import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V106__umbraSpearTapHeavyQuickestRelease,
  healSkill,
} from "../../src/migrations/customSkills/V106__umbraSpearTapHeavyQuickestRelease"
import { spearHeavy1 } from "../../src/data/skills/bellstrike-umbra/spear-heavy-1"
import type { Skill } from "../../src/engine/skill"
import storeV105File from "./testCustomSkills/v105/store.json"

const STORE = storeV105File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const TAP_ID = spearHeavy1.id
const NEIGHBOUR_ID = "bellstrikeUmbra-spear-heavy-2"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v105 fixture", () => {
  it("is v105 and still waits the full hold window before the tap lands", () => {
    expect(STORE.v).toBe(V106__umbraSpearTapHeavyQuickestRelease.to - 1)
    expect(skillIn(STORE, TAP_ID).hits[0]!.frame).toBe(43)
    expect(skillIn(STORE, TAP_ID).castFrames).toBe(66)
  })
})

describe("healSkill", () => {
  it("lands the untouched tap copy on the built-in timing", () => {
    const healed = healSkill(clone(skillIn(STORE, TAP_ID))) as Skill
    expect(healed.hits[0]!.frame).toBe(spearHeavy1.hits[0]!.frame)
    expect(healed.castFrames).toBe(spearHeavy1.castFrames)
  })

  it("retimes only the values that still hold the seeded one", () => {
    const editedCast = clone(skillIn(STORE, TAP_ID))
    editedCast.castFrames = 70
    const healedCast = healSkill(clone(editedCast)) as Skill
    expect(healedCast.castFrames).toBe(70)
    expect(healedCast.hits[0]!.frame).toBe(29.53)

    const editedHit = clone(skillIn(STORE, TAP_ID))
    editedHit.hits[0]!.frame = 40
    const healedHit = healSkill(clone(editedHit)) as Skill
    expect(healedHit.hits[0]!.frame).toBe(40)
    expect(healedHit.castFrames).toBe(52.2)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, TAP_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V106__umbraSpearTapHeavyQuickestRelease — called directly and through the chain", () => {
  it("heals the tap copy and keeps every other skill", () => {
    const after = V106__umbraSpearTapHeavyQuickestRelease.migrate(clone(STORE))
    expect(after.v).toBe(106)
    expect(skillIn(after, TAP_ID).castFrames).toBe(52.2)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V106__umbraSpearTapHeavyQuickestRelease.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v105 → v106 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V106__umbraSpearTapHeavyQuickestRelease)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 106 })!
    expect(result.applied).toEqual(["V106__umbraSpearTapHeavyQuickestRelease"])
    expect(result.blob.v).toBe(106)
  })
})
