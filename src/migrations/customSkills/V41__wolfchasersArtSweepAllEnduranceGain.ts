// v40 -> v41 — Wolfchaser's Art tiers 4-6's own +20 Endurance gain, granted
// alongside the hidden Blood Burst on a Sweep All hit under Empowered River
// Flow. No editable surface in the Skill Editor, so a stored copy is healed
// unconditionally, matched by the gain's own `cooldownGroup` rather than by
// hit index.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface HitTrigger {
  kind: string
  targetId: string
  stacks: number
  condition: unknown
  [key: string]: unknown
}

const WOLFCHASERS_ART_SWEEP_ALL_ENDURANCE_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 20,
  condition: { buffId: "buff-bellstrikeUmbra-empowered-river-flow", op: "gte", stacks: 1 },
  cooldownFrames: 720,
  cooldownGroup: "wolfchasersArtSweepAllEnduranceGain",
}

interface SkillGainPatch {
  matchId: (id: string) => boolean
  appendHitTriggers: Record<number, HitTrigger[]>
}

const exact = (id: string) => (candidate: string) => candidate === id

const PATCHES: SkillGainPatch[] = [
  {
    matchId: exact("bellstrikeUmbra-spearspecial"),
    appendHitTriggers: {
      1: [WOLFCHASERS_ART_SWEEP_ALL_ENDURANCE_GAIN],
      2: [WOLFCHASERS_ART_SWEEP_ALL_ENDURANCE_GAIN],
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial-1-hit-cancel"),
    appendHitTriggers: { 1: [WOLFCHASERS_ART_SWEEP_ALL_ENDURANCE_GAIN] },
  },
]

function alreadyHasMeterDeltaCooldownGroup(triggers: unknown, cooldownGroup: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "meterDelta" &&
        trigger.cooldownGroup === cooldownGroup,
    )
  )
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch || !Array.isArray(skill.hits)) return skill

  return {
    ...skill,
    hits: skill.hits.map((hit, index) => {
      const additions = patch.appendHitTriggers[index]
      if (!additions || !isRecord(hit)) return hit
      const existingTriggers = Array.isArray(hit.triggers) ? hit.triggers : []
      const missing = additions.filter(
        (addition) =>
          !alreadyHasMeterDeltaCooldownGroup(existingTriggers, addition.cooldownGroup as string),
      )
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    }),
  }
}

export const V41__wolfchasersArtSweepAllEnduranceGain: CustomSkillMigration = {
  to: 41,
  name: "V41__wolfchasersArtSweepAllEnduranceGain",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 41, skills }
  },
}
