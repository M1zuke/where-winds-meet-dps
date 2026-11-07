import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V31__forgetfulnessCooldownMarker,
  healSkill,
} from "../../src/migrations/customSkills/V31__forgetfulnessCooldownMarker"
import { loadCustomSkills } from "../../src/storage"
import type { Skill, SkillHit } from "../../src/engine/skill"
import storeV30File from "./testCustomSkills/v30/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"
const HEALED_IDS = [SNOWPARTING_VC_ID, SNOWPARTING_VC_PREPULL_ID, FREE_GRAVE_FROST_ID]

const STORE = storeV30File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const FORGETFULNESS_GATE_TRIGGER = {
  kind: "applyBuff",
  targetId: "forgetfulness",
  stacks: 1,
  condition: { buffId: "forgetfulnessCooldown", op: "eq", stacks: 0 },
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}
const FORGETFULNESS_COOLDOWN_RESET_TRIGGER = {
  kind: "clearStatus",
  targetId: "forgetfulnessCooldown",
  stacks: 1,
  condition: null,
  phase: "exhausted",
  requiresParam: "frostCladNight",
  requiresMinTier: 6,
}

const HEALED_SNOWPARTING_VC_HITS: SkillHit[] = [
  {
    id: "hit-0",
    frame: 0,
    physMultiplier: 2.0769,
    attributeMultiplier: 3.1153,
    physFixed: 575,
    attributeFixed: 313,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "castSkill",
        targetId: "stonesplitStrength-anxisoldierheng",
        stacks: 0,
        condition: { buffId: "ironGuards", op: "gte", stacks: 1, source: "buffEngine" },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      {
        kind: "applyBuff",
        targetId: "buff-stonesplitStrength-dread",
        stacks: 0,
        condition: null,
        phase: "exhausted",
        extendFrames: 120,
        extendOnly: true,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
      FORGETFULNESS_GATE_TRIGGER,
      FORGETFULNESS_COOLDOWN_RESET_TRIGGER,
    ],
  },
] as unknown as SkillHit[]

const HEALED_SNOWPARTING_VC_PREPULL_HITS: SkillHit[] = [
  {
    id: "hit-0",
    frame: 0,
    physMultiplier: 2.07686,
    attributeMultiplier: 3.11529,
    physFixed: 575,
    attributeFixed: 313,
    extraCritDamage: 0,
    triggers: [
      {
        kind: "castSkill",
        targetId: "stonesplitStrength-anxisoldierheng",
        stacks: 0,
        condition: { buffId: "ironGuards", op: "gte", stacks: 1, source: "buffEngine" },
        requiresParam: "frostCladNight",
        requiresMinTier: 1,
      },
      FORGETFULNESS_GATE_TRIGGER,
      FORGETFULNESS_COOLDOWN_RESET_TRIGGER,
    ],
  },
] as unknown as SkillHit[]

const FREE_GRAVE_FROST_LEADING_HIT = {
  frame: 0,
  physMultiplier: 0.4899,
  attributeMultiplier: 0.734867,
  physFixed: 135.6,
  attributeFixed: 73.8,
  extraCritDamage: 0,
}

const HEALED_FREE_GRAVE_FROST_HITS: SkillHit[] = [
  {
    id: "hit-0",
    ...FREE_GRAVE_FROST_LEADING_HIT,
    triggers: [
      {
        kind: "applyBuff",
        targetId: "forgetfulnessCooldown",
        stacks: 1,
        condition: null,
        requiresParam: "frostCladNight",
        requiresMinTier: 6,
      },
    ],
  },
  { id: "hit-1", ...FREE_GRAVE_FROST_LEADING_HIT, frame: 14, triggers: [] },
  { id: "hit-2", ...FREE_GRAVE_FROST_LEADING_HIT, frame: 28, triggers: [] },
  {
    id: "hit-3",
    frame: 42,
    physMultiplier: 0.9798,
    attributeMultiplier: 1.4697,
    physFixed: 271.2,
    attributeFixed: 147.6,
    extraCritDamage: 0,
    triggers: [],
  },
] as unknown as SkillHit[]

