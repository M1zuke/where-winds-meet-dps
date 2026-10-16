import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V101__wushuangStanceVagrantSwordStartOrder,
  healSkill,
} from "../../src/migrations/customSkills/V101__wushuangStanceVagrantSwordStartOrder"
import { healSkill as healSplendorRootMotion } from "../../src/migrations/customSkills/V103__splendorRootMotion"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV100File from "./testCustomSkills/v100/store.json"

const STORE = storeV100File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = [
  "bellstrikeSplendor-swordheavycharged-wushuang",
  "bellstrikeSplendor-swordheavycharged-2-hit-wushuang",
]
const UNTOUCHED_ID = "bellstrikeSplendor-legioncrusher"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v100 fixture", () => {
  it("is v100 and still releases the stance charge on 60 f", () => {
    expect(STORE.v).toBe(V101__wushuangStanceVagrantSwordStartOrder.to - 1)
    for (const id of HEALED_IDS) {
      const hits = skillIn(STORE, id).hits
      expect(hits[hits.length - 1]!.frame, id).toBe(60)
      expect(skillIn(STORE, id).meterDrains![0]!.fromFrame, id).toBe(12.6)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSplendorRootMotion(healSkill(clone(skillIn(STORE, id)))) as Skill
    const live = builtinOf(id)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.meterDrains).toEqual(live.meterDrains)
  })

  it("retimes only the values of an edited copy that still hold the seeded one", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.hits[1]!.frame = 80
    edited.meterDrains![0]!.fromFrame = 13
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits.map((hit) => hit.frame)).toEqual([68.49, 80, 105.7, 60.4])
    expect(healed.meterDrains![0]!.fromFrame).toBe(13)
  })

  it("leaves a cast length the copy was edited away from alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[1]!))
    edited.castFrames = 90
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(90)
    expect(healed.hits[2]!.frame).toBe(60.4)
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

describe("V101__wushuangStanceVagrantSwordStartOrder — called directly", () => {
  it("heals the two stance forms and keeps every other skill", () => {
    const after = V101__wushuangStanceVagrantSwordStartOrder.migrate(clone(STORE))
    expect(after.v).toBe(101)
    for (const id of HEALED_IDS)
      expect((healSplendorRootMotion(skillIn(after, id)) as Skill).hits, id).toEqual(
        builtinOf(id).hits,
      )
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V101__wushuangStanceVagrantSwordStartOrder.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V101__wushuangStanceVagrantSwordStartOrder — through the chain", () => {
  it("is registered and is exactly what the v100 → v101 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V101__wushuangStanceVagrantSwordStartOrder)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 101 })!
    expect(result.applied).toEqual(["V101__wushuangStanceVagrantSwordStartOrder"])
    expect(result.blob.v).toBe(101)
  })
})
