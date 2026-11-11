// v116 → v117 — the umbrella talent's penetration reaches every trajectory hit
// of both weapons: Forsaken Fame, the fan dual-weapon skill and the fan light
// attacks, whose first stage lands as a bullet at maximum distance (80 m/s,
// launched at 31.8 frames); the two Umbrella - Dash collider hits carry none of
// it, so the dash is split into its colliders and a bullet skill. A Skill
// Editor copy seeded before this carries the old reach lists and hits. Each
// part is rewritten only while it still equals what was seeded: once it
// differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, entry) =>
    isRecord(entry)
      ? Object.fromEntries(
          Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)),
        )
      : entry,
  )

const sameValue = (left: unknown, right: unknown): boolean => canonical(left) === canonical(right)

const sameSet = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) && sameValue([...value].sort(), [...expected].sort())

const FAN_RECEIVES = ["inkwellFanAdditionalAttack"]
const UMBRELLA_RECEIVES = ["vernalUmbrellaAdditionalAttack"]
const LIGHT_RECEIVES = ["thunderousBloom", "springThunder", "mistwillowHeavyBuff", "mistwillowBuff"]

const STAGE_ONE_BULLET = {
  frame: 31.8,
  projectile: { speedMetersPerSecond: 80, maxTravelFrames: 12 },
}

const withReceives = (
  skill: Record<string, unknown>,
  before: readonly string[],
  added: readonly string[],
): Record<string, unknown> =>
  sameSet(skill.receives, before) ? { ...skill, receives: [...before, ...added] } : skill

const withStageOneBullet = (skill: Record<string, unknown>): Record<string, unknown> => {
  if (!Array.isArray(skill.hits) || !isRecord(skill.hits[0])) return skill
  const [first, ...rest] = skill.hits
  if (first.frame !== 28 || first.projectile !== undefined) return skill
  return { ...skill, hits: [{ ...first, ...STAGE_ONE_BULLET }, ...rest] }
}

const DASH_COLLIDER_ROW = {
  physMultiplier: 0.439065,
  attributeMultiplier: 0.658598,
  physFixed: 122,
  attributeFixed: 66.5,
  extraCritDamage: 0,
}
const DASH_SEEDED_HITS = [
  { id: "hit-0", frame: 17, ...DASH_COLLIDER_ROW, triggers: [] },
  { id: "hit-1", frame: 51, ...DASH_COLLIDER_ROW, triggers: [] },
  {
    id: "hit-2",
    frame: 51,
    physMultiplier: 0.304656,
    attributeMultiplier: 0.456984,
    physFixed: 84.4,
    attributeFixed: 46,
    extraCritDamage: 1,
    triggers: [],
    projectile: { speedMetersPerSecond: 30, maxTravelFrames: 120 },
  },
]
const DASH_HEALED_HITS = [
  DASH_SEEDED_HITS[0],
  {
    ...DASH_SEEDED_HITS[1],
    triggers: [
      {
        kind: "castSkill",
        targetId: "silkbindJade-umbrella-dash-bullet",
        stacks: 1,
        condition: null,
      },
    ],
  },
]
const DASH_SEEDED_RECEIVES = ["windWall", "trajectorySkill", "combo", ...UMBRELLA_RECEIVES]

const healDash = (skill: Record<string, unknown>): Record<string, unknown> =>
  sameSet(skill.receives, DASH_SEEDED_RECEIVES) && sameValue(skill.hits, DASH_SEEDED_HITS)
    ? {
        ...skill,
        receives: [...UMBRELLA_RECEIVES],
        hits: DASH_HEALED_HITS.map((hit) => ({ ...hit })),
      }
    : skill

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill)) return skill
  switch (skill.id) {
    case "silkbindJade-fanlightcharged":
      return withReceives(
        skill,
        [
          "windWall",
          "pursuitChargedBoost",
          ...LIGHT_RECEIVES,
          "nonPlayerBaseDamage145",
          ...FAN_RECEIVES,
        ],
        ["trajectorySkill"],
      )
    case "silkbindJade-fan-dual":
      return withReceives(skill, ["windWall", ...FAN_RECEIVES], ["trajectorySkill"])
    case "silkbindJade-fan-light":
      return withStageOneBullet(
        withReceives(skill, [...LIGHT_RECEIVES, ...FAN_RECEIVES], ["windWall", "trajectorySkill"]),
      )
    case "silkbindJade-fan-light-chain":
      return withStageOneBullet(
        withReceives(skill, ["windWall", ...LIGHT_RECEIVES, ...FAN_RECEIVES], ["trajectorySkill"]),
      )
    case "silkbindJade-umbrella-dash":
      return healDash(skill)
    default:
      return skill
  }
}

export const V117__jadeTrajectoryHitsReach: CustomSkillMigration = {
  to: 117,
  name: "V117__jadeTrajectoryHitsReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 117, skills }
  },
}
