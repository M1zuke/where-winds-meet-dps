import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V135__starweaveReachesStonesplitMartialArts } from "../../src/migrations/customSkills/V135__starweaveReachesStonesplitMartialArts"
import type { Skill } from "../../src/engine/skill"
import storeV134File from "./testCustomSkills/v134/store.json"

const STORE = storeV134File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const STARWEAVE = "starweaveMartialBoost"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V135__starweaveReachesStonesplitMartialArts", () => {
  it("starts from a v134 store whose seeded copies do not list Starweave", () => {
    expect(STORE.v).toBe(V135__starweaveReachesStonesplitMartialArts.to - 1)
    expect(skillIn(STORE, "stonesplitStrength-phalanxq").receives).not.toContain(STARWEAVE)
  })

  it("appends Starweave to every Stonesplit Martial Art Skill copy and keeps the rest of the reach", () => {
    const migrated = V135__starweaveReachesStonesplitMartialArts.migrate(clone(STORE))
    expect(migrated.v).toBe(135)
    for (const id of [
      "stonesplitStrength-phalanxq",
      "stonesplitStrength-snowpartingslide",
      "stonesplitStrength-snowpartingq-slash",
    ])
      expect(skillIn(migrated, id).receives).toEqual([...skillIn(STORE, id).receives!, STARWEAVE])
  })

  it("keeps an edited copy's values", () => {
    const migrated = V135__starweaveReachesStonesplitMartialArts.migrate(clone(STORE))
    expect(skillIn(migrated, "stonesplitStrength-snowpartingq-slash").hits[0]!.physMultiplier).toBe(
      0.6,
    )
  })

  it("is idempotent and leaves a user-authored skill alone", () => {
    const once = V135__starweaveReachesStonesplitMartialArts.migrate(clone(STORE))
    const twice = V135__starweaveReachesStonesplitMartialArts.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
    expect(skillIn(twice, "sk-user-authored-slash")).toEqual(
      skillIn(STORE, "sk-user-authored-slash"),
    )
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, "stonesplitStrength-phalanxq").receives).toContain(STARWEAVE)
  })
})
