import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V108__dragonBreathSlowFormWithoutIntoxicated,
  healSkill,
} from "../../src/migrations/customSkills/V108__dragonBreathSlowFormWithoutIntoxicated"
import { healSkill as healSingleHitFrame } from "../../src/migrations/customSkills/V109__dragonBreathSingleHitFastFrame"
import { healSkill as healSlowFormChosenAtThePress } from "../../src/migrations/customSkills/V110__dragonBreathSlowFormChosenAtThePress"
import { builtinSkill } from "../builtins"
import type { Skill } from "../../src/engine/skill"
import storeV107File from "./testCustomSkills/v107/store.json"

const STORE = storeV107File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const BREATH_IDS = [
  "mystic-fire-breath-1-hit",
  "mystic-fire-breath-2-hit",
  "mystic-dragon-fire-smolder-1-hit",
  "mystic-dragon-fire-smolder-2-hits",
]
const POET_ID = "mystic-drunkenpoet-prepull"
const UNRELATED_ID = "bellstrikeUmbra-spear-heavy-2"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const withoutHitIds = (skill: Skill) => skill.hits.map(({ id: _id, ...rest }) => rest)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v107 fixture", () => {
  it("is v107 and stores every Dragon's Breath form and the Poet cast without the slow form", () => {
    expect(STORE.v).toBe(V108__dragonBreathSlowFormWithoutIntoxicated.to - 1)
    for (const id of [...BREATH_IDS, POET_ID]) {
      expect(skillIn(STORE, id).hits[0]!.variants, id).toBeUndefined()
      expect(skillIn(STORE, id).hits[0]!.triggers.map((t) => t.targetId)).not.toContain(
        "debuff-mystic-intoxicated",
      )
    }
  })
})

describe("healSkill", () => {
  it("lands every untouched copy on the built-in hits", () => {
    for (const id of [...BREATH_IDS, POET_ID]) {
      const healed = healSlowFormChosenAtThePress(
        healSingleHitFrame(healSkill(clone(skillIn(STORE, id)))),
      ) as Skill
      expect(withoutHitIds(healed), id).toEqual(withoutHitIds(builtinSkill("bellstrikeUmbra", id)))
    }
  })

  it("keeps a retimed copy's own row and leaves a copy that already has the trigger alone", () => {
    const edited = clone(skillIn(STORE, BREATH_IDS[0]!))
    edited.hits[0]!.physMultiplier = 9
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.variants![0]!.physMultiplier).toBe(9)
    expect(healSkill(clone(healed))).toEqual(healed)
  })

  it("leaves an unrelated and a user-authored skill alone", () => {
    for (const id of [UNRELATED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
  })
})

describe("V108__dragonBreathSlowFormWithoutIntoxicated — called directly and through the chain", () => {
  it("heals the copies and keeps every other skill", () => {
    const after = V108__dragonBreathSlowFormWithoutIntoxicated.migrate(clone(STORE))
    expect(after.v).toBe(108)
    for (const id of [...BREATH_IDS, POET_ID])
      expect(skillIn(after, id).hits[0]!.triggers.map((t) => t.targetId)).toContain(
        "debuff-mystic-intoxicated",
      )
    for (const id of [UNRELATED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V108__dragonBreathSlowFormWithoutIntoxicated.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v107 → v108 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V108__dragonBreathSlowFormWithoutIntoxicated)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 108 })!
    expect(result.applied).toEqual(["V108__dragonBreathSlowFormWithoutIntoxicated"])
    expect(result.blob.v).toBe(108)
  })
})
