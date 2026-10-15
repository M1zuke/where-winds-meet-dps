import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V75__springAwayHoverCueTiming,
  healSkill,
} from "../../src/migrations/customSkills/V75__springAwayHoverCueTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import storeV74File from "./testCustomSkills/v74/store.json"

const STORE = storeV74File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

function twelveBulletCopy(): Skill {
  const copy = clone(skillIn(STORE, SKILL.umblightcharge))
  const seededFrames = [58, 66, 77, 87, 98, 107, 117, 126, 136, 146, 156, 165]
  return {
    ...copy,
    id: SKILL.umblightcharge12,
    castFrames: 200,
    meterDrains: [{ ...copy.meterDrains![0], stopAfterSec: 2 }],
    hits: seededFrames.map((frame, index) => ({
      ...copy.hits[index % copy.hits.length],
      id: `hit-${index}`,
      frame,
    })),
  }
}

describe("custom-skills v74 fixture", () => {
  it("is v74 and stores Spring Away on the old bullet frames, cast length and drain", () => {
    expect(STORE.v).toBe(V75__springAwayHoverCueTiming.to - 1)
    const copy = skillIn(STORE, SKILL.umblightcharge)
    expect(copy.hits.map((hit) => hit.frame)).toEqual([58, 66, 77, 87, 98, 107])
    expect(copy.hits[0].projectile).toBeUndefined()
    expect(copy.castFrames).toBe(140)
    expect(copy.meterDrains![0]).toMatchObject({ fromFrame: 44, stopAfterSec: 1 })
  })
})

describe("healSkill - Spring Away", () => {
  it("lands a seeded 6-bullet copy on the live module's frames, projectile, cast length and drain", () => {
    const healed = healSkill(clone(skillIn(STORE, SKILL.umblightcharge))) as Skill
    const live = builtin(SKILL.umblightcharge)
    expect(healed.hits.map((hit) => hit.frame)).toEqual(live.hits.map((hit) => hit.frame))
    expect(healed.hits.map((hit) => hit.projectile)).toEqual(live.hits.map((hit) => hit.projectile))
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.meterDrains).toEqual(live.meterDrains)
  })

  it("lands a seeded 12-bullet copy on the live module's frames, cast length and drain", () => {
    const healed = healSkill(twelveBulletCopy()) as Skill
    const live = builtin(SKILL.umblightcharge12)
    expect(healed.hits.map((hit) => hit.frame)).toEqual(live.hits.map((hit) => hit.frame))
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.meterDrains).toEqual(live.meterDrains)
  })

  it("keeps every other field of the copy", () => {
    const original = clone(skillIn(STORE, SKILL.umblightcharge))
    const healed = healSkill(clone(original)) as Skill
    const strip = ({ hits, castFrames, meterDrains, ...rest }: Skill) => ({
      ...rest,
      hits: hits.map(({ frame, projectile, ...hit }) => hit),
    })
    expect(strip(healed)).toEqual(strip(original))
  })

  it("keeps edited bullet frames and heals the other parts", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.hits[2].frame = 80
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits.map((hit) => hit.frame)).toEqual(edited.hits.map((hit) => hit.frame))
    expect(healed.castFrames).toBe(132.05)
  })

  it("keeps an edited cast length and an edited drain", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.castFrames = 150
    edited.meterDrains![0].stopAfterSec = 1.5
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(150)
    expect(healed.meterDrains).toEqual(edited.meterDrains)
    expect(healed.hits[0].frame).toBe(47.4)
  })

  it("leaves every other skill alone", () => {
    for (const skill of STORE.skills) {
      if (skill.id === SKILL.umblightcharge || skill.id === SKILL.umblightcharge12) continue
      expect(healSkill(clone(skill)), skill.id).toEqual(skill)
    }
  })

  it("is idempotent", () => {
    const once = healSkill(clone(skillIn(STORE, SKILL.umblightcharge)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V75__springAwayHoverCueTiming - through the chain", () => {
  it("is registered and is exactly what the v74 to v75 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V75__springAwayHoverCueTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 75 })!
    expect(result.applied).toEqual(["V75__springAwayHoverCueTiming"])
    expect(result.blob.v).toBe(75)
    expect(skillIn(result.blob, SKILL.umblightcharge).hits[0].frame).toBe(47.4)
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V75__springAwayHoverCueTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})
