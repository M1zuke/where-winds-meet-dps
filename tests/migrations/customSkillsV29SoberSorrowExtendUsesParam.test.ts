import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V29__soberSorrowExtendUsesParam,
  healSpearqExtendParam,
  healSpearq5HitCancelExtendParam,
} from "../../src/migrations/customSkills/V29__soberSorrowExtendUsesParam"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill, SkillHit } from "../../src/engine/skill"
import storeV28File from "./testCustomSkills/v28/store.json"

const CLASS = "bellstrikeUmbra"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SPEARQ_ID = "bellstrikeUmbra-spearq"
const SPEARQ_5_HIT_CANCEL_ID = "bellstrikeUmbra-spearq-5-hit-cancel"
const HEALED_IDS = [SPEARQ_ID, SPEARQ_5_HIT_CANCEL_ID]

const STORE = storeV28File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

const UNTOUCHED_LEADING_HITS: SkillHit[] = [
  {
    id: "hit-0",
    frame: 14,
    physMultiplier: 0.321033,
    attributeMultiplier: 0.4815495,
    physFixed: 88.95,
    attributeFixed: 48.45,
    extraCritDamage: 0,
    triggers: [],
  },
  {
    id: "hit-1",
    frame: 31,
    physMultiplier: 0.321033,
    attributeMultiplier: 0.4815495,
    physFixed: 88.95,
    attributeFixed: 48.45,
    extraCritDamage: 0,
    triggers: [],
  },
  {
    id: "hit-2",
    frame: 45,
    physMultiplier: 0.321033,
    attributeMultiplier: 0.4815495,
    physFixed: 88.95,
    attributeFixed: 48.45,
    extraCritDamage: 0,
    triggers: [],
  },
  {
    id: "hit-3",
    frame: 62,
    physMultiplier: 0.321033,
    attributeMultiplier: 0.4815495,
    physFixed: 88.95,
    attributeFixed: 48.45,
    extraCritDamage: 0,
    triggers: [],
  },
]

function riverFlowTierHit(empoweredStacks: number): SkillHit {
  return {
    id: "hit-4",
    frame: 82,
    physMultiplier: 0.321033,
    attributeMultiplier: 0.4815495,
    physFixed: 88.95,
    attributeFixed: 48.45,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "buff-bellstrikeUmbra-water-drop",
        stacks: 1,
        condition: null,
        appliesOnCastEnd: true,
      },
      {
        kind: "applyBuff",
        targetId: "buff-bellstrikeUmbra-water-drop",
        stacks: 1,
        condition: null,
        extendFrames: 180,
        extendOnly: true,
        appliesOnCastEnd: true,
        requiresParam: "wolfchasersArt",
      },
      {
        kind: "applyBuff",
        targetId: "buff-bellstrikeUmbra-spring-surge",
        stacks: 1,
        condition: null,
        appliesOnCastEnd: true,
      },
      {
        kind: "applyBuff",
        targetId: "buff-bellstrikeUmbra-spring-surge",
        stacks: 1,
        condition: null,
        extendFrames: 180,
        extendOnly: true,
        appliesOnCastEnd: true,
        requiresParam: "wolfchasersArt",
      },
      {
        kind: "applyBuff",
        targetId: "potentRiverFlow",
        stacks: 1,
        condition: { buffId: "debuff-bellstrikeUmbra-bleed-tick", op: "gte", stacks: 1 },
        appliesOnCastEnd: true,
      },
      {
        kind: "applyBuff",
        targetId: "buff-bellstrikeUmbra-empowered-river-flow",
        stacks: 1,
        condition: {
          buffId: "debuff-bellstrikeUmbra-bleed-tick",
          op: "gte",
          stacks: empoweredStacks,
        },
        appliesOnCastEnd: true,
      },
    ],
  }
}

