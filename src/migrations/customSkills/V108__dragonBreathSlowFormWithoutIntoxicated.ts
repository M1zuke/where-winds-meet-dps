// v107 → v108 — Dragon's Breath lands on frame 76.38 and ends its cast later
// (frame 150 for the full forms, the quick-release forms' own landing margin
// for the cut ones) when Intoxicated is not up, and opens Intoxicated itself;
// the Drunken Poet prepull opens it too. A Skill Editor copy seeded before this
// carries neither. The variant and the triggers are added alongside whatever the
// copy already holds, and its own hit row is what the variant copies: a copy
// that already has a variant or the trigger is left as it is.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const INTOXICATED_ID = "debuff-mystic-intoxicated"
const SLOW_FORM_HIT_FRAME = 76.38
const NOT_INTOXICATED = { buffId: INTOXICATED_ID, op: "lt", stacks: 1 }

const SLOW_FORM_CAST_FRAMES: Record<string, number> = {
  "mystic-fire-breath-1-hit": SLOW_FORM_HIT_FRAME + 4,
  "mystic-dragon-fire-smolder-1-hit": SLOW_FORM_HIT_FRAME + 4,
  "mystic-fire-breath-2-hit": 150,
  "mystic-dragon-fire-smolder-2-hits": 150,
}
const POET_PREPULL_ID = "mystic-drunkenpoet-prepull"

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const opensIntoxicated = (condition: unknown) => ({
  kind: "applyDebuff",
  targetId: INTOXICATED_ID,
  stacks: 1,
  condition,
})

const hasIntoxicatedTrigger = (triggers: unknown[]) =>
  triggers.some((trigger) => isRecord(trigger) && trigger.targetId === INTOXICATED_ID)

function healFirstHit(skillId: string, firstHit: RecordValue): RecordValue {
  const triggers = Array.isArray(firstHit.triggers) ? firstHit.triggers : []
  if (hasIntoxicatedTrigger(triggers)) return firstHit
  const castFrames = SLOW_FORM_CAST_FRAMES[skillId]
  if (castFrames === undefined) {
    return { ...firstHit, triggers: [...triggers, opensIntoxicated(null)] }
  }
  const variants = Array.isArray(firstHit.variants) ? firstHit.variants : []
  return {
    ...firstHit,
    triggers: [...triggers, opensIntoxicated(NOT_INTOXICATED)],
    variants: [
      ...variants,
      {
        id: `hv-${skillId}-hit-0-slow-form`,
        label: "Not Intoxicated",
        conditions: [NOT_INTOXICATED],
        physMultiplier: firstHit.physMultiplier,
        attributeMultiplier: firstHit.attributeMultiplier,
        physFixed: firstHit.physFixed,
        attributeFixed: firstHit.attributeFixed,
        frame: SLOW_FORM_HIT_FRAME,
        castFrames,
      },
    ],
  }
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string" || !Array.isArray(skill.hits)) return skill
  if (!(skill.id in SLOW_FORM_CAST_FRAMES) && skill.id !== POET_PREPULL_ID) return skill
  const [firstHit, ...otherHits] = skill.hits
  if (!isRecord(firstHit)) return skill
  return { ...skill, hits: [healFirstHit(skill.id, firstHit), ...otherHits] }
}

export const V108__dragonBreathSlowFormWithoutIntoxicated: CustomSkillMigration = {
  to: 108,
  name: "V108__dragonBreathSlowFormWithoutIntoxicated",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 108, skills }
  },
}
