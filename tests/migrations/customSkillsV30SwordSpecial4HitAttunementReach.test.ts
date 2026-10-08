import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V30__swordSpecial4HitAttunementReach,
  healSwordspecial4HitAttunementReach,
} from "../../src/migrations/customSkills/V30__swordSpecial4HitAttunementReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { HitTrigger, Skill, SkillHit } from "../../src/engine/skill"
import storeV29File from "./testCustomSkills/v29/store.json"

const CLASS = "bellstrikeUmbra"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SWORDSPECIAL_4_HIT_ID = "bellstrikeUmbra-swordspecial-4-hit"

const STORE = storeV29File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

const HEALED_HITS: SkillHit[] = [
  {
    id: "hit-0",
    frame: 29,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 1,
        condition: null,
      },
      {
        kind: "detonateDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 0,
        condition: null,
      },
    ],
  },
  {
    id: "hit-1",
    frame: 35,
    physMultiplier: 0.392708,
    attributeMultiplier: 0.589062,
    physFixed: 108.8,
    attributeFixed: 59.2,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 1,
        condition: null,
      },
      {
        kind: "detonateDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 0,
        condition: null,
      },
    ],
  },
  {
    id: "hit-2",
    frame: 43,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 1,
        condition: null,
      },
      {
        kind: "detonateDot",
        targetId: "debuff-bellstrikeUmbra-bleed-tick",
        stacks: 0,
        condition: null,
      },
      {
        kind: "castSkill",
        targetId: "bellstrikeUmbra-swordspecial-4-hit-final",
        stacks: 1,
        condition: null,
      },
    ],
  },
]

const BLEED_MECHANISM_ENHANCEMENT_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 10,
  condition: { buffId: "debuff-bellstrikeUmbra-bleed-tick", op: "gte", stacks: 4 },
  conditionsBeforeHit: true,
  cooldownFrames: 180,
  cooldownGroup: "bleedMechanismEnhancement",
}

const BLEED_MECHANISM_ENHANCEMENT_RELEASE: HitTrigger = {
  kind: "cooldownCut",
  targetId: "bleedMechanismEnhancement",
  stacks: 180,
  condition: null,
  appliesOnCastEnd: true,
}

const HIT_2_TRIGGERS_WITH_CAST_LAST = [
  ...HEALED_HITS[2]!.triggers.slice(0, 2),
  BLEED_MECHANISM_ENHANCEMENT_GAIN,
  HEALED_HITS[2]!.triggers[2]!,
]
const HIT_2_TRIGGERS_WITH_CAST_FIRST = [
  ...HEALED_HITS[2]!.triggers,
  BLEED_MECHANISM_ENHANCEMENT_GAIN,
]

// This hop's own output never produces hit 0's `variants` array; the live
// built-in and the full hydrator chain do, from a later hop. The live
// built-in module authors the Bleeding refund ahead of the generated cast on
// hit 2; a migrated copy instead appends it after, since a later hop can only
// ever append to what an earlier one already wrote — `CURRENT_HITS` is the
// live built-in's own order, `HYDRATED_HITS` the migration chain's.
const CURRENT_HITS: SkillHit[] = [
  {
    ...HEALED_HITS[0]!,
    triggers: [
      ...HEALED_HITS[0]!.triggers,
      BLEED_MECHANISM_ENHANCEMENT_GAIN,
      BLEED_MECHANISM_ENHANCEMENT_RELEASE,
    ],
    variants: [
      {
        id: "hv-swordspecial-4-hit-hit-0-sword-horizon",
        label: "Sword Horizon",
        conditions: [{ param: "swordHorizon" }],
        physMultiplier: 0.196354,
        attributeMultiplier: 0.294531,
        physFixed: 54.4,
        attributeFixed: 29.6,
        castFrames: 77,
      },
    ],
  },
  { ...HEALED_HITS[1]!, triggers: [...HEALED_HITS[1]!.triggers, BLEED_MECHANISM_ENHANCEMENT_GAIN] },
  { ...HEALED_HITS[2]!, triggers: HIT_2_TRIGGERS_WITH_CAST_LAST },
]

