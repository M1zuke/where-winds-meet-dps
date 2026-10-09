// v63 → v64 — Second Track Slash's stage-1 hold is 31 f (it was 30) with its
// Endurance drain from frame 13 (was 12), so every stage-1 hit frame and cast
// length moves one frame later, as does the level-0 release's; Splendor's
// single-bolt Vagrant Sword ends 5 f sooner and no longer counts as a heavy
// attack or receives Mistwillow; Hero's Blood's two strikes land on frame 22
// (were 33). A Skill Editor copy seeded before this still carries the old
// values. Only a value still identical to what was seeded is rewritten: once
// it differs, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface FramePair {
  from: number
  to: number
}

interface DrainTiming {
  fromFrame: number
  stopAfterSec: number
}

interface Retiming {
  castFrames?: FramePair
  hitFrames?: readonly (FramePair | null)[]
  gatedCastFrames?: FramePair
  drain?: { from: DrainTiming; to: DrainTiming }
}

const UMBRA_PREFIX = "bellstrikeUmbra-sword-charge-"
const STAGE_1_HIT_FRAMES: readonly FramePair[] = [
  { from: 36, to: 37 },
  { from: 60, to: 61 },
  { from: 70, to: 71 },
  { from: 80, to: 81 },
  { from: 138, to: 139 },
]
const STAGE_1_DRAIN = {
  from: { fromFrame: 12, stopAfterSec: 0.3 },
  to: { fromFrame: 13, stopAfterSec: 0.3 },
}
const STAGE_2_DRAIN = {
  from: { fromFrame: 12, stopAfterSec: 1.2 },
  to: { fromFrame: 13, stopAfterSec: 71 / 60 },
}

const stage1 = (hitCount: number, castFrames: FramePair): Retiming => ({
  castFrames,
  hitFrames: STAGE_1_HIT_FRAMES.slice(0, hitCount),
  gatedCastFrames: { from: 86, to: 87 },
  drain: STAGE_1_DRAIN,
})

const RETIMINGS: Record<string, Retiming> = {
  [`${UMBRA_PREFIX}stage-1-1-hit`]: stage1(1, { from: 48, to: 49 }),
  [`${UMBRA_PREFIX}stage-1-2-hit`]: stage1(4, { from: 72, to: 73 }),
  [`${UMBRA_PREFIX}stage-1-3-hit`]: stage1(4, { from: 82, to: 83 }),
  [`${UMBRA_PREFIX}stage-1-4-hit`]: stage1(4, { from: 86, to: 87 }),
  [`${UMBRA_PREFIX}stage-1-5-hit`]: stage1(5, { from: 151, to: 152 }),
  [`${UMBRA_PREFIX}stage-1-level-0`]: {
    castFrames: { from: 49, to: 50 },
    hitFrames: [{ from: 36, to: 37 }],
  },
  [`${UMBRA_PREFIX}stage-2-4-hit`]: { drain: STAGE_2_DRAIN },
  [`${UMBRA_PREFIX}stage-2-5-hit`]: { drain: STAGE_2_DRAIN },
  "bellstrikeSplendor-swordheavycharged": { castFrames: { from: 126, to: 121 } },
  "bamboocutDraught-heros-blood": {
    hitFrames: [null, { from: 33, to: 22 }, { from: 33, to: 22 }],
  },
}

const VAGRANT_SWORD_IDS = [
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-swordheavycharged-2-hit",
  "bellstrikeSplendor-energysurge",
]
const SEEDED_VAGRANT_SWORD_TAGS = [
  "prop:isCharged",
  "weapon:Sword",
  "attack:heavy",
  "attune:swordCharged",
]
const MISTWILLOW_RECEIVES = ["mistwillowLightBuff", "mistwillowBuff"]

const retimedHit = (hit: unknown, frames: FramePair | null | undefined): unknown =>
  isRecord(hit) && frames && hit.frame === frames.from ? { ...hit, frame: frames.to } : hit

const withRetimedGate = (hit: unknown, gated: FramePair | undefined): unknown =>
  gated && isRecord(hit) && hit.castFramesWhenGated === gated.from
    ? { ...hit, castFramesWhenGated: gated.to }
    : hit

const matchesDrain = (drain: unknown, timing: DrainTiming): drain is RecordValue =>
  isRecord(drain) &&
  drain.perSecond === 14 &&
  drain.fromFrame === timing.fromFrame &&
  drain.stopAfterSec === timing.stopAfterSec

function applyRetiming(skill: RecordValue, retiming: Retiming): RecordValue {
  let healed = skill
  if (retiming.castFrames && skill.castFrames === retiming.castFrames.from) {
    healed = { ...healed, castFrames: retiming.castFrames.to }
  }
  const { hitFrames, gatedCastFrames } = retiming
  if ((hitFrames || gatedCastFrames) && Array.isArray(skill.hits)) {
    healed = {
      ...healed,
      hits: skill.hits.map((hit, index) =>
        withRetimedGate(retimedHit(hit, hitFrames?.[index]), gatedCastFrames),
      ),
    }
  }
  const { drain } = retiming
  if (drain && Array.isArray(skill.meterDrains)) {
    healed = {
      ...healed,
      meterDrains: skill.meterDrains.map((entry) =>
        matchesDrain(entry, drain.from) ? { ...entry, ...drain.to } : entry,
      ),
    }
  }
  return healed
}

function dropVagrantSwordStance(skill: RecordValue): RecordValue {
  if (!VAGRANT_SWORD_IDS.includes(String(skill.id))) return skill
  let healed = skill
  const { tags, receives } = skill
  if (
    Array.isArray(tags) &&
    tags.length === SEEDED_VAGRANT_SWORD_TAGS.length &&
    tags.every((tag, index) => tag === SEEDED_VAGRANT_SWORD_TAGS[index])
  ) {
    healed = { ...healed, tags: tags.filter((tag) => tag !== "attack:heavy") }
  }
  if (Array.isArray(receives) && MISTWILLOW_RECEIVES.every((id) => receives.includes(id))) {
    healed = { ...healed, receives: receives.filter((id) => !MISTWILLOW_RECEIVES.includes(id)) }
  }
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const retiming = RETIMINGS[skill.id]
  return dropVagrantSwordStance(retiming ? applyRetiming(skill, retiming) : skill)
}

export const V64__inGameTimingCorrections: CustomSkillMigration = {
  to: 64,
  name: "V64__inGameTimingCorrections",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 64, skills }
  },
}
