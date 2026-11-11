import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V139__cleftpeakDeflectGrantRemoved } from "../../src/migrations/customSkills/V139__cleftpeakDeflectGrantRemoved"
import type { Skill } from "../../src/engine/skill"
import storeV138File from "./testCustomSkills/v138/store.json"

const STORE = storeV138File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const REMOVED = "cleftpeakDeflectGrant"
const SEEDED_IDS = ["stonesplitStrength-deflect", "silkbindJade-deflect-cancel"]
const EDITED_ID = "bamboocutDraught-deflect-cancel"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V139__cleftpeakDeflectGrantRemoved", () => {
  it("starts from a v138 store whose deflect copies list the grant", () => {
    expect(STORE.v).toBe(V139__cleftpeakDeflectGrantRemoved.to - 1)
    for (const id of [...SEEDED_IDS, EDITED_ID])
      expect(skillIn(STORE, id).triggersBuffs).toContain(REMOVED)
  })

  it("drops the grant from every copy and keeps the other triggers", () => {
    const migrated = V139__cleftpeakDeflectGrantRemoved.migrate(clone(STORE))
    expect(migrated.v).toBe(139)
    expect(skillIn(migrated, "stonesplitStrength-deflect").triggersBuffs).toEqual([
      "throatPierceDeflectGrant",
    ])
    for (const id of [SEEDED_IDS[1], EDITED_ID])
      expect(skillIn(migrated, id).triggersBuffs).toEqual([])
  })

  it("keeps an edited copy's values", () => {
    const migrated = V139__cleftpeakDeflectGrantRemoved.migrate(clone(STORE))
    expect(skillIn(migrated, EDITED_ID).hits[0]!.physMultiplier).toBe(0.6)
  })

  it("is idempotent and leaves a user-authored skill alone", () => {
    const once = V139__cleftpeakDeflectGrantRemoved.migrate(clone(STORE))
    const twice = V139__cleftpeakDeflectGrantRemoved.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
    expect(skillIn(twice, "sk-user-authored-slash")).toEqual(
      skillIn(STORE, "sk-user-authored-slash"),
    )
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, SEEDED_IDS[0]).triggersBuffs).not.toContain(REMOVED)
  })
})