const HYDRATED_HITS: SkillHit[] = [
  CURRENT_HITS[0]!,
  CURRENT_HITS[1]!,
  { ...HEALED_HITS[2]!, triggers: HIT_2_TRIGGERS_WITH_CAST_FIRST },
]

describe("frozen hits match the live built-in", () => {
  it("SwordSpecial 4-Hit still matches the shape this hop's tests freeze", () => {
    expect(CURRENT_HITS).toEqual(builtin(SWORDSPECIAL_4_HIT_ID).hits)
  })
})

describe("custom-skills v29 fixture", () => {
  it("is v29 and still stores SwordSpecial 4-Hit's pre-V30, four-hit shape", () => {
    expect(STORE.v).toBe(V30__swordSpecial4HitAttunementReach.to - 1)
    expect(skillIn(STORE, SWORDSPECIAL_4_HIT_ID).hits).toHaveLength(4)
    expect(skillIn(STORE, SWORDSPECIAL_4_HIT_ID).hits).not.toEqual(HEALED_HITS)
  })
})

describe("healSwordspecial4HitAttunementReach", () => {
  it("rewrites an untouched seeded copy to the frozen hits", () => {
    const healed = healSwordspecial4HitAttunementReach(
      clone(skillIn(STORE, SWORDSPECIAL_4_HIT_ID)).hits,
    )
    expect(healed).toEqual(HEALED_HITS)
  })

  it("leaves a copy whose hit coefficients were edited alone", () => {
    const edited = clone(skillIn(STORE, SWORDSPECIAL_4_HIT_ID))
    edited.hits[0]!.physMultiplier = 0.5
    const untouched = clone(edited.hits)
    expect(healSwordspecial4HitAttunementReach(edited.hits)).toEqual(untouched)
  })

  it("an edited frame is left alone", () => {
    const edited = clone(skillIn(STORE, SWORDSPECIAL_4_HIT_ID))
    edited.hits[3]!.frame = 77
    const untouched = clone(edited.hits)
    expect(healSwordspecial4HitAttunementReach(edited.hits)).toEqual(untouched)
  })

  it("an edited extraCritDamage is left alone", () => {
    const edited = clone(skillIn(STORE, SWORDSPECIAL_4_HIT_ID))
    edited.hits[1]!.extraCritDamage = 0.1
    const untouched = clone(edited.hits)
    expect(healSwordspecial4HitAttunementReach(edited.hits)).toEqual(untouched)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "bellstrikeUmbra-spearq"))
    expect(healSwordspecial4HitAttunementReach(clone(untouched).hits)).toEqual(untouched.hits)
  })
})

describe("V30__swordSpecial4HitAttunementReach — called directly", () => {
  it("rewrites the seeded copy and nothing else", () => {
    const after = V30__swordSpecial4HitAttunementReach.migrate(clone(STORE))
    expect(after.v).toBe(30)
    expect(skillIn(after, SWORDSPECIAL_4_HIT_ID).hits).toEqual(HEALED_HITS)
    for (const skill of STORE.skills) {
      if (skill.id === SWORDSPECIAL_4_HIT_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V30__swordSpecial4HitAttunementReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V30__swordSpecial4HitAttunementReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V30__swordSpecial4HitAttunementReach — through the chain", () => {
  it("is registered and is exactly what the v29 → v30 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V30__swordSpecial4HitAttunementReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 30 })!
    expect(result.applied).toEqual(["V30__swordSpecial4HitAttunementReach"])
    expect(result.blob.v).toBe(30)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V30__swordSpecial4HitAttunementReach,
    )
    const result = runChain(withoutStep, 30, clone(STORE))!
    expect(result.applied).not.toContain("V30__swordSpecial4HitAttunementReach")
    expect(skillIn(result.blob, SWORDSPECIAL_4_HIT_ID).hits).toEqual(
      skillIn(STORE, SWORDSPECIAL_4_HIT_ID).hits,
    )
    expect(skillIn(result.blob, SWORDSPECIAL_4_HIT_ID).hits).not.toEqual(HEALED_HITS)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("lands on the frozen hits after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === SWORDSPECIAL_4_HIT_ID)!
    expect(skill.hits).toEqual(HYDRATED_HITS)
  })
})
