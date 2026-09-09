// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V8__riverFlowAppliesOnCastEnd,
  healRiverFlowApplication,
} from "../../src/migrations/customSkills/V8__riverFlowAppliesOnCastEnd"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV7File from "./testCustomSkills/v7/store.json"

const CLASS = "bellstrikeUmbra"
const SPEAR_Q = `${CLASS}-spearq`
const RIVER_FLOW = "potentRiverFlow"
const USER_AUTHORED = "sk-user-authored-slash"
const STORE = storeV7File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const riverFlowTriggers = (skill: Skill) =>
  skill.hits.flatMap((hit) =>
    hit.triggers.filter((t) => t.kind === "applyBuff" && t.targetId === RIVER_FLOW),
  )

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v7 fixture", () => {
  it("is v7 and stores River Flow the way it was seeded before the change", () => {
    expect(STORE.v).toBe(V8__riverFlowAppliesOnCastEnd.to - 1)
    const stored = skillIn(STORE, SPEAR_Q)
    expect(stored.triggersBuffs).toContain(RIVER_FLOW)
    expect(riverFlowTriggers(stored)).toHaveLength(1)
    expect(riverFlowTriggers(stored)[0].appliesOnCastEnd).toBeUndefined()
  })

  it("holds what the built-in no longer carries", () => {
    expect(builtin(SPEAR_Q).triggersBuffs).not.toContain(RIVER_FLOW)
    expect(riverFlowTriggers(builtin(SPEAR_Q))[0].appliesOnCastEnd).toBe(true)
  })
})

describe("healRiverFlowApplication", () => {
  it("flags a stored River Flow trigger to open at the cast's end", () => {
    const healed = healRiverFlowApplication(clone(skillIn(STORE, SPEAR_Q))) as Skill
    expect(riverFlowTriggers(healed)[0].appliesOnCastEnd).toBe(true)
  })

  it("drops the River Flow entry that triggersBuffs no longer applies", () => {
    const healed = healRiverFlowApplication(clone(skillIn(STORE, SPEAR_Q))) as Skill
    expect(healed.triggersBuffs).not.toContain(RIVER_FLOW)
    expect(healed.triggersBuffs).toEqual(builtin(SPEAR_Q).triggersBuffs)
  })

  it("leaves every other trigger and every other skill alone", () => {
    const stored = clone(skillIn(STORE, SPEAR_Q))
    const healed = healRiverFlowApplication(stored) as Skill
    const otherTriggers = (skill: Skill) =>
      skill.hits.flatMap((hit) => hit.triggers.filter((t) => t.targetId !== RIVER_FLOW))
    expect(otherTriggers(healed)).toEqual(otherTriggers(skillIn(STORE, SPEAR_Q)))
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healRiverFlowApplication(other)).toEqual(other)
  })
})

describe("V8__riverFlowAppliesOnCastEnd — called directly", () => {
  it("heals the stale Spear Q copy and nothing else", () => {
    const after = V8__riverFlowAppliesOnCastEnd.migrate(clone(STORE))
    expect(after.v).toBe(8)
    expect(riverFlowTriggers(skillIn(after, SPEAR_Q))[0].appliesOnCastEnd).toBe(true)
    for (const skill of STORE.skills) {
      if (skill.id === SPEAR_Q) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V8__riverFlowAppliesOnCastEnd.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V8__riverFlowAppliesOnCastEnd.migrate(clone(once))).toEqual(once)
  })
})

describe("V8__riverFlowAppliesOnCastEnd — through the chain", () => {
  it("is registered and is exactly what the v7 → v8 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V8__riverFlowAppliesOnCastEnd)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 8 })!
    expect(result.applied).toEqual(["V8__riverFlowAppliesOnCastEnd"])
    expect(result.blob.v).toBe(8)
    expect(riverFlowTriggers(skillIn(result.blob, SPEAR_Q))[0].appliesOnCastEnd).toBe(true)
  })
})
