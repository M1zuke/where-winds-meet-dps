import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V77__mysticFreeMorphWolflikeFrenzyTiming } from "../../src/migrations/customSkills/V77__mysticFreeMorphWolflikeFrenzyTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/mystic/ids"
import storeV76File from "./testCustomSkills/v76/store.json"

const STORE = storeV76File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const RETIMED_IDS = [SKILL.freeMorph, SKILL.wolflikeFrenzy]
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const framesOf = (skill: Skill): number[] => skill.hits.map((hit) => hit.frame)

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

describe("custom-skills v76 fixture", () => {
  it("is v76 and stores both arts on their earlier cast lengths and hit frames", () => {
    expect(STORE.v).toBe(V77__mysticFreeMorphWolflikeFrenzyTiming.to - 1)
    expect(framesOf(skillIn(STORE, SKILL.freeMorph))).toEqual([25, 59, 80, 101, 115, 126, 171])
    expect(skillIn(STORE, SKILL.freeMorph).castFrames).toBe(171)
    expect(framesOf(skillIn(STORE, SKILL.wolflikeFrenzy))).toEqual([47, 83, 95, 115, 127, 167])
    expect(skillIn(STORE, SKILL.wolflikeFrenzy).castFrames).toBe(167)
  })
})

describe("V77__mysticFreeMorphWolflikeFrenzyTiming — called directly", () => {
  it("moves every untouched copy onto the built-in's cast length and frames", () => {
    const after = V77__mysticFreeMorphWolflikeFrenzyTiming.migrate(clone(STORE))
    expect(after.v).toBe(77)
    for (const id of RETIMED_IDS) {
      expect(skillIn(after, id).castFrames, id).toBe(builtin(id).castFrames)
      expect(framesOf(skillIn(after, id)), id).toEqual(framesOf(builtin(id)))
    }
  })

  it("leaves a value the user edited, a user-authored skill and every other field alone", () => {
    const edited = clone(STORE)
    const freeMorph = skillIn(edited, SKILL.freeMorph)
    freeMorph.castFrames = 180
    freeMorph.hits[0]!.frame = 30
    const after = V77__mysticFreeMorphWolflikeFrenzyTiming.migrate(edited)
    expect(skillIn(after, SKILL.freeMorph).castFrames).toBe(180)
    expect(skillIn(after, SKILL.freeMorph).hits[0]!.frame).toBe(30)
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    const rest = ({ hits, castFrames, ...others }: Skill) => others
    expect(rest(skillIn(after, SKILL.wolflikeFrenzy))).toEqual(
      rest(skillIn(STORE, SKILL.wolflikeFrenzy)),
    )
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V77__mysticFreeMorphWolflikeFrenzyTiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V77__mysticFreeMorphWolflikeFrenzyTiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V77__mysticFreeMorphWolflikeFrenzyTiming — through the chain", () => {
  it("is registered and is exactly what the v76 → v77 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V77__mysticFreeMorphWolflikeFrenzyTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 77 })!
    expect(result.applied).toEqual(["V77__mysticFreeMorphWolflikeFrenzyTiming"])
    expect(result.blob.v).toBe(77)
    expect(skillIn(result.blob, SKILL.freeMorph).castFrames).toBe(270)
  })
})
