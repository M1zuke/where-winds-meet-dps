// v28 → v29 — SpearQ / SpearQ 5-Hit Cancel's River Flow ladder no longer
// grants a "Wolfchaser's Art Slotted" marker buff to gate Water Drop's and
// Spring Surge's inner-way extension: the extend triggers read the build
// param directly. A Skill Editor copy seeded under V24's shape still carries
// the marker grant and the marker-conditioned extends.
//
// Trigger arrays have no editable field in the Skill Editor, so a saved one
// is always the seeded one and is healed unconditionally once it still
// matches what V24 produced.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const WOLFCHASERS_ART_SLOTTED_ID = "buff-bellstrikeUmbra-wolfchasers-art-slotted"
const WATER_DROP_ID = "buff-bellstrikeUmbra-water-drop"
const SPRING_SURGE_ID = "buff-bellstrikeUmbra-spring-surge"
const RIVER_FLOW_ID = "potentRiverFlow"
const EMPOWERED_ID = "buff-bellstrikeUmbra-empowered-river-flow"
const BLEED_TICK_DEBUFF_ID = "debuff-bellstrikeUmbra-bleed-tick"
const WOLFCHASERS_ART_PARAM = "wolfchasersArt"
const RIVER_FLOW_MIN_BLEEDING_STACKS = 1
const RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES = 180

function riverFlowTierTriggers(empoweredStacks: number): unknown[] {
  return [
    {
      kind: "applyBuff",
      targetId: WATER_DROP_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: WATER_DROP_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
      requiresParam: WOLFCHASERS_ART_PARAM,
      extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
      extendOnly: true,
    },
    {
      kind: "applyBuff",
      targetId: SPRING_SURGE_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: SPRING_SURGE_ID,
      stacks: 1,
      condition: null,
      appliesOnCastEnd: true,
      requiresParam: WOLFCHASERS_ART_PARAM,
      extendFrames: RIVER_FLOW_WOLFCHASERS_ART_EXTEND_FRAMES,
      extendOnly: true,
    },
    {
      kind: "applyBuff",
      targetId: RIVER_FLOW_ID,
      stacks: 1,
      condition: {
        buffId: BLEED_TICK_DEBUFF_ID,
        op: "gte",
        stacks: RIVER_FLOW_MIN_BLEEDING_STACKS,
      },
      appliesOnCastEnd: true,
    },
    {
      kind: "applyBuff",
      targetId: EMPOWERED_ID,
      stacks: 1,
      condition: { buffId: BLEED_TICK_DEBUFF_ID, op: "gte", stacks: empoweredStacks },
      appliesOnCastEnd: true,
    },
  ]
}

function matchesV24Shape(triggers: unknown): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.length === 7 &&
    isRecord(triggers[0]) &&
    triggers[0].kind === "applyBuff" &&
    triggers[0].targetId === WOLFCHASERS_ART_SLOTTED_ID
  )
}

function healRiverFlowTierHit(hit: unknown, empoweredStacks: number): unknown {
  if (!isRecord(hit) || !matchesV24Shape(hit.triggers)) return hit
  return { ...hit, triggers: riverFlowTierTriggers(empoweredStacks) }
}

export function healSpearqExtendParam(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 6) return hits
  return hits.map((hit, index) => (index === 4 ? healRiverFlowTierHit(hit, 1) : hit))
}

export function healSpearq5HitCancelExtendParam(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 5) return hits
  return hits.map((hit, index) => (index === 4 ? healRiverFlowTierHit(hit, 4) : hit))
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id === "bellstrikeUmbra-spearq" && Array.isArray(skill.hits)) {
    return { ...skill, hits: healSpearqExtendParam(skill.hits) }
  }
  if (skill.id === "bellstrikeUmbra-spearq-5-hit-cancel" && Array.isArray(skill.hits)) {
    return { ...skill, hits: healSpearq5HitCancelExtendParam(skill.hits) }
  }
  return skill
}

export const V29__soberSorrowExtendUsesParam: CustomSkillMigration = {
  to: 29,
  name: "V29__soberSorrowExtendUsesParam",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 29, skills }
  },
}
