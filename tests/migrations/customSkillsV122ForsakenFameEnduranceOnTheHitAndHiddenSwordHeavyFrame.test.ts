import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame,
  healSkill,
} from "../../src/migrations/customSkills/V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV121File from "./testCustomSkills/v121/store.json"

const STORE = storeV121File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const FAME_ID = "silkbindJade-fanlightcharged"
const HEAVY_ALT_ID = "silkbindJade-hidden-sword-heavy-alt"
const UNTOUCHED_IDS = ["silkbindJade-hidden-sword-heavy-1", "sk-user-authored-fame"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v121 fixture", () => {
  it("is v121 and stores the delayed Endurance gain and the heavy hit at frame 0", () => {
    expect(STORE.v).toBe(V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame.to - 1)
    expect(skillIn(STORE, FAME_ID).hits[0]!.triggers[0]!.delayFrames).toBe(1.8)
    expect(skillIn(STORE, HEAVY_ALT_ID).hits[0]!.frame).toBe(0)
  })
})

describe("healSkill", () => {
  it("drops the delay of the untouched Forsaken Fame copy's Endurance gain", () => {
    const healed = healSkill(clone(skillIn(STORE, FAME_ID))) as Skill
    expect(healed.hits[0]!.triggers).toEqual(builtinOf(FAME_ID).hits[0]!.triggers)
  })

  it("moves the untouched alternative heavy hit to the built-in's frame", () => {
    const healed = healSkill(clone(skillIn(STORE, HEAVY_ALT_ID))) as Skill
    expect(healed.hits[0]!.frame).toBe(builtinOf(HEAVY_ALT_ID).hits[0]!.frame)
  })

  it("keeps an Endurance gain or a hit frame that was edited", () => {
    const gain = clone(skillIn(STORE, FAME_ID))
    gain.hits[0]!.triggers[0]!.delayFrames = 3
    expect(healSkill(clone(gain))).toEqual(gain)
    const frame = clone(skillIn(STORE, HEAVY_ALT_ID))
    frame.hits[0]!.frame = 5
    expect(healSkill(clone(frame))).toEqual(frame)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of [FAME_ID, HEAVY_ALT_ID]) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v121 → v122 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(
      V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame,
    )
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 122 })!
    expect(result.applied).toEqual(["V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame"])
    expect(result.blob.v).toBe(122)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
