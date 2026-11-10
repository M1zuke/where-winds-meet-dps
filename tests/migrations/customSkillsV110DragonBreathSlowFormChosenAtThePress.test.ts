import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V110__dragonBreathSlowFormChosenAtThePress,
  healSkill,
} from "../../src/migrations/customSkills/V110__dragonBreathSlowFormChosenAtThePress"
import { fireBreath1Hit } from "../../src/data/skills/mystic/fire-breath-1-hit"
import { fireBreath2Hit } from "../../src/data/skills/mystic/fire-breath-2-hit"
import { dragonFireSmolder1Hit } from "../../src/data/skills/mystic/dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "../../src/data/skills/mystic/dragon-fire-smolder-2-hits"
import { SLOW_FORM_BONUS_FRAME } from "../../src/data/skills/dragonBreathSlowForm"
import type { Skill, SkillHit } from "../../src/engine/skill"
import storeV109File from "./testCustomSkills/v109/store.json"

const STORE = storeV109File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const FORM_IDS = [
  fireBreath1Hit.id,
  fireBreath2Hit.id,
  dragonFireSmolder1Hit.id,
  dragonFireSmolder2Hits.id,
]
const NEIGHBOUR_ID = "mystic-drunkenpoet-prepull"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const framesOf = (hits: SkillHit[]) => hits.map((hit) => hit.frame)
const structureOf = (skill: Skill) =>
  skill.hits.map((hit) => ({
    frame: hit.frame,
    slowFrame: hit.variants?.[0]?.frame,
    slowCast: hit.variants?.[0]?.castFrames,
    conditions: hit.conditions,
    unless: hit.unlessNextStepSkillIds,
    requires: hit.requiresNextStepSkillIds,
    gatedCast: hit.castFramesWhenGated,
    opens: hit.triggers.some((trigger) => trigger.targetId === "debuff-mystic-intoxicated"),
  }))

describe("custom-skills v109 fixture", () => {
  it("is v109 and carries the first-hit-only slow form", () => {
    expect(STORE.v).toBe(V110__dragonBreathSlowFormChosenAtThePress.to - 1)
    const full = skillIn(STORE, fireBreath2Hit.id)
    expect(full.hits[0]!.variants?.[0]?.castFrames).toBe(150)
    expect(full.hits[1]!.variants).toBeUndefined()
    expect(skillIn(STORE, fireBreath1Hit.id).castFrames).toBe(40)
  })
})

describe("healSkill on the full forms", () => {
  for (const id of [fireBreath2Hit.id, dragonFireSmolder2Hits.id]) {
    it(`${id} takes the built-in shape`, () => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      const builtin = id === fireBreath2Hit.id ? fireBreath2Hit : dragonFireSmolder2Hits
      expect(structureOf(healed)).toEqual(structureOf(builtin))
      expect(healed.hits[2]!.variants?.[0]?.frame).toBe(SLOW_FORM_BONUS_FRAME)
    })
  }

  it("keeps a first-hit slow cast the user changed", () => {
    const edited = clone(skillIn(STORE, fireBreath2Hit.id))
    edited.hits[0]!.variants![0]!.castFrames = 155
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.variants![0]!.castFrames).toBe(155)
  })

  it("leaves a hit whose frame the user moved without a slow frame", () => {
    const edited = clone(skillIn(STORE, fireBreath2Hit.id))
    edited.hits[1]!.frame = 110
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[1]!.variants).toBeUndefined()
  })
})

describe("healSkill on the single-hit forms", () => {
  for (const id of [fireBreath1Hit.id, dragonFireSmolder1Hit.id]) {
    it(`${id} takes the built-in shape`, () => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      const builtin = id === fireBreath1Hit.id ? fireBreath1Hit : dragonFireSmolder1Hit
      expect(healed.castFrames).toBe(builtin.castFrames)
      expect(structureOf(healed)).toEqual(structureOf(builtin))
      expect(framesOf(healed.hits)).toEqual(framesOf(builtin.hits))
    })
  }

  it("keeps a quick cast the user changed", () => {
    const edited = clone(skillIn(STORE, fireBreath1Hit.id))
    edited.castFrames = 44
    expect((healSkill(clone(edited)) as Skill).castFrames).toBe(44)
  })
})

describe("healSkill on everything else", () => {
  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of FORM_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V110__dragonBreathSlowFormChosenAtThePress — called directly and through the chain", () => {
  it("heals the four forms and keeps every other skill", () => {
    const after = V110__dragonBreathSlowFormChosenAtThePress.migrate(clone(STORE))
    expect(after.v).toBe(110)
    for (const id of FORM_IDS) expect(skillIn(after, id)).not.toEqual(skillIn(STORE, id))
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V110__dragonBreathSlowFormChosenAtThePress.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v109 → v110 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V110__dragonBreathSlowFormChosenAtThePress)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 110 })!
    expect(result.applied).toEqual(["V110__dragonBreathSlowFormChosenAtThePress"])
    expect(result.blob.v).toBe(110)
  })
})
