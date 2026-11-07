import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V74__springAwayBulletsExtendMarkPerHit,
  healSkill,
} from "../../src/migrations/customSkills/V74__springAwayBulletsExtendMarkPerHit"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/silkbind-jade/ids"
import storeV73File from "./testCustomSkills/v73/store.json"

const STORE = storeV73File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SIX_BULLET_FRAMES = [58, 66, 77, 87, 98, 107]
const TWELVE_BULLET_FRAMES = [58, 66, 77, 87, 98, 107, 117, 126, 136, 146, 156, 165]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const frames = (skill: Skill) => skill.hits.map((hit) => hit.frame)

function twelveBulletCopy(): Skill {
  const copy = clone(skillIn(STORE, SKILL.umblightcharge))
  const seededHits = Array.from({ length: 12 }, (_, index) => ({
    ...copy.hits[index % copy.hits.length],
    id: `hit-${index}`,
    frame: 58 + index * 10,
  }))
  return { ...copy, id: SKILL.umblightcharge12, hits: seededHits }
}

describe("custom-skills v73 fixture", () => {
  it("is v73 and stores Spring Away with the cast-level Extend Mark grant on 10 f bullets", () => {
    expect(STORE.v).toBe(V74__springAwayBulletsExtendMarkPerHit.to - 1)
    const copy = skillIn(STORE, SKILL.umblightcharge)
    expect(copy.triggersBuffs).toEqual(["comboExtendMark"])
    expect(copy.triggersBuffsAtFrame).toEqual({ comboExtendMark: 58 })
    expect(copy.receives).not.toContain("comboExtendMark")
    expect(frames(copy)).toEqual([58, 68, 78, 88, 98, 108])
    expect(skillIn(STORE, SKILL.umblightcharge12).triggersBuffs).toEqual(["userAddedBuff"])
  })
})

describe("healSkill — Spring Away", () => {
  it("drops the cast-level grant, receives the mark and moves the bullets to the cue frames", () => {
    const healed = healSkill(clone(skillIn(STORE, SKILL.umblightcharge))) as Skill
    expect(healed).not.toHaveProperty("triggersBuffs")
    expect(healed).not.toHaveProperty("triggersBuffsAtFrame")
    const receives = healed.receives!
    expect(receives[receives.indexOf("comboSpringAwayBonus") + 1]).toBe("comboExtendMark")
    expect(frames(healed)).toEqual(SIX_BULLET_FRAMES)
  })

  it("retimes a 12-bullet copy onto all twelve cue frames", () => {
    const healed = healSkill(twelveBulletCopy()) as Skill
    expect(frames(healed)).toEqual(TWELVE_BULLET_FRAMES)
  })

  it("keeps every other field of the copy", () => {
    const original = clone(skillIn(STORE, SKILL.umblightcharge))
    const healed = healSkill(clone(original)) as Skill
    const strip = ({ hits, receives, triggersBuffs, triggersBuffsAtFrame, ...rest }: Skill) => ({
      ...rest,
      hits: hits.map(({ frame, ...hit }) => hit),
    })
    expect(strip(healed)).toEqual(strip(original))
  })

  it("keeps an edited grant while still healing the receives and the frames", () => {
    const healed = healSkill(clone(skillIn(STORE, SKILL.umblightcharge12))) as Skill
    expect(healed.triggersBuffs).toEqual(["userAddedBuff"])
    expect(healed.receives).toContain("comboExtendMark")
    expect(frames(healed)).toEqual(SIX_BULLET_FRAMES)
  })

  it("keeps a grant whose frame was edited", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.triggersBuffsAtFrame = { comboExtendMark: 70 }
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.triggersBuffs).toEqual(["comboExtendMark"])
    expect(healed.triggersBuffsAtFrame).toEqual({ comboExtendMark: 70 })
  })

  it("keeps edited receives", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.receives = edited.receives!.filter((id) => id !== "windWall")
    expect((healSkill(clone(edited)) as Skill).receives).toEqual(edited.receives)
  })

  it("keeps edited bullet frames", () => {
    const edited = clone(skillIn(STORE, SKILL.umblightcharge))
    edited.hits[2].frame = 80
    expect(frames(healSkill(clone(edited)) as Skill)).toEqual(frames(edited))
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

describe("V74__springAwayBulletsExtendMarkPerHit — through the chain", () => {
  it("is registered and is exactly what the v73 → v74 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V74__springAwayBulletsExtendMarkPerHit)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 74 })!
    expect(result.applied).toEqual(["V74__springAwayBulletsExtendMarkPerHit"])
    expect(result.blob.v).toBe(74)
    expect(frames(skillIn(result.blob, SKILL.umblightcharge))).toEqual(SIX_BULLET_FRAMES)
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V74__springAwayBulletsExtendMarkPerHit.migrate(input)
    expect(input).toEqual(snapshot)
  })
})
