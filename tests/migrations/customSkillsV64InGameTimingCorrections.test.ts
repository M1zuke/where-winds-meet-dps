import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V64__inGameTimingCorrections,
  healSkill,
} from "../../src/migrations/customSkills/V64__inGameTimingCorrections"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV63File from "./testCustomSkills/v63/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV63File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const UMBRA_STAGE_1_IDS = [1, 2, 3, 4, 5].map(
  (hits) => `bellstrikeUmbra-sword-charge-stage-1-${hits}-hit`,
)
const UMBRA_STAGE_2_IDS = [4, 5].map((hits) => `bellstrikeUmbra-sword-charge-stage-2-${hits}-hit`)
const LEVEL_0_ID = "bellstrikeUmbra-sword-charge-stage-1-level-0"
const HEROS_BLOOD_ID = "bamboocutDraught-heros-blood"
const VAGRANT_SWORD_IDS = [
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-swordheavycharged-2-hit",
]
const EDITED_VAGRANT_SWORD_ID = "bellstrikeSplendor-energysurge"
const USER_SKILL_ID = "sk-user-authored-slash"
const HEALED_IDS = [
  ...UMBRA_STAGE_1_IDS,
  ...UMBRA_STAGE_2_IDS,
  LEVEL_0_ID,
  HEROS_BLOOD_ID,
  ...VAGRANT_SWORD_IDS,
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  [
    ...builtinSkillsForClass("bellstrikeUmbra"),
    ...builtinSkillsForClass("bellstrikeSplendor"),
    ...builtinSkillsForClass("bamboocutDraught"),
  ].find((skill) => skill.id === id)!

const frames = (skill: Skill) => skill.hits.map((hit) => hit.frame)
const gatedCastFrames = (skill: Skill) => skill.hits.map((hit) => hit.castFramesWhenGated)
const drainTiming = (skill: Skill) =>
  skill.meterDrains?.map(({ fromFrame, stopAfterSec }) => ({ fromFrame, stopAfterSec }))

describe("custom-skills v63 fixture", () => {
  it("is v63 and every seeded copy still carries the old timing and Vagrant Sword stance", () => {
    expect(STORE.v).toBe(V64__inGameTimingCorrections.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const live = builtin(id)
      expect(
        seeded.castFrames !== live.castFrames ||
          JSON.stringify(frames(seeded)) !== JSON.stringify(frames(live)) ||
          JSON.stringify(drainTiming(seeded)) !== JSON.stringify(drainTiming(live)) ||
          JSON.stringify(seeded.tags) !== JSON.stringify(live.tags),
        id,
      ).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(UMBRA_STAGE_1_IDS)("lands %s on the built-in's frames, cast length and drain", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const live = builtin(id)
    expect(healed.castFrames).toBe(live.castFrames)
    expect(frames(healed)).toEqual(frames(live))
    expect(gatedCastFrames(healed)).toEqual(gatedCastFrames(live))
    expect(drainTiming(healed)).toEqual(drainTiming(live))
  })

  it.each(UMBRA_STAGE_2_IDS)("lands %s on the built-in's drain and nothing else", (id) => {
    const original = skillIn(STORE, id)
    const healed = healSkill(clone(original)) as Skill
    expect(drainTiming(healed)).toEqual(drainTiming(builtin(id)))
    expect({ ...healed, meterDrains: undefined }).toEqual({ ...original, meterDrains: undefined })
  })

  it("lands the level-0 release on the built-in", () => {
    const healed = healSkill(clone(skillIn(STORE, LEVEL_0_ID))) as Skill
    expect(healed.castFrames).toBe(builtin(LEVEL_0_ID).castFrames)
    expect(frames(healed)).toEqual(frames(builtin(LEVEL_0_ID)))
  })

  it("lands Hero's Blood's two strikes on the built-in's frames", () => {
    const healed = healSkill(clone(skillIn(STORE, HEROS_BLOOD_ID))) as Skill
    expect(frames(healed)).toEqual(frames(builtin(HEROS_BLOOD_ID)))
  })

  it.each(VAGRANT_SWORD_IDS)("drops the heavy tag and Mistwillow from %s", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const live = builtin(id)
    expect(healed.tags).toEqual(live.tags)
    expect([...(healed.receives ?? [])].sort()).toEqual([...(live.receives ?? [])].sort())
  })

  it("shortens the single-bolt Vagrant Sword to the built-in's cast length", () => {
    const id = "bellstrikeSplendor-swordheavycharged"
    expect((healSkill(clone(skillIn(STORE, id))) as Skill).castFrames).toBe(builtin(id).castFrames)
  })

  it("leaves a Vagrant Sword copy the user edited alone", () => {
    const edited = skillIn(STORE, EDITED_VAGRANT_SWORD_ID)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a hit frame, cast length and drain the user edited alone", () => {
    const edited = clone(skillIn(STORE, UMBRA_STAGE_1_IDS[4]!))
    edited.castFrames = 160
    edited.hits[0]!.frame = 40
    edited.meterDrains![0]!.fromFrame = 20
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(160)
    expect(healed.hits[0]!.frame).toBe(40)
    expect(healed.meterDrains![0]!.fromFrame).toBe(20)
    expect(healed.hits[1]!.frame).toBe(61)
  })

  it("leaves an edited Hero's Blood strike alone", () => {
    const edited = clone(skillIn(STORE, HEROS_BLOOD_ID))
    edited.hits[1]!.frame = 30
    const healed = healSkill(clone(edited)) as Skill
    expect(frames(healed)).toEqual([0, 30, 22])
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, USER_SKILL_ID)
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V64__inGameTimingCorrections — called directly", () => {
  it("heals every targeted copy and leaves every other copy alone", () => {
    const after = V64__inGameTimingCorrections.migrate(clone(STORE))
    expect(after.v).toBe(64)
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) {
        expect(skillIn(after, skill.id), skill.id).not.toEqual(skill)
      } else {
        expect(skillIn(after, skill.id), skill.id).toEqual(skill)
      }
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V64__inGameTimingCorrections.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V64__inGameTimingCorrections.migrate(clone(once))).toEqual(once)
  })
})

describe("V64__inGameTimingCorrections — through the chain", () => {
  it("is registered and is exactly what the v63 → v64 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V64__inGameTimingCorrections)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 64 })!
    expect(result.applied).toEqual(["V64__inGameTimingCorrections"])
    expect(result.blob.v).toBe(64)
  })

  it("removing the step from the registry leaves the pre-migration timing untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V64__inGameTimingCorrections,
    )
    const result = runChain(withoutStep, 64, clone(STORE))!
    expect(result.applied).not.toContain("V64__inGameTimingCorrections")
    expect(frames(skillIn(result.blob, HEROS_BLOOD_ID))).toEqual([0, 33, 33])
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the corrected timing after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    expect(frames(loaded.find((skill) => skill.id === HEROS_BLOOD_ID)!)).toEqual([0, 22, 22])
    expect(loaded.find((skill) => skill.id === UMBRA_STAGE_1_IDS[4])!.castFrames).toBe(152)
  })
})
