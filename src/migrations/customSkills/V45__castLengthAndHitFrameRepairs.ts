// v44 → v45 — a round of cast-length and hit-frame corrections across the
// shared mystic arts, the universal actions and Bamboocut Draught. A Skill
// Editor copy seeded before this still carries the old frames. Only a value
// still identical to what was seeded is rewritten: once it differs, a stale
// copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface HitFramePatch {
  index: number
  fromFrame: number
  toFrame: number
  fromRow?: readonly [number, number, number, number]
  toRow?: readonly [number, number, number, number]
}

interface SkillFramePatch {
  matchId: (id: string) => boolean
  fromCastFrames?: number
  toCastFrames?: number
  hits?: readonly HitFramePatch[]
}

const exact = (id: string) => (candidate: string) => candidate === id
const suffix = (value: string) => (candidate: string) => candidate.endsWith(value)
const CLASS_IDS = [
  "bellstrikeUmbra",
  "bellstrikeSplendor",
  "stonesplitStrength",
  "bamboocutDraught",
  "silkbindJade",
]
const anyClass = (slug: string) => (candidate: string) =>
  CLASS_IDS.some((classId) => candidate === `${classId}-${slug}`)

const rowMatches = (
  hit: Record<string, unknown>,
  row: readonly [number, number, number, number],
): boolean =>
  hit.physMultiplier === row[0] &&
  hit.attributeMultiplier === row[1] &&
  hit.physFixed === row[2] &&
  hit.attributeFixed === row[3]

const withRow = (
  hit: Record<string, unknown>,
  row: readonly [number, number, number, number],
): Record<string, unknown> => ({
  ...hit,
  physMultiplier: row[0],
  attributeMultiplier: row[1],
  physFixed: row[2],
  attributeFixed: row[3],
})

