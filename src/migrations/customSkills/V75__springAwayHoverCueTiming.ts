// v74 → v75 — Spring Away's bullets spawn on the hover's own cues (47.4 – 156.6
// f, they were 58 – 165) and fly as accelerating projectiles that land after
// their travel time at the live target distance; the cast ends 35.45 f after
// the cue of its last bullet (132.05 / 192.05 f, it was 140 / 200) and the
// hover drain starts at frame 44.4 and stops with that cue (0.87 / 1.87 s, it
// was 1 / 2 s). A Skill Editor copy seeded before this still carries the old
// values. Each part is rewritten only while it still equals what was seeded:
// once it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SPRING_AWAY_VARIANTS: readonly {
  skillId: string
  bulletCount: number
  seededCastFrames: number
  castFrames: number
  seededHoverSeconds: number
  hoverSeconds: number
}[] = [
  {
    skillId: "silkbindJade-umblightcharge",
    bulletCount: 6,
    seededCastFrames: 140,
    castFrames: 132.05,
    seededHoverSeconds: 1,
    hoverSeconds: 0.87,
  },
  {
    skillId: "silkbindJade-umblightcharge-12",
    bulletCount: 12,
    seededCastFrames: 200,
    castFrames: 192.05,
    seededHoverSeconds: 2,
    hoverSeconds: 1.87,
  },
]
const SEEDED_FRAMES: readonly number[] = [58, 66, 77, 87, 98, 107, 117, 126, 136, 146, 156, 165]
const CUE_FRAMES: readonly number[] = [
  47.4, 57, 66.6, 77.4, 87, 96.6, 107.4, 117, 126.6, 137.4, 147, 156.6,
]
const SEEDED_DRAIN_FROM_FRAME = 44
const DRAIN_FROM_FRAME = 44.4
const BULLET_PROJECTILE = {
  speedMetersPerSecond: 80,
  acceleration: { initialSpeedMetersPerSecond: 10, metersPerSecondSquared: 700 },
  collisionDelayFrames: 2.4,
  maxTravelFrames: 300,
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

function withCueHits(skill: RecordValue, bulletCount: number): RecordValue {
  const { hits } = skill
  if (!Array.isArray(hits) || hits.length !== bulletCount) return skill
  const seeded = hits.every(
    (hit, index) =>
      isRecord(hit) && hit.frame === SEEDED_FRAMES[index] && hit.projectile === undefined,
  )
  if (!seeded) return skill
  return {
    ...skill,
    hits: hits.map((hit, index) => ({
      ...(hit as RecordValue),
      frame: CUE_FRAMES[index],
      projectile: BULLET_PROJECTILE,
    })),
  }
}

function withCastFrames(skill: RecordValue, seeded: number, healed: number): RecordValue {
  return skill.castFrames === seeded ? { ...skill, castFrames: healed } : skill
}

function withHoverDrain(skill: RecordValue, seeded: number, healed: number): RecordValue {
  const { meterDrains } = skill
  if (!Array.isArray(meterDrains) || meterDrains.length !== 1) return skill
  const [drain] = meterDrains
  const isSeeded =
    isRecord(drain) &&
    drain.meterId === "endurance" &&
    drain.perSecond === 10 &&
    drain.fromFrame === SEEDED_DRAIN_FROM_FRAME &&
    drain.stopAfterSec === seeded
  return isSeeded
    ? { ...skill, meterDrains: [{ ...drain, fromFrame: DRAIN_FROM_FRAME, stopAfterSec: healed }] }
    : skill
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const variant = SPRING_AWAY_VARIANTS.find((candidate) => candidate.skillId === skill.id)
  if (!variant) return skill
  return withHoverDrain(
    withCastFrames(
      withCueHits(skill, variant.bulletCount),
      variant.seededCastFrames,
      variant.castFrames,
    ),
    variant.seededHoverSeconds,
    variant.hoverSeconds,
  )
}

export const V75__springAwayHoverCueTiming: CustomSkillMigration = {
  to: 75,
  name: "V75__springAwayHoverCueTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 75, skills }
  },
}
