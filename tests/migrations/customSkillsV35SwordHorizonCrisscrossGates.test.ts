import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V35__swordHorizonCrisscrossGates,
  healSkill,
} from "../../src/migrations/customSkills/V35__swordHorizonCrisscrossGates"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import storeV34File from "./testCustomSkills/v34/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV34File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

const SWORD_HORIZON_CONDITION = { param: "swordHorizon" }

// Present in the captured v34 fixture; the rest of these targets have no
// stored copy in any fixture yet, so their "untouched seeded" shape is built
// from the built-in skill directly.
const AVAILABILITY_FIXTURE_IDS = [
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
]

const HAND_BUILT_AVAILABILITY: Record<string, Skill> = {
  "bellstrikeUmbra-sword-martial-qqq": {
    id: "bellstrikeUmbra-sword-martial-qqq",
    classId: "bellstrikeUmbra",
    name: "Sword Martial QQQ",
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    castFrames: 86,
    triggerable: true,
    hits: [
      {
        id: "hit-0",
        frame: 32,
        physMultiplier: 0.316911,
        attributeMultiplier: 0.475366,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  "bellstrikeUmbra-sword-r-charge-follow-up": {
    id: "bellstrikeUmbra-sword-r-charge-follow-up",
    classId: "bellstrikeUmbra",
    name: "Sword R Charge - Follow Up",
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    castFrames: 86,
    triggerable: true,
    hits: [
      {
        id: "hit-0",
        frame: 14,
        physMultiplier: 0.325601,
        attributeMultiplier: 0.488401,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel": {
    id: "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
    classId: "bellstrikeUmbra",
    name: "Sword R Charge - Follow Up 1-Hit[cancel]",
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    castFrames: 33,
    triggerable: true,
    hits: [
      {
        id: "hit-0",
        frame: 14,
        physMultiplier: 0.325601,
        attributeMultiplier: 0.488401,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
}

const AVAILABILITY_GATED_IDS = [
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
]

function untouchedAvailabilitySkill(id: string): Skill {
  if (AVAILABILITY_FIXTURE_IDS.includes(id)) return skillIn(STORE, id)!
  return HAND_BUILT_AVAILABILITY[id]!
}

const CUT_LENGTH_SPEC = {
  "bellstrikeUmbra-swordspecial-4-hit": {
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    castFrames: 77,
  },
  "bellstrikeUmbra-swordspecial-3-hit": {
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    castFrames: 64,
  },
  "bellstrikeUmbra-swordqfollowup": {
    physMultiplier: 0.544068,
    attributeMultiplier: 0.816102,
    physFixed: 150.6,
    attributeFixed: 82,
    castFrames: 61,
  },
} as const

const HAND_BUILT_CUT_LENGTH: Record<string, Skill> = {
  "bellstrikeUmbra-swordspecial-3-hit": {
    id: "bellstrikeUmbra-swordspecial-3-hit",
    classId: "bellstrikeUmbra",
    name: "SwordSpecial 3-Hit",
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    castFrames: 57,
    triggerable: true,
    hits: [
      {
        id: "hit-0",
        frame: 29,
        physMultiplier: 0.196354,
        attributeMultiplier: 0.294531,
        physFixed: 54.4,
        attributeFixed: 29.6,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  "bellstrikeUmbra-swordqfollowup": {
    id: "bellstrikeUmbra-swordqfollowup",
    classId: "bellstrikeUmbra",
    name: "Sword Martial QQ",
    skillType: "weapon",
    weaponOrAttribute: "Sword",
    attributeAttack: "Bellstrike",
    castFrames: 64,
    triggerable: true,
    hits: [
      {
        id: "hit-0",
        frame: 5,
        physMultiplier: 0.544068,
        attributeMultiplier: 0.816102,
        physFixed: 150.6,
        attributeFixed: 82,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
}

function untouchedCutLengthSkill(id: string): Skill {
  if (id === "bellstrikeUmbra-swordspecial-4-hit") return skillIn(STORE, id)!
  return HAND_BUILT_CUT_LENGTH[id]!
}

function expectAvailabilityHealed(healed: Skill) {
  expect(healed.castConditions).toEqual([SWORD_HORIZON_CONDITION])
}

function expectCutLengthHealed(id: keyof typeof CUT_LENGTH_SPEC, healed: Skill) {
  const spec = CUT_LENGTH_SPEC[id]
  const localId = id.replace(/^bellstrikeUmbra-/, "")
  expect(healed.hits[0]!.variants).toEqual([
    {
      id: `hv-${localId}-hit-0-sword-horizon`,
      label: "Sword Horizon",
      conditions: [SWORD_HORIZON_CONDITION],
      physMultiplier: spec.physMultiplier,
      attributeMultiplier: spec.attributeMultiplier,
      physFixed: spec.physFixed,
      attributeFixed: spec.attributeFixed,
      castFrames: spec.castFrames,
    },
  ])
}

describe("custom-skills v34 fixture", () => {
  it("is v34 and stores the pre-V35 shape for the row's fixture-backed skills", () => {
    expect(STORE.v).toBe(V35__swordHorizonCrisscrossGates.to - 1)
    for (const id of AVAILABILITY_FIXTURE_IDS) {
      expect(skillIn(STORE, id)?.castConditions, id).toBeUndefined()
    }
    expect(skillIn(STORE, "bellstrikeUmbra-swordspecial-4-hit")?.hits[0]?.variants).toBeUndefined()
  })

  it("carries an edited Sword Martial QQ copy that does not match the built-in's hit-0 frame", () => {
    const edited = skillIn(STORE, "bellstrikeUmbra-swordqfollowup")!
    expect(edited.hits[0]!.frame).not.toBe(5)
  })
})

describe("healSkill — availability gate", () => {
  it("adds the Sword Horizon cast condition to every untouched seeded copy", () => {
    for (const id of AVAILABILITY_GATED_IDS) {
      expectAvailabilityHealed(healSkill(clone(untouchedAvailabilitySkill(id))) as Skill)
    }
  })

  it("does not double-heal a copy that already carries castConditions", () => {
    const alreadyHealed = healSkill(
      clone(untouchedAvailabilitySkill("bellstrikeUmbra-crosswind-blade")),
    ) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves an already-gated castConditions field alone rather than overwriting it", () => {
    const edited = {
      ...clone(untouchedAvailabilitySkill("bellstrikeUmbra-crosswind-blade")),
      castConditions: [],
    }
    expect((healSkill(edited) as Skill).castConditions).toEqual([])
  })
})

describe("healSkill — Sword-Horizon-conditioned cut-length variant", () => {
  it("adds the variant to every untouched seeded copy", () => {
    expectCutLengthHealed(
      "bellstrikeUmbra-swordspecial-4-hit",
      healSkill(clone(untouchedCutLengthSkill("bellstrikeUmbra-swordspecial-4-hit"))) as Skill,
    )
    expectCutLengthHealed(
      "bellstrikeUmbra-swordspecial-3-hit",
      healSkill(clone(untouchedCutLengthSkill("bellstrikeUmbra-swordspecial-3-hit"))) as Skill,
    )
    expectCutLengthHealed(
      "bellstrikeUmbra-swordqfollowup",
      healSkill(clone(untouchedCutLengthSkill("bellstrikeUmbra-swordqfollowup"))) as Skill,
    )
  })

  it("does not double-heal a copy that already carries the variant", () => {
    const alreadyHealed = healSkill(
      clone(untouchedCutLengthSkill("bellstrikeUmbra-swordspecial-4-hit")),
    ) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves the real captured edited Sword Martial QQ copy alone (hit-0 frame does not match)", () => {
    const edited = skillIn(STORE, "bellstrikeUmbra-swordqfollowup")!
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("heals a seedSkillFromBuiltin-shaped copy even though its hit id is freshly randomized", () => {
    const seeded = seedSkillFromBuiltin(
      "bellstrikeUmbra",
      untouchedCutLengthSkill("bellstrikeUmbra-swordqfollowup"),
    )
    expect(seeded.hits[0]!.id).not.toBe("hit-0")
    expectCutLengthHealed("bellstrikeUmbra-swordqfollowup", healSkill(seeded) as Skill)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-swordq")
    if (untouched) expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V35__swordHorizonCrisscrossGates — called directly", () => {
  it("heals every fixture-backed targeted skill and nothing else", () => {
    const after = V35__swordHorizonCrisscrossGates.migrate(clone(STORE))
    expect(after.v).toBe(35)
    expectAvailabilityHealed(skillIn(after, "bellstrikeUmbra-crosswind-blade")!)
    expectAvailabilityHealed(skillIn(after, "bellstrikeUmbra-crosswind-blade-cancel")!)
    expectCutLengthHealed(
      "bellstrikeUmbra-swordspecial-4-hit",
      skillIn(after, "bellstrikeUmbra-swordspecial-4-hit")!,
    )
    expect(skillIn(after, "bellstrikeUmbra-swordqfollowup")).toEqual(
      skillIn(STORE, "bellstrikeUmbra-swordqfollowup"),
    )
    const touchedIds = new Set([
      "bellstrikeUmbra-crosswind-blade",
      "bellstrikeUmbra-crosswind-blade-cancel",
      "bellstrikeUmbra-swordspecial-4-hit",
    ])
    for (const skill of STORE.skills) {
      if (touchedIds.has(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V35__swordHorizonCrisscrossGates.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V35__swordHorizonCrisscrossGates.migrate(clone(once))).toEqual(once)
  })
})

describe("V35__swordHorizonCrisscrossGates — through the chain", () => {
  it("is registered and is exactly what the v34 → v35 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V35__swordHorizonCrisscrossGates)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 35 })!
    expect(result.applied).toEqual(["V35__swordHorizonCrisscrossGates"])
    expect(result.blob.v).toBe(35)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V35__swordHorizonCrisscrossGates,
    )
    const result = runChain(withoutStep, 35, clone(STORE))!
    expect(result.applied).not.toContain("V35__swordHorizonCrisscrossGates")
    expect(skillIn(result.blob, "bellstrikeUmbra-crosswind-blade")).toEqual(
      skillIn(STORE, "bellstrikeUmbra-crosswind-blade"),
    )
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the availability gate and the cut-length variant after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const crosswindBlade = loaded.find(
      (candidate) => candidate.id === "bellstrikeUmbra-crosswind-blade",
    )!
    expectAvailabilityHealed(crosswindBlade)
    const swordspecial4Hit = loaded.find(
      (candidate) => candidate.id === "bellstrikeUmbra-swordspecial-4-hit",
    )!
    expectCutLengthHealed("bellstrikeUmbra-swordspecial-4-hit", swordspecial4Hit)
  })
})
