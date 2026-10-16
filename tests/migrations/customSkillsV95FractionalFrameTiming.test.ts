import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V95__fractionalFrameTiming,
  healSkill,
} from "../../src/migrations/customSkills/V95__fractionalFrameTiming"
import { healSkill as healLaterStartOrder } from "../../src/migrations/customSkills/V101__wushuangStanceVagrantSwordStartOrder"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV94File from "./testCustomSkills/v94/store.json"

const STORE = storeV94File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_ID = "bellstrikeSplendor-energysurge"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"
const UNTOUCHED_ID = "bellstrikeSplendor-legioncrusher"
const HEALED_IDS = (STORE.skills as Skill[])
  .map((skill) => skill.id)
  .filter((id) => ![EDITED_ID, USER_AUTHORED_ID, UNTOUCHED_ID].includes(id))
const QIANKUNS_LOCK_IDS = HEALED_IDS.filter((id) => id.includes("spearq"))
const DRONE_LAUNCH_IDS = HEALED_IDS.filter((id) => id.includes("umbdronelaunch"))

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  [...builtinSkillsForClass("bellstrikeSplendor"), ...builtinSkillsForClass("silkbindJade")].find(
    (skill) => skill.id === id,
  )!

describe("custom-skills v94 fixture", () => {
  it("is v94 and still carries the whole-frame values", () => {
    expect(STORE.v).toBe(V95__fractionalFrameTiming.to - 1)
    const releaseHit = skillIn(STORE, "bellstrikeSplendor-swordheavycharged").hits[3]!
    expect(releaseHit.frame).toBe(85)
    expect(skillIn(STORE, "bellstrikeSplendor-energysurge").hits[0]!.frame).toBe(6)
    expect(skillIn(STORE, "silkbindJade-umbdronelaunch-12hit").hits[0]!.frame).toBe(36)
    const qiankunsLockGain = skillIn(STORE, "bellstrikeSplendor-spearq").hits[0]!.triggers[0]!
    expect(qiankunsLockGain).not.toHaveProperty("delayFrames")
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healLaterStartOrder(healSkill(clone(skillIn(STORE, id)))) as Skill
    const live = builtinOf(id)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
  })

  it("retimes only the frames of an edited copy that still hold the seeded value", () => {
    const edited = skillIn(STORE, EDITED_ID)
    expect(edited.hits[1]!.frame).toBe(20)
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits.map((hit) => hit.frame)).toEqual([6.06, 20, 45.3, 0])
  })

  it("leaves a cast length the copy was edited away from alone", () => {
    const edited = clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))
    edited.castFrames = 130
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(130)
    expect(healed.hits[3]!.frame).toBe(84.6)
  })

  it.each(QIANKUNS_LOCK_IDS)("delays the Endurance gain of %s by 0.6 f and nothing else", (id) => {
    const seeded = skillIn(STORE, id)
    const healed = healSkill(clone(seeded)) as Skill
    const gains = healed.hits[0]!.triggers.filter(
      (trigger) =>
        trigger.kind === "meterDelta" &&
        trigger.targetId === "endurance" &&
        !("requiresParam" in trigger),
    )
    expect(gains).toHaveLength(1)
    expect(gains[0]).toMatchObject({ stacks: 30, delayFrames: 0.6 })
    expect(healed.hits[0]!.triggers).toHaveLength(seeded.hits[0]!.triggers.length)
  })

  it.each(DRONE_LAUNCH_IDS)(
    "lands the throw of %s on 35.78 f and keeps its drone trigger",
    (id) => {
      const seeded = skillIn(STORE, id)
      const healed = healSkill(clone(seeded)) as Skill
      expect(healed.hits).toHaveLength(1)
      expect(healed.hits[0]!.frame).toBe(35.78)
      expect(healed.hits[0]!.triggers).toEqual(seeded.hits[0]!.triggers)
    },
  )

  it("leaves a throw whose frame was edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-umbdronelaunch-12hit"))
    edited.hits[0]!.frame = 40
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched built-in neighbour and a user-authored skill alone and is idempotent", () => {
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

describe("V95__fractionalFrameTiming — called directly", () => {
  it("heals the retimed skills and keeps every other skill", () => {
    const after = V95__fractionalFrameTiming.migrate(clone(STORE))
    expect(after.v).toBe(95)
    for (const id of HEALED_IDS) {
      const settled = healLaterStartOrder(skillIn(after, id)) as Skill
      expect(settled.hits, id).toEqual(builtinOf(id).hits)
    }
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V95__fractionalFrameTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V95__fractionalFrameTiming — through the chain", () => {
  it("is registered and is exactly what the v94 → v95 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V95__fractionalFrameTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 95 })!
    expect(result.applied).toEqual(["V95__fractionalFrameTiming"])
    expect(result.blob.v).toBe(95)
  })
})
