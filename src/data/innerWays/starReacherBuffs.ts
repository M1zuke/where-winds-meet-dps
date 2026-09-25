import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { artBonus, stat } from "../../engine/effects/effect"

const physicalAttackPercent = (value: number) => [
  artBonus("minPhysPctBonus", value),
  artBonus("maxPhysPctBonus", value),
]

// In-game values as of 2026-09-24 — an upper bound: the talent also needs
// the caster's own HP above 75%, which the sim has no HP model to gate.
const MARKED_TARGET_BONUS = 0.03

export const starReacherBuffDef = defineBuff({
  id: BUFF.starReacher,
  name: "Star Reacher",
  requires: { param: PARAM.starReacher },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "Physical Attack +7.5% (normal), +15% (<30% Qi or Qi exhausted)",
  effects: (ctx) => {
    const marked = ctx.status.isActive(BUFF.lingeringBone)
      ? [stat("allDamageBoost", MARKED_TARGET_BONUS)]
      : []
    // The talent panel's own +25% branch needs an airborne launch, which a
    // training stake never takes — this phase reads the Lingering-Bone-gated
    // +15% branch instead. In-game values as of 2026-09-24.
    if (ctx.phase === "below30" || ctx.phase === "exhausted")
      return [...physicalAttackPercent(0.15), ...marked]
    return [...physicalAttackPercent(0.075), ...marked]
  },
})
