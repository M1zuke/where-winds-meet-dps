// v45 → v46 — a round of cast-length and hit-frame corrections across
// Stonesplit Strength, Bellstrike Splendor and Silkbind Jade. A Skill Editor
// copy seeded before this still carries the old frames. Only a value still
// identical to what was seeded is rewritten: once it differs, a stale copy
// and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface HitFramePatch {
  index: number
  fromFrame: number
  toFrame: number
}

interface SkillFramePatch {
  matchId: (id: string) => boolean
  fromCastFrames?: number
  toCastFrames?: number
  hits?: readonly HitFramePatch[]
}

const exact = (id: string) => (candidate: string) => candidate === id
const oneOf = (ids: readonly string[]) => (candidate: string) => ids.includes(candidate)

const rowMatches = (
  hit: Record<string, unknown>,
  row: readonly [number, number, number, number],
): boolean =>
  hit.physMultiplier === row[0] &&
  hit.attributeMultiplier === row[1] &&
  hit.physFixed === row[2] &&
  hit.attributeFixed === row[3]

const DRONE_LAUNCH_IDS = [
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
]

const ANXI_SOLDIER_HENG_IDS = [
  "stonesplitStrength-anxisoldierheng",
  "stonesplitStrength-anxisoldierheng-stab",
]

const PATCHES: readonly SkillFramePatch[] = [
  {
    matchId: exact("stonesplitStrength-deflect"),
    fromCastFrames: 25,
    toCastFrames: 15,
  },
  {
    matchId: exact("stonesplitStrength-snowpartingslide"),
    hits: [{ index: 0, fromFrame: 0, toFrame: 32 }],
  },
  {
    matchId: exact("stonesplitStrength-snowpartingspecial"),
    hits: [
      { index: 0, fromFrame: 0, toFrame: 38 },
      { index: 1, fromFrame: 13, toFrame: 60 },
      { index: 2, fromFrame: 26, toFrame: 66 },
      { index: 3, fromFrame: 39, toFrame: 72 },
      { index: 4, fromFrame: 52, toFrame: 78 },
      { index: 5, fromFrame: 65, toFrame: 96 },
      { index: 6, fromFrame: 78, toFrame: 100 },
      { index: 7, fromFrame: 91, toFrame: 104 },
      { index: 8, fromFrame: 104, toFrame: 108 },
    ],
  },
  {
    matchId: oneOf(ANXI_SOLDIER_HENG_IDS),
    fromCastFrames: 0,
    toCastFrames: 42,
    hits: [
      { index: 0, fromFrame: 0, toFrame: 10 },
      { index: 1, fromFrame: 0, toFrame: 24 },
      { index: 2, fromFrame: 0, toFrame: 28 },
      { index: 3, fromFrame: 0, toFrame: 42 },
    ],
  },
  {
    matchId: exact("bellstrikeSplendor-energysurge"),
    hits: [
      { index: 0, fromFrame: 0, toFrame: 6 },
      { index: 1, fromFrame: 17, toFrame: 16 },
      { index: 2, fromFrame: 34, toFrame: 45 },
    ],
  },
  {
    matchId: exact("bellstrikeSplendor-swordq"),
    hits: [{ index: 0, fromFrame: 0, toFrame: 22 }],
  },
  {
    matchId: exact("bellstrikeSplendor-spearq"),
    hits: [{ index: 0, fromFrame: 0, toFrame: 18 }],
  },
  {
    matchId: exact("bellstrikeSplendor-swordspecial"),
    fromCastFrames: 24,
    toCastFrames: 44,
    hits: [{ index: 0, fromFrame: 0, toFrame: 23 }],
  },
  {
    matchId: exact("silkbindJade-umbq"),
    fromCastFrames: 75,
    toCastFrames: 67,
    hits: [{ index: 0, fromFrame: 0, toFrame: 50 }],
  },
  {
    matchId: exact("silkbindJade-umb-heavylight"),
    fromCastFrames: 75,
    toCastFrames: 78,
    hits: [
      { index: 0, fromFrame: 0, toFrame: 6 },
      { index: 1, fromFrame: 25, toFrame: 31 },
      { index: 2, fromFrame: 50, toFrame: 56 },
    ],
  },
  {
    matchId: exact("silkbindJade-fanq"),
    fromCastFrames: 66,
    toCastFrames: 61,
    hits: [{ index: 0, fromFrame: 0, toFrame: 9 }],
  },
  {
    matchId: exact("silkbindJade-fanqcancel"),
    fromCastFrames: 6,
    toCastFrames: 10,
  },
  {
    matchId: exact("silkbindJade-fanheavypursuit-3-hit"),
    fromCastFrames: 90,
    toCastFrames: 93,
    hits: [
      { index: 0, fromFrame: 0, toFrame: 10 },
      { index: 1, fromFrame: 30, toFrame: 34 },
      { index: 2, fromFrame: 60, toFrame: 72 },
    ],
  },
  {
    matchId: exact("silkbindJade-fanheavypursuit-5-hit"),
    fromCastFrames: 150,
    toCastFrames: 146,
    hits: [
      { index: 0, fromFrame: 0, toFrame: 14 },
      { index: 1, fromFrame: 30, toFrame: 33 },
      { index: 2, fromFrame: 60, toFrame: 69 },
      { index: 3, fromFrame: 90, toFrame: 84 },
      { index: 4, fromFrame: 120, toFrame: 112 },
    ],
  },
  {
    matchId: oneOf(DRONE_LAUNCH_IDS),
    fromCastFrames: 68,
    toCastFrames: 66,
    hits: [{ index: 0, fromFrame: 0, toFrame: 36 }],
  },
]

