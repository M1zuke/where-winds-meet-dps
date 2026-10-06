import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V61__boundvesselSpringAwayToadAfterimageTiming,
  healSkill,
} from "../../src/migrations/customSkills/V61__boundvesselSpringAwayToadAfterimageTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV60File from "./testCustomSkills/v60/store.json"

const TOAD_ID = "mystic-toad-cancel"
const BOUNDVESSEL_ID = "bamboocutDraught-boundvessel"
const SPRING_AWAY_ID = "silkbindJade-umblightcharge"
const DODGE_ID = "bellstrikeUmbra-perfect-dodge"
const USER_AUTHORED_ID = "sk-user-authored-vessel"
const STORE = storeV60File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (classId: string, id: string): Skill =>
  builtinSkillsForClass(classId).find((skill) => skill.id === id)!

const frames = (skill: Skill) => skill.hits.map((hit) => hit.frame)
const hitIds = (skill: Skill) => skill.hits.map((hit) => hit.id)
const rowOf = (hit: Skill["hits"][number]) => [
  hit.physMultiplier,
  hit.attributeMultiplier,
  hit.physFixed,
  hit.attributeFixed,
]

describe("custom-skills v60 fixture", () => {
  it("is v60 and every seeded copy still carries the old shape", () => {
    expect(STORE.v).toBe(V61__boundvesselSpringAwayToadAfterimageTiming.to - 1)
    expect(skillIn(STORE, TOAD_ID).hits[0]!.frame).toBe(39)
    expect(skillIn(STORE, BOUNDVESSEL_ID).hits).toHaveLength(12)
    expect(skillIn(STORE, SPRING_AWAY_ID).castFrames).toBe(147)
    expect(skillIn(STORE, DODGE_ID).hits[0]!.triggers).toEqual([])
  })
})

describe("healSkill — Toad[Cancel]", () => {
  it("moves the flip to frame 40 and lands on the built-in", () => {
    const healed = healSkill(clone(skillIn(STORE, TOAD_ID))) as Skill
    expect(frames(healed)).toEqual(frames(builtin("silkbindJade", TOAD_ID)))
    expect(frames(healed)).toEqual([40, 68])
  })

  it("leaves a copy whose flip row was edited alone", () => {
    const edited = clone(skillIn(STORE, TOAD_ID))
    edited.hits[0]!.physFixed = 100
    expect(healSkill(clone(edited))).toEqual(edited)
  })
})

describe("healSkill — Boundvessel", () => {
  const seeded = () => clone(skillIn(STORE, BOUNDVESSEL_ID))

  it("gives a seeded copy 11 rapid slashes at the new frames, the new finisher frame and drain start", () => {
    const healed = healSkill(seeded()) as Skill
    const live = builtin("bamboocutDraught", BOUNDVESSEL_ID)
    expect(hitIds(healed)).toEqual(hitIds(live))
    expect(frames(healed)).toEqual(frames(live))
    expect(healed.hits.map(rowOf)).toEqual(live.hits.map(rowOf))
    expect(healed.hits.map((hit) => hit.conditions)).toEqual(live.hits.map((hit) => hit.conditions))
    expect(healed.hits.at(-1)!.triggers).toEqual(live.hits.at(-1)!.triggers)
    expect(healed.meterDrains).toEqual(live.meterDrains)
  })

  it("leaves a copy with one edited slash alone, finisher frame and drain start excepted", () => {
    const edited = seeded()
    edited.hits.find((hit) => hit.id === "hit-4")!.physMultiplier = 1
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits).toHaveLength(edited.hits.length)
    expect(frames(healed).filter((_, index) => index > 1 && index < 10)).toEqual(
      frames(edited).filter((_, index) => index > 1 && index < 10),
    )
  })

  it("leaves a finisher whose frame was edited alone", () => {
    const edited = seeded()
    edited.hits.find((hit) => hit.id === "hit-13")!.frame = 170
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits.find((hit) => hit.id === "hit-13")!.frame).toBe(170)
  })

  it("leaves a drain whose rate was edited alone", () => {
    const edited = seeded()
    edited.meterDrains![0]!.perSecond = 10
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.meterDrains).toEqual(edited.meterDrains)
  })

  it("does not add slashes to a copy that already has hit-9", () => {
    const healed = healSkill(seeded()) as Skill
    expect(healSkill(clone(healed))).toEqual(healed)
  })
})

