// v104 → v105 — the Sword Morph Endurance conversion fires at the multi-wave
// release event, ahead of the first wave, instead of on the last wave. A Skill
// Editor copy seeded before this still carries the spend on the last wave. A
// copy is rewritten only while both the spend and the release hit still hold
// what was seeded: once either differs, a stale copy and a deliberate edit are
// indistinguishable. The two-wave form had no release hit and gains one.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SPEND_STATUS = "swordMorphConvertedAmount"
const ENERGY_SURGE_GRANT = "energySurgeGrant"
const MULTI_WAVE_WINDOW = "swordMorphMultiWaveWindow"
const ENERGY_SURGE_GRANT_DURATION_FRAMES = 300
const LATE_GRANT_DURATION_FRAMES = 293.94
const TWO_WAVE_RELEASE_FRAME = 84.6
const TWO_WAVE_ID = "bellstrikeSplendor-swordheavycharged-2-hit"

const SPEND_AND_RELEASE_HITS: Readonly<Record<string, { spend: number; release: number }>> = {
  "bellstrikeSplendor-swordheavycharged": { spend: 2, release: 3 },
  "bellstrikeSplendor-swordheavycharged-wushuang": { spend: 2, release: 3 },
  "bellstrikeSplendor-swordheavycharged-2-hit-wushuang": { spend: 1, release: 2 },
  "bellstrikeSplendor-swordheavycharged-prepull": { spend: 2, release: 3 },
}

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const triggersOf = (hit: unknown): RecordValue[] | null =>
  isRecord(hit) && Array.isArray(hit.triggers) && hit.triggers.every(isRecord)
    ? (hit.triggers as RecordValue[])
    : null

const isSpend = (trigger: RecordValue): boolean => trigger.recordSpendAsStatus === SPEND_STATUS

const isEnduranceGain = (trigger: RecordValue): boolean =>
  trigger.kind === "meterDelta" &&
  trigger.targetId === "endurance" &&
  trigger.stacks === 20 &&
  trigger.cooldownGroup === ENERGY_SURGE_GRANT

const isLateGrant = (trigger: RecordValue, targetId: string): boolean =>
  trigger.kind === "applyBuff" &&
  trigger.targetId === targetId &&
  trigger.durationFrames === LATE_GRANT_DURATION_FRAMES

const withTriggers = (hit: RecordValue, triggers: RecordValue[]): RecordValue => ({
  ...hit,
  triggers,
})

function healSpendForm(
  skill: RecordValue,
  hits: unknown[],
  places: { spend: number; release: number },
): unknown {
  const spendTriggers = triggersOf(hits[places.spend])
  const releaseTriggers = triggersOf(hits[places.release])
  if (!spendTriggers || !releaseTriggers) return skill
  if (spendTriggers.filter(isSpend).length !== 1) return skill
  if (releaseTriggers.some(isSpend) || releaseTriggers.filter(isEnduranceGain).length !== 1)
    return skill
  const spend = spendTriggers.find(isSpend)!
  const gainIndex = releaseTriggers.findIndex(isEnduranceGain)
  const healed = hits.map((hit, index) => {
    if (index === places.spend)
      return withTriggers(
        hit as RecordValue,
        spendTriggers.filter((trigger) => !isSpend(trigger)),
      )
    if (index === places.release)
      return withTriggers(hit as RecordValue, [
        ...releaseTriggers.slice(0, gainIndex),
        spend,
        ...releaseTriggers.slice(gainIndex),
      ])
    return hit
  })
  return { ...skill, hits: healed }
}

function healTwoWaveForm(skill: RecordValue, hits: unknown[]): unknown {
  if (hits.length !== 2) return skill
  const firstTriggers = triggersOf(hits[0])
  const lastTriggers = triggersOf(hits[1])
  if (!firstTriggers || !lastTriggers) return skill
  const energySurgeGrant = firstTriggers.filter((trigger) =>
    isLateGrant(trigger, ENERGY_SURGE_GRANT),
  )
  const multiWaveGrant = firstTriggers.filter((trigger) => isLateGrant(trigger, MULTI_WAVE_WINDOW))
  const gain = firstTriggers.filter(isEnduranceGain)
  if (energySurgeGrant.length !== 1 || multiWaveGrant.length !== 1 || gain.length !== 1)
    return skill
  if (lastTriggers.filter(isSpend).length !== 1) return skill
  const multiWaveRelease = { ...multiWaveGrant[0] }
  delete multiWaveRelease.durationFrames
  const releaseHit: RecordValue = {
    id: "hit-2",
    frame: TWO_WAVE_RELEASE_FRAME,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [
      { ...energySurgeGrant[0], durationFrames: ENERGY_SURGE_GRANT_DURATION_FRAMES },
      multiWaveRelease,
      lastTriggers.find(isSpend)!,
      gain[0],
    ],
  }
  return {
    ...skill,
    hits: [
      withTriggers(
        hits[0] as RecordValue,
        firstTriggers.filter(
          (trigger) =>
            trigger !== energySurgeGrant[0] && trigger !== multiWaveGrant[0] && trigger !== gain[0],
        ),
      ),
      withTriggers(
        hits[1] as RecordValue,
        lastTriggers.filter((trigger) => !isSpend(trigger)),
      ),
      releaseHit,
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  if (skill.id === TWO_WAVE_ID) return healTwoWaveForm(skill, skill.hits)
  const places = SPEND_AND_RELEASE_HITS[skill.id]
  return places ? healSpendForm(skill, skill.hits, places) : skill
}

export const V105__swordMorphConversionAtTheRelease: CustomSkillMigration = {
  to: 105,
  name: "V105__swordMorphConversionAtTheRelease",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 105, skills }
  },
}
