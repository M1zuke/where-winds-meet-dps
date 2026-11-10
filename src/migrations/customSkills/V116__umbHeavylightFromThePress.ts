// v115 → v116 — Umb HeavyLight is timed from the heavy press: the heavy tap's
// hit lands at 20.79 frames, Colorful Phoenix hits at 61.46, 68.6 and 91.47
// frames and the cast lasts 113.95 frames. A Skill Editor copy seeded before
// this carries the old cast: three Phoenix hits at 6, 31 and 56 frames, the
// first one summoning the heavy share, and a 78 frame cast. A copy is
// rewritten only while its hits and cast length still equal what was seeded:
// once they differ, a stale copy and a deliberate edit are indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const HEAVYLIGHT_ID = "silkbindJade-umb-heavylight"
const HEAVY_SHARE_TRIGGER = {
  kind: "castSkill",
  targetId: "silkbindJade-umb-heavylight-heavyshare",
  stacks: 1,
  condition: null,
}
const PHOENIX_HIT = {
  physMultiplier: 0.38293200000000005,
  attributeMultiplier: 0.5743980000000001,
  physFixed: 106.26,
  attributeFixed: 57.75,
  extraCritDamage: 0,
}
const SEEDED_FRAMES = [6, 31, 56]
const SEEDED_CAST_FRAMES = 78

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const seededHits = SEEDED_FRAMES.map((frame, index) => ({
  id: `hit-${index}`,
  frame,
  ...PHOENIX_HIT,
  triggers: index === 0 ? [HEAVY_SHARE_TRIGGER] : [],
}))

const healedHits = [
  {
    id: "hit-0",
    frame: 20.79,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    extraCritDamage: 0,
    triggers: [HEAVY_SHARE_TRIGGER],
  },
  ...[61.46, 68.6, 91.47].map((frame, index) => ({
    id: `hit-${index + 1}`,
    frame,
    ...PHOENIX_HIT,
    triggers: [],
  })),
]

const sameHitsIgnoringKeyOrder = (hits: unknown): boolean =>
  Array.isArray(hits) &&
  hits.length === seededHits.length &&
  hits.every((hit, index) => {
    if (!isRecord(hit)) return false
    const expected = seededHits[index] as Record<string, unknown>
    const keys = Object.keys(expected)
    return (
      Object.keys(hit).length === keys.length &&
      keys.every((key) => sameValue(hit[key], expected[key]))
    )
  })

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || skill.id !== HEAVYLIGHT_ID) return skill
  if (skill.castFrames !== SEEDED_CAST_FRAMES || !sameHitsIgnoringKeyOrder(skill.hits)) return skill
  return { ...skill, castFrames: 113.95, hits: healedHits.map((hit) => ({ ...hit })) }
}

export const V116__umbHeavylightFromThePress: CustomSkillMigration = {
  to: 116,
  name: "V116__umbHeavylightFromThePress",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 116, skills }
  },
}
