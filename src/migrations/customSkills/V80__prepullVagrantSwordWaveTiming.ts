// v79 → v80 — the pre-pull Vagrant Sword lands its three waves 6, 16 and 45 f
// after the release (were 0, 17 and 34), the waves and the single bolt fly as
// projectiles, and the release itself is a hit of its own on frame 0 that
// carries the Energy Surge grant, the multi-wave window and the Endurance gain;
// the Sword Morph Endurance conversion moves to the last wave. A Skill Editor
// copy seeded before this still carries the old shape. Only a value still
// identical to what was seeded is rewritten: once it differs, a stale copy and
// a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const WAVE_PROJECTILE = { speedMetersPerSecond: 36, maxTravelFrames: 30 }
const ENERGY_SURGE_GROUP = "energySurgeGrant"
const SWORD_MORPH_CONDITION = { param: "swordMorph" }
const WAVE_COUNT = 3
const WAVE_FRAMES: readonly ({ from: number; to: number } | null)[] = [
  null,
  { from: 17, to: 16 },
  { from: 34, to: 45 },
]
const VARIANT_FRAME = { from: 0, to: 6 }

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const isReleaseTrigger = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  (trigger.kind === "applyBuff" ||
    (trigger.kind === "meterDelta" && trigger.cooldownGroup === ENERGY_SURGE_GROUP))

const isEnduranceConversion = (trigger: unknown): boolean =>
  isRecord(trigger) &&
  trigger.kind === "meterDelta" &&
  trigger.stacks === -20 &&
  trigger.recordSpendAsStatus !== undefined

const retimedFrame = (value: unknown, pair: { from: number; to: number } | null): unknown =>
  pair && value === pair.from ? pair.to : value

const retimedVariant = (variant: unknown): unknown =>
  isRecord(variant) ? { ...variant, frame: retimedFrame(variant.frame, VARIANT_FRAME) } : variant

const retimedWave = (hit: unknown, index: number): unknown => {
  if (!isRecord(hit) || index >= WAVE_COUNT) return hit
  const retimed: RecordValue = {
    ...hit,
    frame: retimedFrame(hit.frame, WAVE_FRAMES[index]),
    ...(hit.projectile === undefined ? { projectile: { ...WAVE_PROJECTILE } } : {}),
  }
  if (Array.isArray(hit.variants)) retimed.variants = hit.variants.map(retimedVariant)
  return retimed
}

function withReleaseHit(hits: unknown[]): unknown[] | null {
  if (hits.length !== WAVE_COUNT) return null
  const [firstWave, secondWave, lastWave] = hits
  if (!isRecord(firstWave) || !isRecord(lastWave) || !Array.isArray(firstWave.triggers)) return null
  const releaseTriggers = firstWave.triggers.filter(isReleaseTrigger)
  const conversionTriggers = firstWave.triggers.filter(isEnduranceConversion)
  if (releaseTriggers.length !== 3 || conversionTriggers.length !== 1) return null
  const lastWaveTriggers = Array.isArray(lastWave.triggers) ? lastWave.triggers : null
  if (lastWaveTriggers === null) return null
  return [
    {
      ...firstWave,
      triggers: firstWave.triggers.filter(
        (trigger) => !isReleaseTrigger(trigger) && !isEnduranceConversion(trigger),
      ),
    },
    secondWave,
    { ...lastWave, triggers: [...conversionTriggers, ...lastWaveTriggers] },
    {
      id: "hit-3",
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      extraCritDamage: 0,
      triggers: releaseTriggers,
      conditions: [{ ...SWORD_MORPH_CONDITION }],
    },
  ]
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== PREPULL_ID || !Array.isArray(skill.hits)) return skill
  const restructured = withReleaseHit(skill.hits)
  const hits = (restructured ?? skill.hits).map(retimedWave)
  return { ...skill, hits }
}

export const V80__prepullVagrantSwordWaveTiming: CustomSkillMigration = {
  to: 80,
  name: "V80__prepullVagrantSwordWaveTiming",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 80, skills }
  },
}