function healHits(hits: unknown, patches: readonly HitFramePatch[]): unknown {
  if (!Array.isArray(hits)) return hits
  return hits.map((entry, position) => {
    const hitPatch = patches.find((candidate) => candidate.index === position)
    if (!hitPatch || !isRecord(entry) || entry.frame !== hitPatch.fromFrame) return entry
    return { ...entry, frame: hitPatch.toFrame }
  })
}

function healPatch(skill: Record<string, unknown>): Record<string, unknown> {
  const patch = PATCHES.find((candidate) => candidate.matchId(String(skill.id)))
  if (!patch) return skill
  let next = skill
  if (
    patch.fromCastFrames !== undefined &&
    patch.toCastFrames !== undefined &&
    next.castFrames === patch.fromCastFrames
  )
    next = { ...next, castFrames: patch.toCastFrames }
  if (patch.hits) next = { ...next, hits: healHits(next.hits, patch.hits) }
  return next
}

// Stonesplit's own Deflect Cancel replaced the universal one outright, so a
// stored copy may still sit at either the pre-fix universal value or the
// universal fix's own value — both heal to the class's own 15 frames.
function healStonesplitDeflectCancel(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "stonesplitStrength-deflect-cancel") return skill
  if (skill.castFrames === 25 || skill.castFrames === 18) return { ...skill, castFrames: 15 }
  return skill
}

// The strike now splits 0.4 / 0.6 across two colliders instead of landing as
// one hit at the cast's own start.
function healSnowpartingqStab(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "stonesplitStrength-snowpartingq-stab") return skill
  if (skill.castFrames !== 113) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || only.frame !== 0) return skill
  if (!rowMatches(only, [2.1324, 3.1986, 590, 322])) return skill
  return {
    ...skill,
    castFrames: 69,
    hits: [
      {
        id: "hit-0",
        frame: 14,
        physMultiplier: 0.85296,
        attributeMultiplier: 1.27944,
        physFixed: 236,
        attributeFixed: 128.8,
        extraCritDamage: 0,
        triggers: [],
      },
      { ...only, id: "hit-1", frame: 48, ...rowValues([1.27944, 1.91916, 354, 193.2]) },
    ],
  }
}

