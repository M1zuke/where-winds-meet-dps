import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { ROLE } from "../../skills/ids"
import { stat } from "../../../engine/effects/effect"
import { matchesAnyTag } from "../../../engine/scope"
import { GRANT_REQUIRES_DEFAULT } from "../../../engine/buffs/buffModule"
import { paramTierOf } from "../../../engine/buffs/paramTier"

// In-game values as of 2026-09-26: below tier 6, only Snowbreak Spring lays a
// stack and takes the larger per-stack cut; tier 6 adds Stab, the Anxi
// soldier line, Burning Heart and Total Annihilation to both.
const SNOWBREAK_FAMILY = [ROLE.snowpartingVC]
const EXTENDED_FAMILY = [
  ROLE.anxiSoldier,
  ROLE.snowpartingQStab,
  ROLE.phalanxCharged,
  ROLE.phalanxQ,
]

const SNOWBREAK_REQUIRES = { param: PARAM.throatPierced }
const EXTENDED_REQUIRES = { param: PARAM.throatPierced, minTier: 6 }

export const throatPierced = defineBuff({
  id: BUFF.throatPierced,
  name: "Throat-Pierced",
  grantRequires: {
    [ROLE.snowpartingVC]: SNOWBREAK_REQUIRES,
    [ROLE.anxiSoldier]: EXTENDED_REQUIRES,
    [ROLE.snowpartingQStab]: EXTENDED_REQUIRES,
    [ROLE.phalanxCharged]: EXTENDED_REQUIRES,
    [ROLE.phalanxQ]: EXTENDED_REQUIRES,
    // An untagged or mis-configured source falls back here — an unslotted
    // inner way must never grant, the same as every named family above.
    [GRANT_REQUIRES_DEFAULT]: SNOWBREAK_REQUIRES,
  },
  triggersFromGeneratedSkills: true,
  affectsAll: true,
  duration: (ctx) => (ctx.build.paramTier(PARAM.throatPierced) >= 1 ? 15 : 8),
  // In-game values as of 2026-09-26: 3 stacks below tier 4, 5 from tier 4 on.
  maxStacks: (params) => (paramTierOf(params, PARAM.throatPierced) >= 4 ? 5 : 3),
  stacksPerHit: true,
  summary: "per stack: physPen +3 / critDmg +3% on the applying skills, +2 / +2% elsewhere",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage") return []
    const tier = ctx.build.paramTier(PARAM.throatPierced)
    const matched =
      tier >= 3 &&
      (matchesAnyTag(ctx.event.tags, SNOWBREAK_FAMILY) ||
        (tier >= 6 && matchesAnyTag(ctx.event.tags, EXTENDED_FAMILY)))
    const stacks = ctx.self.stacks
    return [
      stat("phys.penetration", (matched ? 0.03 : 0.02) * stacks),
      stat("critDamageBoost", (matched ? 0.03 : 0.02) * stacks),
    ]
  },
})
