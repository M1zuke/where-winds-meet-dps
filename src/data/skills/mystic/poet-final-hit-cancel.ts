import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDebuff, castSkill } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { LEVEL_ROWS } from "./levelRows"
import { SKILL, DEBUFF } from "./ids"
import { BUFF } from "../buffs/ids"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"

export const poetFinalHitCancel = defineSkill({
  id: SKILL.poetFinalHitCancel,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Poet Final Hit[Cancel]",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.poetFinalHitCancel,
  cancelledBy: "deflectCancel",
  castFrames: 47,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 6,
  // In-game values as of 2026-09-28: every other mystic art is a stationary
  // cast, and this one carries no engagement-range field to read — reach is
  // an assumption (the class's own default melee reach).
  approach: "stationary",
  receives: [BUFF.poetFinalStrikeStack, ...WINEBOUND_MYSTIC_RECEIVES],
  hits: [
    hit(0, {
      frame: 0,
      ...levelScaled(LEVEL_ROWS.poetFinalHit),
      triggers: [
        applyDebuff({
          target: DEBUFF.combustion,
          stacks: 0,
          extendFrames: 90,
          extendOnly: true,
        }),
        castSkill({ target: SKILL.poetFinalHitCancelExplosion }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
