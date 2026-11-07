import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { LINGERING_BONE_APPLIED_AFTER_HIT_SEC } from "../skills/buffs/lingeringBone"
import { artBonus, stat } from "../../engine/effects/effect"

const physicalAttackPercent = (value: number) => [
  artBonus("minPhysPctBonus", value),
  artBonus("maxPhysPctBonus", value),
]

const markDurationSec = (ctx: { build: { paramTier(id: string): number } }) =>
  ctx.build.paramTier(PARAM.starReacher) >= 4 ? 12 : 8

const SUPREME_QI_FRACTION = 0.3

const MARK_GRANT = {
  requires: { param: PARAM.starReacher },
  affectsAll: true,
  requiresBuffActive: BUFF.lingeringBone,
  buffAppliesAfterLastHitSec: LINGERING_BONE_APPLIED_AFTER_HIT_SEC,
  triggerPhaseTiming: "afterHits",
  cooldown: 1,
  duration: markDurationSec,
} as const

// In-game values as of 2026-10-18: applying Lingering Bone, or the floating
// umbrella refreshing it, opens a Physical Attack window by the target's Qi
// once the hit's damage and Qi have landed: the Supreme one at 30% Qi or less
// (broken included), ending and blocking the plain one while it is up; the
// plain one above 30%, or at any Qi on ranks 1-2.
// Ranks 1-2 have the plain one only and every rank below 4 holds it 8 s
// instead of 12.
export const starReacherBuffDef = defineBuff({
  ...MARK_GRANT,
  id: BUFF.starReacher,
  name: "Star Reacher",
  blockedWhileActive: [BUFF.starReacherSupreme],
  effects: physicalAttackPercent(0.075),
})

export const starReacherSupremeBuffDef = defineBuff({
  ...MARK_GRANT,
  id: BUFF.starReacherSupreme,
  name: "Star Reacher (Supreme)",
  requires: { param: PARAM.starReacher, minTier: 3 },
  triggerPhase: { qiAtMost: SUPREME_QI_FRACTION },
  dispelsOnGrant: [BUFF.starReacher],
  effects: physicalAttackPercent(0.15),
})

// In-game values as of 2026-10-15: rank 6 only; it also needs the caster's own
// HP above 75%, which a practice dummy never lowers.
export const starReacherMarkedTargetBuffDef = defineBuff({
  id: BUFF.starReacherMarkedTarget,
  name: "Star Reacher (Marked Target)",
  requires: { param: PARAM.starReacher, minTier: 6 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "+3% damage on direct hits against a target carrying your Lingering Bone",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.lingeringBone) && ctx.event.kind === "damage" && !ctx.event.isDotTick
      ? [stat("allDamageBoost", 0.03)]
      : [],
})
