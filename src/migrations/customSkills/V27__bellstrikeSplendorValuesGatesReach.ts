// v26 → v27 — Bellstrike Splendor's in-game accuracy pass: level-100 flats
// across the sword and spear energy modules, the Energy Surge grant/consume
// triggers and cast gate, and the Shadow Step / SpearQ receives and grants
// corrections. A Skill Editor copy seeded before any of it still carries the
// old shape for that skill. Only a copy still identical to what was seeded is
// rewritten — once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface FieldSnapshot {
  receives?: unknown
  triggersBuffs?: unknown
  hits?: unknown
  castConditions?: unknown
}

const ENERGY_SURGE_RELEASE_TRIGGER = {
  kind: "applyBuff",
  targetId: "energySurgeGrant",
  stacks: 1,
  condition: null,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: "energySurgeGrant",
  durationFrames: 300,
  requiresParam: "swordMorph",
  requiresMinTier: 6,
}

const ENERGY_SURGE_CONSUME_TRIGGER = {
  kind: "applyBuff",
  targetId: "energySurgeGrant",
  stacks: -1,
  condition: null,
}

const ENERGY_SURGE_GRANT_HELD = { buffId: "energySurgeGrant", op: "gte", stacks: 1 }

const OLD: Record<string, FieldSnapshot> = {
  "bellstrikeSplendor-swordheavycharged": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 302,
        attributeFixed: 168,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 46,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 362,
        attributeFixed: 202,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 92,
        physMultiplier: 1.8292,
        attributeMultiplier: 2.7438,
        physFixed: 422,
        attributeFixed: 236,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-prepull": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.5674,
        attributeMultiplier: 2.3511,
        physFixed: 314.6666666666667,
        attributeFixed: 179,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 17,
        physMultiplier: 1.5674,
        attributeMultiplier: 2.3511,
        physFixed: 314.6666666666667,
        attributeFixed: 179,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 34,
        physMultiplier: 1.5674,
        attributeMultiplier: 2.3511,
        physFixed: 314.6666666666667,
        attributeFixed: 179,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-2-hit": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 302,
        attributeFixed: 168,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 58,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 362,
        attributeFixed: 202,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-energysurge": {
    castConditions: undefined,
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 302,
        attributeFixed: 168,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-1",
        frame: 17,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 362,
        attributeFixed: 202,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 34,
        physMultiplier: 1.8292,
        attributeMultiplier: 2.7438,
        physFixed: 422,
        attributeFixed: 236,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordq": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.0253,
        attributeMultiplier: 1.538,
        physFixed: 179,
        attributeFixed: 103,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordq-2nd": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.0253,
        attributeMultiplier: 1.538,
        physFixed: 179,
        attributeFixed: 103,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial": {
    receives: ["namelessSwordAdditionalAttack"],
    triggersBuffs: undefined,
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 409,
        attributeFixed: 228,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial-2nd": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 356,
        attributeFixed: 202,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial-deflect": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 409,
        attributeFixed: 228,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-spearq": {
    triggersBuffs: ["jadeware", "endlessGale", "mountainsMight", "qiImbalance"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.5732,
        attributeMultiplier: 0.8598,
        physFixed: 133,
        attributeFixed: 74,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-spearq-prepull": {
    triggersBuffs: ["jadeware", "endlessGale", "mountainsMight", "qiImbalance"],
  },
  "bellstrikeSplendor-spearq-0-hit-cancel": {
    triggersBuffs: ["jadeware", "endlessGale", "mountainsMight", "qiImbalance"],
  },
}