describe("healSkill — Spring Away", () => {
  const seeded = () => clone(skillIn(STORE, SPRING_AWAY_ID))

  it("re-times a seeded copy onto the built-in's bullets, lift trigger, cast length and drain", () => {
    const healed = healSkill(seeded()) as Skill
    const live = builtin("silkbindJade", SPRING_AWAY_ID)
    expect(frames(healed)).toEqual(frames(live))
    expect(healed.hits.map(rowOf)).toEqual(live.hits.map(rowOf))
    expect(healed.hits.map((hit) => hit.triggers)).toEqual(live.hits.map((hit) => hit.triggers))
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.meterDrains).toEqual(live.meterDrains)
  })

  it("keeps every other field of the copy", () => {
    const original = seeded()
    const { hits: _hits, castFrames: _cast, ...originalRest } = original
    const {
      hits: _healedHits,
      castFrames: _healedCast,
      meterDrains,
      ...healedRest
    } = healSkill(seeded()) as Skill
    expect(meterDrains).toBeDefined()
    expect(healedRest).toEqual(originalRest)
  })

  it("leaves a copy whose cast length was edited alone", () => {
    const edited = seeded()
    edited.castFrames = 150
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy with one edited bullet alone", () => {
    const edited = seeded()
    edited.hits[3]!.physFixed = 100
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("is idempotent", () => {
    const once = healSkill(seeded())
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("healSkill — perfect dodge", () => {
  it("adds the afterimage trigger once, after the existing triggers", () => {
    const original = clone(skillIn(STORE, DODGE_ID))
    const healed = healSkill(clone(original)) as Skill
    expect(healed.hits[0]!.triggers).toEqual([
      {
        kind: "applyDebuff",
        targetId: "debuff-mystic-ghostly-afterimage",
        stacks: 1,
        condition: null,
        conditions: [{ buffId: "ghostlyStepsUmbra", op: "gte", stacks: 1 }],
      },
    ])
    expect(healSkill(clone(healed))).toEqual(healed)
  })

  it("keeps the triggers an edited copy already carries", () => {
    const edited = clone(skillIn(STORE, DODGE_ID))
    edited.hits[0]!.triggers = [
      { kind: "applyBuff", targetId: "mirageBonus", stacks: 1, condition: null },
    ]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.triggers[0]).toEqual(edited.hits[0]!.triggers[0])
    expect(healed.hits[0]!.triggers).toHaveLength(2)
  })
})

describe("healSkill — user-authored skills", () => {
  it("leaves a user-authored skill with the same rows alone", () => {
    const authored = clone(skillIn(STORE, USER_AUTHORED_ID))
    expect(healSkill(clone(authored))).toEqual(authored)
  })
})

describe("V61__boundvesselSpringAwayToadAfterimageTiming — called directly", () => {
  it("keeps every skill", () => {
    const after = V61__boundvesselSpringAwayToadAfterimageTiming.migrate(clone(STORE))
    expect(after.v).toBe(61)
    expect((after.skills as Skill[]).map((skill) => skill.id)).toEqual(
      (STORE.skills as Skill[]).map((skill) => skill.id),
    )
    expect(skillIn(after, USER_AUTHORED_ID)).toEqual(skillIn(STORE, USER_AUTHORED_ID))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V61__boundvesselSpringAwayToadAfterimageTiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V61__boundvesselSpringAwayToadAfterimageTiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V61__boundvesselSpringAwayToadAfterimageTiming — through the chain", () => {
  it("is registered and is exactly what the v60 → v61 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V61__boundvesselSpringAwayToadAfterimageTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 61 })!
    expect(result.applied).toEqual(["V61__boundvesselSpringAwayToadAfterimageTiming"])
    expect(result.blob.v).toBe(61)
    expect(frames(skillIn(result.blob, BOUNDVESSEL_ID))).toEqual(
      frames(builtin("bamboocutDraught", BOUNDVESSEL_ID)),
    )
    expect(skillIn(result.blob, USER_AUTHORED_ID)).toEqual(skillIn(STORE, USER_AUTHORED_ID))
  })
})
