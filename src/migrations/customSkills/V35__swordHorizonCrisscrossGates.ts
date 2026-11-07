// v34 → v35 — Sword Horizon's Crisscross follow-ups (Inner Track, Inner
// Balance III, Second Track) are now castable only with Sword Horizon
// slotted, and the forms that feed into them (Sword Martial QQ, SwordSpecial
// 3-/4-Hit) carry a Sword-Horizon-conditioned cast-length variant for the cut
// animation. A Skill Editor copy seeded before this still casts unconditionally
// and at the uncut length.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SWORD_HORIZON_CONDITION = { param: "swordHorizon" }

const AVAILABILITY_GATED_IDS = new Set([
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
])

interface CutLengthSpec {
  localId: string
  frame: number
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
  castFrames: number
}

const CUT_LENGTH_BY_ID: Record<string, CutLengthSpec> = {
  "bellstrikeUmbra-swordqfollowup": {
    localId: "swordqfollowup",
    frame: 5,
    physMultiplier: 0.544068,
    attributeMultiplier: 0.816102,
    physFixed: 150.6,
    attributeFixed: 82,
    castFrames: 61,
  },
  "bellstrikeUmbra-swordspecial-3-hit": {
    localId: "swordspecial-3-hit",
    frame: 29,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    castFrames: 64,
  },
  "bellstrikeUmbra-swordspecial-4-hit": {
    localId: "swordspecial-4-hit",
    frame: 29,
    physMultiplier: 0.196354,
    attributeMultiplier: 0.294531,
    physFixed: 54.4,
    attributeFixed: 29.6,
    castFrames: 77,
  },
}

function addAvailabilityCondition(skill: Record<string, unknown>): unknown {
  if (skill.castConditions !== undefined) return skill
  return { ...skill, castConditions: [SWORD_HORIZON_CONDITION] }
}

function addCutLengthVariant(skill: Record<string, unknown>, spec: CutLengthSpec): unknown {
  if (!Array.isArray(skill.hits) || skill.hits.length === 0) return skill
  const [hit0, ...restHits] = skill.hits as Record<string, unknown>[]
  if (!isRecord(hit0) || hit0.variants !== undefined) return skill
  if (
    hit0.frame !== spec.frame ||
    hit0.physMultiplier !== spec.physMultiplier ||
    hit0.attributeMultiplier !== spec.attributeMultiplier ||
    hit0.physFixed !== spec.physFixed ||
    hit0.attributeFixed !== spec.attributeFixed
  )
    return skill
  return {
    ...skill,
    hits: [
      {
        ...hit0,
        variants: [
          {
            id: `hv-${spec.localId}-hit-0-sword-horizon`,
            label: "Sword Horizon",
            conditions: [SWORD_HORIZON_CONDITION],
            physMultiplier: spec.physMultiplier,
            attributeMultiplier: spec.attributeMultiplier,
            physFixed: spec.physFixed,
            attributeFixed: spec.attributeFixed,
            castFrames: spec.castFrames,
          },
        ],
      },
      ...restHits,
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (AVAILABILITY_GATED_IDS.has(skill.id)) return addAvailabilityCondition(skill)
  const cutLength = CUT_LENGTH_BY_ID[skill.id]
  if (cutLength) return addCutLengthVariant(skill, cutLength)
  return skill
}

export const V35__swordHorizonCrisscrossGates: CustomSkillMigration = {
  to: 35,
  name: "V35__swordHorizonCrisscrossGates",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 35, skills }
  },
}
