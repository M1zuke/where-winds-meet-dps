// v94 → v95 — the three-wave Vagrant Sword, the single bolts, Energy Surge,
// Daunting Strike, Shadow Step and Qiankun's Lock carry their exact fractional
// frames (waves 6.06 / 16.02 / 45.30 f after the release, the release at 84.6
// f of hold, the +30 Endurance of Qiankun's Lock 0.6 f into the cast), and the
// umbrella throw lands its damage at 35.78 f (was 36). A Skill Editor copy
// seeded before this still carries the whole-frame values. Only a value still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

interface ValuePair {
  from: number
  to: number
}

interface VariantRetiming {
  frame?: ValuePair
  castFrames?: ValuePair
}

interface HitRetiming {
  frame?: ValuePair
  castFramesWhenGated?: ValuePair
  triggerDurationFrames?: ValuePair
  variants?: readonly (VariantRetiming | null)[]
}

interface Retiming {
  castFrames?: ValuePair
  hits: readonly (HitRetiming | null)[]
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const WAVE_FRAMES: readonly ValuePair[] = [
  { from: 91, to: 90.66 },
  { from: 101, to: 100.62 },
  { from: 130, to: 129.9 },
]
const SWORD_MORPH_WAVE_DURATION: ValuePair = { from: 294, to: 293.94 }

const DRONE_LAUNCH_IDS: readonly string[] = [
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
]

const RETIMINGS: Readonly<Record<string, Retiming>> = {
  "bellstrikeSplendor-swordheavycharged": {
    castFrames: { from: 122, to: 121.8 },
    hits: [
      {
        frame: { from: 97, to: 96.74 },
        variants: [{ frame: WAVE_FRAMES[0], castFrames: { from: 136, to: 135.6 } }],
      },
      { frame: WAVE_FRAMES[1] },
      { frame: WAVE_FRAMES[2] },
      { frame: { from: 85, to: 84.6 } },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-prepull": {
    hits: [
      { variants: [{ frame: { from: 6, to: 6.06 } }] },
      { frame: { from: 16, to: 16.02 } },
      { frame: { from: 45, to: 45.3 } },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-2-hit": {
    castFrames: { from: 102, to: 101.62 },
    hits: [
      { frame: WAVE_FRAMES[0], triggerDurationFrames: SWORD_MORPH_WAVE_DURATION },
      { frame: WAVE_FRAMES[1] },
    ],
  },
  "bellstrikeSplendor-swordheavycharged-2-hit-wushuang": {
    castFrames: { from: 77, to: 77.02 },
    hits: [{ frame: { from: 66, to: 66.06 } }, { frame: { from: 76, to: 76.02 } }],
  },
  "bellstrikeSplendor-swordheavycharged-tier-1": {
    castFrames: { from: 83, to: 82.8 },
    hits: [{ frame: { from: 58, to: 57.74 } }],
  },
  "bellstrikeSplendor-swordheavycharged-wushuang": {
    castFrames: { from: 85, to: 84.8 },
    hits: [
      { frame: { from: 68, to: 68.09 }, variants: [{ frame: { from: 66, to: 66.06 } }] },
      { frame: { from: 76, to: 76.02 } },
      { frame: { from: 105, to: 105.3 } },
    ],
  },
  "bellstrikeSplendor-energysurge": {
    hits: [
      { frame: { from: 6, to: 6.06 } },
      { frame: { from: 16, to: 16.02 } },
      { frame: { from: 45, to: 45.3 } },
    ],
  },
  "bellstrikeSplendor-swordq": {
    castFrames: { from: 55, to: 54.71 },
    hits: [
      { frame: { from: 18, to: 17.58 } },
      {
        frame: { from: 18, to: 17.58 },
        castFramesWhenGated: { from: 19, to: 18.58 },
      },
    ],
  },
  "bellstrikeSplendor-swordspecial": {
    hits: [
      { frame: { from: 17, to: 17.06 } },
      null,
      {
        frame: { from: 17, to: 17.24 },
        triggerDurationFrames: { from: 150, to: 149.76 },
      },
    ],
  },
  "bellstrikeSplendor-spearq": { hits: [null, { frame: { from: 18, to: 17.65 } }] },
  ...Object.fromEntries(
    DRONE_LAUNCH_IDS.map((id) => [id, { hits: [{ frame: { from: 36, to: 35.78 } }] }]),
  ),
}

const QIANKUNS_LOCK_IDS: readonly string[] = [
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq-0-hit-cancel",
]
const QIANKUNS_LOCK_DELAY_FRAMES = 0.6

const swapped = (value: unknown, pair: ValuePair | undefined): unknown =>
  pair && value === pair.from ? pair.to : value

const retimedTriggers = (triggers: unknown, pair: ValuePair): unknown =>
  Array.isArray(triggers)
    ? triggers.map((trigger) =>
        isRecord(trigger) && trigger.durationFrames === pair.from
          ? { ...trigger, durationFrames: pair.to }
          : trigger,
      )
    : triggers

function retimedVariant(variant: unknown, retiming: VariantRetiming | null | undefined): unknown {
  if (!isRecord(variant) || !retiming) return variant
  const retimed: RecordValue = { ...variant }
  if (retiming.frame) retimed.frame = swapped(variant.frame, retiming.frame)
  if (retiming.castFrames) retimed.castFrames = swapped(variant.castFrames, retiming.castFrames)
  return retimed
}

function retimedHit(hit: unknown, retiming: HitRetiming | null | undefined): unknown {
  if (!isRecord(hit) || !retiming) return hit
  const retimed: RecordValue = { ...hit, frame: swapped(hit.frame, retiming.frame) }
  if (retiming.castFramesWhenGated)
    retimed.castFramesWhenGated = swapped(hit.castFramesWhenGated, retiming.castFramesWhenGated)
  if (retiming.triggerDurationFrames)
    retimed.triggers = retimedTriggers(hit.triggers, retiming.triggerDurationFrames)
  if (retiming.variants && Array.isArray(hit.variants))
    retimed.variants = hit.variants.map((variant, index) =>
      retimedVariant(variant, retiming.variants![index]),
    )
  return retimed
}

const isUndelayedQiankunsLockGain = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  trigger.kind === "meterDelta" &&
  trigger.targetId === "endurance" &&
  trigger.stacks === 30 &&
  trigger.requiresParam === undefined &&
  trigger.delayFrames === undefined

function withQiankunsLockDelay(hits: unknown[]): unknown[] {
  return hits.map((hit, index) => {
    if (index !== 0 || !isRecord(hit) || !Array.isArray(hit.triggers)) return hit
    const gainIndex = hit.triggers.findIndex(isUndelayedQiankunsLockGain)
    if (gainIndex < 0) return hit
    const triggers = hit.triggers.map((trigger, position) =>
      position === gainIndex
        ? { ...(trigger as RecordValue), delayFrames: QIANKUNS_LOCK_DELAY_FRAMES }
        : trigger,
    )
    return { ...hit, triggers }
  })
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  let healed: RecordValue = skill
  const retiming = RETIMINGS[skill.id]
  if (retiming)
    healed = {
      ...healed,
      castFrames: swapped(skill.castFrames, retiming.castFrames),
      hits: skill.hits.map((hit, index) => retimedHit(hit, retiming.hits[index])),
    }
  if (QIANKUNS_LOCK_IDS.includes(skill.id))
    healed = { ...healed, hits: withQiankunsLockDelay(healed.hits as unknown[]) }
  return healed
}

export const V95__fractionalFrameTiming: CustomSkillMigration = {
  to: 95,
  name: "V95__fractionalFrameTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 95, skills }
  },
}
