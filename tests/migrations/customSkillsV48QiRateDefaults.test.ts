import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V48__qiRateDefaults,
  healQiRateDefault,
} from "../../src/migrations/customSkills/V48__qiRateDefaults"
import type { Skill } from "../../src/engine/skill"
import storeV47File from "./testCustomSkills/v47/store.json"

const STORE = storeV47File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

const HEALED_IDS_AND_RATES: readonly [string, number][] = [
  ["bellstrikeUmbra-bleed-detonation", 0.2],
  ["bamboocutDraught-falcons-pursuit", 0.4],
  ["bamboocutDraught-dragonquench-inebriate", 0.65],
  ["stonesplitStrength-anxisoldierheng", 0.3],
  ["stonesplitStrength-anxisoldierheng-stab", 0.3],
  ["stonesplitStrength-anxisoldiermojump", 0.3],
  ["stonesplitStrength-anxisoldiermodown", 0.3],
  ["stonesplitStrength-anxisoldiermosweep", 0.3],
]

describe("the pre-V48 shape", () => {
  it("carries no qiRate yet", () => {
    for (const [id] of HEALED_IDS_AND_RATES) {
      const skill = skillIn(STORE, id)!
      expect(
        skill.hits.some((hit) => hit.qiRate !== undefined),
        id,
      ).toBe(false)
    }
  })
})

describe("healQiRateDefault", () => {
  it("adds the in-game rate to every hit of a targeted skill", () => {
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      const healed = healQiRateDefault(clone(skillIn(STORE, id))) as Skill
      expect(
        healed.hits.map((hit) => hit.qiRate),
        id,
      ).toEqual(healed.hits.map(() => rate))
    }
  })

  it("does not double-heal a copy that already carries a qiRate", () => {
    for (const [id] of HEALED_IDS_AND_RATES) {
      const once = healQiRateDefault(clone(skillIn(STORE, id)))
      const twice = healQiRateDefault(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a hit alone once its own coefficients no longer match the seeded shape", () => {
    const edited = skillIn(STORE, "bellstrikeUmbra-bleed-detonation")!
    const withEditedHit: Skill = {
      ...edited,
      hits: edited.hits.map((hit) => ({ ...hit, physMultiplier: hit.physMultiplier + 1 })),
    }
    const healed = healQiRateDefault(clone(withEditedHit)) as Skill
    expect(healed.hits.every((hit) => hit.qiRate === undefined)).toBe(true)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bamboocutDraught-falcons-pursuit")!
    const generic: Skill = { ...untouched, id: "not-a-target-skill" }
    expect(healQiRateDefault(clone(generic))).toEqual(generic)
  })
})

describe("V48__qiRateDefaults — called directly", () => {
  it("heals every targeted skill and leaves every other skill untouched", () => {
    const before = clone(STORE)
    const after = V48__qiRateDefaults.migrate(before)
    expect(after.v).toBe(48)
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      const healed = skillIn(after, id)!
      expect(
        healed.hits.map((hit) => hit.qiRate),
        id,
      ).toEqual(healed.hits.map(() => rate))
    }
    const healedIds = new Set(HEALED_IDS_AND_RATES.map(([id]) => id))
    for (const skill of before.skills) {
      if (healedIds.has(skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V48__qiRateDefaults.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V48__qiRateDefaults.migrate(clone(once))).toEqual(once)
  })
})

describe("V48__qiRateDefaults — through the chain", () => {
  it("is registered and is exactly what the v47 → v48 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V48__qiRateDefaults)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 48 })!
    expect(result.applied).toEqual(["V48__qiRateDefaults"])
    expect(result.blob.v).toBe(48)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V48__qiRateDefaults)
    const result = runChain(withoutStep, 48, clone(STORE))!
    expect(result.applied).not.toContain("V48__qiRateDefaults")
    const skill = skillIn(result.blob, "bellstrikeUmbra-bleed-detonation")!
    expect(skill.hits.every((hit) => hit.qiRate === undefined)).toBe(true)
  })
})

describe("every healed skill survives the hydrator too, matching the live built-in's own rate", () => {
  it("lands each healed copy on exactly the live built-in's hits", async () => {
    const { builtinSkillsForClass } = await import("../../src/engine/builtinLibrary")
    const result = runCustomSkillMigrations(clone(STORE))!
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      const healed = skillIn(result.blob, id)!
      const classId = healed.classId
      const builtin = builtinSkillsForClass(classId).find((candidate) => candidate.id === id)!
      expect(
        healed.hits.map((hit) => hit.qiRate),
        id,
      ).toEqual(builtin.hits.map(() => rate))
    }
  })
})
