import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V112__bladeVesselRapidSlashSpacing,
  healSkill,
} from "../../src/migrations/customSkills/V112__bladeVesselRapidSlashSpacing"
import { bladeVessel } from "../../src/data/skills/bamboocut-draught/blade-vessel"
import { boundvessel } from "../../src/data/skills/bamboocut-draught/boundvessel"
import type { Skill } from "../../src/engine/skill"
import storeV111File from "./testCustomSkills/v111/store.json"

const STORE = storeV111File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const framesOf = (skill: Skill) => skill.hits.map((hit) => hit.frame)

describe("custom-skills v111 fixture", () => {
  it("is v111 and stores Blade Vessel's slashes eight frames apart from frame 42", () => {
    expect(STORE.v).toBe(V112__bladeVesselRapidSlashSpacing.to - 1)
    expect(framesOf(skillIn(STORE, bladeVessel.id)).slice(1, 8)).toEqual([
      42, 50, 58, 66, 74, 82, 90,
    ])
  })
})

describe("healSkill", () => {
  it("lands the untouched copy on the built-in frames and keeps every other hit field", () => {
    const seeded = skillIn(STORE, bladeVessel.id)
    const healed = healSkill(clone(seeded)) as Skill
    expect(framesOf(healed)).toEqual(framesOf(bladeVessel))
    expect(healed.hits.map(({ frame: _frame, ...rest }) => rest)).toEqual(
      seeded.hits.map(({ frame: _frame, ...rest }) => rest),
    )
  })

  it("keeps a copy whose slash frames were edited", () => {
    const edited = clone(skillIn(STORE, bladeVessel.id))
    edited.hits[3]!.frame = 60
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [boundvessel.id, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, bladeVessel.id)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V112__bladeVesselRapidSlashSpacing — called directly and through the chain", () => {
  it("heals the copy and keeps every other skill", () => {
    const after = V112__bladeVesselRapidSlashSpacing.migrate(clone(STORE))
    expect(after.v).toBe(112)
    expect(framesOf(skillIn(after, bladeVessel.id))).toEqual(framesOf(bladeVessel))
    for (const id of [boundvessel.id, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V112__bladeVesselRapidSlashSpacing.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v111 → v112 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V112__bladeVesselRapidSlashSpacing)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 112 })!
    expect(result.applied).toEqual(["V112__bladeVesselRapidSlashSpacing"])
    expect(result.blob.v).toBe(112)
  })
})
