// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V11__spearMistwillowReach,
  healSpearMistwillowReach,
} from "../../src/migrations/customSkills/V11__spearMistwillowReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV10File from "./testCustomSkills/v10/store.json"

const CLASS = "bellstrikeUmbra"
const SPEAR_MISTWILLOW_IDS = [
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-spearheavy-1-hit",
  "bellstrikeUmbra-spearheavy-1-hit-prepull",
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
]
const USER_AUTHORED = "sk-user-authored-slash"
const SEEDED_RECEIVES = ["mistwillowLightBuff", "mistwillowBuff"]
const STORE = storeV10File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v10 fixture", () => {
  it("is v10 and still lists both Mistwillow buffs on every spear row the bonus cannot reach", () => {
    expect(STORE.v).toBe(V11__spearMistwillowReach.to - 1)
    for (const id of SPEAR_MISTWILLOW_IDS)
      expect(skillIn(STORE, id).receives).toEqual(SEEDED_RECEIVES)
  })

  it("holds the corrected shape on the built-ins the copies were seeded from", () => {
    for (const id of SPEAR_MISTWILLOW_IDS) expect(builtin(id).receives ?? []).toEqual([])
  })
})

describe("healSpearMistwillowReach", () => {
  it("strips both buff ids from an untouched spear copy", () => {
    for (const id of SPEAR_MISTWILLOW_IDS) {
      const healed = healSpearMistwillowReach(clone(skillIn(STORE, id))) as Skill
      expect(healed.receives).toBeUndefined()
    }
  })

  it("leaves a copy whose receives list has been edited alone", () => {
    const edited = {
      ...clone(skillIn(STORE, SPEAR_MISTWILLOW_IDS[0])),
      receives: ["mistwillowLightBuff"],
    }
    expect(healSpearMistwillowReach(edited)).toEqual(edited)
  })

  it("leaves an unrelated skill alone", () => {
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healSpearMistwillowReach(other)).toEqual(other)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, SPEAR_MISTWILLOW_IDS[0]))
    const snapshot = clone(input)
    const once = healSpearMistwillowReach(input)
    expect(input).toEqual(snapshot)
    expect(healSpearMistwillowReach(clone(once))).toEqual(once)
  })
})

describe("V11__spearMistwillowReach — called directly", () => {
  it("heals every spear Mistwillow row and nothing else", () => {
    const after = V11__spearMistwillowReach.migrate(clone(STORE))
    expect(after.v).toBe(11)
    for (const id of SPEAR_MISTWILLOW_IDS) expect(skillIn(after, id).receives).toBeUndefined()
    for (const skill of STORE.skills) {
      if (SPEAR_MISTWILLOW_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V11__spearMistwillowReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V11__spearMistwillowReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V11__spearMistwillowReach — through the chain", () => {
  it("is registered and is exactly what the v10 → v11 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V11__spearMistwillowReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 11 })!
    expect(result.applied).toEqual(["V11__spearMistwillowReach"])
    expect(result.blob.v).toBe(11)
    for (const id of SPEAR_MISTWILLOW_IDS) expect(skillIn(result.blob, id).receives).toBeUndefined()
  })
})