const HEALED_HITS: Record<string, SkillHit[]> = {
  [SNOWPARTING_VC_ID]: HEALED_SNOWPARTING_VC_HITS,
  [SNOWPARTING_VC_PREPULL_ID]: HEALED_SNOWPARTING_VC_PREPULL_HITS,
  [FREE_GRAVE_FROST_ID]: HEALED_FREE_GRAVE_FROST_HITS,
}
const HEALED_TRIGGERS_BUFFS: Record<string, string[]> = {
  [SNOWPARTING_VC_ID]: ["throatPierced"],
  [SNOWPARTING_VC_PREPULL_ID]: ["throatPierced"],
  [FREE_GRAVE_FROST_ID]: [],
}

describe("custom-skills v30 fixture", () => {
  it("is v30 and still stores the pre-V31 shape", () => {
    expect(STORE.v).toBe(V31__forgetfulnessCooldownMarker.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(seeded.hits, id).not.toEqual(HEALED_HITS[id])
    }
    expect(skillIn(STORE, SNOWPARTING_VC_ID).triggersBuffs).toEqual([
      "throatPierced",
      "forgetfulness",
    ])
  })
})

describe("healSkill", () => {
  it("rewrites every untouched seeded copy to the frozen shapes", () => {
    for (const id of HEALED_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.hits, id).toEqual(HEALED_HITS[id])
      expect(healed.triggersBuffs ?? [], id).toEqual(HEALED_TRIGGERS_BUFFS[id])
    }
  })

  it("leaves an edited hit's triggers alone", () => {
    const edited = clone(skillIn(STORE, SNOWPARTING_VC_ID))
    edited.hits[0]!.triggers = edited.hits[0]!.triggers.slice(0, 1)
    const untouchedHits = clone(edited.hits)
    expect((healSkill(edited) as Skill).hits).toEqual(untouchedHits)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "stonesplitStrength-deflect"))
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V31__forgetfulnessCooldownMarker — called directly", () => {
  it("rewrites every seeded copy to the frozen shapes and nothing else", () => {
    const after = V31__forgetfulnessCooldownMarker.migrate(clone(STORE))
    expect(after.v).toBe(31)
    for (const id of HEALED_IDS) {
      expect(skillIn(after, id).hits).toEqual(HEALED_HITS[id])
      expect(skillIn(after, id).triggersBuffs ?? []).toEqual(HEALED_TRIGGERS_BUFFS[id])
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V31__forgetfulnessCooldownMarker.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V31__forgetfulnessCooldownMarker.migrate(clone(once))).toEqual(once)
  })
})

describe("V31__forgetfulnessCooldownMarker — through the chain", () => {
  it("is registered and is exactly what the v30 → v31 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V31__forgetfulnessCooldownMarker)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 31 })!
    expect(result.applied).toEqual(["V31__forgetfulnessCooldownMarker"])
    expect(result.blob.v).toBe(31)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V31__forgetfulnessCooldownMarker,
    )
    const result = runChain(withoutStep, 31, clone(STORE))!
    expect(result.applied).not.toContain("V31__forgetfulnessCooldownMarker")
    for (const id of HEALED_IDS) {
      expect(skillIn(result.blob, id).hits).toEqual(skillIn(STORE, id).hits)
      expect(skillIn(result.blob, id).hits).not.toEqual(HEALED_HITS[id])
    }
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  // All three ids move again at v32 (the Snowbreak Spring availability
  // gate), so `loadCustomSkills` — which always walks to the latest version —
  // no longer lands on v31's own frozen shapes alone; the v31 → v32 hop's own
  // hydrator-survival test reads this same v31 fixture and covers the
  // combined result.
  it("keeps every one of this hop's own triggers in the fully-hydrated hits", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      for (const trigger of HEALED_HITS[id]![0]!.triggers) {
        expect(skill.hits[0]!.triggers, id).toContainEqual(trigger)
      }
    }
  })
})