const NEW: Record<string, FieldSnapshot> = {
  "bellstrikeSplendor-swordheavycharged": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 361.6,
        attributeFixed: 197.2,
        extraCritDamage: 0,
        triggers: [ENERGY_SURGE_RELEASE_TRIGGER],
      },
      {
        id: "hit-1",
        frame: 46,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 433.92,
        attributeFixed: 236.64,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 92,
        physMultiplier: 1.8292,
        attributeMultiplier: 2.7438,
        physFixed: 506.24,
        attributeFixed: 276.08,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-prepull": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 361.6,
        attributeFixed: 197.2,
        extraCritDamage: 0,
        triggers: [ENERGY_SURGE_RELEASE_TRIGGER],
      },
      {
        id: "hit-1",
        frame: 17,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 433.92,
        attributeFixed: 236.64,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 34,
        physMultiplier: 1.8292,
        attributeMultiplier: 2.7438,
        physFixed: 506.24,
        attributeFixed: 276.08,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-2-hit": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 361.6,
        attributeFixed: 197.2,
        extraCritDamage: 0,
        triggers: [ENERGY_SURGE_RELEASE_TRIGGER],
      },
      {
        id: "hit-1",
        frame: 58,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 433.92,
        attributeFixed: 236.64,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-energysurge": {
    castConditions: [ENERGY_SURGE_GRANT_HELD],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 361.6,
        attributeFixed: 197.2,
        extraCritDamage: 0,
        triggers: [ENERGY_SURGE_CONSUME_TRIGGER, ENERGY_SURGE_RELEASE_TRIGGER],
      },
      {
        id: "hit-1",
        frame: 17,
        physMultiplier: 1.5679,
        attributeMultiplier: 2.3518,
        physFixed: 433.92,
        attributeFixed: 236.64,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 34,
        physMultiplier: 1.8292,
        attributeMultiplier: 2.7438,
        physFixed: 506.24,
        attributeFixed: 276.08,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordq": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.0253,
        attributeMultiplier: 1.538,
        physFixed: 283.6,
        attributeFixed: 154.6,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordq-2nd": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.0253,
        attributeMultiplier: 1.538,
        physFixed: 283.6,
        attributeFixed: 154.6,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial": {
    receives: [
      "swordSlashDamageBoost",
      "swordEnergyEnhancement",
      "swordEnergyHpDamage",
      "namelessSwordAdditionalAttack",
    ],
    triggersBuffs: ["swordSlashDamageBoost"],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 490,
        attributeFixed: 267,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial-2nd": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 490,
        attributeFixed: 267,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-swordspecial-deflect": {
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.767,
        attributeMultiplier: 2.6505,
        physFixed: 490,
        attributeFixed: 267,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-spearq": {
    triggersBuffs: [
      "jadeware",
      "endlessGale",
      "endlessGaleAtStart",
      "mountainsMight",
      "qiImbalance",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.5732,
        attributeMultiplier: 0.8598,
        physFixed: 160,
        attributeFixed: 87,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "bellstrikeSplendor-spearq-prepull": {
    triggersBuffs: ["jadeware", "endlessGale", "endlessGaleAtStart", "mountainsMight"],
  },
  "bellstrikeSplendor-spearq-0-hit-cancel": {
    triggersBuffs: ["jadeware", "endlessGale", "endlessGaleAtStart", "mountainsMight"],
  },
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((item, index) => deepEqual(item, right[index]))
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord)
    const rightKeys = Object.keys(rightRecord)
    if (leftKeys.length !== rightKeys.length) return false
    return leftKeys.every(
      (key) => key in rightRecord && deepEqual(leftRecord[key], rightRecord[key]),
    )
  }
  return false
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNAPSHOT_KEYS: (keyof FieldSnapshot)[] = [
  "receives",
  "triggersBuffs",
  "hits",
  "castConditions",
]

export function healBellstrikeSplendorValuesGatesReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const oldSnapshot = OLD[skill.id]
  const newSnapshot = NEW[skill.id]
  if (!oldSnapshot || !newSnapshot) return skill
  const oldKeys = SNAPSHOT_KEYS.filter((key) => key in oldSnapshot)
  if (!oldKeys.every((key) => deepEqual(skill[key], oldSnapshot[key]))) return skill
  const healed = { ...skill }
  for (const key of oldKeys) {
    if (key in newSnapshot) healed[key] = newSnapshot[key]
    else delete healed[key]
  }
  return healed
}

export const V27__bellstrikeSplendorValuesGatesReach: CustomSkillMigration = {
  to: 27,
  name: "V27__bellstrikeSplendorValuesGatesReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healBellstrikeSplendorValuesGatesReach)
      : blob.skills
    return { ...blob, v: 27, skills }
  },
}
