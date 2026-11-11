import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V137__cleftpeakReachesJadeTaggedHits } from "../../src/migrations/customSkills/V137__cleftpeakReachesJadeTaggedHits"
import type { Skill } from "../../src/engine/skill"
import storeV136File from "./testCustomSkills/v136/store.json"

const STORE = storeV136File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const CLEFTPEAK = "cleftpeakDeflect"
const SEEDED_IDS = [
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-umb-heavylight",
  "silkbindJade-bamboo-breeze",
]
const EDITED_ID = "silkbindJade-fanheavypursuit-5-hit"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V137__cleftpeakReachesJadeTaggedHits", () => {
  it("starts from a v136 store whose seeded copies do not list Cleftpeak", () => {
    expect(STORE.v).toBe(V137__cleftpeakReachesJadeTaggedHits.to - 1)
    for (const id of SEEDED_IDS) expect(skillIn(STORE, id).receives).not.toContain(CLEFTPEAK)
  })

  it("appends Cleftpeak to each tagged Jade skill copy and keeps the rest of the reach", () => {
    const migrated = V137__cleftpeakReachesJadeTaggedHits.migrate(clone(STORE))
    expect(migrated.v).toBe(137)
    for (const id of [...SEEDED_IDS, EDITED_ID])
      expect(skillIn(migrated, id).receives).toEqual([...skillIn(STORE, id).receives!, CLEFTPEAK])
  })

  it("keeps an edited copy's values", () => {
    const migrated = V137__cleftpeakReachesJadeTaggedHits.migrate(clone(STORE))
    expect(skillIn(migrated, EDITED_ID).hits[0]!.physMultiplier).toBe(0.6)
  })

  it("is idempotent and leaves a user-authored skill alone", () => {
    const once = V137__cleftpeakReachesJadeTaggedHits.migrate(clone(STORE))
    const twice = V137__cleftpeakReachesJadeTaggedHits.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
    expect(skillIn(twice, "sk-user-authored-slash")).toEqual(
      skillIn(STORE, "sk-user-authored-slash"),
    )
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, SEEDED_IDS[0]).receives).toContain(CLEFTPEAK)
  })
})
