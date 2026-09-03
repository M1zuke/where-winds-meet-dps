// v4 → v5 — every Bellstrike Umbra skill was re-authored hit by hit: the
// per-hit multipliers and flat damage now differ within a combo instead of
// sharing the skill's average, and the Crisscross follow-ups carry no flat
// damage. A Skill Editor copy seeded before that still holds the old rows.
import { swapSkillHits, type HitRow, type HitSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const Q_OLD: HitRow = [0.5441, 0.8161, 150, 82]
const Q_NEW: HitRow = [0.544068, 0.816102, 150.6, 82]
const QQ_MID: HitRow = [0.408051, 0.6120765, 112.95, 61.5]
const QQ_LAST: HitRow = [0.816102, 1.224153, 225.9, 123]
const R_FOLLOW_UP_OLD: HitRow = [0.40665, 0.609975, 0, 0]
const CHARGE_3_OLD: HitRow = [
  0.31338333333333335, 0.47008333333333335, 86.66666666666667, 47.166666666666664,
]
const CHARGE_4_OLD: HitRow = [
  0.3021910714285725, 0.4532946428571425, 83.5714285714285, 45.48214285714275,
]
const CHARGE_5_OLD: HitRow = [0.37606, 0.5641, 104, 56.6]
const CHARGE_FIRST: HitRow = [0.402924, 0.604386, 111.6, 60.75]
const CHARGE_MID: HitRow = [0.268616, 0.402924, 74.4, 40.5]
const CHARGE_LAST: HitRow = [0.67154, 1.00731, 186, 101.25]
const SPECIAL_3_OLD: HitRow = [0.21806666666666666, 0.3271, 50.333333333333336, 28.333333333333332]
const SPECIAL_4_OLD: HitRow = [0.245325, 0.367975, 56.75, 31.75]
const SPECIAL_LOW: HitRow = [0.196354, 0.294531, 54.4, 29.6]
const SPECIAL_HIGH: HitRow = [0.392708, 0.589062, 108.8, 59.2]
const SPEAR_Q_OLD: HitRow = [0.3566833333333333, 0.5350166666666667, 98, 53.333333333333336]
const SPEAR_Q_NEW: HitRow = [0.321033, 0.4815495, 88.95, 48.45]
const SPEAR_Q_LAST: HitRow = [0.535055, 0.8025825, 148.25, 80.75]

const repeat = (count: number, swap: HitSwap): HitSwap[] =>
  Array.from({ length: count }, () => swap)

const SUPERSEDED_UMBRA_HITS: Record<string, readonly HitSwap[]> = {
  "bellstrikeUmbra-swordq": [{ from: Q_OLD, to: Q_NEW }],
  "bellstrikeUmbra-swordqfollowup": [
    { from: Q_OLD, to: Q_NEW },
    { from: Q_OLD, to: QQ_MID },
    { from: Q_OLD, to: QQ_MID },
    { from: Q_OLD, to: QQ_LAST },
  ],
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel": [{ from: Q_OLD, to: Q_NEW }],
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel": [
    { from: Q_OLD, to: Q_NEW },
    { from: Q_OLD, to: QQ_MID },
  ],
  "bellstrikeUmbra-sword-martial-qqq": [
    { from: Q_OLD, to: [0.316911, 0.475366, 0, 0] },
    { from: Q_OLD, to: [0.475366, 0.713049, 0, 0] },
  ],
  "bellstrikeUmbra-sword-r-charge-follow-up": [
    { from: R_FOLLOW_UP_OLD, to: [0.325601, 0.488401, 0, 0] },
    { from: R_FOLLOW_UP_OLD, to: [0.488401, 0.732602, 0, 0] },
  ],
  "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel": [
    { from: R_FOLLOW_UP_OLD, to: [0.325601, 0.488401, 0, 0] },
  ],
  "bellstrikeUmbra-crosswind-blade": [{ from: [0.6, 0.9, 0, 0], to: [0.625421, 0.938132, 0, 0] }],
  "bellstrikeUmbra-sword-charge-stage-1-3-hit": [
    { from: CHARGE_3_OLD, to: CHARGE_FIRST },
    ...repeat(2, { from: CHARGE_3_OLD, to: CHARGE_MID }),
  ],
  "bellstrikeUmbra-sword-charge-stage-1-4-hit": [
    { from: CHARGE_4_OLD, to: CHARGE_FIRST },
    ...repeat(3, { from: CHARGE_4_OLD, to: CHARGE_MID }),
  ],
  "bellstrikeUmbra-sword-charge-stage-1-5-hit": [
    { from: CHARGE_5_OLD, to: CHARGE_FIRST },
    ...repeat(3, { from: CHARGE_5_OLD, to: CHARGE_MID }),
    { from: CHARGE_5_OLD, to: CHARGE_LAST },
  ],
  "bellstrikeUmbra-swordspecial-3-hit": [
    { from: SPECIAL_3_OLD, to: SPECIAL_LOW },
    { from: SPECIAL_3_OLD, to: SPECIAL_HIGH },
    { from: SPECIAL_3_OLD, to: SPECIAL_LOW },
  ],
  "bellstrikeUmbra-swordspecial-4-hit": [
    { from: SPECIAL_4_OLD, to: SPECIAL_LOW },
    { from: SPECIAL_4_OLD, to: SPECIAL_HIGH },
    { from: SPECIAL_4_OLD, to: SPECIAL_LOW },
    { from: SPECIAL_4_OLD, to: SPECIAL_HIGH },
  ],
  "bellstrikeUmbra-bleed-tick": [{ from: [0.06864, 0.10296, 0, 0], to: [0.066, 0.099, 0, 0] }],
  "bellstrikeUmbra-spearq": [
    ...repeat(5, { from: SPEAR_Q_OLD, to: SPEAR_Q_NEW }),
    { from: SPEAR_Q_OLD, to: SPEAR_Q_LAST },
  ],
  "bellstrikeUmbra-spearq-5-hit-cancel": repeat(5, {
    from: [0.321, 0.4814, 74, 41],
    to: SPEAR_Q_NEW,
  }),
  "bellstrikeUmbra-spearspecial": [
    {
      from: [1.7122, 2.5683, 474, 258],
      to: [1.712176, 2.568264, 474.4, 258.4],
      variants: [{ from: [2.5683, 3.8524, 711, 387], to: [2.568264, 3.852396, 711.6, 387.6] }],
    },
  ],
  "bellstrikeUmbra-spearspecial-1-hit-cancel": [
    {
      from: [0.8561, 1.28415, 237, 129],
      to: [0.6848704, 1.0273056, 189.76, 103.36],
      variants: [
        { from: [1.02732, 1.54096, 284.4, 154.8], to: [1.0273056, 1.5409584, 284.64, 155.04] },
      ],
    },
  ],
}

export function umbraHitSwapsFor(skillId: string): readonly HitSwap[] | undefined {
  return SUPERSEDED_UMBRA_HITS[skillId]
}

export const V5__umbraHitCoefficients: CustomSkillMigration = {
  to: 5,
  name: "V5__umbraHitCoefficients",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    return { ...blob, v: 5, skills: swapSkillHits(blob, umbraHitSwapsFor) }
  },
}
