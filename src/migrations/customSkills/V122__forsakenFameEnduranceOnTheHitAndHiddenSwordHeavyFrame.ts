// v121 → v122 — Forsaken Fame's +10 Endurance lands on the frame of its hit, not
// 1.8 frames after it, and the hidden sword's alternative heavy attack hits 14.15
// frames into its cast, not at its start. A Skill Editor copy seeded before this
// carries the old delay and frame. Each is rewritten only while it still equals
// what was seeded: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const FORSAKEN_FAME_ID = "silkbindJade-fanlightcharged"
const HIDDEN_HEAVY_ALT_ID = "silkbindJade-hidden-sword-heavy-alt"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const SEEDED_ENDURANCE_GAIN = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 10,
  condition: null,
  delayFrames: 1.8,
}
const HEALED_ENDURANCE_GAIN = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 10,
  condition: null,
}

const withFirstHit = (
  skill: Record<string, unknown>,
  heal: (hit: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> => {
  if (!Array.isArray(skill.hits) || !isRecord(skill.hits[0])) return skill
  const [first, ...rest] = skill.hits
  return { ...skill, hits: [heal(first), ...rest] }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill)) return skill
  if (skill.id === FORSAKEN_FAME_ID)
    return withFirstHit(skill, (hit) =>
      sameValue(hit.triggers, [SEEDED_ENDURANCE_GAIN])
        ? { ...hit, triggers: [HEALED_ENDURANCE_GAIN] }
        : hit,
    )
  if (skill.id === HIDDEN_HEAVY_ALT_ID)
    return withFirstHit(skill, (hit) => (hit.frame === 0 ? { ...hit, frame: 14.15 } : hit))
  return skill
}

export const V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame: CustomSkillMigration = {
  to: 122,
  name: "V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 122, skills }
  },
}