const HEALED_SPEARQ_HITS: SkillHit[] = [
  ...UNTOUCHED_LEADING_HITS,
  riverFlowTierHit(1),
  {
    id: "hit-5",
    frame: 98,
    physMultiplier: 0.535055,
    attributeMultiplier: 0.8025825,
    physFixed: 148.25,
    attributeFixed: 80.75,
    extraCritDamage: 0,
    triggers: [],
  },
]

const HEALED_SPEARQ_5_HIT_CANCEL_HITS: SkillHit[] = [...UNTOUCHED_LEADING_HITS, riverFlowTierHit(4)]

const HEALED_HITS: Record<string, SkillHit[]> = {
  [SPEARQ_ID]: HEALED_SPEARQ_HITS,
  [SPEARQ_5_HIT_CANCEL_ID]: HEALED_SPEARQ_5_HIT_CANCEL_HITS,
}

describe("frozen hits match the live built-ins", () => {
  it("SpearQ and SpearQ 5-Hit Cancel still match the shapes this hop's tests freeze", () => {
    for (const id of HEALED_IDS) expect(HEALED_HITS[id]).toEqual(builtinOf(id).hits)
  })
})

describe("custom-skills v28 fixture", () => {
  it("is v28 and still stores the pre-V29 shape for SpearQ and SpearQ 5-Hit Cancel", () => {
    expect(STORE.v).toBe(V29__soberSorrowExtendUsesParam.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(seeded.hits, id).not.toEqual(HEALED_HITS[id])
    }
  })
})

describe("healSpearqExtendParam / healSpearq5HitCancelExtendParam", () => {
  it("rewrites an untouched seeded SpearQ copy to the frozen hits", () => {
    const healed = healSpearqExtendParam(clone(skillIn(STORE, SPEARQ_ID)).hits)
    expect(healed).toEqual(HEALED_SPEARQ_HITS)
  })

  it("rewrites an untouched seeded SpearQ 5-Hit Cancel copy to the frozen hits", () => {
    const healed = healSpearq5HitCancelExtendParam(
      clone(skillIn(STORE, SPEARQ_5_HIT_CANCEL_ID)).hits,
    )
    expect(healed).toEqual(HEALED_SPEARQ_5_HIT_CANCEL_HITS)
  })

  it("leaves an edited copy alone", () => {
    const edited = clone(skillIn(STORE, SPEARQ_ID))
    edited.hits[4]!.triggers = edited.hits[4]!.triggers.slice(0, -1)
    const untouched = clone(edited.hits)
    expect(healSpearqExtendParam(edited.hits)).toEqual(untouched)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "bellstrikeUmbra-spearheavy"))
    expect(healSpearqExtendParam(clone(untouched).hits)).toEqual(untouched.hits)
  })
})

describe("V29__soberSorrowExtendUsesParam — called directly", () => {
  it("rewrites both seeded copies to the frozen hits and nothing else", () => {
    const after = V29__soberSorrowExtendUsesParam.migrate(clone(STORE))
    expect(after.v).toBe(29)
    for (const id of HEALED_IDS) {
      expect(skillIn(after, id).hits).toEqual(HEALED_HITS[id])
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V29__soberSorrowExtendUsesParam.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V29__soberSorrowExtendUsesParam.migrate(clone(once))).toEqual(once)
  })
})

describe("V29__soberSorrowExtendUsesParam — through the chain", () => {
  it("is registered and is exactly what the v28 → v29 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V29__soberSorrowExtendUsesParam)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 29 })!
    expect(result.applied).toEqual(["V29__soberSorrowExtendUsesParam"])
    expect(result.blob.v).toBe(29)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V29__soberSorrowExtendUsesParam,
    )
    const result = runChain(withoutStep, 29, clone(STORE))!
    expect(result.applied).not.toContain("V29__soberSorrowExtendUsesParam")
    for (const id of HEALED_IDS) {
      expect(skillIn(result.blob, id).hits).toEqual(skillIn(STORE, id).hits)
      expect(skillIn(result.blob, id).hits).not.toEqual(HEALED_HITS[id])
    }
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("lands on the frozen hits after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      expect(skill.hits, id).toEqual(HEALED_HITS[id])
    }
  })
})