const PATCHES: readonly SkillFramePatch[] = [
  {
    matchId: (id) => id !== "silkbindJade-deflect-cancel" && anyClass("deflect-cancel")(id),
    fromCastFrames: 25,
    toCastFrames: 18,
  },
  {
    matchId: anyClass("golden-body-cancel"),
    fromCastFrames: 0,
    toCastFrames: 45,
  },
  {
    matchId: anyClass("golden-body-deflect-cancel"),
    fromCastFrames: 22,
    toCastFrames: 45,
  },
  {
    matchId: suffix("-toad-cancel"),
    fromCastFrames: 72,
    toCastFrames: 96,
    hits: [
      {
        index: 0,
        fromFrame: 0,
        toFrame: 39,
        fromRow: [1.8922, 2.8383, 284.31, 0],
        toRow: [0.54063, 0.810945, 81.23, 0],
      },
      {
        index: 1,
        fromFrame: 36,
        toFrame: 68,
        fromRow: [1.8922, 2.8383, 284.31, 0],
        toRow: [3.24377, 4.865655, 487.39, 0],
      },
    ],
  },
  {
    matchId: suffix("-soaring"),
    fromCastFrames: 120,
    toCastFrames: 122,
    hits: [
      {
        index: 0,
        fromFrame: 0,
        toFrame: 48,
        fromRow: [3.55121, 5.326815, 535.03, 0],
        toRow: [3.19609, 4.794135, 481.53, 0],
      },
      {
        index: 1,
        fromFrame: 60,
        toFrame: 122,
        fromRow: [3.55121, 5.326815, 535.03, 0],
        toRow: [3.90633, 5.859495, 588.53, 0],
      },
    ],
  },
  {
    matchId: suffix("-soaring-1-hit"),
    fromCastFrames: 60,
    toCastFrames: 76,
    hits: [{ index: 0, fromFrame: 0, toFrame: 48 }],
  },
  {
    matchId: suffix("-fire-breath-2-hit"),
    fromCastFrames: 100,
    toCastFrames: 137,
    hits: [
      { index: 0, fromFrame: 40, toFrame: 36 },
      { index: 1, fromFrame: 70, toFrame: 102 },
      { index: 2, fromFrame: 100, toFrame: 108 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-heros-blood"),
    hits: [{ index: 1, fromFrame: 22, toFrame: 33 }],
  },
  {
    matchId: exact("bamboocutDraught-nightwick-primepick-follow-up-cancel"),
    fromCastFrames: 21,
    toCastFrames: 39,
  },
  {
    matchId: exact("bamboocutDraught-reveldrift-cancel"),
    fromCastFrames: 28,
    toCastFrames: 21,
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-second"),
    fromCastFrames: 123,
    toCastFrames: 124,
    hits: [
      { index: 3, fromFrame: 78, toFrame: 79 },
      { index: 4, fromFrame: 84, toFrame: 85 },
      { index: 5, fromFrame: 90, toFrame: 91 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-second-cancel"),
    hits: [
      { index: 3, fromFrame: 78, toFrame: 79 },
      { index: 4, fromFrame: 84, toFrame: 85 },
      { index: 5, fromFrame: 90, toFrame: 91 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-third"),
    fromCastFrames: 111,
    toCastFrames: 110,
    hits: [
      { index: 2, fromFrame: 54, toFrame: 53 },
      { index: 3, fromFrame: 71, toFrame: 70 },
      { index: 4, fromFrame: 76, toFrame: 75 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-third-cancel"),
    hits: [
      { index: 2, fromFrame: 54, toFrame: 53 },
      { index: 3, fromFrame: 71, toFrame: 70 },
      { index: 4, fromFrame: 76, toFrame: 75 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-castlink"),
    hits: [
      { index: 0, fromFrame: 14, toFrame: 15 },
      { index: 1, fromFrame: 28, toFrame: 27 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-peakfall"),
    hits: [{ index: 0, fromFrame: 20, toFrame: 18 }],
  },
  {
    matchId: exact("bamboocutDraught-boundvessel"),
    fromCastFrames: 173,
    toCastFrames: 208,
    hits: [
      { index: 10, fromFrame: 124, toFrame: 144 },
      { index: 11, fromFrame: 140, toFrame: 160 },
    ],
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge-full"),
    fromCastFrames: 50,
    toCastFrames: 25,
  },
  {
    matchId: exact("bellstrikeUmbra-bleed-detonation"),
    hits: [{ index: 0, fromFrame: 0, toFrame: 6 }],
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial-1-hit-cancel"),
    fromCastFrames: 35,
    toCastFrames: 17,
  },
  {
    matchId: exact("bellstrikeUmbra-crosswind-blade-cancel"),
    fromCastFrames: 35,
    toCastFrames: 18,
  },
  {
    matchId: exact("bellstrikeUmbra-spearq-5-hit-cancel"),
    fromCastFrames: 101,
    toCastFrames: 84,
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel"),
    fromCastFrames: 33,
    toCastFrames: 16,
  },
  {
    matchId: exact("bellstrikeUmbra-sword-r-charge-follow-up"),
    fromCastFrames: 86,
    toCastFrames: 87,
    hits: [{ index: 1, fromFrame: 41, toFrame: 42 }],
  },
  {
    matchId: exact("bellstrikeUmbra-swordspecial-3-hit"),
    fromCastFrames: 57,
    toCastFrames: 71,
  },
  {
    matchId: exact("bellstrikeUmbra-swordq"),
    fromCastFrames: 18,
    toCastFrames: 27,
    hits: [{ index: 0, fromFrame: 10, toFrame: 20 }],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-1-hit"),
    fromCastFrames: 18,
    toCastFrames: 48,
    hits: [{ index: 0, fromFrame: 6, toFrame: 36 }],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-2-hit"),
    fromCastFrames: 42,
    toCastFrames: 72,
    hits: [
      { index: 0, fromFrame: 6, toFrame: 36 },
      { index: 1, fromFrame: 30, toFrame: 60 },
    ],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-3-hit"),
    fromCastFrames: 52,
    toCastFrames: 82,
    hits: [
      { index: 0, fromFrame: 6, toFrame: 36 },
      { index: 1, fromFrame: 30, toFrame: 60 },
      { index: 2, fromFrame: 40, toFrame: 70 },
    ],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-4-hit"),
    fromCastFrames: 56,
    toCastFrames: 86,
    hits: [
      { index: 0, fromFrame: 6, toFrame: 36 },
      { index: 1, fromFrame: 30, toFrame: 60 },
      { index: 2, fromFrame: 40, toFrame: 70 },
      { index: 3, fromFrame: 50, toFrame: 80 },
    ],
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-5-hit"),
    fromCastFrames: 121,
    toCastFrames: 151,
    hits: [
      { index: 0, fromFrame: 6, toFrame: 36 },
      { index: 1, fromFrame: 30, toFrame: 60 },
      { index: 2, fromFrame: 40, toFrame: 70 },
      { index: 3, fromFrame: 50, toFrame: 80 },
      { index: 4, fromFrame: 108, toFrame: 138 },
    ],
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy-1-hit"),
    fromCastFrames: 60,
    toCastFrames: 78,
    hits: [{ index: 0, fromFrame: 25, toFrame: 43 }],
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy-stage-1"),
    fromCastFrames: 90,
    toCastFrames: 120,
    hits: [
      { index: 0, fromFrame: 5, toFrame: 35 },
      { index: 1, fromFrame: 14, toFrame: 44 },
      { index: 2, fromFrame: 23, toFrame: 53 },
      { index: 3, fromFrame: 32, toFrame: 62 },
      { index: 4, fromFrame: 41, toFrame: 71 },
      { index: 5, fromFrame: 51, toFrame: 81 },
      { index: 6, fromFrame: 61, toFrame: 91 },
      { index: 7, fromFrame: 71, toFrame: 101 },
      { index: 8, fromFrame: 87, toFrame: 117 },
    ],
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy"),
    fromCastFrames: 156,
    toCastFrames: 246,
    hits: [
      { index: 0, fromFrame: 5, toFrame: 95 },
      { index: 1, fromFrame: 14, toFrame: 104 },
      { index: 2, fromFrame: 23, toFrame: 113 },
      { index: 3, fromFrame: 32, toFrame: 122 },
      { index: 4, fromFrame: 41, toFrame: 131 },
      { index: 5, fromFrame: 51, toFrame: 141 },
      { index: 6, fromFrame: 61, toFrame: 151 },
      { index: 7, fromFrame: 71, toFrame: 161 },
      { index: 8, fromFrame: 81, toFrame: 171 },
      { index: 9, fromFrame: 92, toFrame: 182 },
      { index: 10, fromFrame: 101, toFrame: 191 },
      { index: 11, fromFrame: 112, toFrame: 202 },
      { index: 12, fromFrame: 123, toFrame: 213 },
      { index: 13, fromFrame: 132, toFrame: 222 },
      { index: 14, fromFrame: 142, toFrame: 232 },
      { index: 15, fromFrame: 155, toFrame: 245 },
    ],
  },
]

function healHits(hits: unknown, patches: readonly HitFramePatch[]): unknown {
  if (!Array.isArray(hits)) return hits
  return hits.map((entry, position) => {
    const hitPatch = patches.find((candidate) => candidate.index === position)
    if (!hitPatch || !isRecord(entry) || entry.frame !== hitPatch.fromFrame) return entry
    if (hitPatch.fromRow && !rowMatches(entry, hitPatch.fromRow)) return entry
    const healed = { ...entry, frame: hitPatch.toFrame }
    return hitPatch.toRow ? withRow(healed, hitPatch.toRow) : healed
  })
}

// The full form moved its ripple-application trigger from the second hit
// (frame 81) onto the first (now frame 78), which also newly carries the
// 0.225 strike; the cancel form's own frame-0 trigger hit gains a matching
// damaging hit right after it. Neither reduces to a table lookup, so both
// are healed by their own shape check rather than the generic patch list.
function healFluteOfTheTidesFull(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 2) return hits
  const [first, second] = hits
  if (!isRecord(first) || !isRecord(second)) return hits
  if (first.frame !== 0 || second.frame !== 81) return hits
  if (!rowMatches(first, [3.93721, 5.905815, 855.92, 0])) return hits
  if (!rowMatches(second, [3.93721, 5.905815, 855.92, 0])) return hits
  return [
    withRow({ ...first, frame: 78, triggers: second.triggers }, [1.47645, 2.214675, 320.97, 0]),
    { ...second, frame: 192, triggers: [] },
  ]
}

function healFluteOfTheTidesCancel(hits: unknown): unknown {
  if (!Array.isArray(hits) || hits.length !== 1) return hits
  const [first] = hits
  if (!isRecord(first) || first.frame !== 0) return hits
  return [
    { ...first, frame: 78 },
    {
      id: `${String(first.id ?? "flute-cancel-strike")}-strike`,
      frame: 78,
      physMultiplier: 1.47645,
      attributeMultiplier: 2.214675,
      physFixed: 320.97,
      attributeFixed: 0,
      extraCritDamage: 0,
      triggers: [],
    },
  ]
}

// The Endurance drain the rapid-slash loop now carries has no counterpart in
// any earlier seed, so it is added unconditionally rather than gated on a
// prior value.
function healBoundvesselMeterDrains(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "bamboocutDraught-boundvessel") return skill
  if (skill.meterDrains !== undefined) return skill
  return {
    ...skill,
    meterDrains: [{ meterId: "endurance", perSecond: 15, fromFrame: 36, stopAfterSec: 1.6 }],
  }
}

interface DrainHeal {
  matchId: (id: string) => boolean
  fromDrain: Record<string, unknown>
  toDrain: Record<string, unknown>
}

const SWORD_CHARGE_STAGE_1_IDS = [1, 2, 3, 4, 5].map(
  (n) => `bellstrikeUmbra-sword-charge-stage-1-${n}-hit`,
)

// Second Track Slash's drain now stops at its own 30 f minimum hold and
// releases early onto its own level-0 release; Drifting Thrust's three forms
// now each stop at their own stage's earliest release and release early onto
// the stage actually reached. None of the five has a counterpart in any
// earlier seed for the added fields, so each heal is gated on the drain
// still matching its own old shape exactly, never on their absence alone.
const DRAIN_HEALS: readonly DrainHeal[] = [
  {
    matchId: (id) => SWORD_CHARGE_STAGE_1_IDS.includes(id),
    fromDrain: { meterId: "endurance", perSecond: 14, fromFrame: 12 },
    toDrain: {
      meterId: "endurance",
      perSecond: 14,
      fromFrame: 12,
      stopAfterSec: 0.3,
      chargeRelease: { fallbackSkillId: "bellstrikeUmbra-sword-charge-stage-1-level-0" },
    },
  },
  {
    matchId: (id) =>
      id === "bellstrikeUmbra-spearheavy-1-hit" ||
      id === "bellstrikeUmbra-spearheavy-1-hit-prepull",
    fromDrain: { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
    toDrain: { meterId: "endurance", perSecond: 20, fromFrame: 18 },
  },
  {
    matchId: (id) => id === "bellstrikeUmbra-spearheavy-stage-1",
    fromDrain: { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
    toDrain: {
      meterId: "endurance",
      perSecond: 20,
      fromFrame: 18,
      stopAfterSec: 0.2,
      chargeRelease: { fallbackSkillId: "bellstrikeUmbra-spearheavy-1-hit" },
    },
  },
  {
    matchId: (id) => id === "bellstrikeUmbra-spearheavy",
    fromDrain: { meterId: "endurance", perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
    toDrain: {
      meterId: "endurance",
      perSecond: 20,
      fromFrame: 18,
      stopAfterSec: 1.2,
      chargeRelease: { fallbackSkillId: "bellstrikeUmbra-spearheavy-stage-1" },
    },
  },
]

function healChargeReleaseDrains(skill: Record<string, unknown>): Record<string, unknown> {
  const heal = DRAIN_HEALS.find((candidate) => candidate.matchId(String(skill.id)))
  if (!heal) return skill
  const drains = skill.meterDrains
  if (!Array.isArray(drains) || drains.length !== 1) return skill
  const [entry] = drains
  if (!isRecord(entry) || entry.chargeRelease !== undefined) return skill
  const matchesOld = Object.entries(heal.fromDrain).every(([key, value]) => entry[key] === value)
  if (!matchesOld) return skill
  return { ...skill, meterDrains: [heal.toDrain] }
}

// The River Flow variant's own cast-length override has no counterpart in
// any earlier seed, so it is added unconditionally rather than gated on a
// prior value — the same reasoning as Boundvessel's drain above.
function healSpearSpecialCancelRiverFlowCastFrames(
  skill: Record<string, unknown>,
): Record<string, unknown> {
  if (skill.id !== "bellstrikeUmbra-spearspecial-1-hit-cancel") return skill
  const hits = skill.hits
  if (!Array.isArray(hits)) return skill
  const nextHits = hits.map((entry, position) => {
    if (position !== 1 || !isRecord(entry) || !Array.isArray(entry.variants)) return entry
    const variants = entry.variants.map((variant) =>
      isRecord(variant) &&
      variant.id === "hv-spearspecial-hit-1-river-flow" &&
      variant.castFrames === undefined
        ? { ...variant, castFrames: 19 }
        : variant,
    )
    return { ...entry, variants }
  })
  return { ...skill, hits: nextHits }
}

// Sweep All's hit 1 lands 2 f later than the plain form's under either
// empowered variant; neither override has a counterpart in any earlier
// seed, so both are added unconditionally — the same reasoning as the two
// heals above.
function healSpearSpecialHit1Frame(skill: Record<string, unknown>): Record<string, unknown> {
  if (
    skill.id !== "bellstrikeUmbra-spearspecial" &&
    skill.id !== "bellstrikeUmbra-spearspecial-1-hit-cancel"
  )
    return skill
  const hits = skill.hits
  if (!Array.isArray(hits)) return skill
  const nextHits = hits.map((entry, position) => {
    if (position !== 1 || !isRecord(entry) || !Array.isArray(entry.variants)) return entry
    const variants = entry.variants.map((variant) =>
      isRecord(variant) &&
      (variant.id === "hv-spearspecial-hit-1-river-flow" ||
        variant.id === "hv-spearspecial-hit-1-spring-surge") &&
      variant.frame === undefined
        ? { ...variant, frame: 18 }
        : variant,
    )
    return { ...entry, variants }
  })
  return { ...skill, hits: nextHits }
}

function healTriggerExtendFrames(skill: Record<string, unknown>): Record<string, unknown> {
  if (!suffix("-fire-breath-2-hit")(String(skill.id))) return skill
  const hits = skill.hits
  if (!Array.isArray(hits)) return skill
  const nextHits = hits.map((entry, position) => {
    if (position !== 1 || !isRecord(entry) || !Array.isArray(entry.triggers)) return entry
    const triggers = entry.triggers.map((trigger) =>
      isRecord(trigger) && trigger.extendFrames === 60 && trigger.extendOnly === true
        ? { ...trigger, extendFrames: 90 }
        : trigger,
    )
    return { ...entry, triggers }
  })
  return { ...skill, hits: nextHits }
}

const SWORD_R_CHARGE_FOLLOW_UP_IDS = [
  "bellstrikeUmbra-sword-r-charge-follow-up",
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
]

const BLEED_TICK_TRIGGERS = [
  { kind: "applyDot", targetId: "debuff-bellstrikeUmbra-bleed-tick", stacks: 1, condition: null },
]

// The follow-up's own earliest start sits past hit 3 and hit 4's own landing
// frames, so the 2-hit and 3-hit partial forms still land them when cut
// short straight into the follow-up. Neither hit has a counterpart in any
// earlier seed, so each is appended only once the stored hits array still
// matches its own old (already frame-healed) length exactly.
function healSwordChargeStage1IntoFollowUp(
  skill: Record<string, unknown>,
): Record<string, unknown> {
  const hits = skill.hits
  if (!Array.isArray(hits)) return skill
  if (skill.id === "bellstrikeUmbra-sword-charge-stage-1-2-hit" && hits.length === 2) {
    return {
      ...skill,
      hits: [
        ...hits,
        {
          id: "hit-2",
          frame: 70,
          physMultiplier: 0.268616,
          attributeMultiplier: 0.402924,
          physFixed: 74.4,
          attributeFixed: 40.5,
          extraCritDamage: 0,
          triggers: BLEED_TICK_TRIGGERS,
          requiresNextStepSkillIds: SWORD_R_CHARGE_FOLLOW_UP_IDS,
        },
        {
          id: "hit-3",
          frame: 80,
          physMultiplier: 0.268616,
          attributeMultiplier: 0.402924,
          physFixed: 74.4,
          attributeFixed: 40.5,
          extraCritDamage: 0,
          triggers: BLEED_TICK_TRIGGERS,
          requiresNextStepSkillIds: SWORD_R_CHARGE_FOLLOW_UP_IDS,
          castFramesWhenGated: 86,
        },
      ],
    }
  }
  if (skill.id === "bellstrikeUmbra-sword-charge-stage-1-3-hit" && hits.length === 3) {
    return {
      ...skill,
      hits: [
        ...hits,
        {
          id: "hit-3",
          frame: 80,
          physMultiplier: 0.268616,
          attributeMultiplier: 0.402924,
          physFixed: 74.4,
          attributeFixed: 40.5,
          extraCritDamage: 0,
          triggers: BLEED_TICK_TRIGGERS,
          requiresNextStepSkillIds: SWORD_R_CHARGE_FOLLOW_UP_IDS,
          castFramesWhenGated: 86,
        },
      ],
    }
  }
  return skill
}

// Silkbind Jade's own Deflect Cancel replaced the universal one outright, so
// a stored copy may still sit at either the pre-fix universal value or the
// universal fix's own value — both heal to the class's own 12 frames.
function healSilkbindJadeDeflectCancel(skill: Record<string, unknown>): Record<string, unknown> {
  if (skill.id !== "silkbindJade-deflect-cancel") return skill
  if (skill.castFrames === 25 || skill.castFrames === 18) return { ...skill, castFrames: 12 }
  return skill
}

export function healSkillFrames(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  let next: Record<string, unknown> = healSilkbindJadeDeflectCancel(skill)

  if (suffix("-flute-of-the-tides-full")(next.id as string))
    next = { ...next, hits: healFluteOfTheTidesFull(next.hits) }
  if (suffix("-flute-of-the-tides-cancel")(next.id as string))
    next = { ...next, hits: healFluteOfTheTidesCancel(next.hits) }

  const patch = PATCHES.find((candidate) => candidate.matchId(next.id as string))
  if (patch) {
    if (
      patch.fromCastFrames !== undefined &&
      patch.toCastFrames !== undefined &&
      next.castFrames === patch.fromCastFrames
    )
      next = { ...next, castFrames: patch.toCastFrames }
    if (patch.hits) next = { ...next, hits: healHits(next.hits, patch.hits) }
  }

  next = healBoundvesselMeterDrains(next)
  next = healChargeReleaseDrains(next)
  next = healSpearSpecialCancelRiverFlowCastFrames(next)
  next = healSpearSpecialHit1Frame(next)
  next = healTriggerExtendFrames(next)
  next = healSwordChargeStage1IntoFollowUp(next)
  return next
}

export const V45__castLengthAndHitFrameRepairs: CustomSkillMigration = {
  to: 45,
  name: "V45__castLengthAndHitFrameRepairs",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkillFrames) : blob.skills
    return { ...blob, v: 45, skills }
  },
}
