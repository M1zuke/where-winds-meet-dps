import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V117__jadeTrajectoryHitsReach,
  healSkill,
} from "../../src/migrations/customSkills/V117__jadeTrajectoryHitsReach"
import { throughJadeAuditHops } from "./jadeAuditHops"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV116File from "./testCustomSkills/v116/store.json"

const STORE = storeV116File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = [
  "silkbindJade-fanlightcharged",
  "silkbindJade-fan-dual",
  "silkbindJade-fan-light",
  "silkbindJade-fan-light-chain",
  "silkbindJade-umbrella-dash",
]
const RETIMED_IDS = [
  "silkbindJade-fan-light",
  "silkbindJade-fan-light-chain",
  "silkbindJade-umbrella-dash",
]
const UNTOUCHED_IDS = ["silkbindJade-fan-dash", "sk-user-authored-fan-slash"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v116 fixture", () => {
  it("is v116 and still stores the old reach and hits of every healed skill", () => {
    expect(STORE.v).toBe(V117__jadeTrajectoryHitsReach.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const builtin = builtinOf(id)
      expect(
        JSON.stringify([...(seeded.receives ?? [])].sort()) !==
          JSON.stringify([...(builtin.receives ?? [])].sort()) ||
          JSON.stringify(seeded.hits) !== JSON.stringify(builtin.hits),
        id,
      ).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = throughJadeAuditHops(healSkill(clone(skillIn(STORE, id))))
    const builtin = builtinOf(id)
    expect([...(healed.receives ?? [])].sort()).toEqual([...(builtin.receives ?? [])].sort())
    const timing = (skill: Skill) =>
      skill.hits.map((hit) => [hit.frame, hit.projectile, hit.triggers])
    if (RETIMED_IDS.includes(id)) expect(timing(healed)).toEqual(timing(builtin))
  })

  it("keeps a reach list or a hit that was edited", () => {
    const reach = clone(skillIn(STORE, "silkbindJade-fan-dual"))
    reach.receives = [...(reach.receives ?? []), "userBuff"]
    expect(healSkill(clone(reach))).toEqual(reach)
    const retimed = clone(skillIn(STORE, "silkbindJade-fan-light"))
    retimed.hits[0]!.frame = 30
    expect((healSkill(clone(retimed)) as Skill).hits[0]!.frame).toBe(30)
    const dash = clone(skillIn(STORE, "silkbindJade-umbrella-dash"))
    dash.hits[0]!.physFixed = 1
    expect(healSkill(clone(dash))).toEqual(dash)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V117__jadeTrajectoryHitsReach — called directly and through the chain", () => {
  it("heals the seeded copies and keeps every other skill", () => {
    const after = V117__jadeTrajectoryHitsReach.migrate(clone(STORE))
    expect(after.v).toBe(117)
    for (const id of UNTOUCHED_IDS) expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V117__jadeTrajectoryHitsReach.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v116 → v117 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V117__jadeTrajectoryHitsReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 117 })!
    expect(result.applied).toEqual(["V117__jadeTrajectoryHitsReach"])
    expect(result.blob.v).toBe(117)
  })
})
