// v60 → v61 — Boundvessel's hold is 11 rapid slashes (it was 8, at 36 – 92)
// with its second finisher on frame 161 (was 160) and its Endurance drain from
// frame 40 (was 36); Spring Away's 6 bullets follow the lift and hover at
// frames 58 – 108 (they were 0 – 50, with the lift on the third bullet) and
// drain Endurance; Toad[Cancel]'s flip lands on frame 40 (was 39); and every
// perfect dodge gains the Ghostly Steps - Umbra afterimage trigger. A Skill
// Editor copy seeded before this still carries the old shape. Only a value
// still identical to what was seeded is rewritten: once it differs, a stale
// copy and a deliberate edit are indistinguishable. The afterimage trigger is
// only added, never replaced.
import { matchesRow, withRow, type HitRow } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const TOAD_CANCEL_SUFFIX = "-toad-cancel"
const TOAD_FLIP_ROW: HitRow = [0.54063, 0.810945, 81.23, 0]

const BOUNDVESSEL_ID = "bamboocutDraught-boundvessel"
const RAPID_SLASH_ROW: HitRow = [0.158668, 0.238001, 43.953, 23.933]
const OLD_RAPID_SLASH_FRAMES = [36, 44, 52, 60, 68, 76, 84, 92]
const NEW_RAPID_SLASH_FRAMES = [47, 56, 65, 74, 83, 91, 100, 109, 118, 127, 135]
const OLD_FINISHER_FRAME = 160
const NEW_FINISHER_FRAME = 161

const SPRING_AWAY_ID = "silkbindJade-umblightcharge"
const SPRING_AWAY_LIFT_ID = "silkbindJade-umblightcharge-lift"
const OLD_SPRING_AWAY_BULLET_ROW: HitRow = [1.7173 / 6, 2.576 / 6, (79.16 * 6) / 6, (43.16 * 6) / 6]
const NEW_SPRING_AWAY_BULLET_ROW: HitRow = [0.286244, 0.429367, 79.16, 43.16]
const OLD_SPRING_AWAY_FRAMES = [0, 10, 20, 30, 40, 50]
const NEW_SPRING_AWAY_FRAMES = [58, 68, 78, 88, 98, 108]
const OLD_SPRING_AWAY_CAST_FRAMES = 147
const NEW_SPRING_AWAY_CAST_FRAMES = 140
const OLD_LIFT_HIT_INDEX = 2

const PERFECT_DODGE_ID = /^[A-Za-z]+-perfect-dodge(-full)?$/
const AFTERIMAGE_DEBUFF_ID = "debuff-mystic-ghostly-afterimage"
const AFTERIMAGE_TRIGGER = {
  kind: "applyDebuff",
  targetId: AFTERIMAGE_DEBUFF_ID,
  stacks: 1,
  condition: null,
  conditions: [{ buffId: "ghostlyStepsUmbra", op: "gte", stacks: 1 }],
}

const hasHit = (hit: unknown, frame: number, row: HitRow): hit is RecordValue =>
  isRecord(hit) && hit.frame === frame && matchesRow(hit, row)

function healToadCancel(skill: RecordValue): unknown {
  const hits = skill.hits
  if (!Array.isArray(hits) || !hasHit(hits[0], 39, TOAD_FLIP_ROW)) return skill
  return { ...skill, hits: [{ ...hits[0], frame: 40 }, ...hits.slice(1)] }
}

function healBoundvesselSlashes(hits: unknown[]): unknown[] {
  const slashes = OLD_RAPID_SLASH_FRAMES.map((_oldFrame, index) =>
    hits.find((hit) => isRecord(hit) && hit.id === `hit-${index + 1}`),
  )
  const unedited = slashes.every((hit, index) =>
    hasHit(hit, OLD_RAPID_SLASH_FRAMES[index]!, RAPID_SLASH_ROW),
  )
  const alreadyHasMore = hits.some(
    (hit) => isRecord(hit) && ["hit-9", "hit-10", "hit-11"].includes(hit.id as string),
  )
  if (!unedited || alreadyHasMore) return hits
  const lastSlash = slashes[slashes.length - 1] as RecordValue
  const healed: unknown[] = []
  for (const hit of hits) {
    if (!isRecord(hit)) {
      healed.push(hit)
      continue
    }
    const slashNumber = /^hit-([1-8])$/.exec(hit.id as string)?.[1]
    healed.push(
      slashNumber ? { ...hit, frame: NEW_RAPID_SLASH_FRAMES[Number(slashNumber) - 1] } : hit,
    )
    if (hit === lastSlash) {
      for (const extra of [9, 10, 11]) {
        healed.push({
          ...clone(lastSlash),
          id: `hit-${extra}`,
          frame: NEW_RAPID_SLASH_FRAMES[extra - 1],
        })
      }
    }
  }
  return healed
}

