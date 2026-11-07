// v77 → v78 — Zenith Sword shows under its in-game name (was Crosswind Blade),
// Hidden Sword's third light attack lands its second hit on frame 20 (was 21),
// Fleeting Trace casts 124 f (was 125) and applies Dread on its second last hit
// too, the Primepick follow-up casts 36 f (was 102), and Castlink and
// Grounddrift grant their Binge Points on the animation's own frame (35 or 82,
// and 93) instead of on a collider hit. A Skill Editor copy seeded before this
// still carries the old values. Only a value still identical to what was
// seeded is rewritten: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const BINGE_ACCUMULATION_ID = "buff-bamboocutDraught-skill-binge-point-accumulation"
const BINGE_POINTS_ID = "buff-bamboocutDraught-binge-points"
const CAROUSE_ID = "buff-bamboocutDraught-carouse"
const CONSECUTIVE_PUNCHES_ID = "buff-bamboocutDraught-consecutive-punches"
const CASTLINK_COOLDOWN_ID = "buff-bamboocutDraught-castlink-cooldown"
const DREAD_ID = "buff-stonesplitStrength-dread"

const RENAMES: Readonly<Record<string, { from: string; to: string }>> = {
  "bellstrikeUmbra-crosswind-blade": { from: "Crosswind Blade", to: "Zenith Sword" },
  "bellstrikeUmbra-crosswind-blade-cancel": {
    from: "Crosswind Blade [cancel]",
    to: "Zenith Sword [cancel]",
  },
}

const bingeGrantTriggers = (): RecordValue[] => [
  { kind: "applyBuff", targetId: BINGE_ACCUMULATION_ID, stacks: 25, condition: null },
  {
    kind: "applyBuff",
    targetId: BINGE_ACCUMULATION_ID,
    stacks: 25,
    condition: null,
    conditions: [{ buffId: CAROUSE_ID, op: "gte", stacks: 1 }],
  },
]

const bingeGrantHit = (id: string, frame: number, conditions: RecordValue[]): RecordValue => ({
  id,
  frame,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  extraCritDamage: 0,
  triggers: bingeGrantTriggers(),
  ...(conditions.length > 0 ? { conditions } : {}),
})

const grantsOnlyBinge = (hit: unknown): boolean =>
  isRecord(hit) &&
  Array.isArray(hit.triggers) &&
  hit.triggers.length === 2 &&
  hit.triggers.every((trigger) => isRecord(trigger) && trigger.targetId === BINGE_ACCUMULATION_ID)

const withoutTriggers = (hit: unknown): unknown => (isRecord(hit) ? { ...hit, triggers: [] } : hit)

const consecutivePunches = { buffId: CONSECUTIVE_PUNCHES_ID, op: "gte", stacks: 1 }
const castlinkCooldownClear = { buffId: CASTLINK_COOLDOWN_ID, op: "eq", stacks: 0 }

function healCastlink(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 4 || !grantsOnlyBinge(hits[1]) || !grantsOnlyBinge(hits[3])) return skill
  return {
    ...skill,
    hits: [
      hits[0],
      withoutTriggers(hits[1]),
      hits[2],
      withoutTriggers(hits[3]),
      bingeGrantHit("hit-4", 35, [
        { buffId: BINGE_POINTS_ID, op: "lt", stacks: 100 },
        consecutivePunches,
        castlinkCooldownClear,
      ]),
      bingeGrantHit("hit-5", 82, [
        { buffId: BINGE_POINTS_ID, op: "gte", stacks: 100 },
        consecutivePunches,
        castlinkCooldownClear,
      ]),
    ],
  }
}

function healGrounddrift(skill: RecordValue, hits: unknown[]): RecordValue {
  if (hits.length !== 4 || !grantsOnlyBinge(hits[3])) return skill
  return {
    ...skill,
    hits: [...hits.slice(0, 3), withoutTriggers(hits[3]), bingeGrantHit("hit-4", 93, [])],
  }
}

function healFleetingTrace(skill: RecordValue, hits: unknown[]): RecordValue {
  const healed: RecordValue = {
    ...skill,
    castFrames: skill.castFrames === 125 ? 124 : skill.castFrames,
  }
  const finalHit = hits[8]
  const dreadApplication =
    isRecord(finalHit) && Array.isArray(finalHit.triggers)
      ? finalHit.triggers.find((trigger) => isRecord(trigger) && trigger.targetId === DREAD_ID)
      : undefined
  const secondLast = hits[7]
  if (
    hits.length === 9 &&
    dreadApplication !== undefined &&
    isRecord(secondLast) &&
    Array.isArray(secondLast.triggers) &&
    secondLast.triggers.length === 0
  ) {
    healed.hits = hits.map((hit, index) =>
      index === 7 && isRecord(hit) ? { ...hit, triggers: [dreadApplication] } : hit,
    )
  }
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const rename = RENAMES[skill.id]
  if (rename) return skill.name === rename.from ? { ...skill, name: rename.to } : skill
  if (!Array.isArray(skill.hits)) return skill
  const hits = skill.hits as unknown[]
  switch (skill.id) {
    case "silkbindJade-hidden-sword-light-3":
      return {
        ...skill,
        hits: hits.map((hit, index) =>
          index === 1 && isRecord(hit) && hit.frame === 21 ? { ...hit, frame: 20 } : hit,
        ),
      }
    case "stonesplitStrength-snowpartingspecial":
      return healFleetingTrace(skill, hits)
    case "bamboocutDraught-nightwick-primepick-follow-up":
      return { ...skill, castFrames: skill.castFrames === 102 ? 36 : skill.castFrames }
    case "bamboocutDraught-castlink":
      return healCastlink(skill, hits)
    case "bamboocutDraught-nightwick-grounddrift":
      return healGrounddrift(skill, hits)
    default:
      return skill
  }
}

export const V78__reviewedTimingsGrantsAndNames: CustomSkillMigration = {
  to: 78,
  name: "V78__reviewedTimingsGrantsAndNames",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 78, skills }
  },
}
