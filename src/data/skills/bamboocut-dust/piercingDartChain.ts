import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import type { Skill, SkillHit, TriggerCondition } from "../../../engine/skill"
import {
  tokensOfGratitudeCost,
  tokensOfGratitudeMeter,
  tokensOfGratitudeRequires,
} from "../../classes/bamboocut-dust/meters"
import { BUFF } from "../buffs/ids"
import { ATTACK, ATTUNE, PROP, WEAPON } from "../ids"
import { STATUS } from "./ids"
import { PIERCING_DART_RECEIVES } from "./receives"
import { piercingDartSweepTriggers } from "./soulbreakTriggers"

interface SweepCoefficients {
  physMultiplier: number
  attributeMultiplier: number
  physFixed: number
  attributeFixed: number
}

// In-game values as of 2026-10-13.
const SWEEP_COEFFICIENTS: readonly SweepCoefficients[] = [
  {
    physMultiplier: 0.334122,
    attributeMultiplier: 0.501183,
    physFixed: 92.7,
    attributeFixed: 50.4,
  },
  {
    physMultiplier: 0.334122,
    attributeMultiplier: 0.501183,
    physFixed: 92.7,
    attributeFixed: 50.4,
  },
  {
    physMultiplier: 0.445496,
    attributeMultiplier: 0.668244,
    physFixed: 123.6,
    attributeFixed: 67.2,
  },
  {
    physMultiplier: 0.313564,
    attributeMultiplier: 0.470346,
    physFixed: 87.2,
    attributeFixed: 47.6,
  },
  {
    physMultiplier: 0.470346,
    attributeMultiplier: 0.705519,
    physFixed: 130.8,
    attributeFixed: 71.4,
  },
  {
    physMultiplier: 0.689664,
    attributeMultiplier: 1.034496,
    physFixed: 191.2,
    attributeFixed: 104,
  },
  {
    physMultiplier: 1.034496,
    attributeMultiplier: 1.551744,
    physFixed: 286.8,
    attributeFixed: 156,
  },
]

const NO_DAMAGE: SweepCoefficients = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}

const TOKENS_PER_SWEEP = 10
const TOKENS_PER_SWEEP_COOLDOWN_FRAMES = 30
const TOKENS_PER_SWEEP_GROUP = "bamboocutDust:tokensPerPiercingDartSweep"

export const TOWLINE_SWEEP_BONUS_BY_SEGMENT = [
  BUFF.towlineSweepFirstSweepsBonus,
  BUFF.towlineSweepMiddleSweepsBonus,
  BUFF.towlineSweepLastSweepsBonus,
] as const

export interface PiercingDartSegment {
  id: string
  name: string
  castTag: Skill["castTag"]
  sweepFrames: readonly number[]
}

export interface PiercingDartStage {
  castFrames: number
  tokensCost: number
  tokensCondition: TriggerCondition[]
  segments: readonly [PiercingDartSegment, ...PiercingDartSegment[]]
}

export const TOKENS_BELOW_FIFTY = [tokensOfGratitudeRequires("lt", 50)]
export const TOKENS_FIFTY_TO_NINETY_NINE = [
  tokensOfGratitudeRequires("gte", 50),
  tokensOfGratitudeRequires("lt", 100),
]
export const TOKENS_AT_LEAST_HUNDRED = [tokensOfGratitudeRequires("gte", 100)]

const SEGMENT_SWEEP_COUNTS = [3, 2, 2] as const

function firstSweepIndexOf(segmentIndex: number): number {
  return SEGMENT_SWEEP_COUNTS.slice(0, segmentIndex).reduce((sum, count) => sum + count, 0)
}

function sweepHits(segment: PiercingDartSegment, segmentIndex: number, firstHitIndex: number) {
  const firstSweep = firstSweepIndexOf(segmentIndex)
  return segment.sweepFrames.map((frame, offset): SkillHit =>
    hit(firstHitIndex + offset, {
      frame,
      ...SWEEP_COEFFICIENTS[firstSweep + offset],
      triggers: [
        ...piercingDartSweepTriggers(),
        meterDelta({
          target: tokensOfGratitudeMeter.id,
          stacks: TOKENS_PER_SWEEP,
          cooldownFrames: TOKENS_PER_SWEEP_COOLDOWN_FRAMES,
          cooldownGroup: TOKENS_PER_SWEEP_GROUP,
        }),
      ],
    }),
  )
}

const SEGMENT_TAGS = [WEAPON.ropeDart, ATTACK.charge, PROP.isCharged, ATTUNE.unfetteredCharged]

function segmentSkill(
  segment: PiercingDartSegment,
  segmentIndex: number,
  hits: SkillHit[],
  extra: Pick<Skill, "castFrames" | "triggerable"> &
    Partial<Pick<Skill, "castConditions" | "meterCosts">>,
): Skill {
  return defineSkill({
    id: segment.id,
    classId: "bamboocutDust",
    name: segment.name,
    breakdownName: "Piercing Dart",
    tags: SEGMENT_TAGS,
    skillType: "weapon",
    weaponOrAttribute: "Rope Dart",
    attributeAttack: "Bamboocut",
    castTag: segment.castTag,
    receives: [...PIERCING_DART_RECEIVES, TOWLINE_SWEEP_BONUS_BY_SEGMENT[segmentIndex]],
    hits,
    ...extra,
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
  })
}

export function piercingDartSkills(stage: PiercingDartStage): Skill[] {
  const [firstSegment, ...laterSegments] = stage.segments
  const releaseHit = hit(0, {
    frame: 0,
    ...NO_DAMAGE,
    triggers: [
      applyBuff({
        target: STATUS.soulboundRelease,
        durationFrames: stage.castFrames,
        conditions: [{ buffId: STATUS.soulbound, op: "gte", stacks: 1 }],
      }),
      clearStatus({ target: STATUS.soulbound }),
      clearStatus({ target: STATUS.piercingDartReady }),
      ...laterSegments.map((segment) => castSkill({ target: segment.id })),
    ],
  })
  const mainSkill = segmentSkill(firstSegment, 0, [releaseHit, ...sweepHits(firstSegment, 0, 1)], {
    castFrames: stage.castFrames,
    triggerable: false,
    castConditions: [
      { buffId: STATUS.piercingDartReady, op: "gte", stacks: 1 },
      ...stage.tokensCondition,
    ],
    ...(stage.tokensCost > 0 ? { meterCosts: [tokensOfGratitudeCost(stage.tokensCost)] } : {}),
  })
  const followUps = laterSegments.map((segment, index) =>
    segmentSkill(segment, index + 1, sweepHits(segment, index + 1, 0), {
      castFrames: 0,
      triggerable: true,
    }),
  )
  return [mainSkill, ...followUps]
}
