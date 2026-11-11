import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V140__breakDefenseWithoutArtBonusAttack } from "../../src/migrations/customSkills/V140__breakDefenseWithoutArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV139File from "./testCustomSkills/v139/store.json"

const STORE = storeV139File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const ART_BONUS = "snowpartingBladeAdditionalAttack"
const BREAK_DEFENSE_ID = "stonesplitStrength-break-defense"
const OTHER_ART_SKILL_ID = "stonesplitStrength-snowparting-light-1"
const USER_AUTHORED_ID = "sk-user-authored-slash"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V140__breakDefenseWithoutArtBonusAttack", () => {
  it("starts from a v139 store whose Break Defense copy lists the art bonus", () => {
    expect(STORE.v).toBe(V140__breakDefenseWithoutArtBonusAttack.to - 1)
    expect(skillIn(STORE, BREAK_DEFENSE_ID).receives).toEqual([ART_BONUS])
  })

  it("drops the art bonus from the Break Defense copy", () => {
    const migrated = V140__breakDefenseWithoutArtBonusAttack.migrate(clone(STORE))
    expect(migrated.v).toBe(140)
    expect(skillIn(migrated, BREAK_DEFENSE_ID).receives).toEqual([])
  })

  it("keeps the other reach and the values of an edited Break Defense copy", () => {
    const edited = clone(STORE)
    const copy = skillIn(edited, BREAK_DEFENSE_ID)
    copy.receives = [ART_BONUS, "starweaveMartialBoost"]
    copy.hits[0]!.physMultiplier = 0.25
    const migrated = V140__breakDefenseWithoutArtBonusAttack.migrate(edited)
    expect(skillIn(migrated, BREAK_DEFENSE_ID).receives).toEqual(["starweaveMartialBoost"])
    expect(skillIn(migrated, BREAK_DEFENSE_ID).hits[0]!.physMultiplier).toBe(0.25)
  })

  it("leaves every other skill alone, whatever it receives", () => {
    const migrated = V140__breakDefenseWithoutArtBonusAttack.migrate(clone(STORE))
    for (const id of [OTHER_ART_SKILL_ID, USER_AUTHORED_ID])
      expect(skillIn(migrated, id)).toEqual(skillIn(STORE, id))
  })

  it("is idempotent", () => {
    const once = V140__breakDefenseWithoutArtBonusAttack.migrate(clone(STORE))
    const twice = V140__breakDefenseWithoutArtBonusAttack.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, BREAK_DEFENSE_ID).receives).not.toContain(ART_BONUS)
  })
})
