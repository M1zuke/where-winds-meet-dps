import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
} from "../../src/migrations/customSkills"
import {
  V59__removeNightwickTipsylayHybrid,
  repointRemovedSkill,
} from "../../src/migrations/customSkills/V59__removeNightwickTipsylayHybrid"
import type { Skill } from "../../src/engine/skill"
import storeV58File from "./testCustomSkills/v58/store.json"

const REMOVED_ID = "bamboocutDraught-nightwick-tipsylay"
const SURVIVING_ID = "bamboocutDraught-nightwick-primepick"

type SkillStore = { v: number; skills: Skill[] }
const STORE = storeV58File as unknown as SkillStore

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const idsOf = (skills: unknown[]): string[] => (skills as Skill[]).map((skill) => skill.id)

const withoutSurvivorCopy = (): SkillStore => ({
  ...clone(STORE),
  skills: clone(STORE.skills).filter((skill) => skill.id !== SURVIVING_ID),
})

describe("custom-skills v58 fixture", () => {
  it("is v58 and holds a copy of the removed skill next to a copy of the surviving one", () => {
    expect(STORE.v).toBe(V59__removeNightwickTipsylayHybrid.to - 1)
    expect(idsOf(STORE.skills)).toContain(REMOVED_ID)
    expect(idsOf(STORE.skills)).toContain(SURVIVING_ID)
  })
})

describe("repointRemovedSkill", () => {
  it("keeps the copy under its own id when the surviving skill already has a copy", () => {
    expect(repointRemovedSkill(clone(STORE.skills))).toEqual(STORE.skills)
  })

  it("moves the copy onto the surviving id and its cast tag with it when there is none", () => {
    const { skills } = withoutSurvivorCopy()
    const healed = repointRemovedSkill(clone(skills)) as Skill[]
    const copy = healed.find((skill) => skill.id === SURVIVING_ID)!
    expect(idsOf(healed)).not.toContain(REMOVED_ID)
    expect(copy.castTag).toBe("cast:nightwickPrimepick")
  })

  it("keeps every other field of the copy and every other skill unchanged", () => {
    const { skills } = withoutSurvivorCopy()
    const healed = repointRemovedSkill(clone(skills)) as Skill[]
    const {
      id: _removed,
      castTag: _removedTag,
      ...originalRest
    } = skills.find((skill) => skill.id === REMOVED_ID)!
    const {
      id: _surviving,
      castTag: _survivingTag,
      ...healedRest
    } = healed.find((skill) => skill.id === SURVIVING_ID)!
    expect(healedRest).toEqual(originalRest)
    expect(healed.filter((skill) => skill.id !== SURVIVING_ID)).toEqual(
      skills.filter((skill) => skill.id !== REMOVED_ID),
    )
  })

  it("keeps a cast tag the user edited", () => {
    const skills = withoutSurvivorCopy().skills.map((skill) =>
      skill.id === REMOVED_ID ? { ...skill, castTag: "cast:userChoice" } : skill,
    )
    const copy = (repointRemovedSkill(clone(skills)) as Skill[]).find(
      (skill) => skill.id === SURVIVING_ID,
    )!
    expect(copy.castTag).toBe("cast:userChoice")
  })

  it("leaves a list without the removed skill alone", () => {
    const skills = STORE.skills.filter((skill) => skill.id !== REMOVED_ID)
    expect(repointRemovedSkill(clone(skills))).toEqual(skills)
  })
})

describe("V59__removeNightwickTipsylayHybrid — called directly", () => {
  it("never drops a stored copy and keeps the version bump", () => {
    const after = V59__removeNightwickTipsylayHybrid.migrate(clone(STORE))
    expect(after.v).toBe(59)
    expect(after.skills).toEqual(STORE.skills)
  })

  it("re-points the copy when the surviving skill has none, dropping nothing", () => {
    const store = withoutSurvivorCopy()
    const after = V59__removeNightwickTipsylayHybrid.migrate(clone(store))
    expect(idsOf(after.skills)).toContain(SURVIVING_ID)
    expect(idsOf(after.skills)).not.toContain(REMOVED_ID)
    expect(after.skills).toHaveLength(store.skills.length)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = withoutSurvivorCopy()
    const snapshot = clone(input)
    const once = V59__removeNightwickTipsylayHybrid.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V59__removeNightwickTipsylayHybrid.migrate(clone(once))).toEqual(once)
  })
})

describe("V59__removeNightwickTipsylayHybrid — through the chain", () => {
  it("is registered and is exactly what the v58 → v59 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V59__removeNightwickTipsylayHybrid)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 59 })!
    expect(result.applied).toEqual(["V59__removeNightwickTipsylayHybrid"])
    expect(result.blob.v).toBe(59)
    expect(idsOf(result.blob.skills)).toEqual(idsOf(STORE.skills))
  })
})
