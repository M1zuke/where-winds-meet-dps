import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V96__stonesplitFractionalFrameTiming,
  healSkill,
} from "../../src/migrations/customSkills/V96__stonesplitFractionalFrameTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV95File from "./testCustomSkills/v95/store.json"

const STORE = storeV95File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_ID = "stonesplitStrength-phalanxq-supreme"
const UNTOUCHED_ID = "stonesplitStrength-heng-dash"
const USER_AUTHORED_ID = "sk-user-authored-phalanx-strike"
const HEALED_IDS = [
  "stonesplitStrength-phalanxq",
  "stonesplitStrength-deflect",
  "stonesplitStrength-deflect-cancel",
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!

describe("custom-skills v95 fixture", () => {
  it("is v95 and still carries the whole-frame values", () => {
    expect(STORE.v).toBe(V96__stonesplitFractionalFrameTiming.to - 1)
    expect(skillIn(STORE, "stonesplitStrength-phalanxq").hits[0]!.frame).toBe(26)
    expect(skillIn(STORE, "stonesplitStrength-deflect").hits[0]!.variants![0]!.castFrames).toBe(18)
    expect(skillIn(STORE, EDITED_ID).castFrames).toBe(222)
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const live = builtinOf(id)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
  })

  it("retimes the cast length and grant frames of Supreme and leaves its edited strike frame", () => {
    const healed = healSkill(clone(skillIn(STORE, EDITED_ID))) as Skill
    const live = builtinOf(EDITED_ID)
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.triggersBuffsAtFrame).toEqual(live.triggersBuffsAtFrame)
    expect(healed.hits[0]!.frame).toBe(200)
  })

  it("leaves a cast length the copy was edited away from alone", () => {
    const edited = clone(skillIn(STORE, EDITED_ID))
    edited.castFrames = 230
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(230)
    expect(healed.triggersBuffsAtFrame).toEqual(builtinOf(EDITED_ID).triggersBuffsAtFrame)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of [...HEALED_IDS, EDITED_ID]) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V96__stonesplitFractionalFrameTiming — called directly", () => {
  it("heals the retimed skills and keeps every other skill", () => {
    const after = V96__stonesplitFractionalFrameTiming.migrate(clone(STORE))
    expect(after.v).toBe(96)
    for (const id of HEALED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V96__stonesplitFractionalFrameTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V96__stonesplitFractionalFrameTiming — through the chain", () => {
  it("is registered and is exactly what the v95 → v96 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V96__stonesplitFractionalFrameTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 96 })!
    expect(result.applied).toEqual(["V96__stonesplitFractionalFrameTiming"])
    expect(result.blob.v).toBe(96)
  })
})
