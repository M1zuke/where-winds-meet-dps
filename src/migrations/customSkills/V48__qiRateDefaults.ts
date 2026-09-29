// v47 → v48 — Blood Burst, Falcon's Pursuit, every Dragonquench - Inebriate
// combo stage and every Anxi soldier attack now carry their own Qi rate
// instead of the in-game default 1. A Skill Editor copy seeded before this
// still carries no `qiRate` at all. Only a hit still holding the coefficient
// shape it was seeded with is rewritten: once a value differs, a stale copy
// and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface CoefficientRow {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}

interface QiRateHeal {
  qiRate: number
  rows: readonly CoefficientRow[]
}

const QI_RATE_HEALS: Record<string, QiRateHeal> = {
  "bellstrikeUmbra-bleed-detonation": {
    qiRate: 0.2,
    rows: [{ physMultiplier: 2.4, attributeMultiplier: 3.6, physFixed: 0, attributeFixed: 0 }],
  },
  "bamboocutDraught-falcons-pursuit": {
    qiRate: 0.4,
    rows: [
      {
        physMultiplier: 0.487872,
        attributeMultiplier: 0.731808,
        physFixed: 0,
        attributeFixed: 0,
      },
    ],
  },
  "stonesplitStrength-anxisoldierheng": {
    qiRate: 0.3,
    rows: [{ physMultiplier: 0.35, attributeMultiplier: 0.525, physFixed: 0, attributeFixed: 0 }],
  },
  "stonesplitStrength-anxisoldierheng-stab": {
    qiRate: 0.3,
    rows: [{ physMultiplier: 0.35, attributeMultiplier: 0.525, physFixed: 0, attributeFixed: 0 }],
  },
  "stonesplitStrength-anxisoldiermojump": {
    qiRate: 0.3,
    rows: [{ physMultiplier: 0.9, attributeMultiplier: 1.35, physFixed: 0, attributeFixed: 0 }],
  },
  "stonesplitStrength-anxisoldiermodown": {
    qiRate: 0.3,
    rows: [{ physMultiplier: 0.5, attributeMultiplier: 0.75, physFixed: 0, attributeFixed: 0 }],
  },
  "stonesplitStrength-anxisoldiermosweep": {
    qiRate: 0.3,
    rows: [{ physMultiplier: 0.5, attributeMultiplier: 0.75, physFixed: 0, attributeFixed: 0 }],
  },
}

// Every Dragonquench - Inebriate combo (base, 2nd, 3rd) and their [cancel]
// twins share these stage shapes (the 4th and 5th stage are identical) — only
// their cast frames differ per combo.
const DRAGONQUENCH_STAGE_ROWS: readonly CoefficientRow[] = [
  { physMultiplier: 0.68814, attributeMultiplier: 1.03221, physFixed: 191, attributeFixed: 104 },
  { physMultiplier: 0.66144, attributeMultiplier: 0.99216, physFixed: 184, attributeFixed: 100 },
  { physMultiplier: 0.80698, attributeMultiplier: 1.21047, physFixed: 224, attributeFixed: 122 },
  {
    physMultiplier: 0.546408,
    attributeMultiplier: 0.819612,
    physFixed: 151.5,
    attributeFixed: 82.5,
  },
  {
    physMultiplier: 0.7285440000000001,
    attributeMultiplier: 1.092816,
    physFixed: 202,
    attributeFixed: 110,
  },
]

const DRAGONQUENCH_SKILL_IDS = [
  "bamboocutDraught-dragonquench-inebriate",
  "bamboocutDraught-dragonquench-inebriate-cancel",
  "bamboocutDraught-dragonquench-inebriate-second",
  "bamboocutDraught-dragonquench-inebriate-second-cancel",
  "bamboocutDraught-dragonquench-inebriate-third",
  "bamboocutDraught-dragonquench-inebriate-third-cancel",
]
for (const id of DRAGONQUENCH_SKILL_IDS)
  QI_RATE_HEALS[id] = { qiRate: 0.65, rows: DRAGONQUENCH_STAGE_ROWS }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

function coefficientsMatch(hit: Record<string, unknown>, row: CoefficientRow): boolean {
  return (
    hit.physMultiplier === row.physMultiplier &&
    hit.attributeMultiplier === row.attributeMultiplier &&
    hit.physFixed === row.physFixed &&
    hit.attributeFixed === row.attributeFixed
  )
}

function healHit(hit: unknown, heal: QiRateHeal): unknown {
  if (!isRecord(hit) || hit.qiRate !== undefined) return hit
  if (!heal.rows.some((row) => coefficientsMatch(hit, row))) return hit
  return { ...hit, qiRate: heal.qiRate }
}

export function healQiRateDefault(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const heal = QI_RATE_HEALS[skill.id]
  if (!heal || !Array.isArray(skill.hits)) return skill
  return { ...skill, hits: skill.hits.map((hit) => healHit(hit, heal)) }
}

export const V48__qiRateDefaults: CustomSkillMigration = {
  to: 48,
  name: "V48__qiRateDefaults",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healQiRateDefault) : blob.skills
    return { ...blob, v: 48, skills }
  },
}
