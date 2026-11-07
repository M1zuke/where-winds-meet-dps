// v48 → v49 — additive repairs on built-in skills across every class: the
// Iron Guards/Lingering Bone per-grant-site delayed grant (Stonesplit
// Strength, Silkbind Jade), the new Starweave/Swallowcall gear-set reach on
// every Martial Art Skill and Gauntlet Light Attack, and Bamboocut Draught's
// Realmplay joining the Martial Art Skill roster it had been left out of. A
// Skill Editor copy seeded before this still lacks all three.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface SkillPatch {
  matchId: (id: string) => boolean
  appendReceives?: readonly string[]
  appendTriggersBuffs?: readonly string[]
  appendTags?: readonly string[]
  appendTriggersBuffsAtFrame?: Record<string, number>
}

const exact = (id: string) => (candidate: string) => candidate === id
const oneOf = (ids: readonly string[]) => (candidate: string) => ids.includes(candidate)

const STARWEAVE_RECEIVES = ["starweaveMartialBoost"]
const SWALLOWCALL_RECEIVES = ["swallowcallLightAttackBoost"]

const STARWEAVE_SKILL_IDS = [
  "bamboocutDraught-castlink",
  "bamboocutDraught-peakfall-prepull",
  "bamboocutDraught-peakfall",
  "bamboocutDraught-reveldrift-cancel",
  "bamboocutDraught-reveldrift",
  "bellstrikeSplendor-spearq-0-hit-cancel",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-swordq-2nd",
  "bellstrikeSplendor-swordq",
  "bellstrikeUmbra-spearq-5-hit-cancel",
  "bellstrikeUmbra-spearq",
  "bellstrikeUmbra-sword-martial-qqq",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  "bellstrikeUmbra-swordq",
  "bellstrikeUmbra-swordqfollowup",
  "silkbindJade-fanq-prepull",
  "silkbindJade-fanq",
  "silkbindJade-fanqcancel",
  "silkbindJade-umbq-prepull",
  "silkbindJade-umbq",
]

const SWALLOWCALL_SKILL_IDS = ["bamboocutDraught-light-attack", "bamboocutDraught-bloombreak"]

const PATCHES: readonly SkillPatch[] = [
  {
    matchId: exact("bamboocutDraught-realmplay"),
    appendReceives: STARWEAVE_RECEIVES,
    appendTriggersBuffs: ["jadeware"],
    appendTags: ["prop:isMartialSkillQ"],
  },
  { matchId: oneOf(STARWEAVE_SKILL_IDS), appendReceives: STARWEAVE_RECEIVES },
  { matchId: oneOf(SWALLOWCALL_SKILL_IDS), appendReceives: SWALLOWCALL_RECEIVES },
  {
    matchId: exact("stonesplitStrength-phalanxspecial"),
    appendTriggersBuffsAtFrame: { ironGuards: 60 },
  },
  {
    matchId: exact("silkbindJade-fanlightcharged"),
    appendTriggersBuffsAtFrame: { lingeringBone: 71 },
  },
  {
    matchId: exact("silkbindJade-fanspecial"),
    appendTriggersBuffsAtFrame: { lingeringBone: 33 },
  },
]

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch) return skill

  const next: Record<string, unknown> = { ...skill }

  if (patch.appendReceives) {
    const existing = Array.isArray(skill.receives) ? skill.receives : []
    const missing = patch.appendReceives.filter((id) => !existing.includes(id))
    if (missing.length > 0) next.receives = [...existing, ...missing]
  }

  if (patch.appendTriggersBuffs) {
    const existing = Array.isArray(skill.triggersBuffs) ? skill.triggersBuffs : []
    const missing = patch.appendTriggersBuffs.filter((id) => !existing.includes(id))
    if (missing.length > 0) next.triggersBuffs = [...existing, ...missing]
  }

  if (patch.appendTags) {
    const existing = Array.isArray(skill.tags) ? skill.tags : []
    const missing = patch.appendTags.filter((tag) => !existing.includes(tag))
    if (missing.length > 0) next.tags = [...existing, ...missing]
  }

  if (patch.appendTriggersBuffsAtFrame) {
    const existing = isRecord(skill.triggersBuffsAtFrame) ? skill.triggersBuffsAtFrame : {}
    const missing = Object.entries(patch.appendTriggersBuffsAtFrame).filter(
      ([buffId]) => !(buffId in existing),
    )
    if (missing.length > 0)
      next.triggersBuffsAtFrame = { ...existing, ...Object.fromEntries(missing) }
  }

  return next
}

export const V49__perGrantSiteDelayAndSetReach: CustomSkillMigration = {
  to: 49,
  name: "V49__perGrantSiteDelayAndSetReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 49, skills }
  },
}