function rowValues(row: readonly [number, number, number, number]) {
  return {
    physMultiplier: row[0],
    attributeMultiplier: row[1],
    physFixed: row[2],
    attributeFixed: row[3],
  }
}

const SNOWBREAK_SPRING_AVAILABLE_ID = "snowbreakSpringAvailable"

// Grave Frost's four hits move to their real, post-hold frames; the
// Snowbreak Spring-availability grant follows the hit nearest the in-game
// grant point instead of the last hit.
function healGraveFrost(skill: Record<string, unknown>): Record<string, unknown> {
  const isNormal = skill.id === "stonesplitStrength-snowpartingcharged"
  const isForgetfulness = skill.id === "stonesplitStrength-snowpartingcharged-forgetfulness"
  if (!isNormal && !isForgetfulness) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 4 || !hits.every(isRecord)) return skill
  const records = hits as Record<string, unknown>[]
  const fromFrames = isNormal ? [0, 24, 48, 72] : [0, 14, 28, 42]
  const toFrames = isNormal ? [50, 63, 70, 96] : [11, 24, 31, 57]
  if (!records.every((hit, index) => hit.frame === fromFrames[index])) return skill
  const grantHit = records[3]
  const grantTriggers = Array.isArray(grantHit.triggers) ? grantHit.triggers : []
  const grant = grantTriggers.find(
    (trigger) => isRecord(trigger) && trigger.targetId === SNOWBREAK_SPRING_AVAILABLE_ID,
  )
  const nextHits = records.map((record, position) => {
    let triggers = Array.isArray(record.triggers) ? record.triggers : []
    if (position === 3 && grant) {
      triggers = triggers.filter(
        (trigger) => !(isRecord(trigger) && trigger.targetId === SNOWBREAK_SPRING_AVAILABLE_ID),
      )
    }
    if (position === 2 && grant) triggers = [...triggers, grant]
    return { ...record, frame: toFrames[position], triggers }
  })
  return { ...skill, hits: nextHits }
}

// The dual now carries a separate, zero-damage grant hit ahead of the real
// strike instead of granting Snowbreak Spring availability on the same hit
// that deals damage.
function healSnowpartingDual(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "stonesplitStrength-snowpartingdual") return skill
  if (skill.castFrames !== 35) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || only.frame !== 0) return skill
  if (!rowMatches(only, [0.6486, 0.9729, 180, 98])) return skill
  return {
    ...skill,
    castFrames: 34,
    hits: [
      {
        id: "hit-0",
        frame: 22,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: only.triggers ?? [],
      },
      {
        ...only,
        id: "hit-1",
        frame: 30,
        triggers: [],
      },
    ],
  }
}

const PHALANX_S3_IDS = [
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
]

