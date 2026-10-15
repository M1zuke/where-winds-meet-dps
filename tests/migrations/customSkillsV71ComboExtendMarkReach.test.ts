import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V71__comboExtendMarkReach } from "../../src/migrations/customSkills/V71__comboExtendMarkReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import storeV70File from "./testCustomSkills/v70/store.json"

const STORE = storeV70File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_COPY_ID = SKILL.umblightcharge12

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v70 fixture", () => {
  it("is v70 and stores Spring Away without the Extend Mark grant", () => {
    expect(STORE.v).toBe(V71__comboExtendMarkReach.to - 1)
    expect(skillIn(STORE, SKILL.umblightcharge).triggersBuffs).toBeUndefined()
    expect(skillIn(STORE, EDITED_COPY_ID).triggersBuffs).toEqual(["userAddedBuff"])
  })
})

describe("V71__comboExtendMarkReach — called directly", () => {
  it("gives an untouched Spring Away copy the built-in's grant and its frame", () => {
    const after = V71__comboExtendMarkReach.migrate(clone(STORE))
    const healed = skillIn(after, SKILL.umblightcharge)
    expect(after.v).toBe(71)
    expect(healed.triggersBuffs).toEqual(builtin(SKILL.umblightcharge).triggersBuffs)
    expect(healed.triggersBuffsAtFrame).toEqual(builtin(SKILL.umblightcharge).triggersBuffsAtFrame)
  })

  it("heals the 12-bullet copy the same way", () => {
    const store = clone(STORE)
    const twelve = { ...skillIn(store, SKILL.umblightcharge), id: SKILL.umblightcharge12 }
    const after = V71__comboExtendMarkReach.migrate({ ...store, skills: [twelve] })
    const healed = skillIn(after, SKILL.umblightcharge12)
    expect(healed.triggersBuffs).toEqual(builtin(SKILL.umblightcharge12).triggersBuffs)
    expect(healed.triggersBuffsAtFrame).toEqual(
      builtin(SKILL.umblightcharge12).triggersBuffsAtFrame,
    )
  })

  it("leaves an edited copy and every other skill alone", () => {
    const after = V71__comboExtendMarkReach.migrate(clone(STORE))
    expect(skillIn(after, EDITED_COPY_ID)).toEqual(skillIn(STORE, EDITED_COPY_ID))
    for (const skill of STORE.skills) {
      if (skill.id === SKILL.umblightcharge) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V71__comboExtendMarkReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V71__comboExtendMarkReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V71__comboExtendMarkReach — through the chain", () => {
  it("is registered and is exactly what the v70 → v71 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V71__comboExtendMarkReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 71 })!
    expect(result.applied).toEqual(["V71__comboExtendMarkReach"])
    expect(result.blob.v).toBe(71)
    expect(skillIn(result.blob, SKILL.umblightcharge).triggersBuffs).toEqual(["comboExtendMark"])
  })
})
