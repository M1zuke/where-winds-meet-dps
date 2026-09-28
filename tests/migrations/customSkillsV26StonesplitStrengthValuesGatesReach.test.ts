import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V26__stonesplitStrengthValuesGatesReach,
  healStonesplitStrengthValuesGatesReach,
} from "../../src/migrations/customSkills/V26__stonesplitStrengthValuesGatesReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV25File from "./testCustomSkills/v25/store.json"

const CLASS = "stonesplitStrength"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const HEALED_IDS = [
  "stonesplitStrength-anxisoldierheng",
  "stonesplitStrength-anxisoldiermosweep",
  "stonesplitStrength-snowpartingq-stab",
  "stonesplitStrength-snowpartingcharged",
  "stonesplitStrength-snowpartingcharged-forgetfulness",
  "stonesplitStrength-snowpartingdual",
  "stonesplitStrength-snowpartingdual-prepull",
  "stonesplitStrength-deflect",
  "stonesplitStrength-snowpartingspecial",
  "stonesplitStrength-snowpartingvc",
  "stonesplitStrength-snowpartingvc-prepull",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
  "stonesplitStrength-anxisoldiermodown",
]
const FORGETFULNESS_GRANT_IDS = [
  "stonesplitStrength-snowpartingcharged",
  "stonesplitStrength-snowpartingcharged-forgetfulness",
  "stonesplitStrength-snowpartingdual",
  "stonesplitStrength-snowpartingdual-prepull",
]
const STALE_PRE_GATE_IDS = ["stonesplitStrength-phalanxq", "stonesplitStrength-phalanxspecial"]
const USER_AUTHORED_ID = "sk-user-authored-stonesplit-slash"

const CHECKED_FIELDS = ["tags", "receives", "triggersBuffs", "hits"] as const

// SnowpartingVC/Prepull's `hits`/`triggersBuffs`, and the `hits` of every
// Snowbreak Spring availability grant source, move again at later hops (the
// Forgetfulness cooldown marker, then the Snowbreak Spring availability
// gate); AnxiSoldierHeng's `tags` gains Snowbreak Spring's own stack-family
// tag at a later hop too. Every Anxi Soldier hit's own `hits` gains a Blade
// Momentum gain trigger at the meter hop. None of these equal the LIVE
// built-in once stopped at v26.
const MOVED_AGAIN_FIELDS: Partial<Record<string, readonly (typeof CHECKED_FIELDS)[number][]>> = {
  "stonesplitStrength-snowpartingvc": ["hits", "triggersBuffs"],
  "stonesplitStrength-snowpartingvc-prepull": ["hits", "triggersBuffs"],
  "stonesplitStrength-snowpartingcharged": ["hits"],
  "stonesplitStrength-snowpartingcharged-forgetfulness": ["hits"],
  "stonesplitStrength-snowpartingdual": ["hits"],
  "stonesplitStrength-snowpartingdual-prepull": ["hits"],
  "stonesplitStrength-deflect": ["hits"],
  "stonesplitStrength-anxisoldierheng": ["tags", "hits"],
  "stonesplitStrength-anxisoldiermosweep": ["hits"],
  "stonesplitStrength-anxisoldiermodown": ["hits"],
  "stonesplitStrength-snowpartingq-stab": ["hits"],
  "stonesplitStrength-phalanxcharged-s3": ["hits"],
  "stonesplitStrength-phalanxcharged-s3-innerpassion": ["hits"],
  "stonesplitStrength-snowpartingspecial": ["hits"],
}
const fieldsStillMatchingLiveBuiltin = (id: string) =>
  CHECKED_FIELDS.filter((field) => !(MOVED_AGAIN_FIELDS[id] ?? []).includes(field))

const STORE = storeV25File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v25 fixture", () => {
  it("is v25 and still stores the pre-V26 shape for every healed skill", () => {
    expect(STORE.v).toBe(V26__stonesplitStrengthValuesGatesReach.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const builtin = builtinOf(id)
      const diverges = CHECKED_FIELDS.some(
        (field) => JSON.stringify(seeded[field]) !== JSON.stringify(builtin[field]),
      )
      expect(diverges, id).toBe(true)
    }
  })
})

describe("healStonesplitStrengthValuesGatesReach", () => {
  it("rewrites every untouched seeded copy to the current built-in's shape", () => {
    for (const id of HEALED_IDS) {
      const healed = healStonesplitStrengthValuesGatesReach(clone(skillIn(STORE, id))) as Skill
      const builtin = builtinOf(id)
      for (const field of fieldsStillMatchingLiveBuiltin(id))
        expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    }
  })

  it("leaves an edited copy alone", () => {
    const edited = clone(skillIn(STORE, "stonesplitStrength-snowpartingdual"))
    edited.tags = [...(edited.tags ?? []), "prop:userAdded"]
    expect(healStonesplitStrengthValuesGatesReach(clone(edited))).toEqual(edited)
  })

  it("leaves skills the migration does not target alone", () => {
    for (const id of [...STALE_PRE_GATE_IDS, USER_AUTHORED_ID]) {
      const untouched = clone(skillIn(STORE, id))
      expect(healStonesplitStrengthValuesGatesReach(clone(untouched)), id).toEqual(untouched)
    }
  })
})

describe("V26__stonesplitStrengthValuesGatesReach — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V26__stonesplitStrengthValuesGatesReach.migrate(clone(STORE))
    expect(after.v).toBe(26)
    for (const id of HEALED_IDS) {
      const builtin = builtinOf(id)
      for (const field of fieldsStillMatchingLiveBuiltin(id))
        expect(skillIn(after, id)[field], `${id}.${field}`).toEqual(builtin[field])
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V26__stonesplitStrengthValuesGatesReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V26__stonesplitStrengthValuesGatesReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V26__stonesplitStrengthValuesGatesReach — through the chain", () => {
  it("is registered and is exactly what the v25 → v26 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V26__stonesplitStrengthValuesGatesReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 26 })!
    expect(result.applied).toEqual(["V26__stonesplitStrengthValuesGatesReach"])
    expect(result.blob.v).toBe(26)
    for (const id of HEALED_IDS) {
      if (!fieldsStillMatchingLiveBuiltin(id).includes("tags")) continue
      expect(skillIn(result.blob, id).tags).toEqual(builtinOf(id).tags)
    }
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("lands on the current built-in's shape after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      const builtin = builtinOf(id)
      for (const field of fieldsStillMatchingLiveBuiltin(id)) {
        // The hydrator normalizes tags/receives/triggersBuffs to `[]` when a
        // built-in never authors the field at all — the migration's own scope
        // is what this suite checks elsewhere, not the hydrator's defaulting.
        const expected = field === "hits" ? builtin[field] : (builtin[field] ?? [])
        expect(skill[field], `${id}.${field}`).toEqual(expected)
      }
    }
  })

  it("does not refill triggersBuffs from the legacy backfill table on load", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of FORGETFULNESS_GRANT_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      expect(skill.triggersBuffs, id).toEqual(builtinOf(id).triggersBuffs)
      expect(skill.triggersBuffs, id).not.toContain("forgetfulness")
    }
  })
})
