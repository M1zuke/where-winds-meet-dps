// v39 -> v40 — Mountain's Might's own per-charged-hit Endurance gain and the
// ledger-visible Qi Imbalance marker its own gate reads, on every built-in
// skill the in-game rows name. Neither has an editable surface in the Skill
// Editor, so a stored copy is healed unconditionally, matched by each
// addition's own `cooldownGroup`/`targetId` rather than by hit index.
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

const MOUNTAINS_MIGHT_CHARGED_HIT_GAIN: HitTrigger = {
  kind: "meterDelta",
  targetId: "endurance",
  stacks: 8,
  condition: { buffId: "qiImbalanceMarker", op: "gte", stacks: 1 },
  cooldownFrames: 120,
  cooldownGroup: "mountainsMightChargedHitGain",
  requiresParam: "mountainsMight",
  requiresMinTier: 6,
}

const QIANKUNS_LOCK_QI_IMBALANCE_MARKER_GRANT: HitTrigger = {
  kind: "applyBuff",
  targetId: "qiImbalanceMarker",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
}
const MOUNTAINS_MIGHT_QI_IMBALANCE_MARKER_GRANT: HitTrigger = {
  kind: "applyBuff",
  targetId: "qiImbalanceMarker",
  stacks: 1,
  condition: null,
  appliesOnCastEnd: true,
  requiresParam: "mountainsMight",
}

interface SkillGainPatch {
  matchId: (id: string) => boolean
  appendHitTriggers?: Record<number, HitTrigger[]>
  // Appended to the skill's own `triggersBuffs` only when not already present.
  appendTriggersBuffs?: string[]
}

const exact = (id: string) => (candidate: string) => candidate === id

const PATCHES: SkillGainPatch[] = [
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged"),
    appendHitTriggers: { 0: [MOUNTAINS_MIGHT_CHARGED_HIT_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-2-hit"),
    appendHitTriggers: { 0: [MOUNTAINS_MIGHT_CHARGED_HIT_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-prepull"),
    appendHitTriggers: { 0: [MOUNTAINS_MIGHT_CHARGED_HIT_GAIN] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_QI_IMBALANCE_MARKER_GRANT] },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-prepull"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_QI_IMBALANCE_MARKER_GRANT] },
    appendTriggersBuffs: ["qiImbalance"],
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-0-hit-cancel"),
    appendHitTriggers: { 0: [QIANKUNS_LOCK_QI_IMBALANCE_MARKER_GRANT] },
    appendTriggersBuffs: ["qiImbalance"],
  },
  {
    matchId: exact("bellstrikeSplendor-swordq"),
    appendHitTriggers: { 0: [MOUNTAINS_MIGHT_QI_IMBALANCE_MARKER_GRANT] },
  },
  {
    matchId: exact("bellstrikeSplendor-swordq-2nd"),
    appendHitTriggers: { 0: [MOUNTAINS_MIGHT_QI_IMBALANCE_MARKER_GRANT] },
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

function alreadyHasApplyBuff(triggers: unknown, targetId: string): boolean {
  return (
    Array.isArray(triggers) &&
    triggers.some(
      (trigger) =>
        isRecord(trigger) && trigger.kind === "applyBuff" && trigger.targetId === targetId,
    )
  )
}

function alreadyHas(existingTriggers: unknown[], addition: HitTrigger): boolean {
  if (addition.kind === "meterDelta") {
    return alreadyHasMeterDeltaCooldownGroup(existingTriggers, addition.cooldownGroup as string)
  }
  return alreadyHasApplyBuff(existingTriggers, addition.targetId)
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch) return skill

  const next: Record<string, unknown> = { ...skill }

  if (patch.appendTriggersBuffs) {
    const existing = Array.isArray(skill.triggersBuffs) ? skill.triggersBuffs : []
    const missing = patch.appendTriggersBuffs.filter((buffId) => !existing.includes(buffId))
    if (missing.length > 0) next.triggersBuffs = [...existing, ...missing]
  }

  if (patch.appendHitTriggers && Array.isArray(skill.hits)) {
    next.hits = skill.hits.map((hit, index) => {
      const additions = patch.appendHitTriggers?.[index]
      if (!additions || !isRecord(hit)) return hit
      const existingTriggers = Array.isArray(hit.triggers) ? hit.triggers : []
      const missing = additions.filter((addition) => !alreadyHas(existingTriggers, addition))
      if (missing.length === 0) return hit
      return { ...hit, triggers: [...existingTriggers, ...missing] }
    })
  }

  return next
}

export const V40__mountainsMightAndQiImbalanceMarker: CustomSkillMigration = {
  to: 40,
  name: "V40__mountainsMightAndQiImbalanceMarker",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 40, skills }
  },
}