// Both stage-3 charges gain the Mo Blade Anxi Soldier cues ahead of the
// slam, a Steadfast Devotion gate on stage 3 itself, and their real frames.
function healPhalanxChargedS3(skill: Record<string, unknown>): Record<string, unknown> {
  if (!PHALANX_S3_IDS.includes(String(skill.id))) return skill
  const isPlain = skill.id === "stonesplitStrength-phalanxcharged-s3"
  const fromCastFrames = isPlain ? 188 : 138
  const toCastFrames = isPlain ? 173 : 142
  const soldierFrame = isPlain ? 76 : 57
  const jumpFrame = isPlain ? 112 : 81
  const hitFrame0 = isPlain ? 151 : 120
  const hitFrame1 = isPlain ? 160 : 129
  if (skill.castFrames !== fromCastFrames) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 2) return skill
  const [slamFirstShare, slamSecondShare] = hits
  if (!isRecord(slamFirstShare) || !isRecord(slamSecondShare)) return skill
  if (slamFirstShare.frame !== 0 || !rowMatches(slamFirstShare, [1.7199, 2.5798, 475, 259]))
    return skill
  const oldSecondShareFrame = isPlain ? 94 : 69
  if (
    slamSecondShare.frame !== oldSecondShareFrame ||
    !rowMatches(slamSecondShare, [4.0131, 6.0196, 1110, 604])
  )
    return skill
  const soldierTrigger = Array.isArray(slamSecondShare.triggers)
    ? slamSecondShare.triggers.find(
        (trigger) =>
          isRecord(trigger) && trigger.targetId === "stonesplitStrength-anxisoldiermodown",
      )
    : undefined
  if (!soldierTrigger) return skill
  const steadfastCondition = { param: "steadfastDevotion", minTier: 1 }
  const castConditions = Array.isArray(skill.castConditions) ? skill.castConditions : []
  const nextCastConditions = castConditions.some(
    (condition) => isRecord(condition) && condition.param === "steadfastDevotion",
  )
    ? castConditions
    : [steadfastCondition, ...castConditions]
  return {
    ...skill,
    castFrames: toCastFrames,
    castConditions: nextCastConditions,
    hits: [
      {
        id: "hit-0",
        frame: soldierFrame,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [soldierTrigger],
      },
      {
        id: "hit-1",
        frame: jumpFrame,
        physMultiplier: 0,
        attributeMultiplier: 0,
        physFixed: 0,
        attributeFixed: 0,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "stonesplitStrength-anxisoldiermojump",
            stacks: 0,
            condition: isRecord(soldierTrigger) ? soldierTrigger.condition : null,
            requiresParam: "steadfastDevotion",
            requiresMinTier: 1,
          },
        ],
      },
      { ...slamFirstShare, id: "hit-2", frame: hitFrame0, triggers: [] },
      { ...slamSecondShare, id: "hit-3", frame: hitFrame1, triggers: [] },
    ],
  }
}

// The downward-slash soldier no longer chains its own leaping-slash
// follow-up — the parent charge now casts both directly, at their own cues.
function healAnxiSoldierMoDown(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "stonesplitStrength-anxisoldiermodown") return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || !Array.isArray(only.triggers)) return skill
  const hasChain = only.triggers.some(
    (trigger) => isRecord(trigger) && trigger.targetId === "stonesplitStrength-anxisoldiermojump",
  )
  if (!hasChain) return skill
  const nextTriggers = only.triggers.filter(
    (trigger) =>
      !(isRecord(trigger) && trigger.targetId === "stonesplitStrength-anxisoldiermojump"),
  )
  return { ...skill, hits: [{ ...only, triggers: nextTriggers }] }
}

// The three-wave variant's own frame now moves with the hold instead of
// landing at the cast's own start; its castFrames shortens to the earliest
// release, and the trailing waves move with it.
function healSwordHeavyCharged(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "bellstrikeSplendor-swordheavycharged") return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 3) return skill
  const [firstWave, secondWave, thirdWave] = hits
  if (!isRecord(firstWave) || !isRecord(secondWave) || !isRecord(thirdWave)) return skill
  if (secondWave.frame !== 46 || thirdWave.frame !== 92) return skill
  const variants = Array.isArray(firstWave.variants) ? firstWave.variants : []
  const variantIndex = variants.findIndex(
    (variant) => isRecord(variant) && variant.id === "hv-swordheavycharged-hit-0-multi-wave-window",
  )
  if (variantIndex === -1) return skill
  const variant = variants[variantIndex] as Record<string, unknown>
  if (variant.castFrames !== 140 || variant.frame !== undefined) return skill
  const nextVariants = variants.map((entry, index) =>
    index === variantIndex ? { ...variant, castFrames: 135, frame: 90 } : entry,
  )
  return {
    ...skill,
    hits: [
      { ...firstWave, variants: nextVariants },
      { ...secondWave, frame: 100 },
      { ...thirdWave, frame: 129 },
    ],
  }
}

