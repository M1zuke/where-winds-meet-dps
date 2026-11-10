import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V107__evasiveChargeRefundFromRankOne,
  healSkill,
} from "../../src/migrations/customSkills/V107__evasiveChargeRefundFromRankOne"
import { builtinSkill } from "../builtins"
import type { Skill } from "../../src/engine/skill"
import storeV106File from "./testCustomSkills/v106/store.json"

const STORE = storeV106File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const DODGE_IDS = [
  "bellstrikeUmbra-perfect-dodge",
  "bellstrikeUmbra-perfect-dodge-full",
  "bamboocutDraught-perfect-dodge",
]
const NEIGHBOUR_ID = "bellstrikeUmbra-spear-heavy-2"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const refunds = (skill: Skill) =>
  skill.hits[0]!.triggers.filter((trigger) => trigger.requiresParam === "evasiveCharge")

describe("custom-skills v106 fixture", () => {
  it("is v106 and carries the two-trigger refund on every dodge copy", () => {
    expect(STORE.v).toBe(V107__evasiveChargeRefundFromRankOne.to - 1)
    for (const id of DODGE_IDS)
      expect(
        refunds(skillIn(STORE, id)).map((t) => [t.refundFractionOfCastCost, t.requiresMinTier]),
      ).toEqual([
        [0.5, undefined],
        [0.2, 2],
      ])
  })
})

describe("healSkill", () => {
  it("merges an untouched dodge copy into the built-in single 70% trigger", () => {
    for (const id of DODGE_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(refunds(healed).map((t) => [t.refundFractionOfCastCost, t.requiresMinTier])).toEqual([
        [0.7, undefined],
      ])
    }
    const builtin = builtinSkill("bellstrikeUmbra", "universal-perfect-dodge")
    expect(refunds(builtin).map((t) => t.refundFractionOfCastCost)).toEqual([0.7])
  })

  it("keeps a copy whose refund was edited", () => {
    const edited = clone(skillIn(STORE, DODGE_IDS[0]!))
    refunds(edited)[0]!.refundFractionOfCastCost = 0.9
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, DODGE_IDS[0]!)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V107__evasiveChargeRefundFromRankOne — called directly and through the chain", () => {
  it("heals the dodge copies and keeps every other skill", () => {
    const after = V107__evasiveChargeRefundFromRankOne.migrate(clone(STORE))
    expect(after.v).toBe(107)
    for (const id of DODGE_IDS) expect(refunds(skillIn(after, id))).toHaveLength(1)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V107__evasiveChargeRefundFromRankOne.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v106 → v107 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V107__evasiveChargeRefundFromRankOne)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 107 })!
    expect(result.applied).toEqual(["V107__evasiveChargeRefundFromRankOne"])
    expect(result.blob.v).toBe(107)
  })
})
