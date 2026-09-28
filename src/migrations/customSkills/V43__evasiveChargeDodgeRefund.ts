// v42 -> v43 — the Evasive Charge inner way's own expected-value Endurance
// refund on a Perfect Dodge, two triggers (rank 1's own share, rank 2's own
// additional share) on every built-in dodge skill. No editable surface in the
// Skill Editor, so a stored copy is healed unconditionally, matched by each
// gain's own `requiresParam`/`requiresMinTier` pair rather than by hit index.
// The refund is a fraction of whatever Endurance the dodge itself actually
// paid, not a fixed amount, so a build's own cost modifiers carry through.
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

const EVASIVE_CHARGE_DODGE_REFUND_BASE: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 1,
  condition: null,
  requiresParam: "evasiveCharge",
  refundFractionOfCastCost: 0.5,
}

const EVASIVE_CHARGE_DODGE_REFUND_TIER2: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 1,
  condition: null,
  requiresParam: "evasiveCharge",
  requiresMinTier: 2,
  refundFractionOfCastCost: 0.2,
}

const EVASIVE_CHARGE_DODGE_REFUND_GAINS = [
  EVASIVE_CHARGE_DODGE_REFUND_BASE,
  EVASIVE_CHARGE_DODGE_REFUND_TIER2,
]

interface SkillGainPatch {
  matchId: (id: string) => boolean
  appendHitTriggers: Record<number, HitTrigger[]>
}

const exact = (id: string) => (candidate: string) => candidate === id

const PATCHES: SkillGainPatch[] = [
  {
    matchId: exact("universal-perfect-dodge"),
    appendHitTriggers: { 0: EVASIVE_CHARGE_DODGE_REFUND_GAINS },
  },
  {
    matchId: exact("universal-perfect-dodge-full"),
    appendHitTriggers: { 0: EVASIVE_CHARGE_DODGE_REFUND_GAINS },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge"),
    appendHitTriggers: { 0: EVASIVE_CHARGE_DODGE_REFUND_GAINS },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge-full"),
    appendHitTriggers: { 0: EVASIVE_CHARGE_DODGE_REFUND_GAINS },
  },
]

function gainKey(trigger: HitTrigger): string {
  return `${trigger.requiresParam as string}:${(trigger.requiresMinTier as number | undefined) ?? 0}`
}

function alreadyHasGain(triggers: unknown, key: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) &&
        trigger.kind === "meterDelta" &&
        typeof trigger.requiresParam === "string" &&
        gainKey(trigger as HitTrigger) === key,
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
        (addition) => !alreadyHasGain(existingTriggers, gainKey(addition)),
      )
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    }),
  }
}

export const V43__evasiveChargeDodgeRefund: CustomSkillMigration = {
  to: 43,
  name: "V43__evasiveChargeDodgeRefund",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 43, skills }
  },
}
