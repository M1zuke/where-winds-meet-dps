import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V72__stonesplitHitFrameRetiming } from "../../src/migrations/customSkills/V72__stonesplitHitFrameRetiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/stonesplit-strength/ids"

const RETIMED = [
  { id: SKILL.snowpartingspecial, oldFrames: [38, 60, 66, 72, 78, 96, 100, 104, 108] },
  { id: SKILL.hengDash, oldFrames: [22] },
  { id: SKILL.moDash, oldFrames: [25] },
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const builtin = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!

const framesOf = (skill: Skill): number[] => skill.hits.map((hit) => hit.frame)

const seededOnOldFrames = (id: string, oldFrames: number[]): Skill => {
  const skill = clone(builtin(id))
  skill.hits = skill.hits.map((hit, index) => ({ ...hit, frame: oldFrames[index]! }))
  return skill
}

const storeOf = (skills: Skill[]): RawCustomSkillsBlob & { skills: Skill[] } => ({
  v: 71,
  skills,
})

const seededStore = () =>
  storeOf(RETIMED.map(({ id, oldFrames }) => seededOnOldFrames(id, oldFrames)))

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V72__stonesplitHitFrameRetiming — called directly", () => {
  it("moves every untouched copy onto the built-in's frames", () => {
    const after = V72__stonesplitHitFrameRetiming.migrate(seededStore())
    expect(after.v).toBe(72)
    for (const { id } of RETIMED) {
      expect(framesOf(skillIn(after, id)), id).toEqual(framesOf(builtin(id)))
    }
  })

  it("leaves an edited frame and every other field alone", () => {
    const edited = seededStore()
    const fleetingTrace = skillIn(edited, SKILL.snowpartingspecial)
    fleetingTrace.hits[0]!.frame = 40
    const after = V72__stonesplitHitFrameRetiming.migrate(edited)
    const healed = skillIn(after, SKILL.snowpartingspecial)
    expect(healed.hits[0]!.frame).toBe(40)
    expect(healed.hits[1]!.frame).toBe(73)
    expect(healed.castFrames).toBe(fleetingTrace.castFrames)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = seededStore()
    const snapshot = clone(input)
    const once = V72__stonesplitHitFrameRetiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V72__stonesplitHitFrameRetiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V72__stonesplitHitFrameRetiming — through the chain", () => {
  it("is registered and is exactly what the v71 → v72 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V72__stonesplitHitFrameRetiming)
    const result = runCustomSkillMigrations(seededStore(), { toVersion: 72 })!
    expect(result.applied).toEqual(["V72__stonesplitHitFrameRetiming"])
    expect(framesOf(skillIn(result.blob, SKILL.hengDash))).toEqual([24])
  })
})