function healBoundvessel(skill: RecordValue): unknown {
  if (!Array.isArray(skill.hits)) return skill
  const slashed = healBoundvesselSlashes(skill.hits).map((hit) =>
    isRecord(hit) && hit.id === "hit-13" && hit.frame === OLD_FINISHER_FRAME
      ? { ...hit, frame: NEW_FINISHER_FRAME }
      : hit,
  )
  const drains = skill.meterDrains
  const healedDrains =
    Array.isArray(drains) &&
    drains.length === 1 &&
    isRecord(drains[0]) &&
    drains[0].meterId === "endurance" &&
    drains[0].perSecond === 15 &&
    drains[0].fromFrame === 36 &&
    drains[0].stopAfterSec === 1.6
      ? [{ ...drains[0], fromFrame: 40 }]
      : drains
  return {
    ...skill,
    hits: slashed,
    ...(healedDrains === undefined ? {} : { meterDrains: healedDrains }),
  }
}

function healSpringAway(skill: RecordValue): unknown {
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== OLD_SPRING_AWAY_FRAMES.length) return skill
  if (skill.castFrames !== OLD_SPRING_AWAY_CAST_FRAMES || skill.meterDrains !== undefined) {
    return skill
  }
  const unedited = hits.every((hit, index) =>
    hasHit(hit, OLD_SPRING_AWAY_FRAMES[index]!, OLD_SPRING_AWAY_BULLET_ROW),
  )
  if (!unedited) return skill
  const liftTriggers = (hits[OLD_LIFT_HIT_INDEX] as RecordValue).triggers
  const liftsOnThirdBullet =
    Array.isArray(liftTriggers) &&
    liftTriggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "castSkill" &&
        trigger.targetId === SPRING_AWAY_LIFT_ID,
    )
  if (!liftsOnThirdBullet) return skill
  const firstBulletTriggers = (hits[0] as RecordValue).triggers
  const retimedHits = hits.map((hit, index) => ({
    ...withRow(hit as RecordValue, NEW_SPRING_AWAY_BULLET_ROW),
    frame: NEW_SPRING_AWAY_FRAMES[index],
    ...(index === 0 ? { triggers: liftTriggers } : {}),
    ...(index === OLD_LIFT_HIT_INDEX ? { triggers: firstBulletTriggers } : {}),
  }))
  return {
    ...skill,
    castFrames: NEW_SPRING_AWAY_CAST_FRAMES,
    hits: retimedHits,
    meterDrains: [{ meterId: "endurance", perSecond: 10, fromFrame: 44, stopAfterSec: 1 }],
  }
}

function addAfterimageTrigger(skill: RecordValue): unknown {
  if (!Array.isArray(skill.hits) || !isRecord(skill.hits[0])) return skill
  const firstHit = skill.hits[0]
  const triggers = Array.isArray(firstHit.triggers) ? firstHit.triggers : []
  const present = triggers.some(
    (trigger) => isRecord(trigger) && trigger.targetId === AFTERIMAGE_DEBUFF_ID,
  )
  if (present) return skill
  return {
    ...skill,
    hits: [
      { ...firstHit, triggers: [...triggers, clone(AFTERIMAGE_TRIGGER)] },
      ...skill.hits.slice(1),
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (skill.id.endsWith(TOAD_CANCEL_SUFFIX)) return healToadCancel(skill)
  if (skill.id === BOUNDVESSEL_ID) return healBoundvessel(skill)
  if (skill.id === SPRING_AWAY_ID) return healSpringAway(skill)
  if (PERFECT_DODGE_ID.test(skill.id)) return addAfterimageTrigger(skill)
  return skill
}

export const V61__boundvesselSpringAwayToadAfterimageTiming: CustomSkillMigration = {
  to: 61,
  name: "V61__boundvesselSpringAwayToadAfterimageTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 61, skills }
  },
}
