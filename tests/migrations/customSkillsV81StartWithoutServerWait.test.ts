import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V81__startWithoutServerWait,
  healSkill,
} from "../../src/migrations/customSkills/V81__startWithoutServerWait"
import type { Skill } from "../../src/engine/skill"
import storeV80File from "./testCustomSkills/v80/store.json"

const STORE = storeV80File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const PERFECT_DODGE_COPY = "bellstrikeUmbra-perfect-dodge"
const MARKED_COPY = "bellstrikeSplendor-swordq-3rd"
const USER_AUTHORED = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v80 fixture", () => {
  it("is v80 and stores a Perfect Dodge copy without a mark and a Sword Q copy with the removed mark", () => {
    expect(STORE.v).toBe(V81__startWithoutServerWait.to - 1)
    expect(skillIn(STORE, PERFECT_DODGE_COPY).startLatency).toBeUndefined()
    expect(skillIn(STORE, MARKED_COPY).startLatency).toBe("noWaitOnDummy")
  })
})

describe("healSkill", () => {
  it("drops the dummy-only mark, since starting without a wait is now the default", () => {
    const healed = healSkill(clone(skillIn(STORE, MARKED_COPY))) as Skill
    expect("startLatency" in healed).toBe(false)
  })

  it("drops the idle-step mark", () => {
    expect(
      "startLatency" in (healSkill({ id: "universal-delay", startLatency: "none" }) as Skill),
    ).toBe(false)
  })

  it("marks a Perfect Dodge copy that lacks a mark as waiting for the server", () => {
    const healed = healSkill(clone(skillIn(STORE, PERFECT_DODGE_COPY))) as Skill
    expect(healed.startLatency).toBe("serverRoundTrip")
  })

  it.each([
    "universal-perfect-dodge",
    "bamboocutDraught-perfect-dodge",
    "universal-perfect-dodge-full",
    "bamboocutDraught-perfect-dodge-full",
    "stonesplitStrength-snowpartingslide",
    "stonesplitStrength-snowpartingslide-prepull",
    "stonesplitStrength-snowpartingslide-prepull-hit",
  ])("marks %s as waiting for the server", (id) => {
    expect((healSkill({ id }) as Skill).startLatency).toBe("serverRoundTrip")
  })

  it("leaves every other skill and a user-authored skill alone and is idempotent", () => {
    for (const skill of STORE.skills) {
      if (skill.id === PERFECT_DODGE_COPY || skill.id === MARKED_COPY) continue
      if (skill.startLatency !== undefined) continue
      expect(healSkill(clone(skill)), skill.id).toEqual(skill)
    }
    expect(healSkill(clone(skillIn(STORE, USER_AUTHORED)))).toEqual(skillIn(STORE, USER_AUTHORED))
    const once = healSkill(clone(skillIn(STORE, PERFECT_DODGE_COPY)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V81__startWithoutServerWait — through the chain", () => {
  it("is registered and is exactly what the v80 → v81 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V81__startWithoutServerWait)
    const input = clone(STORE)
    const result = runCustomSkillMigrations(input, { toVersion: 81 })!
    expect(result.applied).toEqual(["V81__startWithoutServerWait"])
    expect(result.blob.v).toBe(81)
    expect(skillIn(result.blob, PERFECT_DODGE_COPY).startLatency).toBe("serverRoundTrip")
    expect("startLatency" in skillIn(result.blob, MARKED_COPY)).toBe(false)
    expect(input).toEqual(STORE)
  })
})