// The Deflect-cancelled 2-hit release moves with the hold and gains the
// generic empty-drain fallback onto the base release.
function healSwordHeavyCharged2Hit(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "bellstrikeSplendor-swordheavycharged-2-hit") return skill
  if (skill.castFrames !== 117) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 2) return skill
  const [firstWave, secondWave] = hits
  if (
    !isRecord(firstWave) ||
    !isRecord(secondWave) ||
    firstWave.frame !== 0 ||
    secondWave.frame !== 58
  )
    return skill
  const drains = skill.meterDrains
  if (!Array.isArray(drains) || drains.length !== 1) return skill
  const [drain] = drains
  if (!isRecord(drain) || drain.chargeRelease !== undefined) return skill
  if (
    drain.meterId !== "endurance" ||
    drain.perSecond !== 20 ||
    drain.fromFrame !== 12.6 ||
    drain.stopAfterSec !== 1.2
  )
    return skill
  return {
    ...skill,
    castFrames: 101,
    meterDrains: [
      { ...drain, chargeRelease: { fallbackSkillId: "bellstrikeSplendor-swordheavycharged" } },
    ],
    hits: [
      { ...firstWave, frame: 90 },
      { ...secondWave, frame: 100 },
    ],
  }
}

// The follow-up now splits 0.15 / 0.15 across its own two slashes instead of
// reusing Daunting Strike's single 0.2 hit.
function healSwordq2nd(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "bellstrikeSplendor-swordq-2nd") return skill
  if (skill.castFrames !== 26) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || only.frame !== 0) return skill
  if (!rowMatches(only, [1.0253, 1.538, 283.6, 154.6])) return skill
  return {
    ...skill,
    castFrames: 60,
    hits: [
      {
        id: "hit-0",
        frame: 7,
        physMultiplier: 0.768985,
        attributeMultiplier: 1.153478,
        physFixed: 212.7,
        attributeFixed: 115.95,
        extraCritDamage: 0,
        triggers: [],
      },
      { ...only, id: "hit-1", frame: 48, ...rowValues([0.768985, 1.153478, 212.7, 115.95]) },
    ],
  }
}

// The whirlwind's own launch frame moves off the cast's own start.
function healFanLightCharged(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "silkbindJade-fanlightcharged") return skill
  if (skill.castFrames !== 75) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 1) return skill
  const [only] = hits
  if (!isRecord(only) || only.frame !== 0) return skill
  return {
    ...skill,
    castFrames: 98,
    hits: [{ ...only, frame: 71 }],
  }
}

// Both halves now land together at the in-game frame instead of the
// second landing well after the first.
function healFanSpecial(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "silkbindJade-fanspecial") return skill
  if (skill.castFrames !== 72) return skill
  const hits = skill.hits
  if (!Array.isArray(hits) || hits.length !== 2) return skill
  const [firstHalf, secondHalf] = hits
  if (
    !isRecord(firstHalf) ||
    !isRecord(secondHalf) ||
    firstHalf.frame !== 0 ||
    secondHalf.frame !== 36
  )
    return skill
  return {
    ...skill,
    hits: [
      { ...firstHalf, frame: 33 },
      { ...secondHalf, frame: 33 },
    ],
  }
}

export function healSkillFrames(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  let next = healPatch(skill)
  next = healStonesplitDeflectCancel(next)
  next = healSnowpartingqStab(next)
  next = healGraveFrost(next)
  next = healSnowpartingDual(next)
  next = healPhalanxChargedS3(next)
  next = healAnxiSoldierMoDown(next)
  next = healSwordHeavyCharged(next)
  next = healSwordHeavyCharged2Hit(next)
  next = healSwordq2nd(next)
  next = healFanLightCharged(next)
  next = healFanSpecial(next)
  return next
}

export const V46__stonesplitSplendorJadeTimingRepairs: CustomSkillMigration = {
  to: 46,
  name: "V46__stonesplitSplendorJadeTimingRepairs",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkillFrames) : blob.skills
    return { ...blob, v: 46, skills }
  },
}
