import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V78__reviewedTimingsGrantsAndNames,
  healSkill,
} from "../../src/migrations/customSkills/V78__reviewedTimingsGrantsAndNames"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL as UMBRA_SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as JADE_SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { SKILL as STONESPLIT_SKILL } from "../../src/data/skills/stonesplit-strength/ids"
import { SKILL as DRAUGHT_SKILL } from "../../src/data/skills/bamboocut-draught/ids"
import storeV77File from "./testCustomSkills/v77/store.json"

const STORE = storeV77File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (classId: string, id: string): Skill =>
  clone(builtinSkillsForClass(classId).find((skill) => skill.id === id)!)

const frames = (skill: Skill): number[] => skill.hits.map((hit) => hit.frame)

const targetIds = (hit: Skill["hits"][number]): string[] =>
  hit.triggers.map((trigger) => trigger.targetId)

describe("custom-skills v77 fixture", () => {
  it("is v77 and stores Zenith Sword and the Binge Points grants on the earlier shapes", () => {
    expect(STORE.v).toBe(V78__reviewedTimingsGrantsAndNames.to - 1)
    expect(skillIn(STORE, UMBRA_SKILL.crosswindBlade).name).toBe("Crosswind Blade")
    expect(skillIn(STORE, DRAUGHT_SKILL.castlink).hits).toHaveLength(4)
    expect(skillIn(STORE, DRAUGHT_SKILL.nightwickGrounddrift).hits).toHaveLength(4)
  })
})

describe("healSkill — names", () => {
  it("renames an untouched Zenith Sword copy and its cancel form", () => {
    const after = V78__reviewedTimingsGrantsAndNames.migrate(clone(STORE))
    expect(skillIn(after, UMBRA_SKILL.crosswindBlade).name).toBe("Zenith Sword")
    expect(skillIn(after, UMBRA_SKILL.crosswindBladeCancel).name).toBe("Zenith Sword [cancel]")
  })

  it("keeps a name the user changed", () => {
    const edited = clone(skillIn(STORE, UMBRA_SKILL.crosswindBlade))
    edited.name = "My Crosswind"
    expect((healSkill(edited) as Skill).name).toBe("My Crosswind")
  })
})

describe("healSkill — Binge Points grants", () => {
  it("moves Castlink's grants onto zero-damage hits on the animation's frames", () => {
    const healed = healSkill(clone(skillIn(STORE, DRAUGHT_SKILL.castlink))) as Skill
    const live = builtin("bamboocutDraught", DRAUGHT_SKILL.castlink)
    expect(frames(healed)).toEqual(frames(live))
    expect(healed.hits.map((hit) => hit.triggers.length)).toEqual(
      live.hits.map((hit) => hit.triggers.length),
    )
    expect(healed.hits.map((hit) => hit.conditions)).toEqual(live.hits.map((hit) => hit.conditions))
    expect(targetIds(healed.hits[4]!)).toEqual(targetIds(live.hits[4]!))
  })

  it("moves Grounddrift's grant onto a zero-damage hit on frame 93", () => {
    const healed = healSkill(clone(skillIn(STORE, DRAUGHT_SKILL.nightwickGrounddrift))) as Skill
    expect(healed.hits).toHaveLength(5)
    expect(healed.hits[4]!.frame).toBe(93)
    expect(healed.hits[3]!.triggers).toEqual([])
    expect(targetIds(healed.hits[4]!)).toEqual(
      targetIds(builtin("bamboocutDraught", DRAUGHT_SKILL.nightwickGrounddrift).hits[4]!),
    )
  })

  it("leaves a Castlink copy whose grant the user edited alone", () => {
    const edited = clone(skillIn(STORE, DRAUGHT_SKILL.castlink))
    edited.hits[1]!.triggers = edited.hits[1]!.triggers.slice(0, 1)
    expect(healSkill(clone(edited))).toEqual(edited)
  })
})

describe("healSkill — timings and Dread", () => {
  it("lands Hidden Sword's second hit on frame 20", () => {
    const seeded = builtin("silkbindJade", JADE_SKILL.hiddenSwordLight3)
    seeded.hits[1]!.frame = 21
    expect(frames(healSkill(seeded) as Skill)).toEqual(
      frames(builtin("silkbindJade", JADE_SKILL.hiddenSwordLight3)),
    )
  })

  it("casts Fleeting Trace for 124 f and applies Dread on its second last hit", () => {
    const seeded = builtin("stonesplitStrength", STONESPLIT_SKILL.snowpartingspecial)
    seeded.castFrames = 125
    seeded.hits[7]!.triggers = []
    const healed = healSkill(seeded) as Skill
    const live = builtin("stonesplitStrength", STONESPLIT_SKILL.snowpartingspecial)
    expect(healed.castFrames).toBe(124)
    expect(healed.hits.map(targetIds)).toEqual(live.hits.map(targetIds))
  })

  it("casts the Primepick follow-up for 36 f", () => {
    const seeded = builtin("bamboocutDraught", DRAUGHT_SKILL.nightwickPrimepickFollowUp)
    seeded.castFrames = 102
    expect((healSkill(seeded) as Skill).castFrames).toBe(36)
  })

  it("leaves a cast length the user edited alone", () => {
    const seeded = builtin("bamboocutDraught", DRAUGHT_SKILL.nightwickPrimepickFollowUp)
    seeded.castFrames = 90
    expect((healSkill(seeded) as Skill).castFrames).toBe(90)
  })
})

describe("V78__reviewedTimingsGrantsAndNames", () => {
  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V78__reviewedTimingsGrantsAndNames.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V78__reviewedTimingsGrantsAndNames.migrate(clone(once))).toEqual(once)
  })

  it("is registered and is exactly what the v77 → v78 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V78__reviewedTimingsGrantsAndNames)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 78 })!
    expect(result.applied).toEqual(["V78__reviewedTimingsGrantsAndNames"])
    expect(result.blob.v).toBe(78)
  })
})
