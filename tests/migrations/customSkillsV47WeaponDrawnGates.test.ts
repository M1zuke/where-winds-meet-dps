import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V47__weaponDrawnGates,
  healSkill,
} from "../../src/migrations/customSkills/V47__weaponDrawnGates"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import { deflectCancel } from "../../src/data/skills/stonesplit-strength/deflect-cancel"
import storeV46File from "./testCustomSkills/v46/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV46File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

const DEFLECT_VARIANT_ID = "hv-deflect-hit-0-mo-blade-drawn"
const DEFLECT_CANCEL_VARIANT_ID = "hv-deflect-cancel-hit-0-mo-blade-drawn"

const DEFLECT_EXPECTED_VARIANT = {
  id: DEFLECT_VARIANT_ID,
  label: "Mo Blade Drawn",
  conditions: [{ buffId: "drawn:Mo Blade", op: "gte", stacks: 1 }],
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  castFrames: 18,
}

const DEFLECT_CANCEL_EXPECTED_VARIANT = {
  ...DEFLECT_EXPECTED_VARIANT,
  id: DEFLECT_CANCEL_VARIANT_ID,
}

const DRAWN_VARIANT_ID_BY_SKILL: Record<string, string> = {
  "stonesplitStrength-deflect": DEFLECT_VARIANT_ID,
  "stonesplitStrength-deflect-cancel": DEFLECT_CANCEL_VARIANT_ID,
}

const EXPECTED_VARIANT_BY_SKILL: Record<string, typeof DEFLECT_EXPECTED_VARIANT> = {
  "stonesplitStrength-deflect": DEFLECT_EXPECTED_VARIANT,
  "stonesplitStrength-deflect-cancel": DEFLECT_CANCEL_EXPECTED_VARIANT,
}

function hasDrawnVariant(skill: Skill): boolean {
  const variantId = DRAWN_VARIANT_ID_BY_SKILL[skill.id]
  return !!variantId && !!skill.hits[0]?.variants?.some((variant) => variant.id === variantId)
}

function hasDrawnGate(skill: Skill): boolean {
  const trigger = skill.hits[0]?.triggers.find(
    (candidate) => candidate.kind === "applyBuff" && candidate.cooldownFrames === 60,
  )
  return !!trigger?.conditions?.some(
    (condition) => "buffId" in condition && condition.buffId === "drawn:Gauntlets",
  )
}

const DEFLECT_IDS = ["stonesplitStrength-deflect", "stonesplitStrength-deflect-cancel"]
const PERFECT_DODGE_IDS = ["bamboocutDraught-perfect-dodge", "bamboocutDraught-perfect-dodge-full"]

// Stonesplit's own Deflect Cancel has no captured copy in the fixture, so its
// untouched-seeded shape is built from the current built-in, with this
// step's own addition stripped back out to reach the genuine pre-V47 shape.
function withoutDrawnVariant(skill: Skill): Skill {
  const variantId = DRAWN_VARIANT_ID_BY_SKILL[skill.id]
  return {
    ...skill,
    hits: skill.hits.map((hit, index) =>
      index === 0
        ? { ...hit, variants: (hit.variants ?? []).filter((variant) => variant.id !== variantId) }
        : hit,
    ),
  }
}

const SEEDED_ONLY: Record<string, Skill> = {
  "stonesplitStrength-deflect-cancel": withoutDrawnVariant(deflectCancel),
}

function beforeShapeOf(id: string): Skill {
  const seeded = SEEDED_ONLY[id]
  return seeded ? seedSkillFromBuiltin("stonesplitStrength", seeded) : skillIn(STORE, id)!
}

describe("the pre-V47 shape", () => {
  it("carries neither gate yet", () => {
    for (const id of DEFLECT_IDS) expect(hasDrawnVariant(beforeShapeOf(id)), id).toBe(false)
    for (const id of PERFECT_DODGE_IDS) expect(hasDrawnGate(beforeShapeOf(id)), id).toBe(false)
  })
})

describe("healSkill", () => {
  it("adds the Mo Blade drawn variant to both Deflect forms, each with its own variant id", () => {
    for (const id of DEFLECT_IDS) {
      const healed = healSkill(clone(beforeShapeOf(id))) as Skill
      expect(hasDrawnVariant(healed), id).toBe(true)
      const variant = healed.hits[0]!.variants!.find(
        (entry) => entry.id === DRAWN_VARIANT_ID_BY_SKILL[id],
      )!
      expect(variant, id).toEqual(EXPECTED_VARIANT_BY_SKILL[id])
    }
  })

  it("adds the gauntlets-drawn condition to both Perfect Dodge forms", () => {
    for (const id of PERFECT_DODGE_IDS) {
      const healed = healSkill(clone(beforeShapeOf(id))) as Skill
      expect(hasDrawnGate(healed), id).toBe(true)
    }
  })

  it("does not double-heal a copy that already carries either addition", () => {
    for (const id of [...DEFLECT_IDS, ...PERFECT_DODGE_IDS]) {
      const once = healSkill(clone(beforeShapeOf(id)))
      const twice = healSkill(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")!
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V47__weaponDrawnGates — called directly", () => {
  it("heals every matchId and leaves every other skill untouched", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: [
        ...(STORE.skills as Skill[]),
        ...Object.keys(SEEDED_ONLY).map((id) => beforeShapeOf(id)),
      ],
    }
    const before = clone(seededStore)
    const after = V47__weaponDrawnGates.migrate(before)
    expect(after.v).toBe(47)
    for (const id of DEFLECT_IDS) expect(hasDrawnVariant(skillIn(after, id)!), id).toBe(true)
    for (const id of PERFECT_DODGE_IDS) expect(hasDrawnGate(skillIn(after, id)!), id).toBe(true)
    for (const skill of before.skills) {
      if ([...DEFLECT_IDS, ...PERFECT_DODGE_IDS].includes(skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V47__weaponDrawnGates.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V47__weaponDrawnGates.migrate(clone(once))).toEqual(once)
  })
})

describe("V47__weaponDrawnGates — through the chain", () => {
  it("is registered and is exactly what the v46 → v47 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V47__weaponDrawnGates)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 47 })!
    expect(result.applied).toEqual(["V47__weaponDrawnGates"])
    expect(result.blob.v).toBe(47)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V47__weaponDrawnGates)
    const result = runChain(withoutStep, 47, clone(STORE))!
    expect(result.applied).not.toContain("V47__weaponDrawnGates")
    expect(hasDrawnGate(skillIn(result.blob, "bamboocutDraught-perfect-dodge")!)).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps both additions after loadCustomSkills, not just after the migration step", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: [...(STORE.skills as Skill[]), beforeShapeOf("stonesplitStrength-deflect-cancel")],
    }
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(seededStore))
    const loaded = loadCustomSkills()
    for (const id of DEFLECT_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      const variant = skill.hits[0]!.variants!.find(
        (entry) => entry.id === DRAWN_VARIANT_ID_BY_SKILL[id],
      )
      expect(variant, id).toEqual(EXPECTED_VARIANT_BY_SKILL[id])
    }
    const dodge = loaded.find((candidate) => candidate.id === "bamboocutDraught-perfect-dodge")!
    expect(hasDrawnGate(dodge)).toBe(true)
  })
})
