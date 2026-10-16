import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V98__swordHorizonBurstStacksAtTheBurst,
  healSkill,
} from "../../src/migrations/customSkills/V98__swordHorizonBurstStacksAtTheBurst"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV97File from "./testCustomSkills/v97/store.json"

const STORE = storeV97File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const BLOOD_BURST_ID = "bellstrikeUmbra-bleed-detonation"
const SWEEP_ALL_IDS = ["bellstrikeUmbra-spearspecial", "bellstrikeUmbra-spearspecial-1-hit-cancel"]
const UNTOUCHED_ID = "bellstrikeUmbra-spear-light-3"
const USER_AUTHORED_ID = "sk-user-authored-burst"
const BLEED_TICK_ID = "debuff-bellstrikeUmbra-bleed-tick"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

const bleedApplications = (skill: Skill, hitIndex: number) =>
  skill.hits[hitIndex]!.triggers.filter(
    (trigger) => trigger.kind === "applyDot" && trigger.targetId === BLEED_TICK_ID,
  )

describe("custom-skills v97 fixture", () => {
  it("is v97, carries Sweep All's burst stacks and a Blood Burst without any", () => {
    expect(STORE.v).toBe(V98__swordHorizonBurstStacksAtTheBurst.to - 1)
    expect(bleedApplications(skillIn(STORE, BLOOD_BURST_ID), 0)).toHaveLength(0)
    for (const id of SWEEP_ALL_IDS)
      expect(
        skillIn(STORE, id).hits.some(
          (_hit, index) => bleedApplications(skillIn(STORE, id), index).length === 3,
        ),
        id,
      ).toBe(true)
  })
})

describe("healSkill", () => {
  it("lands the untouched Blood Burst copy on the built-in's hits", () => {
    const healed = healSkill(clone(skillIn(STORE, BLOOD_BURST_ID))) as Skill
    expect(healed.hits).toEqual(builtinOf(BLOOD_BURST_ID).hits)
  })

  it.each(SWEEP_ALL_IDS)("lands the untouched %s copy on the built-in's hits", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.hits).toEqual(builtinOf(id).hits)
  })

  it("leaves a Blood Burst copy that applies Bleeding of its own alone", () => {
    const edited = clone(skillIn(STORE, BLOOD_BURST_ID))
    edited.hits[0]!.triggers.push({
      kind: "applyDot",
      targetId: BLEED_TICK_ID,
      stacks: 1,
      condition: null,
    })
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("keeps a Sweep All Bleeding trigger that was edited away from the seeded burst stack", () => {
    const edited = clone(skillIn(STORE, SWEEP_ALL_IDS[0]!))
    const burstStack = edited.hits[1]!.triggers.find(
      (trigger) => trigger.requiresParam !== undefined,
    )!
    burstStack.requiresMinTier = 5
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[1]!.triggers).toContainEqual(burstStack)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of [BLOOD_BURST_ID, ...SWEEP_ALL_IDS]) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V98__swordHorizonBurstStacksAtTheBurst — called directly", () => {
  it("heals the three skills and keeps every other skill", () => {
    const after = V98__swordHorizonBurstStacksAtTheBurst.migrate(clone(STORE))
    expect(after.v).toBe(98)
    for (const id of [BLOOD_BURST_ID, ...SWEEP_ALL_IDS]) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V98__swordHorizonBurstStacksAtTheBurst.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V98__swordHorizonBurstStacksAtTheBurst — through the chain", () => {
  it("is registered and is exactly what the v97 → v98 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V98__swordHorizonBurstStacksAtTheBurst)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 98 })!
    expect(result.applied).toEqual(["V98__swordHorizonBurstStacksAtTheBurst"])
    expect(result.blob.v).toBe(98)
  })
})
